import { clsx } from "clsx";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  fullWidth = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center rounded-2xl font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "bg-gradient-to-r from-[#8f5bff] to-[#3ec5ff] text-white shadow-2xl hover:opacity-90 focus:ring-[#8f5bff]",
    secondary: "bg-white/10 text-white border border-white/20 hover:bg-white/20 focus:ring-white",
    outline: "border border-lime-200/60 bg-lime-200/20 text-lime-100 hover:bg-lime-200/30 focus:ring-lime-200",
    ghost: "text-slate-300 hover:text-white hover:bg-white/5 focus:ring-slate-300"
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-6 py-4 text-lg"
  };

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        loading && "cursor-wait",
        disabled && "opacity-40",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2 flex-shrink-0" />
      )}
      {children}
    </button>
  );
}
