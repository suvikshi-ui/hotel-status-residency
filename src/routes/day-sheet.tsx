import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/day-sheet")({
  beforeLoad: () => {
    throw redirect({ to: "/reports", search: { view: "daily" } });
  },
  component: () => null,
});
