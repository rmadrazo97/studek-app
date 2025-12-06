"use client";

import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full px-4 py-3
              ${icon ? "pl-12" : ""}
              bg-[#0f1115]
              border border-[rgba(148,163,184,0.15)]
              rounded-xl
              text-slate-100
              placeholder:text-slate-500
              transition-all duration-300
              focus:outline-none
              focus:border-cyan-400/50
              focus:ring-2
              focus:ring-cyan-400/20
              hover:border-[rgba(148,163,184,0.25)]
              disabled:opacity-50
              disabled:cursor-not-allowed
              ${error ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20" : ""}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
