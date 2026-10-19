import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Building2,
  MapPin,
  Ruler,
  Grid2X2,
  CheckCircle2,
  Clock3,
  X,
  ChevronDown,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import axios from "axios";

import Button from "../components/common/Button";
import ProjectDetailsModal from "../components/projects/ProjectDetailModal";
import StatCard from "../components/projects/StatCard";
import ProjectCard from "../components/projects/ProjectCard";
import CreateProjectModal from "../components/projects/CreateProjectModal";
import ManageProjectPlotsModal from "../components/projects/ManageProjectPlotsModal";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };
const GOLD = "#e4c48a";

const PROJECT_TYPES = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "industrial", label: "Industrial" },
  { value: "mixed_use", label: "Mixed use" },
  { value: "agricultural", label: "Agricultural" },
  { value: "other", label: "Other" },
];

const PROJECT_STATUSES = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const inputClass =
  "w-full rounded-xl border border-[#dfe5dc] bg-white px-3.5 py-3 text-sm text-[#14231d] outline-none transition placeholder:text-[#9aa69e] focus:border-[#1b7a5a] focus:ring-4 focus:ring-[#1b7a5a]/10";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    total_projects: 0,
    total_plots: 0,
    booked_plots: 0,
    sold_plots: 0,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectToManagePlots, setProjectToManagePlots] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch real project records and dashboard statistics.
  const fetchProjectsData = async (showLoader = false) => {
    if (showLoader) setLoading(true);

    setError("");

    try {
      const [projectsResponse, statsResponse] = await Promise.all([
        axios.get("/api/projects/getProjects", {
          withCredentials: true,
        }),
        axios.get("/api/projects/stats", {
          withCredentials: true,
        }),
      ]);

      const projectList = projectsResponse?.data?.data?.projects;
      const projectStats = statsResponse?.data?.data?.stats;

      if (!Array.isArray(projectList) || !projectStats) {
        throw new Error("Invalid response received from the server.");
      }

      setProjects(projectList);

      setStats({
        total_projects: Number(projectStats.total_projects || 0),
        total_plots: Number(projectStats.total_plots || 0),
        booked_plots: Number(projectStats.booked_plots || 0),
        sold_plots: Number(projectStats.sold_plots || 0),
      });

      // Keep an open details modal synchronized with refreshed data.
      setSelectedProject((current) => {
        if (!current) return null;

        return (
          projectList.find(
            (project) =>
              project.id === current.id || project.uuid === current.uuid,
          ) || null
        );
      });
    } catch (err) {
      console.error("Failed to fetch projects:", err);

      setError(
        err?.response?.data?.message ||
          (err?.response?.status === 401
            ? "Your session has expired. Please log in again."
            : "Unable to load projects. Please try again."),
      );
    } finally {
      if (showLoader) setLoading(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsData(true);
  }, []);

  // Search and filters operate on the fetched database records.
  const filteredProjects = useMemo(() => {
    const query = normalize(search);

    return projects.filter((project) => {
      const searchable = [
        project.name,
        project.city,
        project.district,
        project.state,
        project.address_line1,
      ].map(normalize);

      return (
        (!query || searchable.some((value) => value.includes(query))) &&
        (!status || project.status === status) &&
        (!type || project.project_type === type)
      );
    });
  }, [projects, search, status, type]);

  // Refresh projects and counts after creating a project.
  const createProject = async () => {
    setShowCreate(false);
    await fetchProjectsData();
  };

  return (
    <div className="min-h-full space-y-7 bg-[#fafbf8] p-4 sm:p-6 lg:p-8">
      {/* Page header */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#1b7a5a]">
            Portfolio management
          </p>

          <h1
            className="mt-2 text-4xl font-semibold tracking-tight text-[#14231d]"
            style={DISPLAY}
          >
            Projects<span style={{ color: GOLD }}>.</span>
          </h1>

          <p className="mt-2 text-sm text-[#718078]">
            Manage your developments, land area, and plot availability.
          </p>
        </div>

        <Button type="button" onClick={() => setShowCreate(true)}>
          <Plus size={17} />
          Create project
        </Button>
      </header>

      {/* Real dashboard statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Building2}
          label="Total projects"
          value={stats.total_projects}
          caption="Across your portfolio"
          dark
        />

        <StatCard
          icon={Grid2X2}
          label="Total plots"
          value={stats.total_plots}
          caption="Across all projects"
        />

        <StatCard
          icon={Clock3}
          label="Booked plots"
          value={stats.booked_plots}
          caption="Reserved and booked plots"
        />

        <StatCard
          icon={CheckCircle2}
          label="Sold plots"
          value={stats.sold_plots}
          caption="Completed plot sales"
        />
      </section>

      {/* Search and filters */}
      <section className="rounded-2xl border border-[#e3e9e0] bg-white p-4 shadow-sm shadow-[#062a20]/[0.03] sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#829087]"
            />

            <input
              className={`${inputClass} pl-10`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search projects or locations..."
              aria-label="Search projects"
            />
          </div>

          <div className="relative">
            <select
              className={`${inputClass} appearance-none pr-9 lg:w-48`}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter by project status"
            >
              <option value="">All statuses</option>
              {PROJECT_STATUSES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#829087]"
            />
          </div>

          <div className="relative">
            <select
              className={`${inputClass} appearance-none pr-9 lg:w-48`}
              value={type}
              onChange={(event) => setType(event.target.value)}
              aria-label="Filter by project type"
            >
              <option value="">All project types</option>
              {PROJECT_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#829087]"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#eef2ec] pt-4">
          <p className="text-xs text-[#718078]">
            Showing{" "}
            <span className="font-extrabold text-[#14231d]">
              {filteredProjects.length}
            </span>{" "}
            of {projects.length} projects
          </p>

          {(search || status || type) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatus("");
                setType("");
              }}
              className="text-xs font-bold text-[#1b7a5a] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* Projects grid */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2
              className="text-xl font-semibold text-[#14231d]"
              style={DISPLAY}
            >
              All projects
            </h2>

            <p className="mt-1 text-xs text-[#718078]">
              Select a project to view its complete details.
            </p>
          </div>

          <span className="rounded-lg bg-[#e9f3ee] px-3 py-1.5 text-xs font-extrabold text-[#1b7a5a]">
            {filteredProjects.length} projects
          </span>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#e3e9e0] bg-white px-6 py-16 text-center">
            <div
              className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#e3e9e0] border-t-[#1b7a5a]"
              role="status"
              aria-label="Loading projects"
            />

            <p className="mt-4 text-sm text-[#718078]">
              Loading your projects...
            </p>
          </div>
        ) : error ? (
          <div
            className="rounded-2xl border border-rose-200 bg-white px-6 py-12 text-center"
            role="alert"
          >
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertCircle size={22} />
            </span>

            <h3 className="mt-4 font-bold text-[#14231d]">
              Could not load projects
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-[#718078]">
              {error}
            </p>

            <div className="mt-5">
              <Button type="button" onClick={() => fetchProjectsData(true)}>
                Try again
              </Button>
            </div>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project) => (
              <div
                key={project.uuid || project.id}
                className="min-w-0 rounded-2xl"
              >
                <ProjectCard
                  project={project}
                  onClick={() => setSelectedProject(project)}
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setProjectToManagePlots(project)}
                  >
                    <Grid2X2 size={16} />
                    Manage plots
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#cbd7cc] bg-white px-6 py-16 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f3ee] text-[#1b7a5a]">
              <Search size={21} />
            </span>

            <h3 className="mt-4 font-bold text-[#14231d]">
              {projects.length === 0 ? "No projects yet" : "No projects found"}
            </h3>

            <p className="mt-1 text-sm text-[#718078]">
              {projects.length === 0
                ? "Create your first project to get started."
                : "Try another search or clear your filters."}
            </p>

            {projects.length === 0 && (
              <div className="mt-5">
                <Button type="button" onClick={() => setShowCreate(true)}>
                  <Plus size={17} />
                  Create project
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Create project modal */}
      <CreateProjectModal
        open={showCreate}
        projects={projects}
        onCreate={createProject}
        onClose={() => setShowCreate(false)}
      />

      {/* Add or remove plots from an existing project */}
      <ManageProjectPlotsModal
        project={projectToManagePlots}
        onClose={() => setProjectToManagePlots(null)}
        onUpdated={async () => {
          await fetchProjectsData();
          setProjectToManagePlots(null);
        }}
      />

      {/* Project details modal */}
      <ProjectDetailsModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
}
