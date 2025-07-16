import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen">
          {/* Background Particles */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="particle w-2 h-2 top-20 left-20" style={{ animationDelay: '0s' }}></div>
            <div className="particle w-1 h-1 top-40 right-32" style={{ animationDelay: '1s' }}></div>
            <div className="particle w-3 h-3 bottom-32 left-40" style={{ animationDelay: '2s' }}></div>
            <div className="particle w-1 h-1 top-60 right-60" style={{ animationDelay: '3s' }}></div>
            <div className="particle w-2 h-2 bottom-20 right-20" style={{ animationDelay: '4s' }}></div>
          </div>
          
          <Router />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
