import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

function routerBasepath() {
  const raw = import.meta.env.BASE_URL || "/";
  const trimmed = raw.replace(/\/$/, "");
  return trimmed === "" ? "/" : trimmed;
}

export function getRouter() {
  return createRouter({
    routeTree,
    basepath: routerBasepath(),
    defaultErrorComponent: AppErrorComponent,
  });
}
