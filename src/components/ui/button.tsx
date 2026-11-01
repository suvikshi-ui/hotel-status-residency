import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[transform,background-color,box-shadow,opacity] duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] min-h-11 px-4",
  {
    variants: {
      variant: {
        default:
          "border border-[#8a6a32] bg-gradient-to-b from-[#e8d7a8] to-[#c4a36a] text-[#1c1612] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] hover:from-[#f0e2bb] hover:to-[#b89555]",
        secondary:
          "border border-[#c4a36a]/40 bg-[#f3ead8] text-[#1c1612] hover:bg-[#e7dcc6]",
        outline:
          "border border-[#c4a36a] bg-[#fffdf8] text-[#1c1612] hover:bg-[#f3ead8]",
        ghost: "hover:bg-[#f3ead8]",
        danger: "bg-danger text-primary-fg hover:opacity-90",
        sidebar:
          "justify-start text-sidebar-fg hover:bg-sidebar-line w-full rounded-lg",
      },
      size: {
        default: "h-11",
        sm: "h-9 min-h-9 px-3 text-xs",
        lg: "h-12 px-5",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
