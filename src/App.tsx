import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

// Pages
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import UsersPage from "./pages/UsersPage";
import UserDetailPage from "./pages/UserDetailPage";
import AccessReviewsPage from "./pages/AccessReviewsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import RequestsPage from "./pages/RequestsPage (1)";
import OnboardingPage from "./pages/OnboardingPage";
import OffboardingPage from "./pages/OffboardingPage";
import InsightsPage from "./pages/InsightsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />

      {/* Protected — all authenticated roles */}
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute>
          <UsersPage />
        </ProtectedRoute>
      } />
      <Route path="/users/:id" element={
        <ProtectedRoute>
          <UserDetailPage />
        </ProtectedRoute>
      } />
      <Route path="/requests" element={
        <ProtectedRoute>
          <RequestsPage />
        </ProtectedRoute>
      } />

      {/* HR routes */}
      <Route path="/offboarding" element={
        <ProtectedRoute roles={["HR"]}>
          <OffboardingPage />
        </ProtectedRoute>
      } />

      {/* HR routes */}
      <Route path="/onboarding" element={
        <ProtectedRoute roles={["HR", "IT", "CISO"]}>
          <OnboardingPage />
        </ProtectedRoute>
      } />

      {/* IT + CISO routes */}
      <Route path="/reviews" element={
        <ProtectedRoute roles={["IT", "CISO"]}>
          <AccessReviewsPage />
        </ProtectedRoute>
      } />
      <Route path="/audit" element={
        <ProtectedRoute roles={["IT", "CISO"]}>
          <AuditLogsPage />
        </ProtectedRoute>
      } />

      {/* CISO only */}
      <Route path="/insights" element={
        <ProtectedRoute roles={["CISO"]}>
          <InsightsPage />
        </ProtectedRoute>
      } />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
