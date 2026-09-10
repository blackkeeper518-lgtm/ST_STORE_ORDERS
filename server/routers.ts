import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { PRESENTATION_MODE, PRESENTATION_USER } from "@shared/presentation";
import { getSessionCookieOptions } from "./_core/cookies";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { generateOrderSummary } from "./order-summary";
import {
  createProductAlias,
  createVaultFile,
  createVaultProject,
  getUserByOpenId,
  getVaultFile,
  getVaultStats,
  listProductAliases,
  listVaultFiles,
  listVaultProjects,
  updateProductAlias,
  updateVaultFile,
} from "./db";
import { verifyVaultAccessCode } from "./vault-access";
import {
  fetchConversationEvidence,
  fetchDailyChatOrderSummary,
  fetchDailyOrderHistory,
  fetchExternalChatMessages,
  fetchLiveOrders,
  fetchLiveOrder,
  fetchLiveProductMappings,
  fetchLiveThreads,
  fetchParcelForOrder,
  fetchCustomerHistory,
  fetchParcelMatchReview,
  fetchOrdersForThread,
  fetchStockProducts,
  fetchStockWarnings,
  getLiveOrderStats,
  syncProductAliasToMaster,
  updateProductMapAlias,
  updateStockProduct,
} from "./supabase";
import { listAuditLogs } from "./db";
import { createAuditLog, saveChatMessage } from "./db";
import { sendMetaMessage } from "./meta";
import { storagePut } from "./storage";

const threadInput = z.object({ pageId: z.string().min(1), threadId: z.string().min(1) });
const summaryTimingInput = z.object({ limit: z.number().int().min(1).max(100).default(8) });

type UserLike = { id: number; role: "user" | "admin"; name?: string | null; email?: string | null };

function effectiveUser(ctxUser: UserLike | null | undefined): UserLike | null {
  return ctxUser ?? (PRESENTATION_MODE ? PRESENTATION_USER : null);
}

function ownerId(ctxUser: UserLike | null | undefined) {
  return effectiveUser(ctxUser)?.id ?? PRESENTATION_USER.id;
}

function parseMetadata(value: unknown) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try { return JSON.parse(String(value)); } catch { return {}; }
}

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true, service: "suphabass-canonical-order-desk", deskKey: "suphabass", time: new Date().toISOString() })),

  auth: router({
    me: publicProcedure.query(({ ctx }) => effectiveUser(ctx.user)),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  orders: router({
    threads: publicProcedure.query(async () => fetchLiveThreads()),
    live: publicProcedure.input(z.object({ search: z.string().optional(), limit: z.number().int().min(1).max(500).default(300) }).optional()).query(async ({ input }) => {
      const orders = (await fetchLiveOrders(input?.search)).slice(0, input?.limit ?? 300);
      const mapped = getLiveOrderStats(orders);
      return { orders, stats: mapped, fetchedAt: new Date().toISOString() };
    }),
    dailyOrderHistory: publicProcedure.input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), search: z.string().optional() })).query(({ input }) => fetchDailyOrderHistory(input.date, input.search)),
    forThread: publicProcedure.input(threadInput).query(({ input }) => fetchOrdersForThread(input.pageId, input.threadId)),
    parcelForOrder: publicProcedure.input(z.object({ orderNumber: z.string().min(1) })).query(async ({ input }) => { const order = await fetchLiveOrder(input.orderNumber); return order ? fetchParcelForOrder(order) : null; }),
    customerHistory: publicProcedure.input(z.object({ search: z.string().optional(), limit: z.number().int().min(1).max(500).default(200) }).optional()).query(({ input }) => fetchCustomerHistory(input?.search, input?.limit ?? 200)),
    parcelMatches: publicProcedure.input(z.object({ status: z.enum(["all", "matched", "review", "unmatched"]).default("all"), limit: z.number().int().min(1).max(500).default(300) })).query(({ input }) => fetchParcelMatchReview(input.status, input.limit)),
    chatEvidence: publicProcedure.input(threadInput).query(({ input }) => fetchConversationEvidence(input.pageId, input.threadId)),
    searchEvidence: publicProcedure.input(z.object({ q: z.string().optional(), pageId: z.string().optional(), conversationKey: z.string().optional(), limit: z.number().int().min(1).max(200).default(50) })).query(async ({ input }) => {
      const rows = await fetchExternalChatMessages(input.pageId, input.conversationKey, input.limit);
      const q = input.q?.trim().toLowerCase();
      return rows.filter(row => !q || JSON.stringify(row).toLowerCase().includes(q)).slice(0, input.limit);
    }),
    dailyChatSummary: publicProcedure.input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })).query(({ input }) => fetchDailyChatOrderSummary(input.date)),
    generateSummary: publicProcedure.input(z.object({ rawText: z.string(), customerName: z.string().optional(), product: z.string().optional(), cod: z.string().optional(), orderNumber: z.string().optional(), pageId: z.string().optional(), threadId: z.string().optional() })).mutation(({ input }) => generateOrderSummary(input)),
    summaryTimings: publicProcedure.input(summaryTimingInput).query(async ({ input }) => {
      const logs = await listAuditLogs(input.limit, "order_summary_generated");
      return logs.map(log => ({
        id: log.id,
        createdAt: log.createdAt,
        orderNumber: log.entityId ?? "",
        pageId: log.pageId ?? "",
        threadId: log.threadId ?? "",
        metadata: parseMetadata(log.metadataJson),
      }));
    }),
    confirmations: publicProcedure.query(async () => {
      const logs = await listAuditLogs(500, "order_confirmed");
      return logs
        .filter(log => log.pageId && log.threadId)
        .map(log => {
          const metadata = parseMetadata(log.metadataJson) as { orderNumber?: string };
          return { pageId: log.pageId as string, threadId: log.threadId as string, orderNumber: metadata.orderNumber ?? log.entityId ?? undefined };
        });
    }),
    confirmFromChat: publicProcedure.input(threadInput.extend({ customerName: z.string().optional(), customerId: z.string().optional(), evidenceText: z.string().optional() })).mutation(async ({ ctx, input }) => {
      await createAuditLog({
        actorUserId: effectiveUser(ctx.user)?.id,
        actorName: effectiveUser(ctx.user)?.name,
        action: "order_confirmed",
        entityType: "chat_thread",
        entityId: input.customerId,
        pageId: input.pageId,
        threadId: input.threadId,
        metadata: { customerName: input.customerName, evidenceText: input.evidenceText },
      });
      return { ok: true, deskKey: "suphabass", ...input };
    }),
  }),

  chat: router({
    messages: publicProcedure.input(threadInput).query(({ input }) => fetchExternalChatMessages(input.pageId, input.threadId)),
    deliveryHealth: publicProcedure.query(() => ({ failed: [] as Array<{ id: string; message: string }>, sent: [] as Array<{ id: string }> })),
    sendReply: publicProcedure.input(z.object({ pageId: z.string(), threadId: z.string(), recipientId: z.string(), text: z.string().optional(), imageUrl: z.string().optional(), stickerId: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const result = await sendMetaMessage(input);
      const messageText = input.text ?? (input.imageUrl ? "[รูปภาพ]" : input.stickerId ? `[สติกเกอร์ ${input.stickerId}]` : "");
      await saveChatMessage({ providerMessageId: result.message_id, pageId: input.pageId, threadId: input.threadId, senderId: input.pageId, senderType: "page", direction: "outbound", text: messageText, attachments: input.imageUrl ? [{ type: "image", url: input.imageUrl }] : input.stickerId ? [{ type: "sticker", id: input.stickerId }] : undefined, adminUserId: effectiveUser(ctx.user)?.id });
      await createAuditLog({ actorUserId: effectiveUser(ctx.user)?.id, actorName: effectiveUser(ctx.user)?.name, action: "meta_message_sent", entityType: "chat_message", entityId: result.message_id, pageId: input.pageId, threadId: input.threadId, metadata: { recipientId: input.recipientId, kind: input.text ? "text" : input.imageUrl ? "image" : "sticker" } });
      return { ok: true, ...result };
    }),
    simulateSend: publicProcedure.input(z.object({ pageId: z.string(), threadId: z.string(), recipientId: z.string(), kind: z.enum(["text", "image"]), text: z.string().optional(), imageUrl: z.string().optional() })).mutation(({ input }) => ({ dryRun: true, payload: input })),
    uploadImage: publicProcedure.input(z.object({ fileName: z.string(), contentType: z.string().regex(/^image\//), base64: z.string().min(20) })).mutation(async ({ input }) => {
      const encoded = input.base64.replace(/^data:[^;]+;base64,/, "");
      const data = Buffer.from(encoded, "base64");
      if (data.length > 6_000_000) throw new Error("IMAGE_TOO_LARGE: รูปภาพต้องมีขนาดไม่เกิน 6 MB");
      const extension = input.fileName.toLowerCase().match(/\.(jpe?g|png|gif|webp)$/)?.[1] ?? "jpg";
      const uploaded = await storagePut(`suphabass/chat/${Date.now()}.${extension}`, data, input.contentType);
      return { url: uploaded.url, status: "uploaded" as const };
    }),
    metaErrors: publicProcedure.query((): Array<{ id: string; message: string; createdAt?: string }> => []),
  }),

  stock: router({
    products: publicProcedure.query(() => fetchStockProducts()),
    warnings: publicProcedure.query(() => fetchStockWarnings()),
    mappingSummary: publicProcedure.query(async () => {
      const products = await fetchStockProducts();
      const warnings = await fetchStockWarnings();
      const mapped = products.filter(item => Boolean(item.sku && item.aliases?.trim())).length;
      return { total: products.length, mapped, missingAlias: products.length - mapped, duplicateSku: warnings.filter(item => item.kind === "duplicate_sku").length, missingSku: warnings.filter(item => item.kind === "missing_sku").length, products };
    }),
    update: publicProcedure.input(z.object({ id: z.number().int(), stockQty: z.number().optional(), stockStatus: z.string().optional(), labelDisplay: z.string().optional(), unitPrice: z.number().optional() })).mutation(({ input }) => updateStockProduct(input.id, input)),
    updateAlias: publicProcedure.input(z.object({ sku: z.string().min(1), alias: z.string() })).mutation(({ input }) => updateProductMapAlias(input.sku, input.alias)),
  }),

  productAliases: router({
    list: publicProcedure.query(({ ctx }) => listProductAliases(ownerId(ctx.user))),
    catalog: publicProcedure.query(() => fetchLiveProductMappings()),
    create: publicProcedure.input(z.object({ alias: z.string().min(1), canonicalSku: z.string().min(1), canonicalLabel: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const result = await createProductAlias(ownerId(ctx.user), input);
      await syncProductAliasToMaster({ alias: input.alias, canonicalSku: input.canonicalSku }).catch(error => console.warn("[SUPHABASS] alias sync skipped:", error instanceof Error ? error.message : String(error)));
      return result;
    }),
    update: publicProcedure.input(z.object({ id: z.number().int(), alias: z.string().min(1), canonicalSku: z.string().min(1), canonicalLabel: z.string().min(1), isActive: z.boolean().optional() })).mutation(({ ctx, input }) => updateProductAlias(ownerId(ctx.user), input.id, input)),
  }),

  vault: router({
    projects: adminProcedure.query(({ ctx }) => listVaultProjects(ctx.user.id)),
    stats: adminProcedure.query(({ ctx }) => getVaultStats(ctx.user.id)),
    files: adminProcedure.input(z.object({ projectId: z.number().int(), search: z.string().optional() })).query(({ ctx, input }) => listVaultFiles(ctx.user.id, input.projectId, input.search)),
    file: adminProcedure.input(z.object({ fileId: z.number().int() })).query(({ ctx, input }) => getVaultFile(ctx.user.id, input.fileId)),
    createProject: adminProcedure.input(z.object({ name: z.string().min(1), description: z.string().optional(), category: z.string().optional() })).mutation(({ ctx, input }) => createVaultProject(ctx.user.id, input)),
    createFile: adminProcedure.input(z.object({ projectId: z.number().int(), title: z.string().min(1), path: z.string().min(1), language: z.string(), kind: z.enum(["code", "sql", "workflow", "document", "config", "other"]), content: z.string() })).mutation(({ ctx, input }) => createVaultFile(ctx.user.id, input)),
    updateFile: adminProcedure.input(z.object({ fileId: z.number().int(), projectId: z.number().int(), title: z.string().min(1), path: z.string().min(1), language: z.string(), kind: z.enum(["code", "sql", "workflow", "document", "config", "other"]), content: z.string(), isFavorite: z.boolean().optional() })).mutation(({ ctx, input }) => updateVaultFile(ctx.user.id, input.fileId, input)),
    verifyAccessCode: publicProcedure.input(z.object({ code: z.string() })).mutation(({ input }) => ({ ok: verifyVaultAccessCode(input.code) })),
  }),

  ai: router({
    chat: publicProcedure.input(z.object({ messages: z.array(z.object({ role: z.enum(["system", "user", "assistant"]), content: z.string() })) })).mutation(({ input }) => "SUPHABASS assistant is ready. Received " + input.messages.length + " message(s)."),
  }),

  delivery: router({
    pending: publicProcedure.input(z.object({ roomKey: z.string().optional() }).optional()).query(() => [] as unknown[]),
    claim: publicProcedure.input(z.object({ roomKey: z.string(), worker: z.string().default("suphabass") })).mutation(({ input }) => ({ ok: false, status: "not_configured", ...input })),
  }),
});

export type AppRouter = typeof appRouter;
