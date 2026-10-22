import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
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
import {
  confirmSweetAlert,
  successSweetAlert,
  errorSweetAlert,
} from "../components/common/SweetAlert";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };
const GOLD = "#e4c48a";
const PAGE_SIZE = 8;

const INITIAL_CATEGORIES = [
  {
    id: 1,
    uuid: "cat-sales-001",
    name: "Sales",
    description: "Income from products and services sold.",
    is_active: true,
    created_at: "2026-01-12T10:15:00.000Z",
    updated_at: "2026-01-12T10:15:00.000Z",
  },
  {
    id: 2,
    uuid: "cat-purchase-002",
    name: "Purchases",
    description: "Goods and services purchased for business operations.",
    is_active: true,
    created_at: "2026-01-15T09:30:00.000Z",
    updated_at: "2026-01-15T09:30:00.000Z",
  },
  {
    id: 3,
    uuid: "cat-expenses-003",
    name: "Operating Expenses",
    description: "Day-to-day costs required to run the business.",
    is_active: true,
    created_at: "2026-02-01T08:00:00.000Z",
    updated_at: "2026-02-01T08:00:00.000Z",
  },
  {
    id: 4,
    uuid: "cat-transport-004",
    name: "Transport & Fuel",
    description: "Vehicle running costs, fuel, tolls and transportation.",
    is_active: true,
    created_at: "2026-02-06T12:20:00.000Z",
    updated_at: "2026-02-06T12:20:00.000Z",
  },
  {
    id: 5,
    uuid: "cat-rent-005",
    name: "Rent & Utilities",
    description: "Rent, electricity, water, internet and utility bills.",
    is_active: true,
    created_at: "2026-02-10T11:45:00.000Z",
    updated_at: "2026-02-10T11:45:00.000Z",
  },
  {
    id: 6,
    uuid: "cat-salaries-006",
    name: "Salaries & Wages",
    description: "Employee salaries, wages, incentives and allowances.",
    is_active: true,
    created_at: "2026-03-02T10:00:00.000Z",
    updated_at: "2026-03-02T10:00:00.000Z",
  },
  {
    id: 7,
    uuid: "cat-maintenance-007",
    name: "Repairs & Maintenance",
    description: "Maintenance, servicing and repair costs.",
    is_active: false,
    created_at: "2026-03-09T14:10:00.000Z",
    updated_at: "2026-03-09T14:10:00.000Z",
  },
  {
    id: 8,
    uuid: "cat-office-008",
    name: "Office Supplies",
    description: "Stationery, office equipment and consumables.",
    is_active: true,
    created_at: "2026-03-14T09:15:00.000Z",
    updated_at: "2026-03-14T09:15:00.000Z",
  },
  {
    id: 9,
    uuid: "cat-fees-009",
    name: "Bank & Processing Fees",
    description: "Bank charges, payment gateway and transaction fees.",
    is_active: true,
    created_at: "2026-04-04T16:30:00.000Z",
    updated_at: "2026-04-04T16:30:00.000Z",
  },
  {
    id: 10,
    uuid: "cat-misc-010",
    name: "Miscellaneous",
    description: "Transactions that do not fit another category.",
    is_active: false,
    created_at: "2026-04-18T13:00:00.000Z",
    updated_at: "2026-04-18T13:00:00.000Z",
  },
];

const EMPTY_FORM = { name: "", description: "", is_active: true };

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
            className={`text-[11px] font-bold uppercase tracking-[0.14em] ${dark ? "text-white/60" : "text-[#5b6b63]"}`}
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
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${dark ? "text-[#062a20]" : "bg-[#e9f3ee] text-[#1b7a5a]"}`}
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

export default function Categories() {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUuid, setEditingUuid] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [touched, setTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [busyUuid, setBusyUuid] = useState(null);

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return categories.filter((category) => {
      const matchesQuery =
        !normalizedQuery ||
        category.name.toLowerCase().includes(normalizedQuery) ||
        (category.description || "").toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? category.is_active : !category.is_active);
      return matchesQuery && matchesStatus;
    });
  }, [categories, query, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / PAGE_SIZE),
  );
  const safePage = Math.min(page, totalPages);
  const visibleCategories = filteredCategories.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );
  const activeCount = categories.filter((item) => item.is_active).length;
  const inactiveCount = categories.length - activeCount;
  const nameError = touched
    ? !form.name.trim()
      ? "Category name is required."
      : form.name.trim().length > 100
        ? "Category name must be 100 characters or fewer."
        : categories.some(
              (item) =>
                item.name.trim().toLowerCase() ===
                  form.name.trim().toLowerCase() && item.uuid !== editingUuid,
            )
          ? "A category with this name already exists."
          : ""
    : "";

  const openAddModal = () => {
    setEditingUuid(null);
    setForm({ ...EMPTY_FORM });
    setTouched(false);
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingUuid(category.uuid);
    setForm({
      name: category.name || "",
      description: category.description || "",
      is_active: Boolean(category.is_active),
    });
    setTouched(false);
    setModalOpen(true);
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
    if (
      !name ||
      name.length > 100 ||
      categories.some(
        (item) =>
          item.name.trim().toLowerCase() === name.toLowerCase() &&
          item.uuid !== editingUuid,
      )
    ) {
      return;
    }

    setIsSaving(true);
    const now = new Date().toISOString();
    if (editingUuid) {
      setCategories((current) =>
        current.map((item) =>
          item.uuid === editingUuid
            ? {
                ...item,
                name,
                description: form.description.trim(),
                is_active: Boolean(form.is_active),
                updated_at: now,
              }
            : item,
        ),
      );
    } else {
      setCategories((current) => [
        {
          id: Math.max(0, ...current.map((item) => item.id)) + 1,
          uuid: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name,
          description: form.description.trim(),
          is_active: Boolean(form.is_active),
          created_at: now,
          updated_at: now,
        },
        ...current,
      ]);
      setPage(1);
    }
    setIsSaving(false);
    setModalOpen(false);
    setEditingUuid(null);
    setForm({ ...EMPTY_FORM });
    setTouched(false);
    await successSweetAlert({
      title: editingUuid ? "Category updated" : "Category created",
      text: editingUuid
        ? "Category updated successfully."
        : "Category created successfully.",
      timer: 1600,
      showConfirmButton: false,
    });
  };

  const deleteCategory = async (category) => {
    const confirmation = await confirmSweetAlert({
      title: "Delete this category?",
      text: `Remove “${category.name}” from the categories list? This demo uses static data, so the change will remain only until the page is refreshed.`,
      confirmButtonText: "Yes, delete category",
      cancelButtonText: "Cancel",
      confirmButtonClass: "app-swal-deny",
      icon: "warning",
    });
    if (!confirmation.isConfirmed) return;
    setBusyUuid(category.uuid);
    setCategories((current) =>
      current.filter((item) => item.uuid !== category.uuid),
    );
    if (visibleCategories.length === 1 && safePage > 1)
      setPage((current) => current - 1);
    setBusyUuid(null);
    await successSweetAlert({
      title: "Category deleted",
      text: "Category deleted from the static list.",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const toggleActive = async (category) => {
    const nextStatus = !category.is_active;
    setCategories((current) =>
      current.map((item) =>
        item.uuid === category.uuid
          ? {
              ...item,
              is_active: nextStatus,
              updated_at: new Date().toISOString(),
            }
          : item,
      ),
    );
    await successSweetAlert({
      title: nextStatus ? "Category activated" : "Category deactivated",
      text: `${category.name} is now ${nextStatus ? "active" : "inactive"}.`,
      timer: 1300,
      showConfirmButton: false,
    });
  };

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
            deactivate or remove categories.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0b3d2e] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#14543f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1b7a5a] focus-visible:ring-offset-2"
        >
          <Plus size={17} style={{ color: GOLD }} /> Add category
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Layers3}
          label="Total categories"
          value={categories.length}
          note="All saved categories"
          dark
        />
        <StatCard
          icon={UserRoundCheck}
          label="Active categories"
          value={activeCount}
          note="Available for transactions"
        />
        <StatCard
          icon={UserRoundX}
          label="Inactive categories"
          value={inactiveCount}
          note="Not currently available"
        />
        <StatCard
          icon={ClipboardList}
          label="Filtered results"
          value={filteredCategories.length}
          note="Based on current filters"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e3e9e0] bg-white shadow-sm shadow-[#062a20]/[0.03]">
        <div className="flex flex-col gap-4 border-b border-[#edf0eb] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2
              className="text-lg font-semibold text-[#14231d]"
              style={DISPLAY}
            >
              All categories
            </h2>
            <p className="mt-1 text-xs text-[#718078]">
              Search and manage your transaction categories.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative block sm:w-72">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#849188]"
              />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search categories..."
                aria-label="Search categories"
                className="h-11 w-full rounded-xl border border-[#dfe7df] bg-[#fbfcfa] pl-9 pr-3 text-sm text-[#14231d] outline-none transition placeholder:text-[#9aa59d] focus:border-[#1b7a5a] focus:ring-2 focus:ring-[#1b7a5a]/10"
              />
            </label>
            <label className="relative block sm:w-44">
              <ArrowDownUp
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#849188]"
              />
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                aria-label="Filter by status"
                className="h-11 w-full appearance-none rounded-xl border border-[#dfe7df] bg-[#fbfcfa] pl-9 pr-3 text-sm text-[#33453b] outline-none focus:border-[#1b7a5a] focus:ring-2 focus:ring-[#1b7a5a]/10"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="bg-[#f8faf7] text-[10px] font-bold uppercase tracking-[0.13em] text-[#78867d]">
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Description</th>
                <th className="px-5 py-4">Created</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf0eb]">
              {visibleCategories.map((category) => (
                <tr
                  key={category.uuid}
                  className="group transition hover:bg-[#fbfcfa]"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#dcece2] bg-[#edf6f0] text-xs font-bold text-[#1b7a5a]">
                        {initials(category.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#20362b]">
                          {category.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#8a968e]">
                          CAT-{String(category.id).padStart(4, "0")}
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
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${category.is_active ? "bg-[#e7f5eb] text-[#237449]" : "bg-[#f0f1ef] text-[#69756d]"}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${category.is_active ? "bg-[#2c9a5b]" : "bg-[#9aa39b]"}`}
                      />
                      {category.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <ActionButton
                        label="Edit category"
                        tone="blue"
                        onClick={() => openEditModal(category)}
                      >
                        <Pencil size={16} />
                      </ActionButton>
                      <ActionButton
                        label={
                          category.is_active
                            ? "Deactivate category"
                            : "Activate category"
                        }
                        tone={category.is_active ? "amber" : "green"}
                        onClick={() => toggleActive(category)}
                        disabled={busyUuid === category.uuid}
                      >
                        {category.is_active ? (
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
                        <Trash2 size={16} />
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))}
              {!visibleCategories.length && (
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
                    <button
                      type="button"
                      onClick={openAddModal}
                      className="mt-4 text-sm font-semibold text-[#1b7a5a] hover:underline"
                    >
                      Add category
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#edf0eb] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#718078]">
            Showing{" "}
            <span className="font-semibold text-[#33453b]">
              {filteredCategories.length ? (safePage - 1) * PAGE_SIZE + 1 : 0}–
              {Math.min(safePage * PAGE_SIZE, filteredCategories.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-[#33453b]">
              {filteredCategories.length}
            </span>{" "}
            categories
          </p>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={safePage <= 1}
              aria-label="Previous page"
              className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe7df] text-[#52645a] transition hover:bg-[#f4f8f3] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={17} />
            </button>
            <span className="min-w-16 text-center text-xs font-medium text-[#52645a]">
              Page {safePage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={safePage >= totalPages}
              aria-label="Next page"
              className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe7df] text-[#52645a] transition hover:bg-[#f4f8f3] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#071d15]/55 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
            className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-[#e3e9e0] bg-white shadow-2xl shadow-[#062a20]/20"
          >
            <div className="flex items-start justify-between border-b border-[#edf0eb] px-6 py-5">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#1b7a5a]">
                  Category details
                </p>
                <h2
                  id="category-modal-title"
                  className="mt-1 text-2xl font-semibold text-[#14231d]"
                  style={DISPLAY}
                >
                  {editingUuid ? "Edit category" : "Add category"}
                </h2>
                <p className="mt-1 text-xs text-[#718078]">
                  Enter a name and an optional description.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close dialog"
                className="grid h-9 w-9 place-items-center rounded-xl text-[#6f7c73] transition hover:bg-[#f2f5f1] hover:text-[#20362b]"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitCategory} noValidate>
              <div className="space-y-5 px-6 py-6">
                <div>
                  <label
                    htmlFor="category-name"
                    className="mb-2 block text-xs font-bold text-[#33453b]"
                  >
                    Category name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="category-name"
                    autoFocus
                    maxLength={100}
                    value={form.name}
                    onBlur={() => setTouched(true)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="e.g. Office Supplies"
                    aria-invalid={Boolean(nameError)}
                    className={`h-11 w-full rounded-xl border bg-[#fbfcfa] px-3.5 text-sm text-[#20362b] outline-none transition placeholder:text-[#9aa59d] focus:ring-2 ${nameError ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-[#dfe7df] focus:border-[#1b7a5a] focus:ring-[#1b7a5a]/10"}`}
                  />
                  {nameError && (
                    <p
                      role="alert"
                      className="mt-1.5 text-xs font-medium text-red-600"
                    >
                      {nameError}
                    </p>
                  )}
                  <p className="mt-1.5 text-right text-[10px] text-[#9aa59d]">
                    {form.name.length}/100
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="category-description"
                    className="mb-2 block text-xs font-bold text-[#33453b]"
                  >
                    Description{" "}
                    <span className="font-normal text-[#8a968e]">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    id="category-description"
                    rows={4}
                    maxLength={2000}
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Describe what transactions belong in this category..."
                    className="w-full resize-y rounded-xl border border-[#dfe7df] bg-[#fbfcfa] px-3.5 py-3 text-sm leading-5 text-[#20362b] outline-none transition placeholder:text-[#9aa59d] focus:border-[#1b7a5a] focus:ring-2 focus:ring-[#1b7a5a]/10"
                  />
                </div>
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#e3e9e0] bg-[#fbfcfa] p-4">
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
                    checked={form.is_active}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        is_active: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-[#1b7a5a]"
                  />
                </label>
                <p className="rounded-lg bg-[#f8faf7] px-3 py-2 text-[11px] leading-5 text-[#718078]">
                  Static demo: changes are kept in page state and will reset
                  when the page is refreshed.
                </p>
              </div>
              <div className="flex flex-col-reverse gap-2 border-t border-[#edf0eb] bg-[#fbfcfa] px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-[#dfe7df] bg-white px-4 text-sm font-semibold text-[#52645a] transition hover:bg-[#f4f8f3] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0b3d2e] px-5 text-sm font-semibold text-white transition hover:bg-[#14543f] disabled:cursor-wait disabled:opacity-60"
                >
                  <CircleDollarSign size={16} style={{ color: GOLD }} />
                  {isSaving
                    ? "Saving..."
                    : editingUuid
                      ? "Save changes"
                      : "Create category"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
