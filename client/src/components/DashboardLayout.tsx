import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { Activity, Archive, Bell, BrainCircuit, Boxes, CalendarDays, Database, LayoutDashboard, Link2, LockKeyhole, MessageCircle, PanelLeft, Send, Tags, Truck } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { PRESENTATION_MODE } from "@shared/presentation";
import { getActiveCamp, getSupabaseConfig, type Camp } from "@/lib/canonical";

const menuItems = [
  { icon: MessageCircle, label: "รวมแชทเพจ", path: "/chats" },
  { icon: LayoutDashboard, label: "Order Control", path: "/orders" },
  { icon: Truck, label: "แมปเลขพัสดุ", path: "/parcel-mapping" },
  { icon: BrainCircuit, label: "Alien Inbox · คำดิบ", path: "/alien-room" },
  { icon: Database, label: "Product Alien · เก็บคำ", path: "/product-alien-store" },
  { icon: Tags, label: "Product Alien · แมป", path: "/product-alien-map" },
  { icon: Send, label: "ห้องส่ง Telegram", path: "/telegram-delivery" },
  { icon: Tags, label: "Alien Learning · อนุมัติ Alias", path: "/aliases" },
  { icon: Boxes, label: "คลังสินค้าจริง / สต๊อกกลาง", path: "/stock-room" },
  { icon: Tags, label: "Product Master Health", path: "/mapping-dashboard" },
  { icon: CalendarDays, label: "สรุปออเดอร์รายวัน", path: "/daily-chat-summary" },
  { icon: Archive, label: "ประวัติออเดอร์", path: "/order-history" },
  { icon: Boxes, label: "แยก 1/2/3 คอต", path: "/order-buckets" },
  { icon: Activity, label: "ประสิทธิภาพดูดออเดอร์", path: "/order-performance" },
  { icon: Link2, label: "เชื่อมฐานของค่ายนี้", path: "/connect" },
  { icon: Database, label: "คลังโปรเจกต์", path: "/" },
];
const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => { const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY); return saved ? parseInt(saved, 10) : DEFAULT_WIDTH; });
  useEffect(() => { localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString()); }, [sidebarWidth]);
  return <SidebarProvider className="h-full min-h-0 w-full min-w-0 overflow-hidden bg-[#09070d] text-white" style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}><DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent></SidebarProvider>;
}

type DashboardLayoutContentProps = { children: React.ReactNode; setSidebarWidth: (width: number) => void };
function DashboardLayoutContent({ children, setSidebarWidth }: DashboardLayoutContentProps) {
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const unreadThreads: Array<{ key: string; latestAt: string | null; customerName: string | null }> = [];
  const lastNotificationKeyRef = useRef("");
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();
  const [camp, setCamp] = useState<Camp>(getActiveCamp());
  const [now, setNow] = useState(() => new Date());
  const thaiDateTime = new Intl.DateTimeFormat("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Bangkok" }).format(now);
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { const handleCampChange = (event: Event) => setCamp((event as CustomEvent<Camp>).detail); window.addEventListener("camp-change", handleCampChange); return () => window.removeEventListener("camp-change", handleCampChange); }, []);
  useEffect(() => { if (isCollapsed) setIsResizing(false); }, [isCollapsed]);
  useEffect(() => { const handleMouseMove = (event: MouseEvent) => { if (!isResizing) return; const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0; const newWidth = event.clientX - sidebarLeft; if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth); }; const handleMouseUp = () => setIsResizing(false); if (isResizing) { document.addEventListener("mousemove", handleMouseMove); document.addEventListener("mouseup", handleMouseUp); document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; } return () => { document.removeEventListener("mousemove", handleMouseMove); document.removeEventListener("mouseup", handleMouseUp); document.body.style.cursor = ""; document.body.style.userSelect = ""; }; }, [isResizing, setSidebarWidth]);
  const st = camp === "ST";
  return <div className="singto-cyber-edge"><><div className="relative" ref={sidebarRef}><Sidebar collapsible="icon" className={st ? "border-r border-orange-500/20 bg-[#100b08] text-orange-50 [&_[data-slot=sidebar-inner]]:bg-[#100b08] [&_[data-slot=sidebar-inner]]:text-orange-50" : "border-r border-orange-500/10 bg-[#0d0a12] text-orange-50 [&_[data-slot=sidebar-inner]]:bg-[#0d0a12] [&_[data-slot=sidebar-inner]]:text-orange-50"} disableTransition={isResizing}><SidebarHeader className="h-16 justify-center"><div className="flex w-full items-center gap-3 px-2"><button onClick={toggleSidebar} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${st ? "text-orange-200/70 hover:bg-orange-500/10 hover:text-orange-100" : "text-orange-200/60 hover:bg-orange-500/10 hover:text-orange-200"}`} aria-label="เปิดหรือปิดเมนู"><PanelLeft className="h-4 w-4" /></button>{!isCollapsed && <div className="flex min-w-0 items-center gap-2"><button type="button" onClick={() => setLocation("/secret-gallery")} className="group flex min-w-0 items-center gap-2" title="ห้องลับคลังโปรเจค"><span className={`truncate font-semibold tracking-tight ${st ? "text-orange-50 group-hover:text-orange-200" : "text-orange-50 group-hover:text-amber-200"}`}>{st ? "SINGTO STORE" : "SINGTO STORE"}</span><LockKeyhole className={`h-3.5 w-3.5 ${st ? "text-orange-300/70 group-hover:text-orange-200" : "text-orange-300/60 group-hover:text-amber-300"}`} /></button></div>}</div></SidebarHeader><SidebarContent className="gap-0"><SidebarMenu className="px-2 py-1">{menuItems.map(item => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className={`h-10 font-normal ${st ? "text-orange-100/60 hover:bg-orange-500/10 hover:text-orange-50 data-[active=true]:bg-orange-500/15 data-[active=true]:text-orange-200" : "text-orange-100/55 hover:bg-orange-500/10 hover:text-orange-50 data-[active=true]:bg-orange-500/10 data-[active=true]:text-orange-200"}`}><item.icon className={`h-4 w-4 ${location === item.path ? (st ? "text-orange-300" : "text-orange-300") : ""}`} /><span>{item.label}</span>{item.path === "/chats" && unreadThreads.length > 0 ? <span className="ml-auto rounded-full bg-red-500/20 px-1.5 text-[10px] font-semibold text-red-300">{unreadThreads.length}</span> : null}</SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu><div className="mx-3 my-2 rounded-xl border border-red-400/15 bg-red-500/[0.04] p-2.5"><button type="button" onClick={() => { setLocation("/chats"); if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission(); }} className="flex w-full items-center gap-2 text-left text-xs text-red-200"><Bell className="h-3.5 w-3.5" /><span>{unreadThreads.length ? `ลูกค้าทักใหม่ ${unreadThreads.length} ห้อง` : "การแจ้งเตือนข้อความ"}</span></button></div></SidebarContent><SidebarFooter className="p-3"><div className="flex items-center gap-3 rounded-lg px-1 py-1"><Avatar className={`h-9 w-9 shrink-0 ${st ? "border border-orange-400/30 bg-orange-500/10" : "border border-orange-400/20 bg-orange-500/10"}`}><AvatarFallback className={`bg-transparent text-xs font-medium ${st ? "text-orange-200" : "text-amber-200"}`}>{st ? "ST" : "BB"}</AvatarFallback></Avatar><div className="min-w-0"><p className={`truncate text-sm font-medium leading-none ${st ? "text-orange-100" : "text-amber-100"}`}>{st ? "SINGTO STORE" : "SINGTO STORE"} · {camp}</p><p className={`mt-1.5 truncate text-xs ${st ? "text-orange-100/35" : "text-orange-100/35"}`}>{getSupabaseConfig(camp) ? "connected" : "configure /connect"}</p></div></div></SidebarFooter></Sidebar><div className={`absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/20 ${isCollapsed ? "hidden" : ""}`} style={{ zIndex: 50 }} onMouseDown={() => !isCollapsed && setIsResizing(true)} /></div><SidebarInset className={`min-h-0 min-w-0 overflow-hidden ${st ? "bg-[#090706]" : "bg-[#09070d]"}`}>{isMobile && <div className={`sticky top-0 z-40 flex h-14 items-center justify-between px-2 backdrop-blur ${st ? "border-b border-orange-500/20 bg-[#100b08]/95" : "border-b border-orange-500/10 bg-[#0d0a12]/95"}`}><div className="flex items-center gap-2"><SidebarTrigger className={`h-9 w-9 rounded-lg ${st ? "text-orange-100 hover:bg-orange-500/10" : "text-orange-100 hover:bg-orange-500/10"}`} /><span className={st ? "text-orange-50" : "text-orange-50"}>{activeMenuItem?.label ?? "เมนู"}</span></div></div>}<div className={`mx-4 mt-3 flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2 text-[11px] ${st ? "border border-orange-500/20 bg-[#160e08] text-orange-100/75" : "border border-orange-500/20 bg-[#100c19] text-orange-100/75"}`}><span className={`font-medium ${st ? "text-orange-200" : "text-amber-200"}`}>{thaiDateTime}</span><span className={st ? "text-orange-100/35" : "text-orange-100/35"}>·</span><button type="button" onClick={() => setLocation("/chats")} className="inline-flex items-center gap-1.5 text-red-100 hover:text-white"><Bell className="h-3.5 w-3.5" />{unreadThreads.length ? `ลูกค้าทักใหม่ ${unreadThreads.length} ห้อง` : "ไม่มีข้อความใหม่"}</button><span className={st ? "text-orange-100/30" : "text-orange-100/30"}>·</span><span className={st ? "text-orange-300" : "text-amber-300"}>ฐานข้อมูล Deployment นี้</span><span className={st ? "text-orange-100/45" : "text-orange-100/45"}>ฐานข้อมูลของ Deployment นี้</span><span className={st ? "text-orange-100/45" : "text-orange-100/45"}>Live 60s</span></div><main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4">{children}</main></SidebarInset></></div>;
}
