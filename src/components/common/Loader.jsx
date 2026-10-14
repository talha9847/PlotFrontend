import {
  LoaderCircle,
  Leaf,
  RefreshCw,
  Sprout,
  CircleDashed,
} from "lucide-react";

const COLORS = {
  primary: "#0b3d2e",
  accent: "#e4c48a",
  muted: "#5b6b63",
  background: "#fafaf6",
};

const sizes = {
  xs: 14,
  sm: 18,
  md: 24,
  lg: 36,
  xl: 48,
};

/**
 * Reusable Plotwise Loader
 *
 * Props:
 * - size: xs | sm | md | lg | xl
 * - variant: spinner | leaf | refresh | sprout | dashed
 * - color: custom icon color
 * - label: optional loading text
 * - centered: center loader horizontally
 * - className: additional classes
 */
export default function Loader({
  size = "md",
  variant = "spinner",
  color = COLORS.primary,
  label,
  centered = false,
  className = "",
}) {
  const Icon =
    {
      spinner: LoaderCircle,
      leaf: Leaf,
      refresh: RefreshCw,
      sprout: Sprout,
      dashed: CircleDashed,
    }[variant] || LoaderCircle;

  const iconSize = sizes[size] || sizes.md;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 ${
        centered ? "justify-center" : ""
      } ${className}`}
    >
      <Icon
        size={iconSize}
        color={color}
        strokeWidth={2}
        aria-hidden="true"
        className={
          variant === "leaf" || variant === "sprout"
            ? "animate-pulse"
            : "animate-spin"
        }
      />

      {label && (
        <span className="text-sm font-semibold" style={{ color: COLORS.muted }}>
          {label}
        </span>
      )}

      <span className="sr-only">{label || "Loading..."}</span>
    </div>
  );
}

/**
 * Full-page loading state
 */
export function PageLoader({ label = "Preparing your workspace..." }) {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[#fafaf6] px-6"
      role="status"
      aria-live="polite"
    >
      <div className="grid h-16 w-16 place-items-center rounded-[20px] bg-[#0b3d2e] shadow-lg shadow-[#0b3d2e]/20">
        <Leaf
          size={30}
          color={COLORS.accent}
          strokeWidth={2.2}
          className="animate-pulse"
        />
      </div>

      <LoaderCircle
        size={24}
        color={COLORS.primary}
        strokeWidth={2.5}
        className="animate-spin"
        aria-hidden="true"
      />

      <p className="text-sm font-semibold text-[#5b6b63]">{label}</p>
    </div>
  );
}

/**
 * Full-screen loading overlay
 */
export function FullScreenLoader({ label = "Loading..." }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#fafaf6]/95 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#0b3d2e] shadow-xl shadow-[#0b3d2e]/20">
        <Leaf
          size={36}
          color={COLORS.accent}
          strokeWidth={2.2}
          className="animate-pulse"
        />
      </div>

      <LoaderCircle
        size={28}
        color={COLORS.primary}
        strokeWidth={2.5}
        className="animate-spin"
        aria-hidden="true"
      />

      <p className="text-sm font-semibold text-[#5b6b63]">{label}</p>
    </div>
  );
}

/**
 * Skeleton loader for cards and dashboard sections
 */
export function SkeletonLoader({ rows = 3, className = "" }) {
  return (
    <div className={`animate-pulse space-y-4 ${className}`} aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-3 w-1/3 rounded-full bg-[#dfe5dc]" />
          <div className="h-4 w-full rounded-lg bg-[#eef1ec]" />
          <div className="h-3 w-2/3 rounded-full bg-[#e9f3ee]" />
        </div>
      ))}
    </div>
  );
}
