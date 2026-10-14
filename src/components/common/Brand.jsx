import { Leaf } from "lucide-react";
import { Link } from "react-router-dom";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };

export default function Brand({
  light = false,
  compact = false,
  subtitle = "Land management",
  showAccent = true,
  className = "",
  to = "/",
}) {
  return (
    <Link
      to={to}
      aria-label="Plotwise home"
      className={`group inline-flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e4c48a]/50 ${className}`}
    >
      <span
        className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-[13px] transition duration-300 group-hover:-translate-y-0.5 group-hover:rotate-[-6deg] ${
          light
            ? "bg-[#e4c48a] text-[#062a20]"
            : "bg-[#0b3d2e] text-[#e4c48a] shadow-lg shadow-[#0b3d2e]/25"
        }`}
      >
        <Leaf size={19} strokeWidth={2.2} />
        {showAccent && (
          <span
            aria-hidden="true"
            className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ${
              light ? "bg-white ring-[#062a20]" : "bg-[#e4c48a] ring-[#fafaf6]"
            }`}
          />
        )}
      </span>

      {!compact && (
        <span className="min-w-0 leading-none">
          <span
            className={`block text-[22px] font-semibold tracking-[-0.02em] ${light ? "text-white" : "text-[#14231d]"}`}
            style={DISPLAY}
          >
            Plotwise<span className="text-[#e4c48a]">.</span>
          </span>
          {subtitle && (
            <span
              className={`mt-1.5 block truncate text-[9px] font-bold uppercase tracking-[0.2em] ${
                light ? "text-white/55" : "text-[#5b6b63]"
              }`}
            >
              {subtitle}
            </span>
          )}
        </span>
      )}
    </Link>
  );
}
