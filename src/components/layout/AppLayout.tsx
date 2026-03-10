import { AppSidebar } from "./AppSidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-60 min-h-screen transition-all duration-300 p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
