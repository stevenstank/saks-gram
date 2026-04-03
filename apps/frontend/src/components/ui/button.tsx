import { type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-yellow-400 text-black shadow-soft hover:bg-yellow-300 focus-visible:ring-yellow-400/40",
  secondary:
    "bg-gray-800 text-white hover:bg-gray-700 focus-visible:ring-gray-500/40",
  ghost:
    "bg-transparent text-white hover:bg-gray-800 focus-visible:ring-gray-500/40",
  danger:
    "bg-error-600 text-white hover:bg-error-500 focus-visible:ring-red-500/40",
};

export function Button({ variant = "primary", loading = false, disabled, children, className, ...props }: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={[
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2",
        "hover:scale-[1.02]",
        "active:scale-[0.98]",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "disabled:hover:scale-100",
        variantClasses[variant],
        className ?? "",
      ].join(" ")}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
      <span>{children}</span>
    </button>
  );
}
