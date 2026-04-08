import { Link, useRoute, useLocation } from "wouter";
import { BarChart3, TrendingUp, Users, LayoutDashboard, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/deals", label: "Deals", icon: TrendingUp },
  { href: "/pipeline", label: "Pipeline", icon: BarChart3 },
  { href: "/owners", label: "Owners", icon: Users },
];

function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const [isActive] = useRoute(href === "/" ? "/" : href + "/*?");
  const [isExact] = useRoute(href);
  const active = href === "/" ? isExact : isActive || isExact;

  return (
    <Link href={href}>
      <span
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 cursor-pointer select-none",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        )}
      >
        <Icon size={16} />
        {label}
      </span>
    </Link>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-56 bg-sidebar flex flex-col transition-transform duration-200 lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <TrendingUp size={14} className="text-white" />
          </div>
          <span className="text-sidebar-foreground font-semibold text-sm tracking-tight">Pipeline</span>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-sidebar-foreground/40 text-xs">Sales Pipeline Tracker</p>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card lg:hidden">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            <span className="font-semibold text-sm">Pipeline</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
