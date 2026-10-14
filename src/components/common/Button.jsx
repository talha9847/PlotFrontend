import { forwardRef } from "react";
import { LoaderCircle } from "lucide-react";

const variants = {
  primary:
    "bg-[#0b3d2e] text-white shadow-lg shadow-[#0b3d2e]/25 hover:bg-[#0f5340] hover:shadow-xl hover:shadow-[#0b3d2e]/30 focus-visible:ring-[#1b7a5a]",
  secondary:
    "border border-[#cfd9cb] bg-white text-[#0b3d2e] shadow-sm hover:border-[#1b7a5a] hover:bg-[#e9f3ee] focus-visible:ring-[#1b7a5a]",
  ghost:
    "bg-transparent text-[#3f4f48] hover:bg-[#e9f3ee] hover:text-[#0b3d2e] focus-visible:ring-[#1b7a5a]",
  danger:
    "bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:ring-rose-500",
  accent:
    "bg-[#e4c48a] text-[#062a20] shadow-lg shadow-[#e4c48a]/20 hover:brightness-110 focus-visible:ring-[#e4c48a]",
  outline:
    "border border-[#1b7a5a] bg-transparent text-[#1b7a5a] hover:bg-[#1b7a5a] hover:text-white focus-visible:ring-[#1b7a5a]",
};

const sizes = {
  xs: "min-h-8 px-3 text-xs",
  sm: "min-h-9 px-3.5 text-xs",
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-[52px] px-7 text-sm",
  icon: "h-10 w-10 p-0",
};

const Button = forwardRef(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    pill = false,
    loading = false,
    disabled = false,
    className = "",
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={loading || disabled}
      aria-busy={loading || undefined}
      className={`group inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-extrabold tracking-[-0.005em] transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 active:translate-y-px disabled:pointer-events-none disabled:opacity-60 ${
        pill ? "rounded-full" : "rounded-xl"
      } ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading && (
        <LoaderCircle aria-hidden="true" size={16} className="animate-spin" />
      )}
      {children}
    </button>
  );
});

export default Button;
