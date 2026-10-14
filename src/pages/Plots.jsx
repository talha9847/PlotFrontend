import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Download,
  Grid2X2,
  Search,
  Plus,
  Building2,
  MapPin,
  Ruler,
  AlertCircle,
} from "lucide-react";

import PlotMap from "../components/common/PlotMap";
import Badge from "../components/common/Badge";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Modal from "../components/common/Modal";
import Button from "../components/common/Button";
import { plots, project, inr } from "../data/mockData";
import { useToast } from "../components/common/Toast";
import axios from "axios";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };
const GOLD = "#e4c48a";

const STATUSES = ["Available", "Booked", "Sold"];

const SORTS = [
  { value: "plot", label: "Plot number" },
  { value: "low", label: "Price: low to high" },
  { value: "high", label: "Price: high to low" },
];

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

const AREA_UNITS = [
  { value: "sq_ft", label: "Square feet (sq. ft.)" },
  { value: "sq_m", label: "Square metres (sq. m.)" },
  { value: "sq_yd", label: "Square yards (sq. yd.)" },
  { value: "acre", label: "Acres" },
  { value: "hectare", label: "Hectares" },
  { value: "guntha", label: "Guntha" },
  { value: "bigha", label: "Bigha" },
  { value: "other", label: "Other" },
];

const INITIAL_FORM = {
  name: "",
  plots: "",
  project_type: "residential",
  status: "planning",
  address_line1: "",
  address_line2: "",
  city: "",
  district: "",
  state: "",
  postal_code: "",
  total_area: "",
  area_unit: "sq_ft",
};

const norm = (s) =>
  String(s ?? "")
    .trim()
    .toLowerCase();

const fmtArea = (area) =>
  typeof area === "number"
    ? `${area.toLocaleString("en-IN")} sq.ft.`
    : (area ?? "—");

const projectOptionsFrom = (projects) =>
  projects.map((p) => ({
    value: String(p.id),
    label: p.name,
  }));

const inputClass =
  "w-full rounded-xl border border-[#dfe5dc] bg-white px-4 py-3 text-sm text-[#14231d] outline-none transition placeholder:text-[#9aa69e] focus:border-[#1b7a5a] focus:ring-4 focus:ring-[#1b7a5a]/10";

function Field({ label, required, error, children }) {
  return (
    <div className="min-w-0 space-y-2">
      <label className="block text-xs font-bold text-[#3f4f48]">
        {label}
        {required && <span className="ml-1 text-rose-600">*</span>}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e9f3ee] text-[#1b7a5a]">
        <Icon size={19} />
      </span>
      <div>
        <h3 className="text-lg font-semibold text-[#14231d]" style={DISPLAY}>
          {title}
        </h3>
        <p className="text-xs text-[#5b6b63]">{description}</p>
      </div>
    </div>
  );
}

function CreateProjectModal({ open, onClose, projects, onCreate }) {
  const toast = useToast();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
      form: "",
    }));
  };

  const resetForm = () => {
    setForm({ ...INITIAL_FORM });
    setErrors({});
  };

  const closeModal = () => {
    if (loading) return;

    resetForm();
    onClose();
  };

  const validate = () => {
    const nextErrors = {};
    const name = form.name.trim();

    if (!name) {
      nextErrors.name = "Project name is required.";
    } else if (name.length > 100) {
      nextErrors.name = "Project name must not exceed 100 characters.";
    } else if (projects.some((project) => norm(project.name) === norm(name))) {
      nextErrors.name = "A project with this name already exists.";
    }

    if (!form.plots) nextErrors.plots = "Plots is reuqired ";
    else if (form.plots <= 0) nextErrors.plots = "must be greater than 0;";

    if (!PROJECT_TYPES.some((option) => option.value === form.project_type)) {
      nextErrors.project_type = "Please select a valid project type.";
    }

    if (!PROJECT_STATUSES.some((option) => option.value === form.status)) {
      nextErrors.status = "Please select a valid project status.";
    }

    if (!AREA_UNITS.some((option) => option.value === form.area_unit)) {
      nextErrors.area_unit = "Please select a valid area unit.";
    }

    if (form.total_area !== "") {
      const area = Number(form.total_area);

      if (!Number.isFinite(area) || area < 0) {
        nextErrors.total_area = "Area must be a valid non-negative number.";
      } else if (!/^\d+(\.\d{1,3})?$/.test(form.total_area)) {
        nextErrors.total_area = "Use a maximum of 3 decimal places.";
      }
    }

    const textLimits = [
      ["postal_code", 20, "Postal code"],
      ["city", 100, "City"],
      ["district", 100, "District"],
      ["state", 100, "State"],
    ];

    textLimits.forEach(([field, limit, label]) => {
      if (form[field].length > limit) {
        nextErrors[field] = `${label} must not exceed ${limit} characters.`;
      }
    });

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    if (!validate()) {
      toast("Please correct the highlighted fields.", "error");
      return;
    }

    const payload = {
      name: form.name.trim(),
      plots: Number(form.plots),
      project_type: form.project_type,
      status: form.status,
      address_line1: form.address_line1.trim() || null,
      address_line2: form.address_line2.trim() || null,
      city: form.city.trim() || null,
      district: form.district.trim() || null,
      state: form.state.trim() || null,
      postal_code: form.postal_code.trim() || null,
      total_area: form.total_area === "" ? null : Number(form.total_area),
      area_unit: form.area_unit,
    };

    setLoading(true);
    setErrors((previous) => ({ ...previous, form: "" }));

    try {
      const response = await axios.post("/api/projects/", payload, {
        withCredentials: true,
      });

      if (response.status === 200 || response.status === 201) {
        toast("Project created successfully.", "success");
        resetForm();
        onClose();
      }
    } catch (error) {
      const status = error?.response?.status;

      const message =
        error?.response?.data?.message ||
        (status === 401
          ? "Session expired. Please log in again."
          : status === 403
            ? "You don't have permission to create a project."
            : "Unable to create project. Please try again.");

      setErrors((previous) => ({
        ...previous,
        form: message,
      }));

      toast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fieldGrid = "grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2";
  const sectionSpacing = "space-y-5";

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title="Create project"
      description="Add a new real estate project to your portfolio."
      size="xl"
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
      closeDisabled={loading}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={closeModal}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="create-project-form"
            loading={loading}
            disabled={loading}
          >
            <Plus size={16} />
            Create project
          </Button>
        </>
      }
    >
      <form
        id="create-project-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-7"
      >
        {errors.form && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Basic information */}
        <section className={sectionSpacing}>
          <SectionHeading
            icon={Building2}
            title="Basic information"
            description="Project name, type and status."
          />

          <div className={fieldGrid}>
            <div className="sm:col-span-2">
              <Field label="Project name" required error={errors.name}>
                <Input
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="e.g. Green Valley Residency"
                  maxLength={100}
                  required
                  aria-label="Project name"
                  aria-invalid={!!errors.name}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Total Plots" required error={errors.plots}>
                <Input
                  name="plots"
                  value={form.plots}
                  onChange={updateField}
                  placeholder="e.g. Green Valley Residency"
                  maxLength={100}
                  required
                  aria-label="Project name"
                  aria-invalid={!!errors.plots}
                />
              </Field>
            </div>

            <Field label="Project type" required error={errors.project_type}>
              <Select
                name="project_type"
                value={form.project_type}
                onChange={updateField}
                options={PROJECT_TYPES}
                placeholder="Select project type"
                required
                error={errors.project_type}
                aria-label="Project type"
                aria-invalid={!!errors.project_type}
              />
            </Field>

            <Field label="Project status" required error={errors.status}>
              <Select
                name="status"
                value={form.status}
                onChange={updateField}
                options={PROJECT_STATUSES}
                placeholder="Select project status"
                required
                error={errors.status}
                aria-label="Project status"
                aria-invalid={!!errors.status}
              />
            </Field>
          </div>
        </section>

        <div className="border-t border-[#e3e9e0]" />

        {/* Project address */}
        <section className={sectionSpacing}>
          <SectionHeading
            icon={MapPin}
            title="Project address"
            description="Location details for the project site."
          />

          <div className={fieldGrid}>
            <div className="sm:col-span-2">
              <Field label="Address line 1">
                <Input
                  name="address_line1"
                  value={form.address_line1}
                  onChange={updateField}
                  placeholder="Street, road or locality"
                  aria-label="Address line 1"
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Address line 2">
                <Input
                  name="address_line2"
                  value={form.address_line2}
                  onChange={updateField}
                  placeholder="Landmark or additional address details"
                  aria-label="Address line 2"
                />
              </Field>
            </div>

            <Field label="City" error={errors.city}>
              <Input
                name="city"
                value={form.city}
                onChange={updateField}
                placeholder="Enter city"
                aria-label="City"
                aria-invalid={!!errors.city}
              />
            </Field>

            <Field label="District" error={errors.district}>
              <Input
                name="district"
                value={form.district}
                onChange={updateField}
                placeholder="Enter district"
                aria-label="District"
                aria-invalid={!!errors.district}
              />
            </Field>

            <Field label="State" error={errors.state}>
              <Input
                name="state"
                value={form.state}
                onChange={updateField}
                placeholder="Enter state"
                aria-label="State"
                aria-invalid={!!errors.state}
              />
            </Field>

            <Field label="Postal code" error={errors.postal_code}>
              <Input
                name="postal_code"
                value={form.postal_code}
                onChange={updateField}
                placeholder="PIN / postal code"
                maxLength={20}
                aria-label="Postal code"
                aria-invalid={!!errors.postal_code}
              />
            </Field>
          </div>
        </section>

        <div className="border-t border-[#e3e9e0]" />

        {/* Land area */}
        <section className={sectionSpacing}>
          <SectionHeading
            icon={Ruler}
            title="Project area"
            description="Total land area and measurement unit."
          />

          <div className={fieldGrid}>
            <Field label="Total area" error={errors.total_area}>
              <Input
                type="number"
                name="total_area"
                value={form.total_area}
                onChange={updateField}
                placeholder="e.g. 12500.000"
                min="0"
                step="0.001"
                aria-label="Total area"
                aria-invalid={!!errors.total_area}
              />
            </Field>

            <Field label="Area unit" required error={errors.area_unit}>
              <Select
                name="area_unit"
                value={form.area_unit}
                onChange={updateField}
                options={AREA_UNITS}
                placeholder="Select area unit"
                required
                error={errors.area_unit}
                aria-label="Area unit"
                aria-invalid={!!errors.area_unit}
              />
            </Field>
          </div>
        </section>

        <div className="rounded-xl bg-[#f6f8f3] px-4 py-3">
          <p className="text-xs leading-5 text-[#5b6b63]">
            Fields marked with{" "}
            <span className="font-semibold text-rose-600">*</span> are required.
            The database generates the project ID, UUID and timestamps.
          </p>
        </div>
      </form>
    </Modal>
  );
}

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

  const [projects, setProjects] = useState(project);
  const [projectId, setProjectId] = useState("1");
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  const projectOptions = useMemo(
    () => projectOptionsFrom(projects),
    [projects],
  );

  const scoped = useMemo(
    () => plots.filter((p) => !projectId || p.projectId === Number(projectId)),
    [projectId],
  );

  const counts = useMemo(() => {
    const result = { Available: 0, Booked: 0, Sold: 0 };

    scoped.forEach((p) => {
      const key = STATUSES.find((s) => norm(s) === norm(p.status));

      if (key) result[key] += 1;
    });

    return result;
  }, [scoped]);

  const matches = (p) =>
    String(p.plotNo ?? "")
      .toLowerCase()
      .includes(query.toLowerCase()) &&
    (!status || norm(p.status) === norm(status));

  const list = useMemo(() => {
    const result = scoped.filter(matches);

    if (sort === "low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === "high") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [scoped, query, status, sort]);

  const handleCreateProject = async (payload) => {
    // Local preview only. Replace this with your API request
    // when your backend endpoint is ready.
    const duplicate = projects.some((p) => norm(p.name) === norm(payload.name));

    if (duplicate) {
      throw new Error("A project with this name already exists.");
    }

    const nextId = Math.max(0, ...projects.map((p) => Number(p.id) || 0)) + 1;

    const newProject = {
      id: nextId,
      ...payload,
    };

    setProjects((previous) => [...previous, newProject]);
    setProjectId(String(nextId));
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

          {/* Create project button at the top-left */}
          <div className="mt-5">
            <Button size="lg" onClick={() => setCreateProjectOpen(true)}>
              <Plus size={16} />
              Create project
            </Button>
          </div>
        </div>

        <Button
          variant="secondary"
          size="lg"
          onClick={() => toast("Export is a static UI placeholder.", "info")}
        >
          <Download size={16} />
          Export inventory
        </Button>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        open={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        projects={projects}
        onCreate={handleCreateProject}
      />

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
            onChange={(event) => {
              setProjectId(event.target.value);
              setStatus("");
              setQuery("");
              setSelected(null);
            }}
            placeholder="All projects"
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
                      onClick={(event) => {
                        event.stopPropagation();
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

      {/* Plot details modal */}
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
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[#e3e9e0] bg-[#f6f9f4] p-4"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5b6b63]">
                    {label}
                  </p>
                  <p className="mt-2 font-bold text-[#14231d]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
