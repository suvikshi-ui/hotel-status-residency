import { cn } from "@/lib/utils";

export function HotelLogo({
  className,
  mark,
  alt = "Hotel Status Residency",
}: {
  className?: string;
  mark?: boolean;
  alt?: string;
}) {
  return (
    <img
      src={mark ? "/logo-mark.png?v=2" : "/logo.png?v=2"}
      alt={alt}
      className={cn("h-10 w-auto object-contain", className)}
    />
  );
}
