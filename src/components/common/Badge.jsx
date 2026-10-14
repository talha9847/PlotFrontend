import {
  CheckCircle2,
  Clock3,
  CircleDashed,
  AlertCircle,
  XCircle,
} from "lucide-react";

const GREEN = "border-[#bfe0cf] bg-[#e9f6ef] text-[#0b5a3e]";
const GOLD = "border-[#ecd9ad] bg-[#fbf3e0] text-[#7a5d1c]";
const GREY = "border-[#dfe5dc] bg-[#eef1ec] text-[#5b6b63]";
const RED = "border-rose-200 bg-rose-50 text-rose-800";

const presets = {
  available: GREEN,
  paid: GREEN,
  success: GREEN,
  "on track": GREEN,
  active: GREEN,
  booked: GOLD,
  pending: GOLD,
  warning: GOLD,
  "due soon": GOLD,
  sold: GREY,
  inactive: GREY,
  overdue: RED,
  danger: RED,
  error: RED,
  info: "border-sky-200 bg-sky-50 text-sky-800",
};

const icons = {
  available: CheckCircle2,
  paid: CheckCircle2,
  success: CheckCircle2,
  "on track": CheckCircle2,
  booked: Clock3,
  pending: Clock3,
  "due soon": Clock3,
  sold: CircleDashed,
  inactive: CircleDashed,
  overdue: AlertCircle,
  warning: AlertCircle,
  danger: XCircle,
  error: XCircle,
};

export default function Badge({
  children,
  status,
  variant,
  size = "md",
  dot = false,
  icon: Icon,
  className = "",
  ...props
}) {
  const label = status ?? children;
  const key = String(variant ?? label ?? "").toLowerCase();
  const StatusIcon = Icon || icons[key];
  const tone = presets[key] || GREEN;
  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-[11px]",
    lg: "px-3 py-1.5 text-xs",
  };

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full border font-bold tracking-[0.01em] ${tone} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-current opacity-80"
        />
      )}
      {!dot && StatusIcon && (
        <StatusIcon aria-hidden="true" size={12} strokeWidth={2.4} />
      )}
      {label}
    </span>
  );
}
