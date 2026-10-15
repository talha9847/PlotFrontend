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

const PAGE_SIZES = [10, 20, 50, 100];

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
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("plot");
  const [selected, setSelected] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

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

  // Debounce search so the API is not called on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch project-wide statistics separately; these should not change with pagination.
  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      if (!projectUuid) {
        setStats(EMPTY_STATS);
        return;
      }

      try {
        const response = await axios.get(
          `/api/plots/projects/${projectUuid}/stats`,
          { withCredentials: true },
        );
        if (cancelled) return;

        const receivedStats = response.data?.data?.stats;
        if (!receivedStats)
          throw new Error("Invalid plot statistics received from server.");

        setStats({
          total: Number(receivedStats.total ?? 0),
          available: Number(receivedStats.available ?? 0),
          booked: Number(receivedStats.booked ?? 0),
          sold: Number(receivedStats.sold ?? 0),
        });
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to fetch plot statistics:", err);
        setStats(EMPTY_STATS);
      }
    };

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, [projectUuid]);

  // Fetch only the requested page. Search, status and sorting are handled by the API.
  useEffect(() => {
    let cancelled = false;

    const fetchProjectPlots = async () => {
      if (!projectUuid) {
        setPlots([]);
        setPagination({ page: 1, limit, total: 0, totalPages: 0 });
        setSelected(null);
        setLoadingPlots(false);
        return;
      }

      setLoadingPlots(true);
      setError("");

      const sortBy =
        sort === "low" || sort === "high" ? "price" : "plot_number";
      const sortOrder = sort === "high" ? "desc" : "asc";

      try {
        const response = await axios.get(`/api/plots/projects/${projectUuid}`, {
          withCredentials: true,
          params: {
            page,
            limit,
            search: debouncedQuery,
            sortBy,
            sortOrder,
            status,
          },
        });

        if (cancelled) return;

        // Expected controller shape: { success, data: { plots, pagination } }.
        const payload = response.data?.data;
        const receivedPlots = payload?.plots;
        const receivedPagination = payload?.pagination ?? payload?.meta;

        if (!Array.isArray(receivedPlots)) {
          throw new Error(
            "Invalid plot data received from server. Expected data.plots.",
          );
        }

        setPlots(receivedPlots.map(normalizePlot));

        const total = Number(
          receivedPagination?.total ??
            receivedPagination?.totalItems ??
            receivedPagination?.totalCount ??
            receivedPlots.length,
        );
        const currentPage = Number(receivedPagination?.page ?? page);
        const pageLimit = Number(receivedPagination?.limit ?? limit);
        const totalPages = Number(
          receivedPagination?.totalPages ??
            Math.ceil(total / Math.max(pageLimit, 1)),
        );

        setPagination({
          page: currentPage,
          limit: pageLimit,
          total,
          totalPages,
        });
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to fetch plot data:", err);
        setPlots([]);
        setPagination({ page, limit, total: 0, totalPages: 0 });
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
  }, [projectUuid, page, limit, debouncedQuery, status, sort]);

  const projectOptions = useMemo(
    () => projectOptionsFrom(projects),
    [projects],
  );

  // The server returns only the current page, already filtered and sorted.
  const scoped = plots;
  const list = plots;

  const matches = (plot) => {
    const plotNumberMatches = String(plot.plotNo ?? "")
      .toLowerCase()
      .includes(debouncedQuery.toLowerCase());
    const normalizedStatus =
      norm(plot.status) === "reserved" ? "booked" : norm(plot.status);
    const statusMatches = !status || normalizedStatus === norm(status);
    return plotNumberMatches && statusMatches;
  };

  const handleProjectChange = (event) => {
    setProjectUuid(event.target.value);
    setQuery("");
    setStatus("");
    setSort("plot");
    setPage(1);
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
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
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
                onClick={() => {
                  setStatus(item);
                  setPage(1);
                }}
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

      {/* Map pagination controls */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#e3e9e0] bg-white px-5 py-4 shadow-sm shadow-[#062a20]/[0.03] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-[#5b6b63]">
          <span>Rows per page</span>

          <select
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setPage(1);
            }}
            className="rounded-lg border border-[#dfe5dc] bg-white px-2.5 py-2 text-sm text-[#14231d] outline-none focus:border-[#1b7a5a]"
            aria-label="Plots per page"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
          <span className="text-xs text-[#5b6b63]">
            Showing {pagination.total === 0 ? 0 : (page - 1) * limit + 1}
            {"–"}
            {Math.min(page * limit, pagination.total)}
            {" of "}
            {pagination.total} plots
          </span>

          <span className="text-xs text-[#5b6b63]">
            Page {pagination.totalPages === 0 ? 0 : page} of{" "}
            {pagination.totalPages}
          </span>

          <button
            type="button"
            disabled={loadingPlots || page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-lg border border-[#dfe5dc] px-4 py-2 text-xs font-bold text-[#0b3d2e] transition hover:bg-[#f4f7f2] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <button
            type="button"
            disabled={
              loadingPlots ||
              pagination.totalPages === 0 ||
              page >= pagination.totalPages
            }
            onClick={() =>
              setPage((current) => Math.min(pagination.totalPages, current + 1))
            }
            className="rounded-lg border border-[#dfe5dc] px-4 py-2 text-xs font-bold text-[#0b3d2e] transition hover:bg-[#f4f7f2] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* Plot list */}
     

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
