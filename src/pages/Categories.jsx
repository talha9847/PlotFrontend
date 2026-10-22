import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Layers3,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  UserRoundCheck,
  UserRoundX,
  X,
} from "lucide-react";

import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import {
  confirmSweetAlert,
  successSweetAlert,
  errorSweetAlert,
} from "../components/common/SweetAlert";
import Loader from "../components/common/Loader";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };
const GOLD = "#e4c48a";
const PAGE_SIZE = 8;
const EMPTY_FORM = { name: "", description: "", is_active: true };

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const normalizeCategory = (category = {}) => ({
  ...category,
  name: category.name ?? "",
  description: category.description ?? "",
  is_active: Boolean(category.is_active ?? category.isActive ?? true),
  created_at: category.created_at ?? category.createdAt ?? null,
  updated_at: category.updated_at ?? category.updatedAt ?? null,
});

const extractRows = (payload) => {
  const candidates = [
    payload?.data,
    payload?.data?.categories,
    payload?.categories,
    payload?.results,
  ];
  return candidates.find(Array.isArray) || [];
};

const extractPagination = (payload) =>
  payload?.pagination ??
  payload?.data?.pagination ??
  payload?.meta?.pagination ??
  null;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";

function StatCard({ icon: Icon, label, value, note, dark = false }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl ${
        dark
          ? "border-transparent bg-[#0b3d2e] text-white shadow-lg shadow-[#0b3d2e]/20"
          : "border-[#e3e9e0] bg-white hover:shadow-[#062a20]/5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-[11px] font-bold uppercase tracking-[0.14em] ${
              dark ? "text-white/60" : "text-[#5b6b63]"
            }`}
          >
            {label}
          </p>
          <p
            className="mt-4 text-3xl font-semibold tracking-tight"
            style={DISPLAY}
          >
            {value}
          </p>
          {note && (
            <p
              className={`mt-1 text-xs ${dark ? "text-white/55" : "text-[#5b6b63]"}`}
            >
              {note}
            </p>
          )}
        </div>
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
            dark ? "text-[#062a20]" : "bg-[#e9f3ee] text-[#1b7a5a]"
          }`}
          style={dark ? { background: GOLD } : undefined}
        >
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  children,
  tone = "green",
  disabled = false,
}) {
  const tones = {
    blue: "text-blue-700 hover:bg-blue-50 focus-visible:ring-blue-500",
    amber: "text-amber-700 hover:bg-amber-50 focus-visible:ring-amber-500",
    green:
      "text-emerald-700 hover:bg-emerald-50 focus-visible:ring-emerald-500",
    red: "text-red-600 hover:bg-red-50 focus-visible:ring-red-500",
  };

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

function FieldError({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
      {children}
    </p>
  );
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [busyUuid, setBusyUuid] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUuid, setEditingUuid] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [touched, setTouched] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === "name") setTouched(true);
  };

  const nameError = useMemo(() => {
    if (!touched) return "";
    const name = form.name.trim();
    if (!name) return "Category name is required.";
    if (name.length > 100)
      return "Category name must be 100 characters or fewer.";
    if (
      categories.some(
        (item) =>
          item.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase() &&
          item.uuid !== editingUuid,
      )
    ) {
      return "A category with this name already exists.";
    }
    return "";
  }, [touched, form.name, categories, editingUuid]);

  useEffect(() => {
    const controller = new AbortController();
    let debounceId;

    const loadCategories = async () => {
      setIsLoading(true);
      setLoadError("");

      const params = {
        page,
        limit: PAGE_SIZE,
        ...(query.trim() ? { search: query.trim() } : {}),
        ...(statusFilter !== "all"
          ? { isActive: statusFilter === "active" }
          : {}),
      };

      try {
        const response = await axios.get("/api/categories", {
          params,
          withCredentials: true,
          signal: controller.signal,
        });
        const payload = response.data;
        const rows = extractRows(payload).map(normalizeCategory);
        const pageInfo = extractPagination(payload);

        setCategories(rows);
        setPagination({
          page: Number(pageInfo?.page ?? page),
          limit: Number(pageInfo?.limit ?? PAGE_SIZE),
          total: Number(pageInfo?.total ?? rows.length),
          totalPages: Number(
            pageInfo?.totalPages ??
              Math.max(
                1,
                Math.ceil(Number(pageInfo?.total ?? rows.length) / PAGE_SIZE),
              ),
          ),
        });
      } catch (error) {
        if (!axios.isCancel(error) && error.code !== "ERR_CANCELED") {
          setLoadError(getErrorMessage(error, "Unable to load categories."));
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    debounceId = window.setTimeout(loadCategories, query.trim() ? 250 : 0);
    return () => {
      window.clearTimeout(debounceId);
      controller.abort();
    };
  }, [query, statusFilter, page, refreshKey]);

  const activeCount = categories.filter((item) => item.is_active).length;
  const inactiveCount = categories.length - activeCount;
  const totalPages = Math.max(1, pagination.totalPages || 1);

  const openAddModal = () => {
    setEditingUuid(null);
    setForm({ ...EMPTY_FORM });
    setTouched(false);
    setModalOpen(true);
  };

  const openEditModal = async (category) => {
    if (!category.uuid) {
      errorSweetAlert({
        title: "Unable to edit category",
        text: "This category does not have a UUID.",
      });
      return;
    }

    setEditingUuid(category.uuid);
    setForm({
      name: category.name ?? "",
      description: category.description ?? "",
      is_active: Boolean(category.is_active),
    });
    setTouched(false);
    setModalOpen(true);

    // Fetch the latest record before editing. If this endpoint returns a
    // different envelope, the selected list row remains a safe fallback.
    try {
      const response = await axios.get(
        `/api/categories/${encodeURIComponent(category.uuid)}`,
        { withCredentials: true },
      );
      const record =
        response.data?.data?.category ??
        response.data?.category ??
        response.data?.data;
      if (record && typeof record === "object" && !Array.isArray(record)) {
        const latest = normalizeCategory(record);
        setForm({
          name: latest.name,
          description: latest.description,
          is_active: latest.is_active,
        });
      }
    } catch (error) {
      // Do not close the modal; the list row can still be edited.
      if (error?.response?.status !== 404) {
        errorSweetAlert({
          title: "Could not refresh category",
          text: getErrorMessage(
            error,
            "Using the category data already loaded.",
          ),
        });
      }
    }
  };

  const closeModal = () => {
    if (isSaving) return;
    setModalOpen(false);
    setEditingUuid(null);
    setForm({ ...EMPTY_FORM });
    setTouched(false);
  };

  const submitCategory = async (event) => {
    event.preventDefault();
    setTouched(true);
    const name = form.name.trim();
    const description = form.description.trim();

    if (!name || name.length > 100) {
      errorSweetAlert({
        title: "Check category name",
        text: "Enter a category name of up to 100 characters.",
      });
      return;
    }

    if (
      categories.some(
        (item) =>
          item.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase() &&
          item.uuid !== editingUuid,
      )
    ) {
      errorSweetAlert({
        title: "Category already exists",
        text: "Choose a different category name.",
      });
      return;
    }

    if (description.length > 2000) {
      errorSweetAlert({
        title: "Description is too long",
        text: "Description must be 2,000 characters or fewer.",
      });
      return;
    }

    const payload = {
      name,
      description: description || null,
      isActive: Boolean(form.is_active),
    };

    const uuidBeingEdited = editingUuid;
    setIsSaving(true);

    try {
      const response = uuidBeingEdited
        ? await axios.patch(
            `/api/categories/${encodeURIComponent(uuidBeingEdited)}`,
            payload,
            { withCredentials: true },
          )
        : await axios.post("/api/categories", payload, {
            withCredentials: true,
          });

      setModalOpen(false);
      setEditingUuid(null);
      setForm({ ...EMPTY_FORM });
      setTouched(false);
      setPage(1);
      setRefreshKey((value) => value + 1);

      await successSweetAlert({
        title: uuidBeingEdited ? "Category updated" : "Category created",
        text:
          response.data?.message ||
          (uuidBeingEdited
            ? "Category updated successfully."
            : "Category created successfully."),
        timer: 1700,
        showConfirmButton: false,
      });
    } catch (error) {
      errorSweetAlert({
        title: "Unable to save category",
        text:
          error?.response?.status === 409
            ? "A category with this name already exists."
            : getErrorMessage(error, "Please try again."),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCategory = async (category) => {
    const confirmation = await confirmSweetAlert({
      title: "Delete this category?",
      text: `Remove "${category.name}" from the categories list?`,
      confirmButtonText: "Yes, delete category",
      cancelButtonText: "Cancel",
      confirmButtonClass: "app-swal-deny",
      icon: "warning",
    });
    if (!confirmation?.isConfirmed) return;

    setBusyUuid(category.uuid);
    try {
      const response = await axios.delete(
        `/api/categories/${encodeURIComponent(category.uuid)}`,
        { withCredentials: true },
      );

      if (categories.length === 1 && page > 1) setPage((value) => value - 1);
      else setRefreshKey((value) => value + 1);

      await successSweetAlert({
        title: "Category deleted",
        text: response.data?.message || "Category deleted successfully.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      errorSweetAlert({
        title: "Delete failed",
        text: getErrorMessage(error, "Please try again."),
      });
    } finally {
      setBusyUuid(null);
    }
  };

  const toggleActive = async (category) => {
    const nextStatus = !category.is_active;
    setBusyUuid(category.uuid);
    try {
      const response = await axios.patch(
        `/api/categories/${encodeURIComponent(category.uuid)}/status`,
        { isActive: nextStatus },
        { withCredentials: true },
      );

      setRefreshKey((value) => value + 1);
      await successSweetAlert({
        title: nextStatus ? "Category activated" : "Category deactivated",
        text:
          response.data?.message ||
          `${category.name} is now ${nextStatus ? "active" : "inactive"}.`,
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error) {
      errorSweetAlert({
        title: "Status update failed",
        text: getErrorMessage(error, "Please try again."),
      });
    } finally {
      setBusyUuid(null);
    }
  };

  const clearFilters = useCallback(() => {
    setQuery("");
    setStatusFilter("all");
    setPage(1);
  }, []);

  return (
    <div className="space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#1b7a5a]">
            Transactions
          </p>
          <h1
            className="mt-2 text-4xl font-semibold tracking-tight text-[#14231d]"
            style={DISPLAY}
          >
            Transaction categories<span style={{ color: GOLD }}>.</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5b6b63]">
            Organize transactions with clear categories. Add, edit, activate,
            deactivate, or remove categories.
          </p>
        </div>
        <Button size="lg" onClick={openAddModal}>
          <Plus size={17} style={{ color: GOLD }} /> Add category
        </Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Layers3}
          label="Total categories"
          value={pagination.total}
          note="Matching saved records"
          dark
        />
        <StatCard
          icon={UserRoundCheck}
          label="Active categories"
          value={activeCount}
          note="Active on this page"
        />
        <StatCard
          icon={UserRoundX}
          label="Inactive categories"
          value={inactiveCount}
          note="Inactive on this page"
        />
        <StatCard
          icon={ClipboardList}
          label="Results on page"
          value={categories.length}
          note="Based on current filters"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e3e9e0] bg-white shadow-sm shadow-[#062a20]/[0.03]">
        <div className="flex flex-col gap-4 border-b border-[#eef2ec] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2
              className="text-lg font-semibold text-[#14231d]"
              style={DISPLAY}
            >
              All categories
            </h2>
            <p className="mt-1 text-xs text-[#5b6b63]">
              Search, filter, and manage transaction categories.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_180px]">
            <Input
              wrapperClassName="w-full"
              leadingIcon={Search}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search categories..."
              aria-label="Search categories"
            />
            <Select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value || "all");
                setPage(1);
              }}
              options={STATUS_OPTIONS}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#f4f7f2] text-[10px] font-bold uppercase tracking-[0.14em] text-[#5b6b63]">
                {[
                  "Category",
                  "Description",
                  "Created",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th key={heading} className="px-5 py-3.5">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <Loader size="lg" label="Loading categories..." centered />
                  </td>
                </tr>
              )}
              {!isLoading && loadError && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <p
                      role="alert"
                      className="text-sm font-semibold text-red-700"
                    >
                      {loadError}
                    </p>
                    <button
                      type="button"
                      onClick={() => setRefreshKey((value) => value + 1)}
                      className="mt-3 text-xs font-bold text-[#1b7a5a] hover:underline"
                    >
                      Try again
                    </button>
                  </td>
                </tr>
              )}
              {!isLoading &&
                !loadError &&
                categories.map((category) => (
                  <tr
                    key={category.uuid || category.id}
                    className="group border-t border-[#eef2ec] transition hover:bg-[#f8faf6]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#dcece2] bg-[#edf6f0] text-xs font-bold text-[#1b7a5a]">
                          {initials(category.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#20362b]">
                            {category.name || "Unnamed category"}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#8a968e]">
                            {category.id != null
                              ? `CAT-${String(category.id).padStart(4, "0")}`
                              : "Category"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-sm px-5 py-4 text-sm leading-5 text-[#64736a]">
                      <span className="line-clamp-2">
                        {category.description || "No description provided."}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-[#64736a]">
                      {formatDate(category.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={category.is_active ? "available" : "neutral"}
                      >
                        {category.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <ActionButton
                          label="Edit category"
                          tone="blue"
                          onClick={() => openEditModal(category)}
                          disabled={busyUuid === category.uuid}
                        >
                          <Pencil size={16} />
                        </ActionButton>
                        {/* <ActionButton
                          label={
                            category.is_active
                              ? "Deactivate category"
                              : "Activate category"
                          }
                          tone={category.is_active ? "amber" : "green"}
                          onClick={() => toggleActive(category)}
                          disabled={busyUuid === category.uuid}
                        >
                          {busyUuid === category.uuid ? (
                            <Loader size="xs" label="" />
                          ) : category.is_active ? (
                            <UserRoundX size={16} />
                          ) : (
                            <UserRoundCheck size={16} />
                          )}
                        </ActionButton>
                        <ActionButton
                          label="Delete category"
                          tone="red"
                          onClick={() => deleteCategory(category)}
                          disabled={busyUuid === category.uuid}
                        >
                          {busyUuid === category.uuid ? (
                            <Loader size="xs" label="" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </ActionButton> */}
                      </div>
                    </td>
                  </tr>
                ))}
              {!isLoading && !loadError && categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#edf6f0] text-[#1b7a5a]">
                      <Tag size={20} />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-[#24382d]">
                      No categories found
                    </p>
                    <p className="mt-1 text-xs text-[#78867d]">
                      Try a different search or add a new category.
                    </p>
                    {query || statusFilter !== "all" ? (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-3 text-xs font-bold text-[#1b7a5a] hover:underline"
                      >
                        Clear filters
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={openAddModal}
                        className="mt-3 text-xs font-bold text-[#1b7a5a] hover:underline"
                      >
                        Add category
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#eef2ec] bg-[#fafcf9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-[#5b6b63]">
            Showing{" "}
            <b className="text-[#14231d]">
              {pagination.total ? (page - 1) * PAGE_SIZE + 1 : 0}–
              {Math.min(
                (page - 1) * PAGE_SIZE + categories.length,
                pagination.total,
              )}
            </b>{" "}
            of <b className="text-[#14231d]">{pagination.total}</b> categories
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#5b6b63]">
              Page {pagination.total ? page : 0} of{" "}
              {pagination.total ? totalPages : 0}
            </span>
            <button
              type="button"
              disabled={isLoading || page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              aria-label="Previous page"
              className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe5dc] text-[#0b3d2e] hover:bg-[#f4f7f2] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              disabled={isLoading || !pagination.total || page >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              aria-label="Next page"
              className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe5dc] text-[#0b3d2e] hover:bg-[#f4f7f2] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        size="xl"
        title={editingUuid ? "Edit category" : "Add category"}
        description="Fields marked with * are required."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={closeModal}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" form="category-info-form" disabled={isSaving}>
              {isSaving ? <Loader size="xs" color="#e4c48a" /> : null}
              {isSaving
                ? "Saving..."
                : editingUuid
                  ? "Save changes"
                  : "Create category"}
            </Button>
          </>
        }
      >
        <form
          id="category-info-form"
          onSubmit={submitCategory}
          noValidate
          className="space-y-5"
        >
          <div>
            <Input
              label="Category name"
              required
              value={form.name}
              maxLength={100}
              onBlur={() => setTouched(true)}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="e.g. Office Supplies"
              aria-invalid={Boolean(nameError)}
            />
            <FieldError>{nameError}</FieldError>
            <p className="mt-1.5 text-right text-[10px] text-[#9aa59d]">
              {form.name.length}/100
            </p>
          </div>

          <div>
            <label
              htmlFor="category-description"
              className="mb-2 block text-sm font-semibold text-[#14231d]"
            >
              Description{" "}
              <span className="font-normal text-[#8a958e]">(optional)</span>
            </label>
            <textarea
              id="category-description"
              rows={4}
              maxLength={2000}
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Describe what transactions belong in this category..."
              className="w-full resize-y rounded-xl border border-[#dfe5dc] bg-white px-4 py-3 text-sm leading-5 text-[#14231d] outline-none transition placeholder:text-slate-400 focus:border-[#1b7a5a] focus:ring-4 focus:ring-[#1b7a5a]/15"
            />
            <p className="mt-1.5 text-right text-[10px] text-[#9aa59d]">
              {form.description.length}/2000
            </p>
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#e3e9e0] bg-[#fafcf9] p-4">
            <span className="flex items-center gap-3">
              <span
                className={`grid h-9 w-9 place-items-center rounded-xl ${form.is_active ? "bg-[#e7f5eb] text-[#237449]" : "bg-[#f0f1ef] text-[#69756d]"}`}
              >
                {form.is_active ? <Check size={17} /> : <X size={17} />}
              </span>
              <span>
                <span className="block text-sm font-semibold text-[#263b30]">
                  Active category
                </span>
                <span className="mt-0.5 block text-xs text-[#718078]">
                  {form.is_active
                    ? "Available for use in transactions"
                    : "Hidden from active category choices"}
                </span>
              </span>
            </span>
            <input
              type="checkbox"
              checked={Boolean(form.is_active)}
              onChange={(event) =>
                updateField("is_active", event.target.checked)
              }
              className="h-4 w-4 accent-[#1b7a5a]"
            />
          </label>
        </form>
      </Modal>
    </div>
  );
}
