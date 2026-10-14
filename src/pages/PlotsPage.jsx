import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Download,
  Grid2X2,
  Search,
} from "lucide-react";
import PlotMap from "../components/common/PlotMap";
import Badge from "../components/common/Badge";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Modal from "../components/common/Modal";
import Button from "../components/common/Button";
import { plots, project, inr } from "../data/mockData";
import { useToast } from "../components/common/Toast";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };
const GOLD = "#e4c48a";
const STATUSES = ["Available", "Booked", "Sold"];
const SORTS = [
  { value: "plot", label: "Plot number" },
  { value: "low", label: "Price: low to high" },
  { value: "high", label: "Price: high to low" },
];

const norm = (s) => String(s ?? "").toLowerCase();
const fmtArea = (a) =>
  typeof a === "number" ? `${a.toLocaleString("en-IN")} sq.ft.` : a;
const projectOptions = project.map((p) => ({
  value: String(p.id),
  label: p.name,
}));

function Stat({ icon: Icon, label, value, dark }) {
  return (
    <div
      className={`rounded-2xl border p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl ${dark ? "border-transparent bg-[#0b3d2e] text-white shadow-lg shadow-[#0b3d2e]/25" : "border-[#e3e9e0] bg-white hover:shadow-[#062a20]/5"}`}
    >
      <div className="flex items-center justify-between">
        <p
          className={`text-[11px] font-bold uppercase tracking-[0.14em] ${dark ? "text-white/60" : "text-[#5b6b63]"}`}
        >
          {label}
        </p>
        <span
          className={`grid h-9 w-9 place-items-center rounded-xl ${dark ? "text-[#062a20]" : "bg-[#e9f3ee] text-[#1b7a5a]"}`}
          style={dark ? { background: GOLD } : undefined}
        >
          <Icon size={17} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight" style={DISPLAY}>
        {value}
      </p>
    </div>
  );
}

export default function PlotsPage() {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("plot");
  const [selected, setSelected] = useState(null);

  const [projectId, setProjectId] = useState("1");

  const scoped = useMemo(
    () => plots.filter((p) => !projectId || p.projectId === Number(projectId)),
    [projectId],
  );

  const counts = useMemo(() => {
    const c = { Available: 0, Booked: 0, Sold: 0 };
    scoped.forEach((p) => {
      const k = STATUSES.find((s) => norm(s) === norm(p.status));
      if (k) c[k] += 1;
    });
    return c;
  }, [scoped]);

  const matches = (p) =>
    String(p.plotNo).toLowerCase().includes(query.toLowerCase()) &&
    (!status || p.status === status);

  const list = useMemo(() => {
    const filtered = scoped.filter(matches);
    const sorted = [...filtered];
    if (sort === "low") sorted.sort((a, b) => a.price - b.price);
    if (sort === "high") sorted.sort((a, b) => b.price - a.price);
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoped, query, status, sort]);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#1b7a5a]">
            Inventory
          </p>
          <h1
            className="mt-2 text-4xl font-semibold tracking-tight text-[#14231d]"
            style={DISPLAY}
          >
            Plot inventory<span style={{ color: GOLD }}>.</span>
          </h1>
          <p className="mt-2 text-sm text-[#5b6b63]">
            Browse plot positions and availability.
          </p>
        </div>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => toast("Export is a static UI placeholder.", "info")}
        >
          <Download size={16} /> Export inventory
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Grid2X2} label="Total plots" value={scoped.length} dark />
        <Stat icon={CheckCircle2} label="Available" value={counts.Available} />
        <Stat icon={Clock3} label="Booked" value={counts.Booked} />
        <Stat icon={CircleDashed} label="Sold" value={counts.Sold} />
      </div>

      {/* Filters + map */}
      <div className="rounded-2xl border border-[#e3e9e0] bg-white p-5 shadow-sm shadow-[#062a20]/[0.03] sm:p-6">
        <div className="grid gap-3 md:grid-cols-[230px_1fr_auto]">
          <Select
            aria-label="Project"
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setStatus("");
              setQuery("");
            }}
            placeholder="All projects"
            options={projectOptions}
          />
          <Input
            leadingIcon={Search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search plot number"
            aria-label="Search plot number"
          />
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Filter by status"
          >
            {["", ...STATUSES].map((s) => (
              <button
                key={s || "all"}
                type="button"
                aria-pressed={status === s}
                onClick={() => setStatus(s)}
                className={`rounded-full border px-4 py-2.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1b7a5a]/20 ${
                  status === s
                    ? "border-[#0b3d2e] bg-[#0b3d2e] text-white shadow-md shadow-[#0b3d2e]/20"
                    : "border-[#dfe5dc] bg-white text-[#3f4f48] hover:border-[#1b7a5a] hover:text-[#0b3d2e]"
                }`}
              >
                {s || "All"}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <PlotMap
            plots={scoped}
            onSelect={setSelected}
            matches={matches}
            selectedId={selected?.id}
          />
        </div>
      </div>

      {/* Plot list */}
      <div className="overflow-hidden rounded-2xl border border-[#e3e9e0] bg-white shadow-sm shadow-[#062a20]/[0.03]">
        <div className="flex flex-col gap-3 border-b border-[#eef2ec] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-[#14231d]" style={DISPLAY}>
              Plot list
            </p>
            <p className="mt-1 text-xs text-[#5b6b63]">
              {list.length} of {scoped.length} plots shown
            </p>
          </div>
          <Select
            wrapperClassName="w-full sm:w-[220px]"
            aria-label="Sort plots"
            value={sort}
            onChange={(e) => setSort(e.target.value || "plot")}
            placeholder="Sort: Plot number"
            options={SORTS.slice(1)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="bg-[#f4f7f2] text-[10px] font-bold uppercase tracking-[0.14em] text-[#5b6b63]">
                {["Plot number", "Area", "Price", "Status", ""].map((h, i) => (
                  <th key={i} className="px-5 py-3.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="group cursor-pointer border-t border-[#eef2ec] transition hover:bg-[#f8faf6]"
                >
                  <td className="px-5 py-4">
                    <span className="rounded-lg bg-[#e9f3ee] px-2.5 py-1 text-xs font-extrabold text-[#0b3d2e]">
                      {p.plotNo}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[#3f4f48]">
                    {fmtArea(p.area)}
                  </td>
                  <td className="px-5 py-4 font-bold text-[#14231d]">
                    {inr(p.price)}
                  </td>
                  <td className="px-5 py-4">
                    <Badge>{p.status}</Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(p);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-extrabold text-[#1b7a5a] transition group-hover:gap-2"
                    >
                      Details <ArrowUpRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f3ee] text-[#1b7a5a]">
                      <Search size={20} />
                    </span>
                    <p className="mt-4 text-sm font-bold text-[#14231d]">
                      No plots match
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setStatus("");
                      }}
                      className="mt-3 text-xs font-extrabold text-[#1b7a5a] hover:underline"
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.plotNo || "Plot details"}
        description="Plot information · sample data"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Close
            </Button>
            {norm(selected?.status) === "available" && (
              <Button
                onClick={() => {
                  toast(
                    `Booking for ${selected.plotNo} is a static preview.`,
                    "info",
                  );
                  setSelected(null);
                }}
              >
                Book this plot
              </Button>
            )}
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-[#0b3d2e] p-5 text-white">
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: GOLD }}
                >
                  Price
                </p>
                <p
                  className="mt-1 text-3xl font-semibold tracking-tight"
                  style={DISPLAY}
                >
                  {inr(selected.price)}
                </p>
              </div>
              <Badge size="lg">{selected.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Area", fmtArea(selected.area)],
                ["Reference", selected.plotNo],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-xl border border-[#e3e9e0] bg-[#f6f9f4] p-4"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5b6b63]">
                    {k}
                  </p>
                  <p className="mt-2 font-bold text-[#14231d]">{v}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
