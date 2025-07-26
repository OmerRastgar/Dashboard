import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  Search, 
  FileText, 
  Settings, 
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Database,
  Activity
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const sidebarItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { name: "Users", icon: Users, path: "/dashboard/users" },
  { name: "Roles", icon: Shield, path: "/dashboard/roles" },
  { name: "Search", icon: Search, path: "/dashboard/search" },
  { name: "Audit Logs", icon: FileText, path: "/dashboard/audit-logs" },
];

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const permissions = usePermissions();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if API call fails
      navigate("/login");
    }
  };

  const getUserInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Sidebar */}
      <div 
        className={`bg-dashboard-sidebar border-r border-border transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-64" : "w-16"
        } flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hover:bg-muted"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems
              .filter((item) => {
                // Filter navigation items based on permissions
                switch (item.name) {
                  case "Dashboard":
                    return permissions.canViewDashboard();
                  case "Users":
                    return permissions.canAccessUsersModule();
                  case "Roles":
                    return permissions.canAccessRolesModule();
                  case "Audit Logs":
                    return permissions.canAccessLogsModule();
                  case "Search":
                    return true; // Search is available to all authenticated users
                  default:
                    return true;
                }
              })
              .map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-active"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`
                    }
                  >
                    <item.icon className={`h-5 w-5 ${sidebarOpen ? "mr-3" : ""}`} />
                    {sidebarOpen && <span>{item.name}</span>}
                  </NavLink>
                </li>
              ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-dashboard-header border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-foreground">
                Welcome back, {user?.full_name || user?.username}
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="hover:bg-muted"
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.full_name ? getUserInitials(user.full_name) : user?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.full_name || user?.username}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}