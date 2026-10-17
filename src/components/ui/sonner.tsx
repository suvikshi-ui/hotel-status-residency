import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="light"
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "bg-card text-fg border-border shadow-border",
        },
      }}
    />
  );
}
