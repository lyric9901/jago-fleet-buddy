import { createFileRoute, redirect, Outlet, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { Bus } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading, isVisitor } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.navigate({ to: "/login", replace: true });
      return;
    }
    if (isVisitor) {
      const path = router.state.location.pathname;
      const adminOnly =
        path === "/settings" ||
        path === "/vehicles/new" ||
        /^\/vehicles\/[^/]+\/edit\/?$/.test(path);
      if (adminOnly) {
        router.navigate({ to: "/", replace: true });
      }
    }
  }, [user, loading, isVisitor, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Bus className="h-5 w-5 animate-pulse" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

// Helper for child routes
export function ensureAuth() {
  return redirect({ to: "/login" });
}
