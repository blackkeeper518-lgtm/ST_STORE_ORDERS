import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { COOKIE_NAME } from "../shared/const";
import { sendMetaMessage } from "./meta";
import { storagePut } from "./storage";
import { fetchParcelMappingQueue, purgeOldParcels, recordOutgoingChatMessage, supabaseGet, supabasePost } from "./supabase";
import * as db from "./db";

const ownerId = (ctx: { user: { id: number } | null }) => ctx.user?.id ?? 0;
const kind = z.enum(["code", "sql", "workflow", "document", "config", "other"]);
async function persistOutgoingChatBestEffort(input: Parameters<typeof recordOutgoingChatMessage>[0]) {
  try { await recordOutgoingChatMessage(input); }
  catch (error) { console.error("[chat] outgoing write-back failed after Meta accepted message", error); }
}
async function persistLocalChatBestEffort(input: Parameters<typeof db.saveChatMessage>[0]) {
  try { await db.saveChatMessage(input); }
  catch (error) { console.error("[chat] local audit write skipped after Meta accepted message", error); }
}

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true, service: "drakside-system", time: new Date().toISOString() })),

  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { (ctx.res as any).clearCookie(COOKIE_NAME, { maxAge: -1, httpOnly: true, secure: true, sameSite: "none", path: "/" }); return { success: true }; }),
  }),

  chat: router({
    sendReply: publicProcedure.input(z.object({ pageId: z.string(), pageName: z.string().optional(), portalKey: z.string().optional(), chatLinkKey: z.string().optional(), threadId: z.string(), recipientId: z.string(), text: z.string().optional(), imageUrl: z.string().optional(), stickerId: z.string().optional() })).mutation(async ({ input, ctx }) => {
      const result = await sendMetaMessage(input);
      void persistOutgoingChatBestEffort({ portalKey: input.portalKey, chatLinkKey: input.chatLinkKey, pageId: input.pageId, pageName: input.pageName, threadId: input.threadId, recipientId: input.recipientId, messageId: result.message_id, text: input.text });
      void persistLocalChatBestEffort({ pageId: input.pageId, threadId: input.threadId, senderId: input.pageId, senderType: "page", direction: "outbound", text: input.text, attachments: input.imageUrl ? [{ url: input.imageUrl }] : undefined, adminUserId: ctx.user?.id, providerMessageId: result.message_id });
      return result;
    }),
    uploadImage: publicProcedure.input(z.object({ fileName: z.string(), contentType: z.string(), base64: z.string() })).mutation(async ({ input }) => {
      const comma = input.base64.indexOf(",");
      const raw = comma >= 0 ? input.base64.slice(comma + 1) : input.base64;
      return storagePut(`chat/${input.fileName}`, Buffer.from(raw, "base64"), input.contentType);
    }),
  }),

  parcels: router({
    mappingQueue: adminProcedure.input(z.object({ status: z.enum(["all", "ready", "over24", "over48", "sent"]).default("all"), limit: z.number().int().min(1).max(500).default(300) })).query(({ input }) => fetchParcelMappingQueue({ status: input.status === "sent" ? "sent" : "all", limit: input.limit })),
    purgeExpired: adminProcedure.input(z.object({ confirmation: z.literal("DELETE_PARCELS_OLDER_THAN_3_DAYS") })).mutation(() => purgeOldParcels()),
    sendTracking: adminProcedure.input(z.object({
      pageId: z.string().min(1),
      threadId: z.string().min(1),
      recipientId: z.string().min(1),
      text: z.string().trim().min(1).max(2000),
    })).mutation(async ({ input, ctx }) => {
      const result = await sendMetaMessage(input);
      await db.saveChatMessage({
        pageId: input.pageId,
        threadId: input.threadId,
        senderId: input.recipientId,
        senderType: "admin",
        direction: "outbound",
        text: input.text,
        adminUserId: ctx.user.id,
      });
      return result;
    }),
  }),

  vault: router({
    verifyAccessCode: publicProcedure.input(z.object({ code: z.string() })).mutation(({ input }) => ({ ok: Boolean(process.env.VAULT_ACCESS_CODE && input.code === process.env.VAULT_ACCESS_CODE) })),
    projects: adminProcedure.query(({ ctx }) => db.listVaultProjects(ownerId(ctx))),
    stats: adminProcedure.query(({ ctx }) => db.getVaultStats(ownerId(ctx))),
    files: adminProcedure.input(z.object({ projectId: z.number(), search: z.string().optional() })).query(({ ctx, input }) => db.listVaultFiles(ownerId(ctx), input.projectId, input.search)),
    file: adminProcedure.input(z.object({ fileId: z.number() })).query(({ ctx, input }) => db.getVaultFile(ownerId(ctx), input.fileId)),
    createProject: adminProcedure.input(z.object({ name: z.string(), description: z.string().optional(), category: z.string().optional() })).mutation(({ ctx, input }) => db.createVaultProject(ownerId(ctx), input)),
    createFile: adminProcedure.input(z.object({ projectId: z.number(), path: z.string(), title: z.string(), language: z.string(), kind, content: z.string() })).mutation(({ ctx, input }) => db.createVaultFile(ownerId(ctx), input)),
    updateFile: adminProcedure.input(z.object({ fileId: z.number(), projectId: z.number(), path: z.string(), title: z.string(), language: z.string(), kind, content: z.string(), isFavorite: z.boolean().optional() })).mutation(({ ctx, input: { fileId, ...input } }) => db.updateVaultFile(ownerId(ctx), fileId, input)),
  }),

  ai: router({ chat: publicProcedure.input(z.object({ messages: z.array(z.unknown()) })).mutation(() => ({ text: "AI endpoint is not configured" })) }),
  delivery: router({
    pending: publicProcedure.input(z.object({ roomKey: z.string().optional() }).optional()).query(async ({ input }) => {
      const filter = input?.roomKey ? `&room_key=eq.${encodeURIComponent(input.roomKey)}` : "";
      return supabaseGet<unknown[]>(`vw_trial_label_delivery_queue?select=*${filter}&order=created_at.asc&limit=100`);
    }),
    claim: publicProcedure.input(z.object({ roomKey: z.string(), worker: z.string().default("vercel") })).mutation(({ input }) => supabasePost<unknown>("rpc/claim_view_order", { p_order_id: Number(input.roomKey) })),
  }),
});

export type AppRouter = typeof appRouter;
