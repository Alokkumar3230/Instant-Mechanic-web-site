import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link, useLocation } from "@tanstack/react-router";
import {
  ChartLine,
  ClipboardList,
  Gauge,
  LogOut,
  Menu,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { SignInScreen } from "@/components/sign-in-screen";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  useBookingStatusWatch,
  useDemoBootstrap,
  useLivePolling,
} from "@/hooks/useQueries";
import { cn } from "@/lib/utils";

const NAV_ITEMS: ReadonlyArray<{
  key: string;
  label: string;
  to: string;
  icon: LucideIcon;
}> = [
  { key: "overview", label: "Overview", to: "/", icon: Gauge },
  { key: "analytics", label: "Analytics", to: "/analytics", icon: ChartLine },
  { key: "bookings", label: "Bookings", to: "/bookings", icon: ClipboardList },
  { key: "mechanics", label: "Mechanics", to: "/mechanics", icon: UserCog },
  { key: "customers", label: "Customers", to: "/customers", icon: Users },
];

const POLL_INTERVAL_MS = 5000;

function resolvePageTitle(pathname: string): string {
  if (pathname === "/") return "Overview";
  if (pathname.startsWith("/analytics")) return "Analytics";
  if (/^\/bookings\/\d+$/.test(pathname)) return "Booking detail";
  if (pathname.startsWith("/bookings")) return "Bookings";
  if (/^\/mechanics\/\d+$/.test(pathname)) return "Mechanic detail";
  if (pathname.startsWith("/mechanics")) return "Mechanics";
  if (/^\/customers\/\d+$/.test(pathname)) return "Customer detail";
  if (pathname.startsWith("/customers")) return "Customers";
  return "Instant Mechanic";
}

function Brand() {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4">
      <img
        src="/assets/generated/instant-mechanic-mark.dim_512x512.png"
        alt=""
        className="size-7 rounded-md"
      />
      <div className="min-w-0">
        <p className="font-display text-sm leading-none font-bold tracking-tight">
          Instant Mechanic
        </p>
        <p className="mt-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          Ops Console
        </p>
      </div>
    </div>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();

  return (
    <nav
      className="flex-1 space-y-1 overflow-y-auto p-3"
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.key}
            to={item.to}
            data-ocid={`nav.${item.key}`}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-smooth",
              active
                ? "bg-primary text-primary-foreground shadow-subtle"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarStatus() {
  return (
    <div className="shrink-0 border-t border-sidebar-border p-3">
      <div className="flex items-center gap-2 rounded-md bg-sidebar-accent px-3 py-2">
        <span className="size-1.5 animate-pulse-dot rounded-full bg-primary" />
        <span className="font-mono text-[10px] tracking-widest text-sidebar-accent-foreground uppercase">
          Live · 5s poll
        </span>
      </div>
    </div>
  );
}

function UserMenu() {
  const { identity, clear } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal =
    principal.length > 14
      ? `${principal.slice(0, 6)}…${principal.slice(-6)}`
      : principal;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="gap-2 px-2"
          aria-label="Open user menu"
          data-ocid="user.menu"
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/15 font-mono text-xs font-semibold text-primary">
              IM
            </AvatarFallback>
          </Avatar>
          <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
            {shortPrincipal}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Signed in</DropdownMenuLabel>
        <p className="truncate px-2 pb-1 font-mono text-xs text-muted-foreground">
          {principal}
        </p>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => clear()}
          data-ocid="user.signout"
          className="text-destructive focus:text-destructive"
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppLoadingScreen() {
  return (
    <output
      data-ocid="app.loading_state"
      className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background"
      aria-label="Connecting to the console"
    >
      <div className="flex size-12 items-center justify-center rounded-md bg-primary/10">
        <Wrench className="size-6 animate-pulse text-primary" />
      </div>
      <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
        Connecting to console…
      </p>
    </output>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing } = useInternetIdentity();
  useLivePolling(isAuthenticated ? POLL_INTERVAL_MS : null);
  useBookingStatusWatch(isAuthenticated);
  useDemoBootstrap();

  const { pathname } = useLocation();
  const pageTitle = resolvePageTitle(pathname);

  useEffect(() => {
    document.title =
      pageTitle === "Instant Mechanic"
        ? "Instant Mechanic"
        : `${pageTitle} · Instant Mechanic`;
  }, [pageTitle]);

  if (isInitializing) {
    return <AppLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <SignInScreen />;
  }

  return (
    <div className="flex min-h-svh bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <Brand />
        <SidebarNav />
        <SidebarStatus />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-card px-4 shadow-subtle">
          <MobileNav />
          <h2 className="min-w-0 truncate font-display text-base font-semibold tracking-tight">
            {pageTitle}
          </h2>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>

        <footer className="border-t border-border bg-muted/40 px-4 py-3 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="text-foreground underline-offset-2 hover:underline"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation"
          data-ocid="nav.mobile_open"
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 bg-sidebar p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-full flex-col">
          <Brand />
          <SidebarNav onNavigate={() => setOpen(false)} />
          <SidebarStatus />
        </div>
      </SheetContent>
    </Sheet>
  );
}
