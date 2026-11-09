import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/useMobile";
import { readChatMessages, readChatThreads, subscribeToChatMessages } from "@/lib/canonical";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { Check, CheckCircle2, ChevronDown, CircleUserRound, Clipboard, ImagePlus, LoaderCircle, MessageCircle, RefreshCw, Search, Send, Sparkles, Users, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function timeLabel(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("th-TH", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}

function imageUrls(value: string | null | undefined) {
  if (!value) return [];
  try {
    const attachments = JSON.parse(value) as unknown;
    const urls: string[] = [];
    const walk = (item: unknown) => {
      if (!item || typeof item !== "object") return;
      const record = item as Record<string, unknown>;
      for (const candidate of [record.url, record.file_url, (record.payload as Record<string, unknown> | undefined)?.url]) {
        if (typeof candidate === "string" && /^https?:\/\//i.test(candidate) && !urls.includes(candidate)) urls.push(candidate);
      }
      Object.values(record).forEach(child => Array.isArray(child) && child.forEach(walk));
    };
    if (Array.isArray(attachments)) attachments.forEach(walk); else walk(attachments);
    return urls;
  } catch { return []; }
}

function stripSpeakerPrefix(value: string) { return value.replace(/^\s*\[(?:เพจ|ลูกค้า)\]\s*/i, "").trim(); }
function isPageTimelineLine(line: string) { return /\[\s*เพจ\s*[:：]/i.test(line); }
function isCustomerTimelineLine(line: string) { return /\[\s*ลูกค้า\s*[:：]/i.test(line); }
function isThreadControlConflict(message: string) { return /META_THREAD_CONTROL_CONFLICT|another app|currently controlling|ควบคุมเธรด|แอพอื่นกำลังควบคุม/i.test(message); }
function isTransientMetaInternal(message: string) { return /META_TRANSIENT_INTERNAL|2018012|code=-1/i.test(message); }


const CHAT_SOUND_KEY = "nightops-chat-sound-v1";
const CHAT_PAGE_FILTER_KEY = "bb-orders-chat-page-filter-v1";
const CHAT_SELECTED_ROOM_KEY = "bb-orders-chat-selected-room-v1";
function playChatNotificationSound() {
  try {
    const settings = JSON.parse(localStorage.getItem(CHAT_SOUND_KEY) || "{}");
    if (settings.enabled === false) return;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const tone = settings.tone === "bell" ? 880 : settings.tone === "pop" ? 520 : 660;
    const duration = settings.tone === "bell" ? 0.42 : 0.18;
    oscillator.type = settings.tone === "pop" ? "square" : "sine";
    oscillator.frequency.value = tone;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.01, Number(settings.volume) || 0.35), context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration + 0.03);
    window.setTimeout(() => void context.close(), 700);
  } catch { /* Browser may block audio until a user gesture. */ }
}

const quickReplies = [
  "สวัสดีค่ะ สนใจรับกี่คอตดีคะ?",
  "มีบริการเก็บเงินปลายทางค่ะ",
  "ขอชื่อ ที่อยู่ และเบอร์โทรสำหรับจัดส่งด้วยค่ะ",
  "ขอบคุณค่ะ เดี๋ยวแอดมินรีบเช็กให้ค่ะ",
];

export default function ChatHub() {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(() => typeof window === "undefined" ? null : localStorage.getItem(CHAT_SELECTED_ROOM_KEY));
  const [composerOpen, setComposerOpen] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(() => typeof window === "undefined" || window.innerWidth >= 1440);
  const [toolsWidth, setToolsWidth] = useState(320);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pageFilterOpen, setPageFilterOpen] = useState(false);
  const [selectedPages, setSelectedPages] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { const value = JSON.parse(localStorage.getItem(CHAT_PAGE_FILTER_KEY) || "[]"); return Array.isArray(value) ? value.filter(item => typeof item === "string") : []; } catch { return []; }
  });
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "ordered">("all");
  const [replyText, setReplyText] = useState("");
  const [replyImageUrl, setReplyImageUrl] = useState("");
  const [stickerId, setStickerId] = useState("");
  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([]);
  const optimisticMessageIdRef = useRef<string | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [replyNotice, setReplyNotice] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [summary, setSummary] = useState<{ orderNumber: string; customerName: string; phone: string; address: string; product: string; cod: string; copyText: string; unitPrice?: number | null; timingMs?: { total: number; parse: number; dataLookup: number; audit: number } } | null>(null);
  const [messageFilter, setMessageFilter] = useState<"all" | "customer" | "page">("all");
  const [copied, setCopied] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const chatTimelineRef = useRef<HTMLDivElement>(null);
  const [showNewMessages, setShowNewMessages] = useState(false);
  const nearBottomRef = useRef(true);
  const lastSelectedKeyRef = useRef<string | null>(null);
  useEffect(() => { localStorage.setItem(CHAT_PAGE_FILTER_KEY, JSON.stringify(selectedPages)); }, [selectedPages]);
  useEffect(() => { if (selectedKey) localStorage.setItem(CHAT_SELECTED_ROOM_KEY, selectedKey); }, [selectedKey]);
  const threadsQuery = useQuery({ queryKey: ["canonical-chat-threads"], queryFn: readChatThreads, refetchInterval: 15_000 });
  const threads = threadsQuery.data ?? [];
  const availablePages = useMemo<Array<[string, string, boolean]>>(
    () => Array.from(new Map(threads.filter(thread => thread.pageId && thread.pageName && thread.pageName !== "ไม่ระบุเพจ").map(thread => [thread.pageId as string, { name: thread.pageName as string, active: Boolean((thread as any).codTodayActive) }] as [string, { name: string; active: boolean }])).entries()).map(([pageId, value]) => [pageId, value.name, value.active] as [string, string, boolean]).sort((a, b) => a[1].localeCompare(b[1], "th")),
    [threads],
  );
  const codLeaderboard = useMemo(() => {
    const counts = new Map<string, { pageId: string; pageName: string; count: number }>();
    threads.forEach(thread => {
      if (!thread.pageId || !thread.pageName || thread.pageName === "ไม่ระบุเพจ") return;
      const current = counts.get(thread.pageId) ?? { pageId: thread.pageId, pageName: thread.pageName, count: 0 };
      if ((thread as any).codTodayActive) current.count += 1;
      counts.set(thread.pageId, current);
    });
    return Array.from(counts.values()).filter(item => item.count > 0).sort((a, b) => b.count - a.count || a.pageName.localeCompare(b.pageName, "th"));
  }, [threads]);
  const filteredThreads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return threads.filter(thread => {
      const matchesPage = selectedPages.length === 0 || Boolean(thread.pageId && selectedPages.includes(thread.pageId));
      const matchesStatus = statusFilter === "all" || (statusFilter === "unread" ? thread.unread : thread.codSignalCount > 0);
      const matchesSearch = !query || [thread.customerName, thread.pageName, thread.preview, thread.searchText, thread.latestOrderNumber].some(value => String(value ?? "").toLowerCase().includes(query));
      return matchesPage && matchesStatus && matchesSearch;
    });
  }, [threads, search, selectedPages, statusFilter]);
  const selected = filteredThreads.find(thread => thread.key === selectedKey) ?? filteredThreads[0];
  const selectedPageId = selected?.pageId ?? selected?.orders[0]?.page_id ?? "";
  const selectedThreadId = selected?.threadId ?? "";
  const selectedCustomerId = selected?.customerId ?? "";
  const [handoffTracking, setHandoffTracking] = useState<Record<string, any> | null>(null);
  const messagesQuery = useQuery({ queryKey: ["canonical-chat-messages", selectedPageId, selectedThreadId], queryFn: () => readChatMessages(selectedPageId, selectedThreadId), enabled: Boolean(selectedPageId && selectedThreadId), refetchInterval: 5_000 });
  useEffect(() => {
    setOptimisticMessages([]);
    optimisticMessageIdRef.current = null;
  }, [selectedPageId, selectedThreadId]);
  useEffect(() => {
    const serverTexts = new Set((messagesQuery.data ?? []).filter(message => message.direction === "outbound").map(message => message.text));
    if (!serverTexts.size) return;
    setOptimisticMessages(current => current.filter(message => !serverTexts.has(message.text)));
  }, [messagesQuery.data]);
  useEffect(() => {
    if (!selectedPageId || !selectedThreadId || typeof window === "undefined") {
      setHandoffTracking(null);
      return;
    }
    try {
      const raw = window.sessionStorage.getItem(`darkside-send-gate:${selectedPageId}:${selectedThreadId}`);
      setHandoffTracking(raw ? JSON.parse(raw) : null);
    } catch {
      setHandoffTracking(null);
    }
  }, [selectedPageId, selectedThreadId]);
  useEffect(() => {
    const unsubscribe = subscribeToChatMessages(() => {
      void threadsQuery.refetch();
      if (selectedPageId && selectedThreadId) void messagesQuery.refetch();
    });
    return unsubscribe;
  }, [selectedPageId, selectedThreadId]);
  const soundSnapshotRef = useRef({ room: "", count: 0 });
  useEffect(() => {
    const room = `${selectedPageId}:${selectedThreadId}`;
    const messages = messagesQuery.data ?? [];
    if (soundSnapshotRef.current.room !== room) {
      soundSnapshotRef.current = { room, count: messages.length };
      return;
    }
    if (messages.length > soundSnapshotRef.current.count) {
      const newest = messages[messages.length - 1];
      if (newest?.direction === "inbound" || newest?.senderType === "customer") playChatNotificationSound();
    }
    soundSnapshotRef.current.count = messages.length;
  }, [messagesQuery.data, selectedPageId, selectedThreadId]);
  const linkedOrders = selected?.orders ?? [];
  const selectedTrackingRows = useMemo(() => {
    if (!selected) return [];
    const room = selected as Record<string, any>;
    const row = {
      tracking_number: room.tracking_number ?? room.parcel_tracking_number ?? "",
      order_number: room.order_number ?? "",
      order_number_display: room.order_number_display ?? "",
      shipping_carrier: room.shipping_carrier ?? "",
      facebook_tracking_message: room.facebook_tracking_message ?? "",
      drakside_tracking_message: room.drakside_tracking_message ?? "",
    };
    const merged = { ...handoffTracking };
    Object.entries(row).forEach(([key, value]) => {
      if (String(value ?? "").trim()) merged[key] = value;
    });
    return Object.values(merged).some(value => String(value ?? "").trim()) ? [merged] : [];
  }, [selected, handoffTracking]);
  const chatEvidenceQuery = trpc.orders.chatEvidence.useQuery({ pageId: selectedPageId, threadId: selectedThreadId }, { enabled: Boolean(selectedPageId && selectedThreadId && orderDetailOpen), refetchInterval: 60_000 });
  const totalMessages = useMemo(() => threads.reduce((total, thread) => total + thread.messageCount, 0), [threads]);
  const uploadImage = trpc.chat.uploadImage.useMutation({ onSuccess: result => setReplyImageUrl(`${window.location.origin}${result.url}`) });
  const sendReply = trpc.chat.sendReply.useMutation({
    onMutate: () => { setDeliveryStatus("sending"); setReplyNotice("กำลังส่งไปยัง Facebook…"); },
    onSuccess: () => {
      setDeliveryStatus("sent");
      setReplyNotice("ส่งข้อความสำเร็จแล้ว");
      setReplyText("");
      setReplyImageUrl("");
      setStickerId("");
      void Promise.all([messagesQuery.refetch(), threadsQuery.refetch()]);
    },
    onError: error => {
      setDeliveryStatus("failed");
      setReplyNotice(error.message || "ส่งข้อความไม่สำเร็จ");
      const failedId = optimisticMessageIdRef.current;
      if (failedId) setOptimisticMessages(current => current.filter(message => message.id !== failedId));
      optimisticMessageIdRef.current = null;
    },
  });
  const generateSummary = trpc.orders.generateSummary.useMutation({ onSuccess: result => { setSummary(result); setSummaryText(""); setReplyText(result.copyText); } });
  const summaryTimingsQuery = trpc.orders.summaryTimings.useQuery({ limit: 8 }, { enabled: summaryOpen, refetchInterval: false });
  const metaErrorsQuery = trpc.chat.metaErrors.useQuery(undefined, { refetchInterval: 60_000 });
  const confirmationsQuery = trpc.orders.confirmations.useQuery(undefined, { refetchInterval: 30_000 });
  const confirmOrder = trpc.orders.confirmFromChat.useMutation({ onSuccess: () => confirmationsQuery.refetch() });
  const confirmedKeys = new Set((confirmationsQuery.data ?? []).map(row => `${row.pageId}:${row.threadId}`));
  const openOrderSummary = () => {
    if (!selected) return;
    const linkedSource = selected.orders?.find((order: any) => order.source_text)?.source_text
      || selected.orders?.find((order: any) => order.source_payload?.source_text)?.source_payload?.source_text;
    const seed = linkedSource || selected.chatTimeline?.join("\n") || selected.preview || "";
    setSummary(null);
    setSummaryText(seed);
    setSummaryOpen(true);
  };
  const selectedConfirmed = Boolean(selected && confirmedKeys.has(`${selectedPageId}:${selectedThreadId}`));
  const confirmSelectedOrder = () => { if (!selectedPageId || !selectedThreadId || selectedConfirmed) return; confirmOrder.mutate({ pageId: selectedPageId, threadId: selectedThreadId, customerName: selected?.customerName ?? undefined, customerId: selectedCustomerId || undefined, evidenceText: selected?.preview ?? undefined }); };

  useEffect(() => { if (!selectedKey && filteredThreads[0]) setSelectedKey(filteredThreads[0].key); }, [filteredThreads, selectedKey]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pageId = params.get("page_id");
    const threadId = params.get("thread_id");
    if (!pageId || !threadId) return;
    const target = threads.find(thread => thread.pageId === pageId && thread.threadId === threadId);
    if (target) {
      setSelectedKey(target.key);
      if (isMobile) setMobileOpen(true);
    }
  }, [threads, isMobile]);
  useEffect(() => { if (selectedKey && !filteredThreads.some(thread => thread.key === selectedKey)) setSelectedKey(filteredThreads[0]?.key ?? null); }, [filteredThreads, selectedKey]);
  useEffect(() => {
    const element = chatTimelineRef.current;
    if (!element) return;
    const selectedChanged = lastSelectedKeyRef.current !== selectedKey;
    lastSelectedKeyRef.current = selectedKey;
    if (!selectedChanged && !nearBottomRef.current) {
      setShowNewMessages(true);
      return;
    }
    const frame = window.requestAnimationFrame(() => element.scrollTo({ top: element.scrollHeight, behavior: "auto" }));
    setShowNewMessages(false);
    return () => window.cancelAnimationFrame(frame);
  }, [selectedKey, messagesQuery.data?.length]);

  const handleTimelineScroll = () => {
    const element = chatTimelineRef.current;
    if (!element) return;
    nearBottomRef.current = element.scrollHeight - element.clientHeight - element.scrollTop <= 100;
    if (nearBottomRef.current) setShowNewMessages(false);
  };

  const jumpToLatest = () => {
    const element = chatTimelineRef.current;
    if (!element) return;
    nearBottomRef.current = true;
    element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
    setShowNewMessages(false);
  };

  const sendCurrentReply = () => {
    const text = replyText.trim();
    const imageUrl = replyImageUrl.trim();
    if (sendReply.isPending || !selectedPageId || !selectedThreadId || (!text && !imageUrl)) return;
    if (!selectedCustomerId) { setDeliveryStatus("failed"); setReplyNotice("ห้องนี้ยังไม่มี Customer PSID จึงยังส่งข้อความไม่ได้"); return; }
    const optimisticId = `optimistic-${Date.now()}`;
    optimisticMessageIdRef.current = optimisticId;
    setOptimisticMessages(current => [...current, { id: optimisticId, text: text || "ส่งรูปภาพ", message_text: text, direction: "outbound", senderType: "page", side: "right", occurredAt: new Date().toISOString(), attachmentsJson: imageUrl ? JSON.stringify([{ url: imageUrl }]) : "[]" }]);
    sendReply.mutate({
      pageId: selectedPageId,
      pageName: selected?.pageName ?? undefined,
      portalKey: selected?.portalKey ?? undefined,
      chatLinkKey: selected?.chatLinkKey ?? undefined,
      threadId: selectedThreadId,
      recipientId: selectedCustomerId,
      text: text || undefined,
      imageUrl: imageUrl || undefined,
    });
  };
  const handleImageUpload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 6_000_000) return;
    const reader = new FileReader();
    reader.onload = () => uploadImage.mutate({ fileName: file.name, contentType: file.type as "image/jpeg", base64: String(reader.result) });
    reader.readAsDataURL(file);
  };
  const addEmoji = (emoji: string) => setReplyText(current => `${current}${current ? " " : ""}${emoji}`);
  const copySummary = async () => {
    if (!replyText.trim()) return;
    await navigator.clipboard.writeText(replyText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  const visibleTimeline = (selected?.chatTimeline ?? []).filter((line: string) => messageFilter === "all" || (messageFilter === "page" ? isPageTimelineLine(line) : isCustomerTimelineLine(line)));
  const visibleStoredMessages = [...(messagesQuery.data ?? []), ...optimisticMessages].filter(message => messageFilter === "all" || (messageFilter === "page" ? message.direction === "outbound" : message.direction === "inbound"));

  const composer = <div className="min-h-0 overflow-hidden border-t border-cyan-300/20 pt-2">
    <div className="mb-2 flex shrink-0 flex-wrap items-center gap-2"><input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={event => { handleImageUpload(event.target.files?.[0]); event.currentTarget.value = ""; }} /><Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadImage.isPending} className="h-8 border-cyan-300/25 bg-cyan-300/[0.06] text-xs text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,.08)]"><ImagePlus className="mr-1 h-3.5 w-3.5" />{uploadImage.isPending ? "กำลังอัปโหลด…" : "แนบรูป"}</Button>{replyImageUrl ? <span className="max-w-40 truncate text-[10px] text-emerald-300">รูปพร้อมส่ง</span> : null}</div>
    <div className="mb-2 flex flex-nowrap gap-1.5 overflow-x-auto whitespace-nowrap pb-1">{quickReplies.map(reply => <button key={reply} type="button" onClick={() => setReplyText(reply)} className="shrink-0 rounded-lg border border-violet-300/20 bg-gradient-to-r from-violet-500/[0.10] to-fuchsia-500/[0.08] px-2.5 py-1.5 text-xs text-fuchsia-100/85 transition hover:border-cyan-300/40 hover:bg-cyan-400/10 hover:text-white">{reply}</button>)}{["😊", "👍", "❤️", "🙏", "📦"].map(emoji => <button key={emoji} type="button" onClick={() => addEmoji(emoji)} className="shrink-0 rounded-lg border border-cyan-300/20 bg-cyan-400/[0.06] px-2.5 py-1.5 text-base transition hover:border-fuchsia-300/40 hover:bg-fuchsia-500/15">{emoji}</button>)}</div>
    <div className="flex items-end gap-2"><Textarea value={replyText} onChange={event => setReplyText(event.target.value)} placeholder={selectedCustomerId ? "พิมพ์ตอบลูกค้า…" : "ไม่พบ Customer PSID ของห้องนี้"} disabled={!selectedCustomerId} className="h-24 max-h-28 min-h-24 resize-none overflow-y-auto rounded-xl border-cyan-300/20 bg-[#0a111b] text-sm leading-6 text-white placeholder:text-cyan-100/35 focus-visible:ring-cyan-300/40" onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendCurrentReply(); } }} /><Button aria-label="ส่งข้อความ" disabled={sendReply.isPending || !selectedCustomerId || (!replyText.trim() && !replyImageUrl.trim())} onClick={sendCurrentReply} className="h-11 shrink-0 rounded-xl bg-gradient-to-br from-cyan-300 to-violet-400 text-[#07101a] shadow-[0_0_18px_rgba(34,211,238,.32)] transition hover:brightness-110"><Send className="h-4 w-4" /></Button></div>


  </div>;

  const conversation = selected ? <div className="chat-cosmos-conversation flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-cyan-300/15 bg-gradient-to-r from-cyan-400/[0.035] via-transparent to-fuchsia-500/[0.06] px-4 py-3 sm:px-5"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/20 via-violet-500/20 to-fuchsia-500/25 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,.12)]"><CircleUserRound className="h-5 w-5" /></div><div className="min-w-0"><div className="mb-1 flex flex-wrap items-center gap-1.5"><span className={`${selected.codTodayActive ? "cod-room-header" : ""} rounded-md border border-fuchsia-300/25 bg-fuchsia-400/[0.08] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-fuchsia-200`}>ROOM · {selected.pageId ? selected.pageId.slice(-4) : "BB"}{selected.codTodayActive ? " ⚡" : ""}</span><span className="truncate text-[10px] text-cyan-200/70">{selected.pageName || "ไม่ระบุเพจ"}</span></div><h2 className="truncate text-base font-semibold text-white">{selected.customerName || "ลูกค้าใหม่"}</h2><div className="mt-1 flex items-center gap-2 text-xs text-cyan-100/55"><span className="truncate">{selected.pageName}</span><span>·</span><span>{timeLabel(selected.latestAt)}</span></div></div></div><div className="flex max-w-full flex-wrap items-center justify-end gap-2"><Badge className="hidden border border-emerald-400/25 bg-emerald-400/10 text-emerald-300 sm:inline-flex">● ONLINE</Badge><Button size="sm" variant="outline" onClick={confirmSelectedOrder} disabled={selectedConfirmed || confirmOrder.isPending} className="rounded-xl border-violet-300/25 bg-violet-400/[0.08] text-xs text-violet-100 hover:border-fuchsia-300/45 hover:bg-fuchsia-400/15">{selectedConfirmed ? <><CheckCircle2 className="mr-1 h-3.5 w-3.5" />ยืนยันแล้ว</> : confirmOrder.isPending ? "กำลังบันทึก…" : "ยืนยันเป็นออเดอร์"}</Button><Button size="sm" variant="outline" onClick={() => setOrderDetailOpen(true)} className="rounded-xl border-cyan-300/30 bg-cyan-400/[0.08] text-xs text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,.08)] hover:bg-cyan-400/15" title="นับข้อความที่มีคำว่า COD ในข้อมูลแชทที่โหลด">COD ({selected.codSignalCount ?? 0})</Button><Button size="sm" onClick={openOrderSummary} className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-xs shadow-[0_0_16px_rgba(217,70,239,.18)] hover:brightness-110">สรุปออเดอร์</Button>{isMobile ? <button onClick={() => setMobileOpen(false)} className="rounded-xl p-2 text-fuchsia-100/55 hover:bg-fuchsia-500/10 hover:text-white" aria-label="ปิดห้องแชท"><X className="h-5 w-5" /></button> : null}</div></div>
    <div ref={chatTimelineRef} onScroll={handleTimelineScroll} className="chat-cosmos-timeline relative min-h-0 flex-1 flex flex-col justify-start gap-3 overflow-y-auto overscroll-contain bg-[radial-gradient(circle_at_82%_8%,rgba(16,185,129,0.12),transparent_28%),radial-gradient(circle_at_12%_74%,rgba(168,85,247,0.11),transparent_30%),linear-gradient(135deg,#080c15,#0d0914_56%,#090b12)] p-4 sm:p-5 [-webkit-overflow-scrolling:touch]">
      {showNewMessages ? <button type="button" onClick={jumpToLatest} className="sticky bottom-3 left-1/2 z-20 mx-auto -mb-10 rounded-full border border-fuchsia-300/30 bg-gradient-to-r from-fuchsia-600 via-violet-600 to-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_24px_rgba(168,85,247,0.45)] transition hover:scale-105">ข้อความใหม่ · ลงล่างสุด</button> : null}
      {messagesQuery.isFetching ? <div className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/20 bg-[#15101d]/90 px-2.5 py-1 text-[10px] text-fuchsia-200"><LoaderCircle className="h-3 w-3 animate-spin" />กำลังอัปเดต</div> : null}
      {visibleStoredMessages.length === 0 ? <>{visibleTimeline.length ? visibleTimeline.map((line: string, index: number) => <div key={`${line}-${index}`} className={`chat-message-bubble min-w-0 shrink-0 break-words [overflow-wrap:anywhere] rounded-2xl px-4 py-3 text-sm leading-6 shadow-lg ${isPageTimelineLine(line) ? "ml-auto rounded-br-md border border-fuchsia-300/25 bg-gradient-to-br from-violet-900/80 to-fuchsia-950/65 text-fuchsia-50 shadow-[0_0_20px_rgba(217,70,239,.10)]" : "rounded-bl-md border border-emerald-300/25 bg-gradient-to-br from-emerald-950/85 to-green-950/55 text-emerald-50/95 shadow-[0_0_18px_rgba(16,185,129,.12)]"}`}><p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{stripSpeakerPrefix(line)}</p></div>) : <div className="rounded-2xl border border-fuchsia-500/10 bg-black/20 p-4 text-sm leading-6 text-fuchsia-100/60"><p>{selected.preview}</p></div>}<p className="text-[11px] text-fuchsia-100/30">แชทจากตารางกลาง · n8n API รอบถัดไปจะอัปเดตเข้าห้องนี้อัตโนมัติ</p></> : null}
      {visibleStoredMessages.map(message => { const isRight = ("side" in message && message.side === "right") || message.direction === "outbound" || message.senderType === "page"; const senderName = isRight ? (selected.pageName || "เพจ") : (selected.customerName || "ลูกค้า"); return <div key={message.id} className={`flex w-full shrink-0 ${isRight ? "justify-end" : "justify-start"}`}><div className={`chat-message-bubble min-w-0 shrink-0 break-words [overflow-wrap:anywhere] rounded-2xl px-4 py-3 text-sm leading-6 shadow-lg ${isRight ? "rounded-br-md border border-fuchsia-300/25 bg-gradient-to-br from-violet-900/80 to-fuchsia-950/65 text-fuchsia-50 shadow-[0_0_20px_rgba(217,70,239,.10)]" : "rounded-bl-md border border-emerald-300/25 bg-gradient-to-br from-emerald-950/85 to-green-950/55 text-emerald-50/95 shadow-[0_0_18px_rgba(16,185,129,.12)]"}`}><p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-60">{senderName}</p><p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{stripSpeakerPrefix(message.text || "ส่งรูปภาพ")}</p>{imageUrls(message.attachmentsJson).map(url => <button key={url} type="button" onClick={() => setLightboxUrl(url)} className="mt-2 block cursor-zoom-in text-left"><img src={url} alt="ไฟล์แนบจากแชท คลิกเพื่อขยาย" className="max-h-56 rounded-xl object-cover transition hover:brightness-110" /></button>)}<p className="mt-1 text-[10px] opacity-50">{senderName} · {timeLabel(String(message.occurredAt))}</p></div></div>; })}
    </div>
    <div className={`chat-cosmos-composer mt-auto flex shrink-0 flex-col overflow-hidden border-t border-cyan-300/20 bg-gradient-to-b from-[#111326] to-[#090c14] p-3 shadow-[0_-8px_28px_rgba(34,211,238,.05)] sm:p-4 transition-[height] duration-300 ${composerOpen ? "h-[270px] min-h-[270px]" : "h-12 min-h-12"}`}><div className="mb-2 flex shrink-0 items-center justify-between border-b border-fuchsia-500/10 pb-2"><span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fuchsia-100/45">กล่องตอบแชท</span>{replyNotice ? <span className={`max-w-[65%] truncate text-[10px] ${deliveryStatus === "sent" ? "text-emerald-300" : deliveryStatus === "failed" ? "text-rose-300" : "text-cyan-200"}`}>{replyNotice}</span> : null}<button type="button" onClick={() => setComposerOpen(value => !value)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-fuchsia-400/20 bg-fuchsia-400/[0.06] text-fuchsia-200 transition hover:bg-fuchsia-400/15" title={composerOpen ? "หุบกล่องตอบแชท" : "เปิดกล่องตอบแชท"} aria-label={composerOpen ? "หุบกล่องตอบแชท" : "เปิดกล่องตอบแชท"}><ChevronDown className={`h-4 w-4 transition-transform ${composerOpen ? "rotate-0" : "rotate-180"}`} /></button></div><div className={`min-h-0 flex-1 overflow-hidden ${composerOpen ? "" : "pointer-events-none opacity-0"}`}><div className="mb-3 flex shrink-0 flex-wrap items-center gap-1.5"><span className="mr-1 text-[10px] uppercase tracking-wider text-fuchsia-100/35">ดูข้อความ</span>{([ ["all", "ทั้งหมด"], ["customer", "ลูกค้า"], ["page", "เพจ"] ] as const).map(([value, label]) => <button key={value} onClick={() => setMessageFilter(value)} className={`rounded-lg px-2.5 py-1 text-[10px] transition ${messageFilter === value ? "bg-fuchsia-500/20 text-fuchsia-200 ring-1 ring-fuchsia-400/30" : "text-fuchsia-100/45 hover:bg-fuchsia-500/10 hover:text-fuchsia-100"}`}>{label}</button>)}</div>{summary ? <div className="mb-3 hidden shrink-0 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/[0.06] p-3"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold text-fuchsia-200">พรีวิวใบสรุป · {summary.orderNumber}</p><button onClick={() => setSummary(null)} className="text-[10px] text-fuchsia-100/40 hover:text-white">ล้าง</button></div><p className="mt-1 text-[11px] text-fuchsia-100/45">ตรวจข้อความด้านล่างให้ถูกต้องก่อนกดส่งให้ลูกค้า</p><Button variant="outline" size="sm" onClick={copySummary} className="mt-2 h-7 border-fuchsia-400/20 bg-transparent text-[10px] text-fuchsia-200">{copied ? <Check className="mr-1 h-3 w-3" /> : <Clipboard className="mr-1 h-3 w-3" />}{copied ? "คัดลอกแล้ว" : "คัดลอกข้อความสรุป"}</Button></div> : null}{composer}</div></div>
  </div> : <div className="flex min-h-[560px] items-center justify-center text-sm text-fuchsia-100/35">เลือกห้องแชทเพื่อเริ่มดูข้อความ</div>;

  return <div className="chat-cosmos-shell cosmic-stage h-full min-h-0 overflow-hidden bg-[radial-gradient(ellipse_at_top_left,rgba(34,211,238,0.11),transparent_38%),radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.10),transparent_40%),#070912] text-white"><div className="mx-auto flex h-full min-h-0 max-w-[1600px] flex-col gap-3 overflow-hidden p-2 sm:p-4 lg:p-6">
    <div className="flex shrink-0 items-center gap-2 rounded-xl border border-cyan-300/15 bg-[#0c1320]/80 px-3 py-2 text-xs text-cyan-100/70 shadow-[inset_0_0_16px_rgba(34,211,238,.04)] backdrop-blur-lg"><span className="inline-flex items-center gap-1.5 text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />SIGNAL LIVE</span><span className="text-fuchsia-100/20">·</span><span>รอบล่าสุด: {threadsQuery.dataUpdatedAt ? new Date(threadsQuery.dataUpdatedAt).toLocaleString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "กำลังโหลด"}</span></div>
    {codLeaderboard.length ? <div className="cod-leaderboard-marquee" aria-label="อันดับ COD วันนี้"><div className="cod-leaderboard-track">{[...codLeaderboard, ...codLeaderboard].map((item, index) => <span className={`cod-leaderboard-item ${(index % codLeaderboard.length) + 1 === 1 ? "cod-rank-winner" : ""} ${(index % codLeaderboard.length) + 1 === codLeaderboard.length ? "cod-rank-emergency" : ""}`} key={`${item.pageId}-${index}`}><b>╳╳ #{(index % codLeaderboard.length) + 1}</b> {item.pageName} <strong>COD signal {item.count} ห้อง</strong> <b>╳╳</b></span>)}</div></div> : null}
    {threadsQuery.isError ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-xs text-red-200"><span>โหลดห้องแชทไม่สำเร็จ: {threadsQuery.error.message}</span><Button size="sm" variant="outline" onClick={() => threadsQuery.refetch()} className="border-red-300/20 bg-transparent text-red-100">ลองใหม่</Button></div> : null}
    {threads.find(thread => thread.orderCountError)?.orderCountError ? <div role="alert" className="rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.06] px-4 py-3 text-xs leading-5 text-cyan-200">โหลดแชทได้ แต่การเชื่อมแถวออเดอร์มีปัญหา: {String(threads.find(thread => thread.orderCountError)?.orderCountError)}</div> : null}
    <header className="neon-sign relative shrink-0 overflow-hidden rounded-2xl border border-cyan-300/35 bg-gradient-to-r from-[#0c1421] via-[#151020] to-[#170d1d] px-4 py-3 shadow-[0_0_14px_rgba(34,211,238,.24),0_0_32px_rgba(168,85,247,.20),inset_0_0_20px_rgba(217,70,239,.10)] backdrop-blur-xl"><div className="hero-orbit pointer-events-none opacity-60" aria-hidden="true" /><div className="relative z-10 flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-fuchsia-300">COSMIC · CHAT CONTROL</p><h1 className="mt-1 text-xl font-semibold tracking-tight text-white drop-shadow-[0_0_8px_rgba(244,114,182,.95)]">กล่องข้อความรวม</h1></div><div className="flex items-center gap-2"><span className="hidden text-[10px] text-fuchsia-100/35 sm:inline">เลือกห้องเพื่อเริ่มตอบ</span><Button variant="outline" size="sm" onClick={() => threadsQuery.refetch()} className="h-8 border-fuchsia-400/20 bg-fuchsia-400/5 text-[10px] text-fuchsia-100 hover:bg-fuchsia-400/10"><RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${threadsQuery.isFetching ? "animate-spin" : ""}`} />รีเฟรช</Button></div></div></header>
    <div className="relative flex min-h-0 flex-1 flex-nowrap gap-3 overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch] xl:gap-4 xl:overflow-hidden"><Card className="flex w-[min(290px,84vw)] min-h-0 shrink-0 flex-col overflow-hidden rounded-3xl border-cyan-300/20 bg-[#0b111c]/95 shadow-[0_8px_32px_rgba(34,211,238,.08),0_0_24px_rgba(168,85,247,.06)] backdrop-blur-xl"><CardHeader className="border-b border-fuchsia-500/10 pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base">ห้องแชท <span className="ml-1 text-xs font-normal text-fuchsia-100/35">{filteredThreads.length}</span></CardTitle><button onClick={() => setPageFilterOpen(value => !value)} className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] ${selectedPages.length ? "bg-fuchsia-500/15 text-fuchsia-200" : "text-fuchsia-100/45 hover:bg-fuchsia-500/10 hover:text-fuchsia-100"}`}><span className="h-2 w-2 rounded-sm border border-current" />เพจ{selectedPages.length ? ` · ${selectedPages.length}` : ""}<ChevronDown className="h-3 w-3" /></button></div>
      <div className="relative mt-3"><Search className="absolute left-3 top-2.5 h-4 w-4 text-fuchsia-100/30" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="ค้นหาชื่อลูกค้าหรือข้อความ…" className="rounded-xl border-fuchsia-500/15 bg-black/20 pl-9 text-white placeholder:text-fuchsia-100/25 focus-visible:ring-fuchsia-400" />{pageFilterOpen ? <div className="absolute right-0 top-12 z-20 w-64 rounded-2xl border border-fuchsia-400/20 bg-[#181020] p-3 shadow-2xl shadow-black/50"><div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-wider text-fuchsia-300">เลือกเพจ</p><button onClick={() => setSelectedPages([])} className="text-[10px] text-fuchsia-100/40 hover:text-white">ล้าง</button></div>{availablePages.map(([pageId, pageName, codToday]) => { const active = selectedPages.includes(pageId); return <button key={pageId} type="button" onClick={() => setSelectedPages(current => active ? current.filter(item => item !== pageId) : [...current, pageId])} className={`page-holo-label group flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-xs transition ${codToday ? "page-holo-label--live" : ""} ${active ? "border-cyan-300/55 bg-cyan-300/15 text-cyan-50 shadow-[0_0_16px_rgba(34,211,238,.20)]" : "border-fuchsia-300/10 bg-black/15 text-fuchsia-50/70 hover:border-fuchsia-300/35 hover:bg-fuchsia-500/10"}`}><span className={`relative flex h-2.5 w-2.5 shrink-0 rounded-full ${codToday ? "bg-fuchsia-100 shadow-[0_0_12px_rgba(255,255,255,.95)]" : active ? "bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,.9)]" : "bg-fuchsia-200/25"}`} /><span className="min-w-0 flex-1 truncate">{pageName}</span><span className="font-mono text-[9px] text-fuchsia-100/35">BB.{pageId.slice(-4)}</span>{codToday ? <span className="cod-neon-sign" aria-label="COD วันนี้">COD</span> : null}</button>; })}{!availablePages.length ? <p className="p-2 text-xs text-fuchsia-100/35">ยังไม่มีรายชื่อเพจ</p> : null}</div> : null}</div>
      <div className="mt-3 flex flex-wrap gap-1.5">{([ ["all", "ทั้งหมด"], ["unread", "ยังไม่อ่าน"], ["ordered", "มี COD"] ] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setStatusFilter(value)} className={`rounded-lg px-2.5 py-1.5 text-xs transition ${statusFilter === value ? "bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/25" : "text-fuchsia-100/45 hover:bg-fuchsia-500/10 hover:text-fuchsia-100"}`}>{label}</button>)}</div></CardHeader><CardContent className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 [-webkit-overflow-scrolling:touch]">{threadsQuery.isLoading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-fuchsia-100/40"><RefreshCw className="h-4 w-4 animate-spin" />กำลังโหลดห้อง…</div> : filteredThreads.length === 0 ? <div className="p-12 text-center text-sm text-fuchsia-100/40"><MessageCircle className="mx-auto mb-3 h-8 w-8 text-fuchsia-100/15" />ยังไม่มีห้องตามตัวกรอง</div> : filteredThreads.map((thread, index) => <button key={thread.key} onClick={() => { setSelectedKey(thread.key); if (isMobile) setMobileOpen(true); }} className={`room-list-card ${thread.codTodayActive ? "room-list-card--signal" : ""} relative mb-1 flex w-full items-start gap-3 rounded-2xl p-3.5 text-left transition ${selected?.key === thread.key ? "bg-gradient-to-r from-cyan-400/[0.12] via-violet-500/[0.08] to-fuchsia-500/[0.10] ring-1 ring-cyan-300/35 shadow-[0_0_20px_rgba(34,211,238,.09)]" : "hover:bg-cyan-300/[0.06] hover:ring-1 hover:ring-cyan-300/15"}`}><span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${index % 2 ? "bg-fuchsia-500/20 text-fuchsia-200" : "bg-fuchsia-500/20 text-fuchsia-200"}`}>{(thread.customerName || "ลูกค้า").slice(0, 1)}</span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold text-fuchsia-50">{thread.customerName || "ลูกค้าใหม่"}</span><span className="shrink-0 text-xs text-cyan-100/55">{timeLabel(thread.latestAt)}</span></span><span className="mt-1 flex items-center gap-1.5 truncate text-xs text-fuchsia-100/75"><span className={`${thread.codTodayActive ? "cod-room-sign" : ""} shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] ${thread.codTodayActive ? "border-fuchsia-200/80 bg-fuchsia-400/20 text-fuchsia-50 shadow-[0_0_14px_rgba(255,70,205,.8)]" : "border-fuchsia-300/20 bg-fuchsia-400/[0.08] text-fuchsia-200"}`}>BB.{thread.pageId ? thread.pageId.slice(-4) : "ROOM"}{thread.codTodayActive ? " ⚡" : ""}</span>{thread.unread ? <span className="rounded bg-cyan-400/15 px-1 text-cyan-200">ใหม่</span> : null}{thread.codSignalCount > 0 ? <span title="นับข้อความที่มีคำว่า COD เท่านั้น" className="rounded bg-emerald-400/15 px-1 text-emerald-200">COD {thread.codSignalCount}</span> : null}{thread.orderCount > 0 ? <span title="แถวออเดอร์ที่ผูกกับห้องได้" className="rounded bg-cyan-400/15 px-1 text-cyan-200">ORD {thread.orderCount}</span> : null}{confirmedKeys.has(`${thread.pageId}:${thread.threadId}`) ? <span className="rounded bg-fuchsia-400/15 px-1 text-cyan-200">ยืนยันแล้ว</span> : null}<span className="truncate">{thread.pageName}</span></span><span className="mt-1 block truncate text-xs text-fuchsia-100/45">{thread.preview}</span></span></button>)}</CardContent></Card>
      <Card className="hidden h-full min-h-0 min-w-[min(560px,85vw)] flex-1 overflow-hidden rounded-3xl border-violet-300/20 bg-[#0b101b]/95 shadow-[0_8px_36px_rgba(168,85,247,.10)] backdrop-blur-xl md:block">{conversation}</Card>
      {!toolsOpen ? <button type="button" onClick={() => setToolsOpen(true)} aria-label="เปิดแผงเครื่องมือ" className="absolute right-2 top-2 z-30 rounded-xl border border-cyan-300/30 bg-[#0b1520]/95 px-3 py-2 text-xs font-semibold text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,.18)] transition hover:border-fuchsia-300/50 hover:text-white">เปิดเครื่องมือ</button> : null}
      <Card className={`chat-cosmos-tools order-signal-tools relative flex min-h-0 shrink-0 flex-col overflow-hidden rounded-3xl border-cyan-300/20 bg-gradient-to-b from-[#0d1721] to-[#0b0d17] shadow-[0_8px_36px_rgba(34,211,238,.11)] backdrop-blur-xl transition-[width] duration-300 ${toolsOpen ? "" : "pointer-events-none"}`} style={{ width: toolsOpen ? `${toolsWidth}px` : "0px" }}><CardHeader className="shrink-0 border-b border-cyan-300/10 pb-3"><div className="flex items-center justify-between gap-2"><div><CardTitle className="text-sm text-cyan-100">เครื่องมือห้องนี้</CardTitle><p className="mt-1 text-[10px] text-cyan-100/40">สำรอง · เสียบข้อความเข้ากล่องแชท</p></div><label className="flex items-center gap-1 text-[9px] text-cyan-100/40" title="ปรับความกว้างแผง"><span>↔</span><input type="range" min="280" max="520" step="20" value={toolsWidth} onChange={event => setToolsWidth(Number(event.target.value))} className="w-16 accent-cyan-400" /></label><button type="button" onClick={() => setToolsOpen(false)} className="rounded-lg p-1.5 text-cyan-100/45 hover:bg-cyan-300/10 hover:text-cyan-100" aria-label="หุบแผงเครื่องมือ"><X className="h-4 w-4" /></button></div></CardHeader><CardContent className="min-h-0 space-y-3 overflow-y-auto p-3">{selected ? <><div className="rounded-xl border border-cyan-300/10 bg-cyan-300/[0.04] p-3"><p className="truncate text-sm font-semibold text-cyan-100">{selected.customerName || "ลูกค้าใหม่"}</p><p className="mt-1 truncate text-[10px] text-cyan-100/45">{selected.pageName || "ไม่ระบุเพจ"}</p></div><div className={`rounded-xl border p-3 ${selected.codTodayActive ? "border-fuchsia-300/45 bg-fuchsia-400/[0.08] shadow-[0_0_24px_rgba(255,70,205,.18)]" : "border-cyan-300/10 bg-cyan-300/[0.04]"}`}><div className="flex items-center justify-between gap-2"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/65">COD SIGNAL DECK</p><span className={`h-2.5 w-2.5 rounded-full ${selected.codTodayActive ? "bg-fuchsia-100 shadow-[0_0_14px_rgba(255,255,255,.95)]" : "bg-cyan-100/20"}`} /></div><p className={`mt-2 text-sm font-semibold ${selected.codTodayActive ? "text-fuchsia-50" : "text-cyan-100/65"}`}>{selected.codTodayActive ? "COD วันนี้ · มีออเดอร์แล้ว" : "ยังไม่มี COD วันนี้"}</p><div className="mt-2 grid grid-cols-2 gap-2 text-[10px]"><span className="rounded-lg bg-black/20 p-2 text-cyan-100/55">COD signal <b className="ml-1 text-cyan-100">{selected.codSignalCount ?? 0}</b></span><span className="rounded-lg bg-black/20 p-2 text-cyan-100/55">COD วันนี้ <b className="ml-1 text-cyan-100">{selected.todayCodSignalCount ?? 0}</b></span></div></div>{selectedTrackingRows.length ? selectedTrackingRows.map((row, index) => <div key={`${row.tracking_number}-${index}`} className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.04] p-3"><div className="flex items-center justify-between gap-2"><p className="font-mono text-sm font-bold text-emerald-100">{row.tracking_number || "ไม่มีเลข"}</p><span className="text-[10px] text-emerald-200/65">สำรอง</span></div><p className="mt-1 truncate text-[10px] text-cyan-100/45">{row.order_number_display || row.order_number || "ไม่พบออเดอร์"} · {row.shipping_carrier || "FLASH EXPRESS"}</p><div className="mt-3 grid gap-2"><Button type="button" size="sm" onClick={() => setReplyText(String(row.facebook_tracking_message || ""))} disabled={!row.facebook_tracking_message} className="h-8 justify-start bg-emerald-500/15 text-[10px] text-emerald-100 hover:bg-emerald-500/25">เสียบ Facebook ลงกล่อง</Button><Button type="button" size="sm" variant="outline" onClick={() => setReplyText(String(row.drakside_tracking_message || ""))} disabled={!row.drakside_tracking_message} className="h-8 justify-start border-cyan-300/20 text-[10px] text-cyan-100">เสียบ Drakside ลงกล่อง</Button></div><p className="mt-2 text-[9px] leading-4 text-cyan-100/35">กดแล้วแค่ใส่ในช่องพิมพ์ ยังไม่ส่งให้ลูกค้า</p></div>) : <div className="rounded-xl border border-cyan-300/10 bg-black/20 p-3 text-xs leading-5 text-cyan-100/45">ห้องนี้ยังไม่มี Tracking สำรอง</div>}</> : <div className="p-4 text-center text-xs text-cyan-100/40">เลือกห้องแชทก่อน</div>}</CardContent></Card>
    </div>
    {isMobile && mobileOpen ? <div className="fixed inset-0 z-50 flex items-end bg-[#03050b]/85 p-2 backdrop-blur-md"><div className="flex h-[94dvh] max-h-[94dvh] w-full min-h-0 flex-col overflow-hidden rounded-3xl border border-cyan-300/25 bg-[#0b101a]/95 shadow-[0_0_36px_rgba(34,211,238,.12),0_0_56px_rgba(168,85,247,.12)] backdrop-blur-xl">{conversation}</div></div> : null}
    {summaryOpen ? <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-3xl border border-fuchsia-400/25 bg-[#15101d] p-5 shadow-2xl shadow-fuchsia-950/40"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-fuchsia-300">ADMIN ORDER SUMMARY</p><h3 className="mt-2 text-xl font-semibold text-white">สร้างใบสรุปออเดอร์ในห้องนี้</h3></div><button onClick={() => setSummaryOpen(false)} className="rounded-xl p-2 text-fuchsia-100/50 hover:bg-fuchsia-500/10 hover:text-white"><X className="h-5 w-5" /></button></div><Textarea autoFocus value={summaryText} onChange={event => setSummaryText(event.target.value)} placeholder="วางข้อความลูกค้าที่นี่…" className="mt-4 min-h-48 border-fuchsia-500/20 bg-black/25 text-sm leading-6 text-white placeholder:text-fuchsia-100/25" />{summary ? <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">PREVIEW · {summary.orderNumber}</p><span className="text-[10px] text-emerald-200/60">ยังไม่ส่ง</span></div><div className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><div><span className="text-[10px] text-fuchsia-100/40">ชื่อลูกค้า</span><p className="text-white">{summary.customerName || "ไม่ระบุชื่อ"}</p></div><div><span className="text-[10px] text-fuchsia-100/40">เบอร์โทร</span><p className="text-white">{summary.phone || "ไม่ระบุเบอร์โทร"}</p></div><div className="sm:col-span-2"><span className="text-[10px] text-fuchsia-100/40">ที่อยู่</span><p className="text-fuchsia-100/80">{summary.address || "ไม่ระบุที่อยู่"}</p></div><div><span className="text-[10px] text-fuchsia-100/40">สินค้า</span><p className="text-fuchsia-200">{summary.product}</p></div><div><span className="text-[10px] text-fuchsia-100/40">COD</span><p className="text-cyan-200">{summary.cod === "ไม่ระบุ" ? summary.cod : `${summary.cod} บาท`}</p></div></div><div className="mt-3 border-t border-emerald-400/10 pt-3"><span className="text-[10px] text-fuchsia-100/40">ข้อความที่จะนำไปใส่ช่องตอบกลับ</span><pre className="mt-1 whitespace-pre-wrap text-xs leading-5 text-fuchsia-100/75">{summary.copyText}</pre></div>{summary.timingMs ? <p className="mt-3 border-t border-emerald-400/10 pt-2 text-[10px] text-emerald-200/55">วัดเวลา: รวม {summary.timingMs.total}ms · ดึงข้อมูล {summary.timingMs.dataLookup}ms · แปลงข้อความ {summary.timingMs.parse}ms · Audit {summary.timingMs.audit}ms</p> : null}</div> : null}<div className="mt-4 rounded-xl border border-fuchsia-400/10 bg-black/15 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-fuchsia-100/40">ประวัติ Timing ล่าสุด</p>{summaryTimingsQuery.isLoading ? <p className="mt-2 text-[10px] text-fuchsia-100/35">กำลังโหลด…</p> : <div className="mt-2 space-y-1">{summaryTimingsQuery.data?.slice(0, 5).map(row => { const timing = (row.metadata as { timingMs?: { total?: number; dataLookup?: number; parse?: number; audit?: number } }).timingMs; return <p key={row.id} className="text-[10px] text-fuchsia-100/50">{row.orderNumber ?? "draft"} · รวม {timing?.total ?? "—"}ms · data {timing?.dataLookup ?? "—"}ms · parse {timing?.parse ?? "—"}ms</p>; })}</div>}</div><div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setSummaryOpen(false)} className="border-fuchsia-400/20 bg-transparent text-fuchsia-100/70">ยกเลิก</Button><Button disabled={!summaryText.trim() || generateSummary.isPending} onClick={() => generateSummary.mutate({ rawText: summaryText, pageId: selectedPageId || undefined, threadId: selectedThreadId || undefined })} className="bg-gradient-to-r from-fuchsia-600 via-violet-600 to-emerald-500">{generateSummary.isPending ? "กำลังอ่าน…" : "สรุปออเดอร์"}</Button></div></div></div> : null}
    {orderDetailOpen ? <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"><div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-cyan-400/25 bg-[#15101d] p-5 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-cyan-300">LINKED ORDERS</p><h3 className="mt-1 text-xl font-semibold text-white">ออเดอร์ของ {selected?.customerName || "ลูกค้ารายนี้"}</h3></div><button onClick={() => setOrderDetailOpen(false)} className="rounded-xl p-2 text-fuchsia-100/50 hover:bg-fuchsia-500/10 hover:text-white"><X className="h-5 w-5" /></button></div><p className="mt-3 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3 text-xs leading-5 text-cyan-100/75">ห้องนี้พบข้อความที่มีคำว่า COD {selected?.codSignalCount ?? 0} รายการ (ใช้ COD เป็นเกณฑ์เดียวในข้อความที่โหลดมา) · เชื่อมแถวออเดอร์ได้ {linkedOrders.length} ใบ</p>{threadsQuery.isLoading ? <div className="mt-8 flex items-center justify-center gap-2 text-sm text-fuchsia-100/50"><LoaderCircle className="h-4 w-4 animate-spin text-cyan-300" />กำลังค้นหาออเดอร์…</div> : linkedOrders.length ? <div className="mt-4 space-y-3">{linkedOrders.map((order: any) => <div key={order.order_number} className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.05] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-cyan-100">{order.order_number}</p><span className="text-xs text-fuchsia-100/50">COD {order.cod_amount ?? order.expected_cod ?? "—"} บาท</span></div><p className="mt-2 text-sm text-fuchsia-100/75">{order.customer_name || "ไม่ระบุชื่อ"} · {order.phone || "ไม่ระบุเบอร์"}</p><p className="mt-1 text-xs leading-5 text-fuchsia-100/50">{order.full_address || "ไม่ระบุที่อยู่"}</p><p className="mt-2 text-xs text-fuchsia-200/70">{order.lab_product_display_text || "ยังไม่มี master_display_for_packer ใน Lab 88"}</p></div>)}</div> : <p className="mt-5 rounded-2xl border border-fuchsia-500/10 bg-black/20 p-4 text-sm text-fuchsia-100/50">ยังไม่พบออเดอร์ที่เชื่อมกับห้องนี้</p>}{chatEvidenceQuery.isLoading ? <div className="mt-5 flex items-center gap-2 text-xs text-cyan-200/70"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />กำลังโหลดหลักฐานแชท…</div> : <div className="mt-5 rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/[0.04] p-4"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">CHAT EVIDENCE</p><span className="text-[10px] text-cyan-100/50">{chatEvidenceQuery.data?.length ?? 0} รายการ</span></div><div className="mt-3 max-h-64 space-y-2 overflow-y-auto">{chatEvidenceQuery.data?.length ? chatEvidenceQuery.data.map(row => <div key={String(row.id)} className="rounded-xl border border-fuchsia-400/10 bg-black/20 p-2.5"><div className="flex justify-between gap-2 text-[10px] text-cyan-100/45"><span>{row.speaker_type === "page" ? "[เพจ]" : "[ลูกค้า]"} {String(row.customer_name ?? row.sender_name ?? "ลูกค้า")}</span><span>{timeLabel(String(row.occurred_at ?? row.source_created_at ?? ""))}</span></div><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-fuchsia-50/80">{String(row.message_text ?? "[ข้อความไม่มีตัวอักษร / มีไฟล์แนบ]")}</p><p className="mt-1 truncate text-[9px] text-cyan-100/30">source: {String(row.source_message_id ?? row.dedupe_key ?? "—")}</p></div>) : <p className="text-xs text-cyan-100/45">ยังไม่มีหลักฐานจากตารางแชทลูกค้าหรือเพจสำหรับห้องนี้</p>}</div></div>}</div></div> : null}
    {lightboxUrl ? <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightboxUrl(null)}><img src={lightboxUrl} alt="รูปภาพขนาดเต็ม" className="max-h-[92vh] max-w-[94vw] rounded-2xl object-contain shadow-2xl" /></div> : null}
    <footer className="flex items-center gap-2 px-2 text-[11px] text-fuchsia-100/30"><MessageCircle className="h-3.5 w-3.5" />n8n API → Supabase ทุก 1 นาที · ห้องแชทอ่านจากตารางกลาง · ทุกการตอบกลับบันทึก Audit Log</footer>
  </div></div>;
}
