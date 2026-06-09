import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { WorkspaceLayoutSkeleton } from "./screens/WorkspaceLayoutSkeleton";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WorkspaceLayoutSkeleton />
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}

export default App;
