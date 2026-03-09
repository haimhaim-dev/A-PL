"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary-deep to-blue-600 text-white shadow-lg shadow-blue-900/50 hover:shadow-xl hover:shadow-blue-900/60 active:scale-[0.98]",
        destructive:
          "bg-accent-red text-white shadow-lg shadow-red-900/50 hover:shadow-xl hover:shadow-red-900/60 active:scale-[0.98]",
        outline:
          "border-2 border-white/10 bg-white/5 backdrop-blur hover:bg-white/10 hover:border-white/20",
        secondary:
          "bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700",
        ghost: "hover:bg-white/5 hover:text-white",
        link: "text-primary-deep underline-offset-4 hover:underline"
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-8 text-base",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    if (asChild) {
      // asChild가 true일 때는 Slot을 사용하거나 children을 반환
      return React.cloneElement(
        React.Children.only(props.children as React.ReactElement),
        {
          className: cn(buttonVariants({ variant, size, className })),
          ref,
          ...props
        }
      );
    }
    
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
