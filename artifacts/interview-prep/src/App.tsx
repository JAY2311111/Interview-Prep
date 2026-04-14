import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/context/ThemeContext";
import { UserProvider, useUser } from "@/context/UserContext";
import { AppShell } from "@/components/AppShell";
import NotFound from "@/pages/not-found";
import OnboardingPage from "@/pages/onboarding";
import DashboardPage from "@/pages/dashboard";
import QuestionsPage from "@/pages/questions";
import QuestionDetailPage from "@/pages/question-detail";
import QuestionFormPage from "@/pages/question-form";
import GroupsPage from "@/pages/groups";
import TagsPage from "@/pages/tags";
import ImportExportPage from "@/pages/import-export";
import SettingsPage from "@/pages/settings";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (user === null) {
    return <OnboardingPage />;
  }

  return (
    <AppShell>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/questions" component={QuestionsPage} />
        <Route path="/questions/new" component={QuestionFormPage} />
        <Route path="/questions/:id/edit" component={QuestionFormPage} />
        <Route path="/questions/:id" component={QuestionDetailPage} />
        <Route path="/groups" component={GroupsPage} />
        <Route path="/tags" component={TagsPage} />
        <Route path="/import-export" component={ImportExportPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <UserProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppRoutes />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
