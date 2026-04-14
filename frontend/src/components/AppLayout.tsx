import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Database,
  BarChart3,
  Route,
  FileText,
  Users,
  ChevronDown,
  Lock,
  User,
} from "lucide-react";
import { useRole } from "@/context/RoleContext";

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Inventory", path: "/inventory", icon: Database },
  { label: "Risk Analytics", path: "/risk-analytics", icon: BarChart3 },
  { label: "Migration Planner", path: "/migration", icon: Route },
  { label: "Reports", path: "/reports", icon: FileText },
];

export default function AppLayout() {
  const [adminOpen, setAdminOpen] = useState(false);
  const { user, isSecurityAdmin, switchToPublic } = useRole();
  const navigate = useNavigate();
  const location = useLocation();

  const openSecurityAdmin = () => {
    setAdminOpen(false);
    if (isSecurityAdmin) return;
    navigate("/login", { state: { from: { pathname: location.pathname } } });
  };

  const backToPublic = async () => {
    setAdminOpen(false);
    await switchToPublic();
    if (location.pathname === "/security-admins") {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="bg-primary border-b border-primary/20 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 h-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/pnb_logo.jpg"
              alt="Punjab National Bank logo"
              className="w-9 h-9 rounded-lg object-cover bg-white"
            />
            <div className="leading-tight">
              <p className="text-sm font-bold text-pnb-gold tracking-wide">
                Punjab National Bank
              </p>
              <p className="text-[10px] text-primary-foreground/70 tracking-wider uppercase">
                Quantum Security Platform
              </p>
            </div>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-pnb-gold/20 text-pnb-gold"
                      : "text-primary-foreground/70 hover:text-pnb-gold hover:bg-pnb-gold/10"
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
            {isSecurityAdmin && (
              <NavLink
                to="/security-admins"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-pnb-gold/20 text-pnb-gold"
                      : "text-primary-foreground/70 hover:text-pnb-gold hover:bg-pnb-gold/10"
                  }`
                }
              >
                <Users className="w-4 h-4" />
                Security Admins
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setAdminOpen(!adminOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-primary-foreground/80 hover:bg-primary-foreground/10 transition-colors"
              >
                {isSecurityAdmin ? <Lock className="w-4 h-4" /> : <User className="w-4 h-4" />}
                <span className="hidden sm:inline">
                  {isSecurityAdmin ? "Security Admin" : "Public View"}
                </span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {adminOpen && (
                <div className="absolute right-0 mt-1 w-52 bg-card rounded-lg shadow-lg border py-1 z-50">
                  <button
                    onClick={backToPublic}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors ${
                      !isSecurityAdmin ? "font-semibold text-primary" : "text-foreground"
                    }`}
                  >
                    <User className="w-4 h-4 inline mr-2" />
                    Public View
                  </button>
                  <button
                    onClick={openSecurityAdmin}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors ${
                      isSecurityAdmin ? "font-semibold text-primary" : "text-foreground"
                    }`}
                  >
                    <Lock className="w-4 h-4 inline mr-2" />
                    Security Admin
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex overflow-x-auto px-4 pb-2 gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-pnb-gold/20 text-pnb-gold"
                    : "text-primary-foreground/70 hover:text-pnb-gold"
                }`
              }
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </NavLink>
          ))}
          {isSecurityAdmin && (
            <NavLink
              to="/security-admins"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-pnb-gold/20 text-pnb-gold"
                    : "text-primary-foreground/70 hover:text-pnb-gold"
                }`
              }
            >
              <Users className="w-3.5 h-3.5" />
              Security Admins
            </NavLink>
          )}
        </nav>
      </header>

      {/* Page content */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-3 px-6">
        <p className="text-xs text-muted-foreground text-center">
          © 2026 Punjab National Bank — Quantum Security Assessment Platform v2.1.0 | Classification: INTERNAL USE ONLY
        </p>
      </footer>
    </div>
  );
}
