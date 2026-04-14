import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { RoleProvider } from "@/context/RoleContext";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Login from "./pages/Login";
import RiskAnalytics from "./pages/RiskAnalytics";
import MigrationPlanner from "./pages/MigrationPlanner";
import Reports from "./pages/Reports";
import SecurityAdmins from "./pages/SecurityAdmins";
import NotFound from "./pages/NotFound";

console.log("App.tsx loading...");

const queryClient = new QueryClient();

const App = () => {
  console.log("App component rendering...");
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RoleProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/risk-analytics" element={<RiskAnalytics />} />
                <Route path="/migration" element={<MigrationPlanner />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/security-admins" element={<SecurityAdmins />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </RoleProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
