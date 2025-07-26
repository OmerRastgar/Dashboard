import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import Users from "./pages/dashboard/Users";
import Roles from "./pages/dashboard/Roles";
import Search from "./pages/dashboard/Search";
import AuditLogs from "./pages/dashboard/AuditLogs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="dashboard-theme">
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Protected dashboard routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={
                  <ProtectedRoute module="dashboard">
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="users" element={
                  <ProtectedRoute module="users">
                    <Users />
                  </ProtectedRoute>
                } />
                <Route path="roles" element={
                  <ProtectedRoute module="roles">
                    <Roles />
                  </ProtectedRoute>
                } />
                <Route path="search" element={<Search />} />
                <Route path="audit-logs" element={
                  <ProtectedRoute module="logs">
                    <AuditLogs />
                  </ProtectedRoute>
                } />
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
