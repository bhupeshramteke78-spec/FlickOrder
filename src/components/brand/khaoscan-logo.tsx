import Image from "next/image";
import { cn } from "@/lib/utils";

export function KhaoScanLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={cn("relative inline-flex shrink-0 overflow-hidden rounded-xl bg-white shadow-sm", className)}>
      <Image
        src="/khaoscan-logo.png"
        alt="KhaoScan"
        fill
        sizes="64px"
        priority={priority}
        className="object-contain p-0.5"
      />
    </span>
  );
}

export const FlickOrderLogo = KhaoScanLogo;
