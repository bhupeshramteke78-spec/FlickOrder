import Image from "next/image";
import { cn } from "@/lib/utils";

export function FlickOrderLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={cn("relative inline-flex shrink-0 overflow-hidden rounded-xl", className)}>
      <Image
        src="/khaoscan-logo.png"
        alt="KhaoScan"
        fill
        sizes="64px"
        priority={priority}
        className="object-contain"
      />
    </span>
  );
}

export const KhaoScanLogo = FlickOrderLogo;
