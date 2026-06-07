import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WorkspaceLayoutSkeleton } from "./screens/WorkspaceLayoutSkeleton";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WorkspaceLayoutSkeleton />
    </QueryClientProvider>
  );
}

export default App;
