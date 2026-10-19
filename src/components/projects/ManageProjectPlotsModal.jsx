import { useEffect, useMemo, useState } from "react";
import { Grid2X2, Minus, Plus, AlertTriangle } from "lucide-react";
import axios from "axios";

import Modal from "../common/Modal";
import Button from "../common/Button";
// Adjust this import if your SweetAlert helper is stored in a different folder.
import {
  confirmSweetAlert,
  successSweetAlert,
  errorSweetAlert,
} from "../../components/common/SweetAlert";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };

const inputClass =
  "w-full rounded-xl border border-[#dfe5dc] bg-white px-3.5 py-3 text-sm text-[#14231d] outline-none transition focus:border-[#1b7a5a] focus:ring-4 focus:ring-[#1b7a5a]/10";

const getPlotCount = (project) =>
  Number(
    project?.total_plots ??
      project?.plots ??
      project?.plot_count ??
      project?.totalPlots ??
      0,
  );

// Change this path if your backend route uses a different URL.
const MANAGE_PLOTS_ENDPOINT = "/api/projects/managePlots";

export default function ManageProjectPlotsModal({
  project,
  onClose,
  onUpdated,
}) {
  const [action, setAction] = useState("add");
  const [count, setCount] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentPlots = useMemo(() => getPlotCount(project), [project]);
  const nextPlots =
    currentPlots +
    (action === "add" ? Number(count || 0) : -Number(count || 0));

  useEffect(() => {
    if (project) {
      setAction("add");
      setCount("1");
      setError("");
    }
  }, [project]);

  const closeModal = () => {
    if (!loading) {
      setError("");
      onClose();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const amount = Number(count);
    if (!Number.isSafeInteger(amount) || amount < 1) {
      setError("Enter a positive whole number of plots.");
      return;
    }

    if (action === "delete" && amount > currentPlots) {
      setError(
        `You cannot delete more than the current ${currentPlots} plots.`,
      );
      return;
    }

    const result = await confirmSweetAlert({
      title: action === "add" ? "Add plots?" : "Delete plots?",
      text:
        action === "add"
          ? `Add ${amount} plot${amount === 1 ? "" : "s"} to "${project?.name}"? The total will become ${nextPlots}.`
          : `Delete ${amount} plot${amount === 1 ? "" : "s"} from "${project?.name}"? The total will become ${nextPlots}. This action may be irreversible.`,
      confirmButtonText:
        action === "add" ? "Yes, add plots" : "Yes, delete plots",
      cancelButtonText: "Cancel",
      icon: action === "add" ? "question" : "warning",
      confirmButtonClass:
        action === "delete" ? "app-swal-deny" : "app-swal-confirm",
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      const response = await axios.post(
        MANAGE_PLOTS_ENDPOINT,
        {
          project_id: project?.id ?? project?.uuid,
          action,
          count: amount,
        },
        { withCredentials: true },
      );

      if (response.status < 200 || response.status >= 300) {
        throw new Error("The server did not confirm the plot update.");
      }

      await successSweetAlert({
        title: action === "add" ? "Plots added" : "Plots deleted",
        text:
          response?.data?.message ||
          `${amount} plot${amount === 1 ? "" : "s"} ${action === "add" ? "added to" : "deleted from"} the project successfully.`,
      });

      await onUpdated?.();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        (err?.response?.status === 401
          ? "Your session has expired. Please log in again."
          : err?.response?.status === 403
            ? "You do not have permission to manage plots."
            : err?.message || "Unable to update plots. Please try again.");

      setError(message);
      await errorSweetAlert({
        title: "Plot update failed",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={Boolean(project)}
      onClose={closeModal}
      title="Manage project plots"
      description="Add new plots or remove plots from this project."
      size="md"
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
            form="manage-project-plots-form"
            loading={loading}
            disabled={loading || !project}
          >
            {action === "add" ? <Plus size={16} /> : <Minus size={16} />}
            {action === "add" ? "Add plots" : "Delete plots"}
          </Button>
        </>
      }
    >
      {project && (
        <form
          id="manage-project-plots-form"
          onSubmit={handleSubmit}
          className="space-y-5"
          noValidate
        >
          <div className="flex items-start gap-3 rounded-xl border border-[#e3e9e0] bg-[#f8faf6] p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e9f3ee] text-[#1b7a5a]">
              <Grid2X2 size={19} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-[#718078]">
                Selected project
              </p>
              <h3
                className="mt-1 truncate text-lg font-semibold text-[#14231d]"
                style={DISPLAY}
              >
                {project.name}
              </h3>
              <p className="mt-1 text-sm text-[#5b6b63]">
                Current plots:{" "}
                <strong className="text-[#14231d]">{currentPlots}</strong>
              </p>
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-xs font-bold text-[#3f4f48]">
              What would you like to do?
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setAction("add");
                  setError("");
                }}
                aria-pressed={action === "add"}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                  action === "add"
                    ? "border-[#1b7a5a] bg-[#e9f3ee] text-[#1b7a5a]"
                    : "border-[#dfe5dc] bg-white text-[#5b6b63] hover:border-[#9eb9a8]"
                }`}
              >
                <Plus size={17} /> Add plots
              </button>
              <button
                type="button"
                onClick={() => {
                  setAction("delete");
                  setError("");
                }}
                aria-pressed={action === "delete"}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                  action === "delete"
                    ? "border-rose-500 bg-rose-50 text-rose-700"
                    : "border-[#dfe5dc] bg-white text-[#5b6b63] hover:border-rose-300"
                }`}
              >
                <Minus size={17} /> Delete plots
              </button>
            </div>
          </fieldset>

          <div className="space-y-2">
            <label
              htmlFor="manage-plots-count"
              className="block text-xs font-bold text-[#3f4f48]"
            >
              Number of plots
            </label>
            <input
              id="manage-plots-count"
              className={inputClass}
              type="number"
              min="1"
              step="1"
              max={action === "delete" ? currentPlots : undefined}
              value={count}
              onChange={(event) => setCount(event.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="rounded-xl border border-[#e3e9e0] px-4 py-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-[#718078]">New total after update</span>
              <strong
                className={
                  action === "delete" ? "text-rose-700" : "text-[#1b7a5a]"
                }
              >
                {Number.isSafeInteger(Number(count)) &&
                Number(count) > 0 &&
                nextPlots >= 0
                  ? nextPlots
                  : "—"}
              </strong>
            </div>
          </div>

          {action === "delete" && (
            <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-5 text-amber-800">
              <AlertTriangle size={17} className="mt-0.5 shrink-0" />
              <p>
                Only delete plots that are safe to remove. The backend should
                prevent deletion of plots that are booked, sold, or otherwise
                referenced.
              </p>
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
            >
              {error}
            </p>
          )}
        </form>
      )}
    </Modal>
  );
}
