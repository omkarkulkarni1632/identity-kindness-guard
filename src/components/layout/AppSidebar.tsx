import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Shield, LayoutDashboard, Users, ClipboardCheck, ScrollText,
  ChevronLeft, ChevronRight, LogOut, Bot, Inbox, UserPlus, UserMinus, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

const roleNavItems = {
  CISO: [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/users", icon: Users, label: "Users" },
    { to: "/requests", icon: Inbox, label: "Requests" },
    { to: "/reviews", icon: ClipboardCheck, label: "Access Reviews" },
    { to: "/insights", icon: Bot, label: "AI Insights" },
    { to: "/audit", icon: ScrollText, label: "Audit Logs" },
  ],
  IT: [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/users", icon: Users, label: "Users" },
    { to: "/requests", icon: Inbox, label: "Requests" },
    { to: "/reviews", icon: ClipboardCheck, label: "Access Reviews" },
    { to: "/audit", icon: ScrollText, label: "Audit Logs" },
  ],
  HR: [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/onboarding", icon: UserPlus, label: "Onboarding" },
    { to: "/offboarding", icon: UserMinus, label: "Offboarding" },
    { to: "/users", icon: Users, label: "Employees" },
    { to: "/requests", icon: Inbox, label: "My Requests" },
  ],
};

const roleBadgeColors = {
  CISO: "bg-destructive/15 text-destructive border-destructive/20",
  IT: "bg-primary/15 text-primary border-primary/20",
  HR: "bg-success/15 text-success border-success/20",
};

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const navItems = user ? roleNavItems[user.platform_role] : roleNavItems.CISO;

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Shield className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-foreground">
            AccessGuard
          </span>
        )}
      </div>

      {/* User badge */}
      {user && !collapsed && (
        <div className="mx-2 mt-3 rounded-md border border-border bg-muted/30 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-card-foreground truncate">{user.name}</span>
            <span className={cn("text-[10px] font-bold border rounded-full px-1.5 py-0.5", roleBadgeColors[user.platform_role])}>
              {user.platform_role}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{user.email}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="border-t border-border p-2">
        <button
          onClick={handleSignOut}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex h-10 items-center justify-center border-t border-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}