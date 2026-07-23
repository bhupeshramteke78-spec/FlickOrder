import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-emerald-300 text-zinc-950 hover:-translate-y-0.5 hover:bg-emerald-200",
        secondary: "border border-zinc-200 bg-white text-zinc-900 hover:-translate-y-0.5 hover:bg-zinc-50",
        ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
        danger: "bg-rose-400 text-zinc-950 hover:bg-rose-300",
        glass:
          "relative isolate overflow-hidden border border-white/25 bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_18px_45px_rgba(0,0,0,0.24)] backdrop-blur-xl before:absolute before:inset-0 before:-z-10 before:bg-[linear-gradient(135deg,rgba(255,255,255,0.38),rgba(255,255,255,0.08)_42%,rgba(255,102,0,0.24))] after:absolute after:-left-1/2 after:top-0 after:h-full after:w-1/2 after:-skew-x-12 after:bg-white/25 after:opacity-0 after:transition-all after:duration-500 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/18 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_22px_60px_rgba(255,102,0,0.18)] hover:after:left-[125%] hover:after:opacity-100",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-4",
        lg: "h-12 px-5 text-base",
        icon: "h-10 w-10 px-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  ),
);

Button.displayName = "Button";

export { buttonVariants };
