import Image from "next/image";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-11 w-11",
  xl: "h-14 w-14",
} as const;

export type KhaoScanLogoSize = keyof typeof sizeMap;

export function KhaoScanLogo({
  className,
  size = "md",
  priority = false,
}: {
  className?: string;
  size?: KhaoScanLogoSize;
  priority?: boolean;
}) {
  return (
    <span className={cn("relative inline-flex shrink-0 overflow-hidden rounded-xl", sizeMap[size], className)}>
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

export const FlickOrderLogo = KhaoScanLogo;

