import { useEffect, useRef, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from './hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import './i18n';
import { Layout } from "./components/Layout";
import DevicesPage from "./pages/DevicesPage";
import DashboardPage from "./pages/DashboardPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import LaboratoryPage from "./pages/LaboratoryPage";
import DeviceDetail from "./pages/DeviceDetail";
import { RemoteControlPage } from "./pages/RemoteControlPage";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import { Settings } from "./pages/Settings";
import AdminPage from "./pages/AdminPage";
import LibraryPage from "./pages/LibraryPage";
import ArticleDetailPage from "./pages/ArticleDetailPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 hour - data stays fresh longer
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      refetchOnWindowFocus: false, // CRITICAL: Stop refreshing on tab switch
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: false,
    },
  },
});

// Global auth state listener for navigation and cache management
const AuthStateListener = () => {
  const location = useLocation();
  const queryClientInstance = useQueryClient();

  // Keep latest pathname available to the auth callback without re-subscribing
  const pathnameRef = useRef(location.pathname);
  const redirectingRef = useRef(false);

  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    const hardRedirect = (to: string) => {
      // Prevent duplicate redirects when Supabase emits multiple events in quick succession
      if (redirectingRef.current) return;
      redirectingRef.current = true;
      window.location.replace(to);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const pathname = pathnameRef.current;
      console.log("Auth state changed:", event, !!session, "path:", pathname);

      if (event === "SIGNED_OUT") {
        // Clear all cached data immediately
        queryClientInstance.clear();

        // Hard redirect to fully reset in-memory app state
        if (pathname !== "/auth") {
          hardRedirect("/auth");
        }
        return;
      }

      // If the user is authenticated and still on /auth, hard redirect out
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        if (pathname === "/auth" || pathname === "/") {
          hardRedirect("/dashboard");
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [queryClientInstance]);

  return null;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Use realtime Supabase session as the source of truth (AuthContext can lag)
  const { user: contextUser } = useAuth();
  const [sessionUser, setSessionUser] = useState<typeof contextUser>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setSessionUser(session?.user ?? null);
      setSessionLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSessionUser(data.session?.user ?? null);
      setSessionLoading(false);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const user = sessionUser ?? contextUser;

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user: contextUser } = useAuth();
  const [sessionUser, setSessionUser] = useState<typeof contextUser>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setSessionUser(session?.user ?? null);
      setSessionLoading(false);
    });

    // Get initial session AFTER listener is attached (prevents missing fast transitions)
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSessionUser(data.session?.user ?? null);
      setSessionLoading(false);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const user = sessionUser ?? contextUser;

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <Routes>
      <Route 
        path="/auth" 
        element={user ? <Navigate to="/dashboard" replace /> : <Auth />} 
      />
      <Route
        path="/"
        element={<Navigate to="/devices" replace />}
      />
      <Route
        path="/devices"
        element={
          <ProtectedRoute>
            <Layout>
              <DevicesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Layout>
              <AnalyticsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/laboratory"
        element={
          <ProtectedRoute>
            <Layout>
              <LaboratoryPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/device/:id"
        element={
          <ProtectedRoute>
            <DeviceDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/remote-control"
        element={
          <ProtectedRoute>
            <Layout>
              <RemoteControlPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Layout>
              <AdminPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/library"
        element={
          <ProtectedRoute>
            <Layout>
              <LibraryPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/library/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <ArticleDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthStateListener />
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
