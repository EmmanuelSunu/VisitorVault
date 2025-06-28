import { Switch, Route } from "wouter";
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

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/register" component={VisitorRegistration} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/register" component={VisitorRegistration} />
          <Route path="/host" component={HostDashboard} />
          <Route path="/reception" component={ReceptionInterface} />
          <Route path="/admin" component={AdminPanel} />
        </>
      )}
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
    </QueryClientProvider>
  );
}

export default App;
