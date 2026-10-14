import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Download,
  Grid2X2,
  Search,
} from "lucide-react";
import axios from "axios";

import PlotMap from "../components/common/PlotMap";
import Badge from "../components/common/Badge";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Modal from "../components/common/Modal";
import Button from "../components/common/Button";
import { inr } from "../data/mockData";
import { useToast } from "../components/common/Toast";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };
const GOLD = "#e4c48a";

const STATUSES = ["Available", "Booked", "Sold"];

const SORTS = [
  { value: "plot", label: "Plot number" },
  { value: "low", label: "Price: low to high" },
  { value: "high", label: "Price: high to low" },
];

const EMPTY_STATS = {
  total: 0,
  available: 0,
  booked: 0,
  sold: 0,
};

const norm = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const fmtArea = (area) => {
  if (area == null || area === "") return "—";

  const number = Number(area);

  return Number.isFinite(number)
    ? `${number.toLocaleString("en-IN")} sq.ft.`
    : "—";
};

const projectOptionsFrom = (projects) =>
  projects.map((project) => ({
    value: project.uuid,
    label: project.name,
  }));

const normalizePlot = (plot) => ({
  ...plot,
  price: Number(plot.price ?? 0),
  area: plot.area ?? null,
  status:
    norm(plot.status) === "reserved"
      ? "Booked"
      : String(plot.status ?? "").replace(/^./, (char) => char.toUpperCase()),
});

function Stat({ icon: Icon, label, value, dark }) {
  return (
    <div
      className={`rounded-2xl border p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl ${
        dark
          ? "border-transparent bg-[#0b3d2e] text-white shadow-lg shadow-[#0b3d2e]/25"
          : "border-[#e3e9e0] bg-white hover:shadow-[#062a20]/5"
      }`}
    >
      <div className="flex items-center justify-between">
        <p
          className={`text-[11px] font-bold uppercase tracking-[0.14em] ${
            dark ? "text-white/60" : "text-[#5b6b63]"
          }`}
        >
          {label}
        </p>

        <span
          className={`grid h-9 w-9 place-items-center rounded-xl ${
            dark ? "text-[#062a20]" : "bg-[#e9f3ee] text-[#1b7a5a]"
          }`}
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

export default function Plots() {
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("plot");
  const [selected, setSelected] = useState(null);

  const [projects, setProjects] = useState([]);
  const [projectUuid, setProjectUuid] = useState("");
  const [plots, setPlots] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingPlots, setLoadingPlots] = useState(false);
  const [error, setError] = useState("");

  // 1. Fetch projects for the dropdown
  useEffect(() => {
    let cancelled = false;

    const fetchProjects = async () => {
      setLoadingProjects(true);
      setError("");

      try {
        const response = await axios.get("/api/plots/projects", {
          withCredentials: true,
        });

        const projectList = response.data?.data?.projects;

        if (!Array.isArray(projectList)) {
          throw new Error("Invalid projects response from server.");
        }

        if (cancelled) return;

        setProjects(projectList);

        // Select the first project by default.
        setProjectUuid((currentUuid) => {
          if (
            currentUuid &&
            projectList.some((project) => project.uuid === currentUuid)
          ) {
            return currentUuid;
          }

          return projectList[0]?.uuid ?? "";
        });
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to fetch projects:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load projects.",
        );
      } finally {
        if (!cancelled) setLoadingProjects(false);
      }
    };

    fetchProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Fetch statistics and plots for the selected project's UUID
  useEffect(() => {
    let cancelled = false;

    const fetchProjectPlots = async () => {
      if (!projectUuid) {
        setPlots([]);
        setStats(EMPTY_STATS);
        setSelected(null);
        setLoadingPlots(false);
        return;
      }

      setLoadingPlots(true);
      setError("");
      setSelected(null);

      try {
        const [statsResponse, plotsResponse] = await Promise.all([
          axios.get(`/api/plots/projects/${projectUuid}/stats`, {
            withCredentials: true,
          }),
          axios.get(`/api/plots/projects/${projectUuid}`, {
            withCredentials: true,
          }),
        ]);

        if (cancelled) return;

        // Backend response: data.stats
        const receivedStats = statsResponse.data?.data?.stats;
        // Backend response: data.plots
        const receivedPlots = plotsResponse.data?.data?.plots;

        if (!receivedStats || !Array.isArray(receivedPlots)) {
          throw new Error("Invalid plot data received from server.");
        }

        setStats({
          total: Number(receivedStats.total ?? 0),
          available: Number(receivedStats.available ?? 0),
          booked: Number(receivedStats.booked ?? 0),
          sold: Number(receivedStats.sold ?? 0),
        });

        setPlots(receivedPlots.map(normalizePlot));
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to fetch plot data:", err);
        setPlots([]);
        setStats(EMPTY_STATS);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load plot inventory.",
        );
      } finally {
        if (!cancelled) setLoadingPlots(false);
      }
    };

    fetchProjectPlots();

    return () => {
      cancelled = true;
    };
  }, [projectUuid]);

  const projectOptions = useMemo(
    () => projectOptionsFrom(projects),
    [projects],
  );

  // The API already filters plots by project UUID.
  const scoped = plots;

  const matches = (plot) => {
    const plotNumberMatches = String(plot.plotNo ?? "")
      .toLowerCase()
      .includes(query.toLowerCase());

    const normalizedStatus =
      norm(plot.status) === "reserved" ? "booked" : norm(plot.status);

    const statusMatches = !status || normalizedStatus === norm(status);

    return plotNumberMatches && statusMatches;
  };

  const list = useMemo(() => {
    const result = scoped.filter(matches);

    if (sort === "low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === "high") {
      result.sort((a, b) => b.price - a.price);
    } else {
      result.sort((a, b) =>
        String(a.plotNo ?? "").localeCompare(
          String(b.plotNo ?? ""),
          undefined,
          { numeric: true },
        ),
      );
    }

    return result;
  }, [scoped, query, status, sort]);

  const handleProjectChange = (event) => {
    setProjectUuid(event.target.value);
    setQuery("");
    setStatus("");
    setSort("plot");
    setSelected(null);
  };

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
          onClick={() => toast("Export is not implemented yet.", "info")}
        >
          <Download size={16} />
          Export inventory
        </Button>
      </div>

      {/* Project selector and filters */}
      <div className="rounded-2xl border border-[#e3e9e0] bg-white p-5 shadow-sm shadow-[#062a20]/[0.03] sm:p-6">
        <div className="grid gap-3 md:grid-cols-[230px_1fr_auto]">
          <Select
            aria-label="Project"
            value={projectUuid}
            onChange={handleProjectChange}
            placeholder="Select a project"
            options={projectOptions}
          />

          <Input
            leadingIcon={Search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search plot number"
            aria-label="Search plot number"
          />

          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Filter by status"
          >
            {["", ...STATUSES].map((item) => (
              <button
                key={item || "all"}
                type="button"
                aria-pressed={status === item}
                onClick={() => setStatus(item)}
                className={`rounded-full border px-4 py-2.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1b7a5a]/20 ${
                  status === item
                    ? "border-[#0b3d2e] bg-[#0b3d2e] text-white shadow-md shadow-[#0b3d2e]/20"
                    : "border-[#dfe5dc] bg-white text-[#3f4f48] hover:border-[#1b7a5a] hover:text-[#0b3d2e]"
                }`}
              >
                {item || "All"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Stats from API */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Grid2X2} label="Total plots" value={stats.total} dark />
        <Stat icon={CheckCircle2} label="Available" value={stats.available} />
        <Stat icon={Clock3} label="Booked" value={stats.booked} />
        <Stat icon={CircleDashed} label="Sold" value={stats.sold} />
      </div>

      {/* Map */}
      <div className="rounded-2xl border border-[#e3e9e0] bg-white p-5 shadow-sm shadow-[#062a20]/[0.03] sm:p-6">
        {loadingProjects ? (
          <p className="py-10 text-center text-sm text-[#5b6b63]">
            Loading projects...
          </p>
        ) : projects.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#5b6b63]">
            No projects found. Create a project before adding plots.
          </p>
        ) : loadingPlots ? (
          <p className="py-10 text-center text-sm text-[#5b6b63]">
            Loading plot inventory...
          </p>
        ) : (
          <PlotMap
            plots={scoped}
            onSelect={setSelected}
            matches={matches}
            selectedId={selected?.id}
          />
        )}
      </div>

      {/* Plot list */}
      <div className="overflow-hidden rounded-2xl border border-[#e3e9e0] bg-white shadow-sm shadow-[#062a20]/[0.03]">
        <div className="flex flex-col gap-3 border-b border-[#eef2ec] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-[#14231d]" style={DISPLAY}>
              Plot list
            </p>

            <p className="mt-1 text-xs text-[#5b6b63]">
              {loadingPlots
                ? "Loading plots..."
                : `${list.length} of ${scoped.length} plots shown`}
            </p>
          </div>

          <Select
            wrapperClassName="w-full sm:w-[220px]"
            aria-label="Sort plots"
            value={sort}
            onChange={(event) => setSort(event.target.value || "plot")}
            placeholder="Sort: Plot number"
            options={SORTS}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="bg-[#f4f7f2] text-[10px] font-bold uppercase tracking-[0.14em] text-[#5b6b63]">
                {["Plot number", "Area", "Price", "Status", ""].map(
                  (heading, index) => (
                    <th key={index} className="px-5 py-3.5">
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody>
              {!loadingPlots &&
                list.map((plot) => (
                  <tr
                    key={plot.uuid || plot.id}
                    onClick={() => setSelected(plot)}
                    className="group cursor-pointer border-t border-[#eef2ec] transition hover:bg-[#f8faf6]"
                  >
                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-[#e9f3ee] px-2.5 py-1 text-xs font-extrabold text-[#0b3d2e]">
                        {plot.plotNo}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-[#3f4f48]">
                      {fmtArea(plot.area)}
                    </td>

                    <td className="px-5 py-4 font-bold text-[#14231d]">
                      {inr(plot.price)}
                    </td>

                    <td className="px-5 py-4">
                      <Badge>{plot.status}</Badge>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelected(plot);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-extrabold text-[#1b7a5a] transition group-hover:gap-2"
                      >
                        Details <ArrowUpRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}

              {!loadingPlots && list.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f3ee] text-[#1b7a5a]">
                      <Search size={20} />
                    </span>

                    <p className="mt-4 text-sm font-bold text-[#14231d]">
                      {error ? "Could not load plots" : "No plots match"}
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

      {/* Plot details modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.plotNo || "Plot details"}
        description="Plot information"
        footer={
          <Button variant="secondary" onClick={() => setSelected(null)}>
            Close
          </Button>
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
                ["Plot type", selected.plotType || "—"],
                ["Notes", selected.notes || "—"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[#e3e9e0] bg-[#f6f9f4] p-4"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5b6b63]">
                    {label}
                  </p>
                  <p className="mt-2 break-words font-bold text-[#14231d]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
