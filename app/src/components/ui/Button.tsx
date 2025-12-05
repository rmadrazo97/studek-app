"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      children,
      icon,
      iconPosition = "left",
      className = "",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "relative inline-flex items-center justify-center font-medium transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-[#08090a] disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-gradient-to-r from-cyan-400 to-blue-500 text-[#08090a] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:scale-[1.02]",
      secondary:
        "bg-[#0f1115] border border-[rgba(148,163,184,0.15)] text-slate-100 hover:border-cyan-400/40 hover:bg-[#161a1f]",
      ghost:
        "bg-transparent text-slate-300 hover:text-cyan-400 hover:bg-[rgba(34,211,238,0.08)]",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm gap-1.5",
      md: "px-6 py-3 text-base gap-2",
      lg: "px-8 py-4 text-lg gap-2.5",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {icon && iconPosition === "left" && <span className="flex-shrink-0">{icon}</span>}
        {children}
        {icon && iconPosition === "right" && <span className="flex-shrink-0">{icon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
