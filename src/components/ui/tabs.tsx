import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "liquid-glass flex h-auto min-h-11 w-full items-center gap-1 rounded-lg p-1 text-[#1c1612]",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

export const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex h-auto min-h-10 min-w-0 flex-1 items-center justify-center whitespace-normal rounded-md px-2 py-1 text-center text-xs font-semibold leading-tight text-[#1c1612] transition-colors data-[state=active]:bg-[#1c1612] data-[state=active]:text-[#f8f1e4] data-[state=active]:shadow-[inset_0_1px_0_rgba(232,213,176,0.4)] sm:text-sm",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 outline-none data-[state=inactive]:hidden",
      className,
      "data-[state=inactive]:!hidden",
    )}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";
