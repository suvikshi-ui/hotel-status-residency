import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { HydrateLedger } from "@/components/hydrate";
import { AuthShell } from "@/components/auth-shell";
import { SecurityProvider } from "@/components/security-gate";
import { Toaster } from "@/components/ui/sonner";
import { publicUrl } from "@/lib/public-url";
import { SupabaseAuthProvider } from "@/lib/supabase-auth";
import appCss from "../styles.css?url";

const APP_NAME = "Status Ledger";
const isGithubPages = import.meta.env.VITE_GITHUB_PAGES === "true";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#1F5C54" },
      {
        name: "description",
        content:
          "Daily cash book, occupancy and night audit for Hotel Status Residency, Mahape.",
      },
    ],
    links: [
      { rel: "icon", type: "image/png", href: publicUrl("favicon.png") },
      { rel: "icon", type: "image/svg+xml", href: publicUrl("favicon.svg") },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: publicUrl("__grok/manifest.webmanifest") },
      { rel: "apple-touch-icon", href: publicUrl("__grok/icon-180.png") },
    ],
  }),
  component: RootComponent,
});

function AppTree() {
  return (
    <>
      <PreviewHostBridge />
      <AuthProvider>
        <SupabaseAuthProvider>
          <HydrateLedger>
            <SecurityProvider>
              <AuthShell>
                <Outlet />
              </AuthShell>
              <Toaster />
            </SecurityProvider>
          </HydrateLedger>
        </SupabaseAuthProvider>
      </AuthProvider>
    </>
  );
}

function RootComponent() {
  if (isGithubPages) {
    return <AppTree />;
  }
  return (
    <html lang="en" suppressHydrationWarning className="antialiased">
      <head>
        <HeadContent />
      </head>
      <body>
        <AppTree />
        <Scripts />
      </body>
    </html>
  );
}
