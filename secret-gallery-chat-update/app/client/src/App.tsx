import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import OrderControl from "./pages/OrderControl";
import ChatHub from "./pages/ChatHub";
import ProductAliases from "./pages/ProductAliases";
import OrderPerformance from "./pages/OrderPerformance";
import StockRoom from "./pages/StockRoom";
import MappingDashboard from "./pages/MappingDashboard";
import OrderBuckets from "./pages/OrderBuckets";
import DailyChatSummary from "./pages/DailyChatSummary";
import OrderHistory from "./pages/OrderHistory";
import ConnectSupabase from "./pages/ConnectSupabase";
import AlienRoom from "./pages/AlienRoom";
import SecretGallery from "./pages/SecretGallery";

function Shell({ children }: { children: React.ReactNode }) { return <DashboardLayout>{children}</DashboardLayout>; }
function Router() {
  return <Switch>
    <Route path="/connect"><ConnectSupabase /></Route>
    <Route path="/secret-gallery"><SecretGallery /></Route>
    <Route path="/orders"><Shell><OrderControl /></Shell></Route>
    <Route path="/chats"><Shell><ChatHub /></Shell></Route>
    <Route path="/alien-room"><Shell><AlienRoom /></Shell></Route>
    <Route path="/aliases"><Shell><ProductAliases /></Shell></Route>
    <Route path="/order-performance"><Shell><OrderPerformance /></Shell></Route>
    <Route path="/stock-room"><Shell><StockRoom /></Shell></Route>
    <Route path="/mapping-dashboard"><Shell><MappingDashboard /></Shell></Route>
    <Route path="/order-buckets"><Shell><OrderBuckets /></Shell></Route>
    <Route path="/daily-chat-summary"><Shell><DailyChatSummary /></Shell></Route>
    <Route path="/order-history"><Shell><OrderHistory /></Shell></Route>
    <Route path="/"><Redirect to="/chats" /></Route>
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}
export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
