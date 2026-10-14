import { Plus, Search, Building2 } from "lucide-react";

import Modal from "../common/Modal";
import Button from "../common/Button";
import Badge from "../common/Badge";

const GOLD = "#e4c48a";
const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };

const formatNumber = (value) => Number(value || 0).toLocaleString("en-IN");

const formatLabel = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatArea = (value, unit) => {
  if (value === null || value === undefined || value === "") {
    return "Not specified";
  }

  const label =
    AREA_UNITS.find((item) => item.value === unit)?.label || unit || "";

  return `${Number(value).toLocaleString("en-IN")} ${label}`;
};

const AREA_UNITS = [
  { value: "sq_ft", label: "Square feet" },
  { value: "sq_m", label: "Square metres" },
  { value: "sq_yd", label: "Square yards" },
  { value: "acre", label: "Acres" },
  { value: "hectare", label: "Hectares" },
  { value: "guntha", label: "Guntha" },
  { value: "bigha", label: "Bigha" },
  { value: "other", label: "Other" },
];

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

export default function ProjectDetailsModal({ project, onClose }) {
  if (!project) return null;

  const totalPlots = Number(project.plots || 0);
  const available = Math.max(
    0,
    totalPlots - Number(project.booked || 0) - Number(project.sold || 0),
  );

  const address = [
    project.address_line1,
    project.address_line2,
    project.city,
    project.district,
    project.state,
    project.postal_code,
  ]
    .filter(Boolean)
    .join(", ");

  const details = [
    ["Project type", formatLabel(project.project_type)],
    ["Project status", formatLabel(project.status)],
    ["Total plots", formatNumber(totalPlots)],
    ["Available plots", formatNumber(available)],
    ["Booked plots", formatNumber(project.booked)],
    ["Sold plots", formatNumber(project.sold)],
    ["Total land area", formatArea(project.total_area, project.area_unit)],
    ["Created on", project.created_at || "Not specified"],
  ];

  return (
    <Modal
      open={!!project}
      onClose={onClose}
      title={project.name}
      description={address || "Location not specified"}
      size="lg"
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#e9f3ee] text-[#1b7a5a]">
          <Building2 size={22} />
        </span>

        <div>
          <p className="text-xs text-[#718078]">Project status</p>
          <div className="mt-1">
            <StatusBadge status={project.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {details.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-[#e8ede6] bg-white p-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#718078]">
              {label}
            </p>
            <p className="mt-2 break-words text-sm font-bold text-[#14231d]">
              {value}
            </p>
          </div>
        ))}
      </div>
    </Modal>
  );
}
