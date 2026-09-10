import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { HydrateLedger } from "@/components/hydrate";
import { AppShell } from "@/components/app-shell";
import { SecurityProvider } from "@/components/security-gate";
import { Toaster } from "@/components/ui/sonner";
import { publicUrl } from "@/lib/public-url";
import appCss from "../styles.css?url";

const APP_NAME = "Status Ledger";

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
  component: () => (
    <html lang="en" suppressHydrationWarning className="antialiased">
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <HydrateLedger>
            <SecurityProvider>
            <AppShell>
              <Outlet />
            </AppShell>
            <Toaster />
            </SecurityProvider>
          </HydrateLedger>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
