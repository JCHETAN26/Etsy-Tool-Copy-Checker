import { Link, Outlet, useLocation } from "react-router-dom";
import { Shield, Home, ShieldAlert, List, Settings, CreditCard, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", icon: Home, path: "/dashboard" },
  { label: "Matches", icon: ShieldAlert, path: "/matches", badge: 3 },
  { label: "My Listings", icon: List, path: "/listings" },
  { label: "Settings", icon: Settings, path: "/settings" },
  { label: "Billing", icon: CreditCard, path: "/billing" },
];

function NavItem({ item, active, collapsed }: { item: typeof navItems[0]; active: boolean; collapsed?: boolean }) {
  return (
    <Link
      to={item.path}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span className="flex-1">{item.label}</span>}
      {!collapsed && item.badge && <Badge variant="destructive" className="h-5 min-w-5 justify-center text-[10px] px-1.5">{item.badge}</Badge>}
    </Link>
  );
}

function SidebarContent({ collapsed }: { collapsed?: boolean }) {
  const location = useLocation();
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary shrink-0" />
        {!collapsed && <span className="font-bold text-lg">ListingShield</span>}
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavItem key={item.path} item={item} active={location.pathname === item.path || location.pathname.startsWith(item.path + "/")} collapsed={collapsed} />
        ))}
      </nav>
      <div className="p-4 border-t">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">J</div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Jane Seller</p>
              <p className="text-xs text-muted-foreground truncate">jane@example.com</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <Button variant="ghost" size="sm" className="w-full mt-2 text-muted-foreground justify-start" asChild>
            <Link to="/"><LogOut className="mr-2 h-4 w-4" /> Sign Out</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex w-full">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 border-r bg-card flex-col shrink-0 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>
      {/* Tablet icon sidebar */}
      <aside className="hidden md:flex lg:hidden w-16 border-r bg-card flex-col shrink-0 fixed inset-y-0 left-0 z-30">
        <SidebarContent collapsed />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-16 lg:ml-64">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-20 h-14 border-b bg-card flex items-center px-4 gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-bold">ListingShield</span>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 border-t bg-card flex justify-around py-2">
          {navItems.slice(0, 4).map((item) => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            return (
              <Link key={item.path} to={item.path} className={cn("flex flex-col items-center gap-0.5 text-xs", active ? "text-primary" : "text-muted-foreground")}>
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.badge && <span className="absolute -top-1 -right-2 h-3.5 min-w-3.5 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center px-1">{item.badge}</span>}
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
