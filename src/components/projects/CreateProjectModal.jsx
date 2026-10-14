import { useState } from "react";
import { Plus, Building2, MapPin, Ruler, AlertCircle } from "lucide-react";
import axios from "axios";

import Input from "../common/Input";
import Select from "../common/Select";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { useToast } from "../common/Toast";

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

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

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

/* -------------------------------------------------------
   CREATE PROJECT MODAL
   Reuses the existing Modal, Input, Select, Button,
   and Toast components.
------------------------------------------------------- */

export default function CreateProjectModal({
  open,
  onClose,
  projects,
  onCreate,
}) {
  const toast = useToast();

  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const updateField = (field, eventOrValue) => {
    const value =
      eventOrValue &&
      typeof eventOrValue === "object" &&
      "target" in eventOrValue
        ? eventOrValue.target.value
        : eventOrValue;

    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: "",
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
    const plotCount = Number(form.plots);

    if (!name) {
      nextErrors.name = "Project name is required.";
    } else if (name.length > 100) {
      nextErrors.name = "Project name cannot exceed 100 characters.";
    } else if (
      projects.some((project) => normalize(project.name) === normalize(name))
    ) {
      nextErrors.name = "A project with this name already exists.";
    }

    if (form.plots === "") {
      nextErrors.plots = "Total plots is required.";
    } else if (!Number.isInteger(plotCount) || plotCount <= 0) {
      nextErrors.plots = "Enter a positive whole number of plots.";
    }

    if (!PROJECT_TYPES.some((item) => item.value === form.project_type)) {
      nextErrors.project_type = "Select a valid project type.";
    }

    if (!PROJECT_STATUSES.some((item) => item.value === form.status)) {
      nextErrors.status = "Select a valid project status.";
    }

    if (!AREA_UNITS.some((item) => item.value === form.area_unit)) {
      nextErrors.area_unit = "Select a valid area unit.";
    }

    if (form.total_area !== "") {
      const area = Number(form.total_area);

      if (!Number.isFinite(area) || area < 0) {
        nextErrors.total_area = "Enter a valid non-negative area.";
      } else if (!/^\d+(\.\d{1,3})?$/.test(form.total_area)) {
        nextErrors.total_area = "Use a maximum of 3 decimal places.";
      }
    }

    const textLimits = [
      ["address_line1", 255, "Address line 1"],
      ["address_line2", 255, "Address line 2"],
      ["city", 100, "City"],
      ["district", 100, "District"],
      ["state", 100, "State"],
      ["postal_code", 20, "Postal code"],
    ];

    textLimits.forEach(([field, limit, label]) => {
      if (form[field].length > limit) {
        nextErrors[field] = `${label} cannot exceed ${limit} characters.`;
      }
    });

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading || !validate()) {
      if (!loading) {
        toast("Please correct the highlighted fields.", "error");
      }
      return;
    }

    /*
     * Send only fields supported by the current project API.
     * Plots are kept in the frontend model because the current
     * backend schema does not appear to store a plots column.
     */
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
    console.log(payload);
    try {
      const response = await axios.post("/api/projects/create", payload, {
        withCredentials: true,
      });

      const savedProject = response?.data?.data;

      if (response.status !== 200 && response.status !== 201) {
        throw new Error("The server did not confirm project creation.");
      }

      if (!savedProject) {
        throw new Error(
          "The server response did not contain the created project.",
        );
      }

      const newProject = {
        ...savedProject,
        plots: Number(form.plots),
        booked: Number(savedProject.booked || 0),
        sold: Number(savedProject.sold || 0),
      };

      onCreate(newProject);
      resetForm();
      toast("Project created successfully.", "success");
    } catch (error) {
      const status = error?.response?.status;

      const message =
        error?.response?.data?.message ||
        (status === 401
          ? "Session expired. Please log in again."
          : status === 403
            ? "You do not have permission to create a project."
            : error?.message ||
              "Unable to create the project. Please try again.");

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

        <section className={sectionSpacing}>
          <SectionHeading
            icon={Building2}
            title="Basic information"
            description="Project name, type, status, and plot count."
          />

          <div className={fieldGrid}>
            <div className="sm:col-span-2">
              <Field label="Project name" required error={errors.name}>
                <Input
                  name="name"
                  value={form.name}
                  onChange={(value) => updateField("name", value)}
                  placeholder="e.g. Green Valley Residency"
                  maxLength={100}
                  required
                  aria-label="Project name"
                  aria-invalid={!!errors.name}
                />
              </Field>
            </div>

            <Field label="Total plots" required error={errors.plots}>
              <Input
                type="number"
                name="plots"
                value={form.plots}
                onChange={(value) => updateField("plots", value)}
                placeholder="e.g. 120"
                min="1"
                step="1"
                required
                aria-label="Total plots"
                aria-invalid={!!errors.plots}
              />
            </Field>

            <Field label="Project type" required error={errors.project_type}>
              <Select
                name="project_type"
                value={form.project_type}
                onChange={(value) => updateField("project_type", value)}
                options={PROJECT_TYPES}
                placeholder="Select project type"
                required
                aria-label="Project type"
                aria-invalid={!!errors.project_type}
              />
            </Field>

            <Field label="Project status" required error={errors.status}>
              <Select
                name="status"
                value={form.status}
                onChange={(value) => updateField("status", value)}
                options={PROJECT_STATUSES}
                placeholder="Select project status"
                required
                aria-label="Project status"
                aria-invalid={!!errors.status}
              />
            </Field>
          </div>
        </section>

        <div className="border-t border-[#e3e9e0]" />

        <section className={sectionSpacing}>
          <SectionHeading
            icon={MapPin}
            title="Project address"
            description="Location details for the project site."
          />

          <div className={fieldGrid}>
            <div className="sm:col-span-2">
              <Field label="Address line 1" error={errors.address_line1}>
                <Input
                  name="address_line1"
                  value={form.address_line1}
                  onChange={(value) => updateField("address_line1", value)}
                  placeholder="Street, road, or locality"
                  aria-label="Address line 1"
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Address line 2" error={errors.address_line2}>
                <Input
                  name="address_line2"
                  value={form.address_line2}
                  onChange={(value) => updateField("address_line2", value)}
                  placeholder="Landmark or additional details"
                  aria-label="Address line 2"
                />
              </Field>
            </div>

            <Field label="City" error={errors.city}>
              <Input
                name="city"
                value={form.city}
                onChange={(value) => updateField("city", value)}
                placeholder="Enter city"
                aria-label="City"
                aria-invalid={!!errors.city}
              />
            </Field>

            <Field label="District" error={errors.district}>
              <Input
                name="district"
                value={form.district}
                onChange={(value) => updateField("district", value)}
                placeholder="Enter district"
                aria-label="District"
                aria-invalid={!!errors.district}
              />
            </Field>

            <Field label="State" error={errors.state}>
              <Input
                name="state"
                value={form.state}
                onChange={(value) => updateField("state", value)}
                placeholder="Enter state"
                aria-label="State"
                aria-invalid={!!errors.state}
              />
            </Field>

            <Field label="Postal code" error={errors.postal_code}>
              <Input
                name="postal_code"
                value={form.postal_code}
                onChange={(value) => updateField("postal_code", value)}
                placeholder="PIN / postal code"
                maxLength={20}
                aria-label="Postal code"
                aria-invalid={!!errors.postal_code}
              />
            </Field>
          </div>
        </section>

        <div className="border-t border-[#e3e9e0]" />

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
                onChange={(value) => updateField("total_area", value)}
                placeholder="e.g. 125000"
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
                onChange={(value) => updateField("area_unit", value)}
                options={AREA_UNITS}
                required
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
            Your project ID and timestamps are generated by the backend.
          </p>
        </div>
      </form>
    </Modal>
  );
}
