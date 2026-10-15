import { plots as allPlots } from "../../data/mockData";
import {
  MapPin,
  CheckCircle2,
  Clock3,
  CircleDashed,
  Route,
} from "lucide-react";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };

const statusStyles = {
  Available: {
    card: "border-[#cfe3d7] bg-white text-[#0b3d2e] hover:border-[#1b7a5a] hover:bg-[#e9f6ef]",
    dot: "bg-[#1b7a5a]",
    icon: CheckCircle2,
  },
  Booked: {
    card: "border-[#ecd9ad] bg-[#fbf3e0] text-[#7a5d1c] hover:border-[#e4c48a] hover:bg-[#f8ebc9]",
    dot: "bg-[#e4c48a]",
    icon: Clock3,
  },
  Sold: {
    card: "border-[#dfe5dc] bg-[#eef1ec] text-[#7a867f] hover:border-[#c9d2c6] hover:bg-[#e6eae4]",
    dot: "bg-[#a9b4ad]",
    icon: CircleDashed,
  },
};

const legends = Object.entries(statusStyles).map(([label, s]) => ({
  label,
  dot: s.dot,
}));

function formatArea(area) {
  if (area == null || area === "") return "Area N/A";
  if (typeof area === "number")
    return Number.isFinite(area)
      ? `${area.toLocaleString("en-IN")} ft²`
      : "Area N/A";
  const value = String(area).trim();
  const numericPart = value
    .replace(/,/g, "")
    .replace(/\s*(sq\.?\s*ft\.?|sqft|ft²|square feet)\s*$/i, "")
    .trim();
  const n = Number(numericPart);
  if (numericPart && Number.isFinite(n))
    return `${n.toLocaleString("en-IN")} ft²`;
  return value || "Area N/A";
}

function getStatus(status) {
  const normalized = String(status ?? "Available").toLowerCase();
  const entry = Object.entries(statusStyles).find(
    ([key]) => key.toLowerCase() === normalized,
  );
  if (entry) return { ...entry[1], label: entry[0] };
  return {
    card: "border-[#dfe5dc] bg-white text-[#3f4f48] hover:bg-[#f4f7f2]",
    dot: "bg-slate-400",
    icon: CircleDashed,
    label: String(status ?? "Unknown"),
  };
}

/**
 * Props
 *  onSelect(plot)       click handler
 *  compact              show only the first 18 plots
 *  plots                optional list (defaults to mockData)
 *  matches(plot)        optional; plots that return false are dimmed (use for search/filter)
 *  selectedId           optional; highlights the selected plot
 */
export default function PlotMap({
  onSelect,
  compact = false,
  plots = allPlots,
  matches,
  selectedId,
}) {
  const data = compact ? plots.slice(0, 18) : plots;
  const counts = data.reduce(
    (r, p) => {
      const s = getStatus(p.status).label;
      if (s in r) r[s] += 1;
      return r;
    },
    { Available: 0, Booked: 0, Sold: 0 },
  );

  return (
    <section className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0b3d2e] text-[#e4c48a]">
            <MapPin size={19} />
          </span>
          <div>
            <h3
              className="text-lg font-semibold tracking-tight text-[#14231d]"
              style={DISPLAY}
            >
              Plot layout
            </h3>
            <p className="mt-0.5 text-xs text-[#5b6b63]">
              Select a plot to view its details
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cfe3d7] bg-[#e9f6ef] px-3 py-1.5 text-xs font-bold text-[#0b3d2e]">
          <Route size={13} /> {data.length} plots
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {legends.map(({ label, dot }) => (
          <div
            key={label}
            className="min-w-0 rounded-2xl border border-[#e3e9e0] bg-white p-3 sm:p-4"
          >
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
              <span className="truncate text-[11px] font-semibold text-[#5b6b63] sm:text-xs">
                {label}
              </span>
            </div>
            <p
              className="mt-1.5 text-2xl font-semibold tracking-tight text-[#14231d]"
              style={DISPLAY}
            >
              {counts[label]}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#d4ddd1] bg-[#eef3ea] p-3 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0b3d2e]/60">
            Site overview
          </span>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {legends.map(({ label, dot }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 text-[10px] font-semibold text-[#5b6b63]"
              >
                <span className={`h-2 w-2 rounded-sm ${dot}`} /> {label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-4">
          {data.map((plot, index) => {
            const status = getStatus(plot.status);
            const StatusIcon = status.icon;
            const plotNumber = plot.plotNo ?? `P-${plot.id}`;
            const dim = matches ? !matches(plot) : false;
            const isSelected = selectedId != null && selectedId === plot.id;

            return (
              <div key={plot.id ?? plotNumber} className="contents">
                <button
                  type="button"
                  onClick={() => onSelect?.(plot)}
                  title={`${plotNumber} · ${status.label} · ${formatArea(plot.area)}`}
                  aria-label={`Plot ${plotNumber}, ${status.label}, ${formatArea(plot.area)}`}
                  aria-pressed={isSelected}
                  className={`group relative flex min-h-[100px] min-w-0 flex-col items-start justify-between overflow-hidden rounded-xl border p-3 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1b7a5a]/25 sm:min-h-[112px] sm:p-3.5 ${status.card} ${dim ? "opacity-30 saturate-50" : ""} ${isSelected ? "ring-4 ring-[#e4c48a]" : ""}`}
                >
                  <div className="flex w-full items-start justify-between gap-1.5">
                    <span className="min-w-0 truncate text-sm font-extrabold tracking-tight">
                      {plotNumber}
                    </span>
                    <StatusIcon
                      size={15}
                      className="shrink-0 opacity-80"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 w-full">
                    <p className="truncate text-xs font-semibold">
                      {formatArea(plot.area)}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${status.dot}`}
                      />
                      <span className="truncate text-[10px] font-semibold opacity-80">
                        {status.label}
                      </span>
                    </div>
                  </div>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-5 -right-5 h-14 w-14 rounded-full bg-[#1b7a5a]/10 transition-transform duration-300 group-hover:scale-150"
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <p className="flex items-start gap-2 px-1 text-xs leading-5 text-[#5b6b63]">
        <MapPin size={14} className="mt-0.5 shrink-0 text-[#1b7a5a]" />
        <span>
          Illustrative layout only. Plot positions and access roads must match
          the client&apos;s surveyed land plan.
        </span>
      </p>
    </section>
  );
}
