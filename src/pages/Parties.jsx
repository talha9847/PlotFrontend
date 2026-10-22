import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Users,
  UserRound,
  Building2,
  Plus,
  Search,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Tag,
  UserCheck,
  UserX,
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
const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const PARTIES_ENDPOINT = API_BASE_URL.endsWith("/api")
  ? `${API_BASE_URL}/parties`
  : `${API_BASE_URL}/api/parties`;

const PARTY_TYPES = [
  { value: "driver", label: "Driver" },
  { value: "employee", label: "Employee" },
  { value: "vendor", label: "Vendor" },
  { value: "supplier", label: "Supplier" },
  { value: "landlord", label: "Landlord" },
  { value: "customer", label: "Customer" },
  { value: "broker", label: "Broker" },
  { value: "other", label: "Other" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "All categories" },
  ...PARTY_TYPES,
];
const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const EMPTY_FORM = {
  name: "",
  party_type: "other",
  phone: "",
  email: "",
  address: "",
  notes: "",
  is_active: true,
};

const titleCase = (value = "") =>
  value.charAt(0).toUpperCase() + value.slice(1).replaceAll("_", " ");

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";

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

function Detail({ icon: Icon, children }) {
  if (!children) return null;
  return (
    <p className="flex min-w-0 items-start gap-2 text-xs text-[#5b6b63]">
      <Icon size={14} className="mt-0.5 shrink-0 text-[#1b7a5a]" />
      <span className="break-words">{children}</span>
    </p>
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

export default function Parties() {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
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
  const [touched, setTouched] = useState({});

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const emailError =
    touched.email &&
    form.email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
      ? "Enter a valid email address."
      : "";
  const phoneError =
    touched.phone && !form.phone.trim()
      ? "Phone number is required."
      : touched.phone && form.phone.trim().length > 30
        ? "Phone number must be 30 characters or fewer."
        : "";
  const nameError =
    touched.name && !form.name.trim()
      ? "Name is required."
      : touched.name && form.name.trim().length > 160
        ? "Name must be 160 characters or fewer."
        : "";

  useEffect(() => {
    const controller = new AbortController();
    let debounceId;

    const loadParties = async () => {
      setIsLoading(true);
      setLoadError("");

      const params = {
        page,
        limit: PAGE_SIZE,
        ...(query.trim() ? { search: query.trim() } : {}),
        ...(typeFilter !== "all" ? { partyType: typeFilter } : {}),
        ...(statusFilter !== "all"
          ? { isActive: statusFilter === "active" }
          : {}),
      };

      try {
        const response = await axios.get("/api/parties", {
          params,
          withCredentials: true,
          signal: controller.signal,
        });

        const payload = response.data;
        const rows = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.data?.parties)
            ? payload.data.parties
            : [];

        const pageInfo = payload?.pagination || payload?.data?.pagination;
        setParties(rows);
        setPagination({
          page: pageInfo?.page ?? page,
          limit: pageInfo?.limit ?? PAGE_SIZE,
          total: pageInfo?.total ?? 0,
          totalPages: pageInfo?.totalPages ?? 0,
        });
      } catch (error) {
        if (!axios.isCancel(error) && error.code !== "ERR_CANCELED") {
          setLoadError(
            error.response?.data?.message ||
              error.message ||
              "Unable to load parties.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    // Debounce free-text search; filters and page changes use the same request path.
    debounceId = setTimeout(loadParties, query.trim() ? 250 : 0);
    return () => {
      clearTimeout(debounceId);
      controller.abort();
    };
  }, [query, typeFilter, statusFilter, page, refreshKey]);

  const activeCount = parties.filter((party) => party.is_active).length;
  const organizationCount = parties.filter((party) =>
    ["vendor", "supplier", "landlord", "broker"].includes(party.party_type),
  ).length;
  const inactiveCount = parties.filter((party) => !party.is_active).length;
  const totalPages = Math.max(1, pagination.totalPages || 1);
  const visibleParties = parties;

  const openAddModal = () => {
    setEditingUuid(null);
    setForm({ ...EMPTY_FORM });
    setTouched({});
    setModalOpen(true);
  };

  const openEditModal = (party) => {
    setEditingUuid(party.uuid);
    setForm({
      name: party.name ?? "",
      party_type: party.party_type ?? "other",
      phone: party.phone ?? "",
      email: party.email ?? "",
      address: party.address ?? "",
      notes: party.notes ?? "",
      is_active: Boolean(party.is_active),
    });
    setTouched({});
    setModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setModalOpen(false);
    setEditingUuid(null);
    setForm({ ...EMPTY_FORM });
    setTouched({});
  };

  const submitParty = async (event) => {
    event.preventDefault();
    setTouched({ name: true, phone: true, email: true });

    const name = form.name.trim();
    const phone = form.phone.trim();
    const email = form.email.trim();

    if (!name || name.length > 160) {
      errorSweetAlert({
        title: "Check party name",
        text: "Enter a name of up to 160 characters.",
      });
      return;
    }
    if (!phone || phone.length > 30) {
      errorSweetAlert({
        title: "Check phone number",
        text: "A phone number of up to 30 characters is required.",
      });
      return;
    }
    if (
      email &&
      (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    ) {
      errorSweetAlert({
        title: "Invalid email",
        text: "Please enter a valid email address.",
      });
      return;
    }

    const payload = {
      name,
      phone,
      email: email || null,
      partyType: form.party_type || "other",
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
      isActive: Boolean(form.is_active),
    };

    setIsSaving(true);
    try {
      const response = editingUuid
        ? await axios.patch(
            `/api/parties/${encodeURIComponent(editingUuid)}`,
            payload,
            { withCredentials: true },
          )
        : await axios.post("/api/parties", payload, {
            withCredentials: true,
          });

      const result = response.data || {};

      setModalOpen(false);
      setEditingUuid(null);
      setForm({ ...EMPTY_FORM });
      setTouched({});
      setPage(1);
      setRefreshKey((value) => value + 1);
      await successSweetAlert({
        title: editingUuid ? "Party updated" : "Party created",
        text:
          result.message ||
          (editingUuid
            ? "Party updated successfully."
            : "Party created successfully."),
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      errorSweetAlert({
        title: "Unable to save party",
        text:
          error.response?.status === 409
            ? "This phone number is already used by another party."
            : error.response?.data?.message ||
              error.message ||
              "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async (party) => {
    const confirmation = await confirmSweetAlert({
      title: "Delete this party?",
      text: `Remove ${party.name} from the directory? This will soft-delete the record.`,
      confirmButtonText: "Yes, delete party",
      cancelButtonText: "Cancel",
      confirmButtonClass: "app-swal-deny",
      icon: "warning",
    });

    if (!confirmation.isConfirmed) return;

    setBusyUuid(party.uuid);
    try {
      const response = await axios.delete(
        `/api/parties/${encodeURIComponent(party.uuid)}`,
        { withCredentials: true },
      );
      const result = response.data || {};

      if (parties.length === 1 && page > 1) setPage((value) => value - 1);
      else setRefreshKey((value) => value + 1);

      await successSweetAlert({
        title: "Party deleted",
        text: result.message || "Party deleted successfully.",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      errorSweetAlert({
        title: "Delete failed",
        text:
          error.response?.data?.message || error.message || "Please try again.",
      });
    } finally {
      setBusyUuid(null);
    }
  };

  const toggleActive = async (party) => {
    const nextStatus = !party.is_active;
    setBusyUuid(party.uuid);
    try {
      const response = await axios.patch(
        `/api/parties/${encodeURIComponent(party.uuid)}/status`,
        { isActive: nextStatus },
        { withCredentials: true },
      );
      const result = response.data || {};
      setRefreshKey((value) => value + 1);
      await successSweetAlert({
        title: nextStatus ? "Party activated" : "Party deactivated",
        text: result.message || "Party status updated successfully.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      errorSweetAlert({
        title: "Status update failed",
        text:
          error.response?.data?.message || error.message || "Please try again.",
      });
    } finally {
      setBusyUuid(null);
    }
  };

  return (
    <div className="space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#1b7a5a]">
            Relationships
          </p>
          <h1
            className="mt-2 text-4xl font-semibold tracking-tight text-[#14231d]"
            style={DISPLAY}
          >
            Parties directory<span style={{ color: GOLD }}>.</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5b6b63]">
            Manage drivers, employees, vendors, suppliers, customers and other
            contacts in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate("categories")}
          >
            <Tag size={16} /> Categories
          </Button>
          <Button size="lg" onClick={openAddModal}>
            <Plus size={17} style={{ color: GOLD }} /> Add party
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total parties"
          value={pagination.total}
          note="Matching saved records"
          dark
        />
        <StatCard
          icon={UserCheck}
          label="Active parties"
          value={activeCount}
          note="Active on this page"
        />
        <StatCard
          icon={Building2}
          label="Business contacts"
          value={organizationCount}
          note="Business contacts on this page"
        />
        <StatCard
          icon={UserX}
          label="Inactive parties"
          value={inactiveCount}
          note="Inactive on this page"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e3e9e0] bg-white shadow-sm shadow-[#062a20]/[0.03]">
        <div className="flex flex-col gap-4 border-b border-[#eef2ec] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2
              className="text-lg font-semibold text-[#14231d]"
              style={DISPLAY}
            >
              All parties
            </h2>
            <p className="mt-1 text-xs text-[#5b6b63]">
              Search, filter and manage your saved contacts
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(240px,1fr)_180px_160px]">
            <Input
              wrapperClassName="w-full"
              leadingIcon={Search}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search name, phone, email..."
              aria-label="Search parties"
            />
            <Select
              aria-label="Filter by party category"
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value || "all");
                setPage(1);
              }}
              options={TYPE_OPTIONS}
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
          <table className="w-full min-w-[1000px] table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[235px]" />
              <col className="w-[125px]" />
              <col className="w-[190px]" />
              <col className="w-[210px]" />
              <col className="w-[110px]" />
              <col className="w-[170px]" />
            </colgroup>
            <thead>
              <tr className="bg-[#f4f7f2] text-[10px] font-bold uppercase tracking-[0.14em] text-[#5b6b63]">
                {[
                  "Party",
                  "Category",
                  "Contact",
                  "Address",
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
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Loader size="lg" label="Loading parties..." centered />
                  </td>
                </tr>
              )}
              {!isLoading && loadError && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className="text-sm font-semibold text-red-700">
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
                visibleParties.map((party) => (
                  <tr
                    key={party.uuid}
                    className="group border-t border-[#eef2ec] transition hover:bg-[#f8faf6]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0b3d2e] text-[11px] font-extrabold ring-2 ring-[#e4c48a]/40"
                          style={{ color: GOLD }}
                        >
                          {initials(party.name)}
                        </span>
                        <div className="min-w-0">
                          <p
                            className="truncate font-bold text-[#14231d]"
                            title={party.name}
                          >
                            {party.name}
                          </p>
                          <p className="mt-0.5 text-xs text-[#8a958e]">
                            Added {formatDate(party.created_at)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={
                          party.party_type === "customer" ? "available" : "info"
                        }
                      >
                        {titleCase(party.party_type || "other")}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1.5">
                        <Detail icon={Phone}>{party.phone}</Detail>
                        <Detail icon={Mail}>{party.email}</Detail>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Detail icon={MapPin}>
                        {party.address || "Address not added"}
                      </Detail>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={party.is_active ? "available" : "neutral"}
                      >
                        {party.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(party)}
                          aria-label={`Edit ${party.name}`}
                          title="Edit party"
                          className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        >
                          <Pencil size={16} />
                        </button>
                        {/* <button
                          type="button"
                          disabled={busyUuid === party.uuid}
                          onClick={() => toggleActive(party)}
                          aria-label={`${party.is_active ? "Deactivate" : "Activate"} ${party.name}`}
                          title={
                            party.is_active
                              ? "Deactivate party"
                              : "Activate party"
                          }
                          className={`grid h-9 w-9 place-items-center rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${
                            party.is_active
                              ? "border-amber-200 bg-white text-amber-700 hover:bg-amber-50 focus:ring-amber-500"
                              : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 focus:ring-emerald-500"
                          }`}
                        >
                          {busyUuid === party.uuid ? (
                            <Loader size="xs" label="" />
                          ) : party.is_active ? (
                            <UserX size={16} />
                          ) : (
                            <UserCheck size={16} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDelete(party)}
                          disabled={busyUuid === party.uuid}
                          aria-label={`Delete ${party.name}`}
                          title="Delete party"
                          className="grid h-9 w-9 place-items-center rounded-xl border border-red-200 bg-white text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busyUuid === party.uuid ? (
                            <Loader size="xs" label="" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button> */}
                      </div>
                    </td>
                  </tr>
                ))}
              {!isLoading && !loadError && visibleParties.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f3ee] text-[#1b7a5a]">
                      <Search size={20} />
                    </span>
                    <p className="mt-4 text-sm font-bold text-[#14231d]">
                      No parties found
                    </p>
                    <p className="mt-1 text-xs text-[#5b6b63]">
                      Try another search term or change the filters.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setTypeFilter("all");
                        setStatusFilter("all");
                        setPage(1);
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

        <div className="flex flex-col gap-3 border-t border-[#eef2ec] bg-[#fafcf9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-[#5b6b63]">
            Showing{" "}
            <b className="text-[#14231d]">
              {pagination.total ? (page - 1) * PAGE_SIZE + 1 : 0}–
              {Math.min(
                (page - 1) * PAGE_SIZE + parties.length,
                pagination.total,
              )}
            </b>{" "}
            of <b className="text-[#14231d]">{pagination.total}</b> parties
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
              className="rounded-lg border border-[#dfe5dc] px-3 py-2 text-xs font-bold text-[#0b3d2e] hover:bg-[#f4f7f2] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={isLoading || !pagination.total || page >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              className="rounded-lg border border-[#dfe5dc] px-3 py-2 text-xs font-bold text-[#0b3d2e] hover:bg-[#f4f7f2] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        size="xl"
        title={editingUuid ? "Edit party" : "Add party"}
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
            <Button type="submit" form="party-info-form" disabled={isSaving}>
              {isSaving ? <Loader size="xs" color="#e4c48a" /> : null}
              {isSaving
                ? "Saving..."
                : editingUuid
                  ? "Save changes"
                  : "Add party"}
            </Button>
          </>
        }
      >
        <form
          id="party-info-form"
          onSubmit={submitParty}
          noValidate
          className="space-y-6"
        >
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e9f3ee] text-[#1b7a5a]">
                <UserRound size={16} />
              </span>
              <h3 className="text-sm font-bold text-[#14231d]">
                Basic information
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Input
                  label="Party name"
                  required
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Full name or organization"
                  aria-invalid={Boolean(nameError)}
                />
                <FieldError>{nameError}</FieldError>
              </div>
              <Select
                label="Party category"
                required
                value={form.party_type}
                onChange={(event) =>
                  updateField("party_type", event.target.value)
                }
                options={PARTY_TYPES}
              />
              <div>
                <Input
                  label="Phone number"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  aria-invalid={Boolean(phoneError)}
                />
                <FieldError>{phoneError}</FieldError>
                <p className="mt-1 text-xs text-[#8a958e]">
                  Phone number is required and must be unique.
                </p>
              </div>
              <div>
                <Input
                  label="Email address"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="name@example.com"
                  aria-invalid={Boolean(emailError)}
                />
                <FieldError>{emailError}</FieldError>
              </div>
            </div>
          </section>
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e9f3ee] text-[#1b7a5a]">
                <MapPin size={16} />
              </span>
              <h3 className="text-sm font-bold text-[#14231d]">
                Address and notes
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="party-address"
                  className="mb-2 block text-sm font-semibold text-[#14231d]"
                >
                  Address
                </label>
                <textarea
                  id="party-address"
                  rows={2}
                  value={form.address}
                  onChange={(event) =>
                    updateField("address", event.target.value)
                  }
                  placeholder="Street, area, city, state..."
                  className="block w-full rounded-xl border border-[#dfe5dc] bg-white px-4 py-3 text-sm text-[#14231d] outline-none transition placeholder:text-slate-400 focus:border-[#1b7a5a] focus:ring-4 focus:ring-[#1b7a5a]/15"
                />
              </div>
              <div>
                <label
                  htmlFor="party-notes"
                  className="mb-2 block text-sm font-semibold text-[#14231d]"
                >
                  Notes
                </label>
                <textarea
                  id="party-notes"
                  rows={3}
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  placeholder="Optional notes about this party"
                  className="block w-full rounded-xl border border-[#dfe5dc] bg-white px-4 py-3 text-sm text-[#14231d] outline-none transition placeholder:text-slate-400 focus:border-[#1b7a5a] focus:ring-4 focus:ring-[#1b7a5a]/15"
                />
              </div>
            </div>
          </section>
          <section className="rounded-xl border border-[#e3e9e0] bg-[#fafcf9] p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={Boolean(form.is_active)}
                onChange={(event) =>
                  updateField("is_active", event.target.checked)
                }
                className="mt-1 h-4 w-4 accent-[#0b3d2e]"
              />
              <span>
                <span className="block text-sm font-bold text-[#14231d]">
                  Active party
                </span>
                <span className="mt-1 block text-xs leading-5 text-[#5b6b63]">
                  Inactive parties remain in the directory but are marked as
                  inactive.
                </span>
              </span>
            </label>
          </section>
        </form>
      </Modal>
    </div>
  );
}
