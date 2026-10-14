import { Plus, Search, Building2 } from "lucide-react";

import Modal from "../common/Modal";
import Button from "../common/Button";

const GOLD = "#e4c48a";
const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };

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
