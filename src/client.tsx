import { StrictMode, startTransition } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";

const app = (
  <StrictMode>
    <StartClient />
  </StrictMode>
);

startTransition(() => {
  if (import.meta.env.VITE_GITHUB_PAGES === "true") {
    const el = document.getElementById("root");
    if (!el) {
      throw new Error("GitHub Pages shell is missing #root");
    }
    createRoot(el).render(app);
    return;
  }
  hydrateRoot(document, app);
});
