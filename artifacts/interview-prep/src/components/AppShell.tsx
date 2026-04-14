import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  LayoutDashboard,
  FolderOpen,
  Tag,
  Download,
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/questions", label: "Questions", icon: Search },
  { href: "/groups", label: "Groups", icon: FolderOpen },
  { href: "/tags", label: "Tags", icon: Tag },
  { href: "/import-export", label: "Import / Export", icon: Download },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className={cn(
          "relative flex flex-col shrink-0 border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out",
          collapsed ? "w-[60px]" : "w-[220px]"
        )}
      >
        {/* Logo */}
        <div className={cn("flex items-center h-14 border-b border-sidebar-border transition-all duration-300", collapsed ? "justify-center px-0" : "px-5 gap-3")}>
          <div className="h-8 w-8 shrink-0 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <BookOpen className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-bold text-[15px] text-sidebar-foreground tracking-tight whitespace-nowrap overflow-hidden">
              InterviewPrep
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className={cn("flex-1 py-3 space-y-0.5 overflow-y-auto", collapsed ? "px-1.5" : "px-2.5")}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? location === "/" : location.startsWith(href);
            const item = (
              <Link key={href} href={href}>
                <a
                  data-testid={`nav-${label.toLowerCase().replace(/ \/ /g, "-").replace(/ /g, "-")}`}
                  className={cn(
                    "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150",
                    collapsed ? "justify-center h-10 w-10 mx-auto" : "px-3 py-2.5 w-full",
                    active
                      ? "bg-primary/15 text-primary shadow-sm"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
                  {!collapsed && <span className="truncate">{label}</span>}
                </a>
              </Link>
            );

            return collapsed ? (
              <Tooltip key={href} delayDuration={0}>
                <TooltipTrigger asChild>{item}</TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {label}
                </TooltipContent>
              </Tooltip>
            ) : (
              item
            );
          })}
        </nav>

        {/* User */}
        {user && (
          <div className={cn("border-t border-sidebar-border transition-all duration-300", collapsed ? "py-3 flex justify-center" : "p-4")}>
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <span className="text-2xl cursor-default select-none">{user.avatar}</span>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">{user.name}</TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xl shrink-0">{user.avatar}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">{user.name}</p>
                  <p className="text-[11px] text-sidebar-foreground/50 mt-0.5">Local profile</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          data-testid="button-toggle-sidebar"
          className={cn(
            "absolute -right-3 top-[52px] z-20 h-6 w-6 rounded-full border border-border bg-background shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </aside>

      {/* ── Main content ────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
