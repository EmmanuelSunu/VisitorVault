import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import VisitorRegistration from "@/pages/visitor-registration";
import HostDashboard from "@/pages/host-dashboard";
import ReceptionInterface from "@/pages/reception-interface";
import AdminPanel from "@/pages/admin-panel";
import StaffLogin from "@/pages/staff-login";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/" component={VisitorRegistration} />
      <Route path="/register" component={VisitorRegistration} />
      <Route path="/staff">
        {() => (isAuthenticated ? <Home /> : <Redirect to="/staff-login" />)}
      </Route>
      <Route path="/host">
        {() => (isAuthenticated ? <HostDashboard /> : <Redirect to="/staff-login" />)}
      </Route>
      <Route path="/dashboard">
        {() => (isAuthenticated ? <HostDashboard /> : <Redirect to="/staff-login" />)}
      </Route>
      <Route path="/reception">
        {() => (isAuthenticated ? <ReceptionInterface /> : <Redirect to="/staff-login" />)}
      </Route>
      <Route path="/admin">
        {() => (isAuthenticated ? <AdminPanel /> : <Redirect to="/staff-login" />)}
      </Route>
      <Route path="/staff-login" component={StaffLogin} />
      <Route path="/login" component={StaffLogin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
      <footer className="w-full bg-gray-50 border-t text-center py-3 text-sm text-gray-600 fixed bottom-0 left-0 z-50">
        Powered By{' '}
        <a
          href="https://www.desiderata.com.gh"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline font-medium"
        >
          Desiderata Visitor Management System
        </a>
      </footer>
    </QueryClientProvider>
  );
}

export default App;
