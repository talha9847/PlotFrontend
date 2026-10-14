import { Building2, MapPin, ArrowUpRight } from "lucide-react";
const GOLD = "#e4c48a";
const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };

import Badge from "../common/Badge";

const formatNumber = (value) => Number(value || 0).toLocaleString("en-IN");
const formatLabel = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function StatusBadge({ status }) {
  const variants = {
    active: "active",
    planning: "pending",
    on_hold: "warning",
    completed: "success",
    archived: "inactive",
  };

  return (
    <Badge
      status={formatLabel(status)}
      variant={variants[status] || "info"}
      size="md"
    />
  );
}
export default function ProjectCard({ project, onClick }) {
  const totalPlots = Number(project.plots || 0);
  const booked = Number(project.booked || 0);
  const sold = Number(project.sold || 0);
  const remaining = Math.max(0, totalPlots - booked - sold);

  const progress =
    totalPlots > 0 ? Math.min(100, ((booked + sold) / totalPlots) * 100) : 0;

  const location = [project.city, project.state].filter(Boolean).join(", ");

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-2xl border border-[#e3e9e0] bg-white p-5 text-left shadow-sm shadow-[#062a20]/[0.03] transition duration-200 hover:-translate-y-0.5 hover:border-[#b8d5c4] hover:shadow-lg hover:shadow-[#062a20]/[0.06]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e9f3ee] text-[#1b7a5a]">
          <Building2 size={20} />
        </span>
        <StatusBadge status={project.status} />
      </div>

      <h3
        className="mt-5 text-xl font-semibold text-[#14231d] transition group-hover:text-[#1b7a5a]"
        style={DISPLAY}
      >
        {project.name}
      </h3>

      <p className="mt-2 flex items-center gap-1.5 text-xs text-[#718078]">
        <MapPin size={14} className="shrink-0" />
        <span className="truncate">{location || "Location not specified"}</span>
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#f6f8f3] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#718078]">
            Total plots
          </p>
          <p className="mt-1 text-xl font-semibold text-[#14231d]">
            {formatNumber(totalPlots)}
          </p>
        </div>

        <div className="rounded-xl bg-[#f6f8f3] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#718078]">
            Available
          </p>
          <p className="mt-1 text-xl font-semibold text-[#14231d]">
            {formatNumber(remaining)}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold text-[#5b6b63]">Sales progress</span>
          <span className="font-extrabold text-[#14231d]">
            {Math.round(progress)}%
          </span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-[#e9eee7]">
          <div
            className="h-full rounded-full bg-[#1b7a5a] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-[#eef2ec] pt-4">
        <span className="text-xs font-semibold text-[#718078]">
          {formatLabel(project.project_type)}
        </span>

        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#1b7a5a]">
          View details
          <ArrowUpRight size={14} />
        </span>
      </div>
    </button>
  );
}
