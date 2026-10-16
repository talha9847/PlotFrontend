import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CheckCircle,
  Clock3,
  IndianRupee,
  MapPin,
  Search,
  UserRound,
  XCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Wallet,
} from "lucide-react";
import axios from "axios";

import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import { useToast } from "../components/common/Toast";
import {
  confirmSweetAlert,
  successSweetAlert,
} from "../components/common/SweetAlert";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };
const GOLD = "#e4c48a";

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "reserved", label: "Reserved" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
  { value: "refunded", label: "Refunded" },
];

const TABS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
  { value: "all", label: "All bookings" },
];

const STATUS_OPTIONS = [{ value: "all", label: "All statuses" }, ...STATUSES];

const SORT_OPTIONS = [
  { value: "created_at:desc", label: "Newest first" },
  { value: "created_at:asc", label: "Oldest first" },
  { value: "booking_date:desc", label: "Booking date: newest" },
  { value: "booking_date:asc", label: "Booking date: oldest" },
  { value: "booking_number:asc", label: "Booking number: A–Z" },
  { value: "total_amount:desc", label: "Amount: highest first" },
  { value: "total_amount:asc", label: "Amount: lowest first" },
  { value: "customer_name:asc", label: "Customer: A–Z" },
  { value: "project_name:asc", label: "Project: A–Z" },
];

const EMPTY_STATS = {
  total: 0,
  pending: 0,
  reserved: 0,
  confirmed: 0,
  cancelled: 0,
  completed: 0,
  refunded: 0,
};

const EMPTY_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "—";

  // Handles both YYYY-MM-DD and ISO date strings from PostgreSQL.
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

const titleCase = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

const getBadgeVariant = (status) => {
  const variants = {
    pending: "pending",
    reserved: "reserved",
    confirmed: "info",
    cancelled: "danger",
    completed: "available",
    refunded: "warning",
  };

  return variants[status] || "default";
};

function StatCard({ icon: Icon, label, value, dark = false }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        dark
          ? "border-transparent bg-[#0b3d2e] text-white"
          : "border-[#e3e9e0] bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
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

function DetailLine({ icon: Icon, children }) {
  return (
    <p className="flex min-w-0 items-start gap-2 text-xs text-[#5b6b63]">
      <Icon size={14} className="mt-0.5 shrink-0 text-[#1b7a5a]" />
      <span className="break-words">{children || "—"}</span>
    </p>
  );
}

export default function Bookings() {
  const toast = useToast();

  const [confirmErrors, setConfirmErrors] = useState({});
  const FREQUENCIES = [
    "weekly",
    "monthly",
    "quarterly",
    "half_yearly",
    "yearly",
    "milestone",
    "custom",
  ];
  const PLAN_STATUSES = ["active", "completed", "cancelled"];

  const formatINRInput = (value) => {
    if (value === "" || value == null) return "";

    const number = Number(value);

    if (!Number.isFinite(number)) return "";

    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
    }).format(number);
  };
  const isValidDate = (value) => {
    if (!value) return false;

    // HTML date input returns YYYY-MM-DD
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (!match) return false;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(year, month - 1, day);

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const validateConfirmField = (name, value, form = confirmForm) => {
    const totalAmount = Number(confirmingBooking?.total_amount);

    switch (name) {
      case "down_payment": {
        if (value === "") return "Down payment is required.";

        const amount = Number(value);

        if (!Number.isFinite(amount) || amount <= 0) {
          return "Down payment must be greater than 0.";
        }

        if (amount > totalAmount) {
          return "Down payment cannot exceed the total amount.";
        }

        return "";
      }

      case "installment_count": {
        if (value === "") return "Number of installments is required.";

        const count = Number(value);

        if (!Number.isInteger(count) || count <= 0) {
          return "Enter a positive whole number.";
        }

        return "";
      }

      case "status":
        return PLAN_STATUSES.includes(value)
          ? ""
          : "Select a valid plan status.";
      case "frequency":
        return FREQUENCIES.includes(value)
          ? ""
          : "Select a valid plan frequency.";

      case "start_date":
        if (!value) return "Payment date is required.";
        return isValidDate(value) ? "" : "Enter a valid payment date.";

      case "start_date":
        if (!value) return "Installment start date is required.";
        if (!isValidDate(value)) return "Enter a valid start date.";

        if (isValidDate(form.start_date) && value < form.start_date) {
          return "Start date cannot be before the payment date.";
        }

        return "";

      case "notes":
        return String(value ?? "").length > 2000
          ? "Notes cannot exceed 2,000 characters."
          : "";

      default:
        return "";
    }
  };

  const handleConfirmFieldChange = (name, value) => {
    const updatedForm = {
      ...confirmForm,
      [name]: value,
    };

    setConfirmForm(updatedForm);

    setConfirmErrors((current) => ({
      ...current,
      [name]: validateConfirmField(name, value, updatedForm),
    }));
  };
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);

  const [activeTab, setActiveTab] = useState("pending");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("created_at:desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmingBooking, setConfirmingBooking] = useState(null);
  const [confirmForm, setConfirmForm] = useState({
    down_payment: "",
    installment_count: "24",
    frequency: "monthly",
    start_date: "",
    status: "active",
    notes: "",
    lead_id: "",
  });
  const [savingConfirmation, setSavingConfirmation] = useState(false);

  const openConfirmModal = (booking) => {
    console.log(booking);
    setConfirmingBooking(booking);

    setConfirmForm({
      ...confirmForm,
      lead_id: booking.lead_id,
    });

    setConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    if (savingConfirmation) return;

    setConfirmModalOpen(false);
    setConfirmingBooking(null);
  };

  const handleConfirmBooking = async (event) => {
    event.preventDefault();

    if (!confirmingBooking || savingConfirmation) return;

    const fields = [
      "lead_id",
      "down_payment",
      "installment_count",
      "frequency",
      "start_date",
      "status",
      "notes",
    ];

    const errors = {};

    fields.forEach((name) => {
      const error = validateConfirmField(name, confirmForm[name], confirmForm);

      if (error) errors[name] = error;
    });

    setConfirmErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast("Please fix the validation errors.", "error");
      return;
    }
    try {
      setSavingConfirmation(true);

      const res = await axios.post(
        `/api/bookings/confirm/${confirmingBooking.uuid}`,
        {
          down_payment: confirmForm.down_payment,
          installment_count: confirmForm.installment_count,
          frequency: confirmForm.frequency,
          start_date: confirmForm.start_date,
          status: confirmForm.status,
          notes: confirmForm.notes,
        },
        {
          withCredentials: true,
        },
      );
      if (res.status == 201 || res.status == 200) {
        await fetchBookings();
        toast(
          res.data?.message || "Booking confirmed successfully.",
          "success",
        );
        setConfirmModalOpen(false);
        setConfirmingBooking(null);
        setConfirmErrors({});

        // Reset the confirmation form if you have a shared initial state.
        setConfirmForm({
          down_payment: "",
          installment_count: "24",
          frequency: "monthly",
          start_date: "",
          status: "active",
          notes: "",
          lead_id: "",
        });
        // Refresh the bookings list.
      }
    } catch (error) {
      console.error("Confirm booking error:", error);

      toast(
        error.response?.data?.message ||
          "Failed to confirm booking. Please try again.",
        "error",
      );
    } finally {
      setSavingConfirmation(false);
    }
  };

  const handleCancelBooking = async (booking) => {
    const result = await confirmSweetAlert({
      title: "Cancel booking?",
      text: `Are you sure you want to cancel booking ${booking.booking_number} for ${booking.customer_name}?`,
      icon: "warning",
      confirmButtonText: "Yes, cancel booking",
      cancelButtonText: "Keep booking",
      confirmButtonClass: "app-swal-deny",
    });

    if (!result.isConfirmed) return;

    // TODO: Call your cancellation API here.
    // Update the booking status to "cancelled" on the backend.

    await successSweetAlert({
      title: "Confirmation required",
      text: "Connect the cancellation API before updating the booking.",
    });
  };

  // Use the active tab as the status unless the user selects a status filter.
  const requestStatus =
    statusFilter !== "all"
      ? statusFilter
      : activeTab !== "all"
        ? activeTab
        : "";

  const [sortBy, sortOrder] = sort.split(":");

  const fetchBookings = async () => {
    setLoading(true);

    try {
      const response = await axios.get("/api/bookings", {
        withCredentials: true,
        params: {
          page,
          limit,
          search: query.trim(),
          sortBy,
          sortOrder,
          ...(requestStatus ? { status: requestStatus } : {}),
        },
      });

      const result = response.data?.data;

      if (!response.data?.success || !result) {
        throw new Error("Invalid bookings response.");
      }

      setBookings(result.bookings || []);
      setStats({
        ...EMPTY_STATS,
        ...(result.stats || {}),
      });
      setPagination({
        ...EMPTY_PAGINATION,
        ...(result.pagination || {}),
      });
    } catch (error) {
      console.error("Failed to fetch bookings:", error);

      toast(
        error.response?.data?.message || "Failed to load bookings.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch whenever the search, tab, sorting, or pagination changes.
  // Debounce search so we don't send a request for every keystroke.
  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => {
        fetchBookings();
      },
      query.trim() ? 350 : 0,
    );

    return () => window.clearTimeout(timeoutId);
  }, [page, limit, query, sort, requestStatus]);

  const changeTab = (tab) => {
    setActiveTab(tab);
    setStatusFilter("all");
    setPage(1);
  };

  const changeStatusFilter = (value) => {
    setStatusFilter(value || "all");
    setActiveTab("all");
    setPage(1);
  };

  const changeSearch = (event) => {
    setQuery(event.target.value);
    setPage(1);
  };

  const openDetails = (booking) => {
    setSelectedBooking(booking);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedBooking(null);
  };

  const totalValue = bookings.reduce(
    (sum, booking) => sum + Number(booking.total_amount || 0),
    0,
  );

  return (
    <div className="space-y-7">
      {/* Page header */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#1b7a5a]">
            Sales management
          </p>

          <h1
            className="mt-2 text-4xl font-semibold tracking-tight text-[#14231d]"
            style={DISPLAY}
          >
            Bookings<span style={{ color: GOLD }}>.</span>
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5b6b63]">
            Review booking requests and track booking statuses, customers, and
            payments.
          </p>
        </div>

        <Button variant="secondary" onClick={fetchBookings} disabled={loading}>
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </header>
      {/* Statistics from API */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Total bookings"
          value={stats.total}
          dark
        />

        <StatCard icon={Clock3} label="Pending" value={stats.pending} />

        <StatCard
          icon={CheckCircle2}
          label="Confirmed"
          value={stats.confirmed}
        />

        <StatCard icon={XCircle} label="Cancelled" value={stats.cancelled} />
      </section>
      {/* Booking table */}
      <section className="overflow-hidden rounded-2xl border border-[#e3e9e0] bg-white shadow-sm shadow-[#062a20]/[0.03]">
        <div className="border-b border-[#eef2ec] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2
                className="text-lg font-semibold text-[#14231d]"
                style={DISPLAY}
              >
                Booking register
              </h2>

              <p className="mt-1 text-xs text-[#5b6b63]">
                Search and filter your booking records.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Input
                wrapperClassName="w-full"
                leadingIcon={Search}
                value={query}
                onChange={changeSearch}
                placeholder="Search bookings..."
                aria-label="Search bookings"
              />

              <Select
                aria-label="Filter bookings by status"
                value={statusFilter}
                onChange={(event) => changeStatusFilter(event.target.value)}
                options={STATUS_OPTIONS}
              />

              <Select
                aria-label="Sort bookings"
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setPage(1);
                }}
                options={SORT_OPTIONS}
              />
            </div>
          </div>

          {/* Status tabs and API counts */}
          <div
            className="mt-5 flex gap-2 overflow-x-auto pb-1"
            role="tablist"
            aria-label="Booking status"
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.value;

              const count =
                tab.value === "all" ? stats.total : (stats[tab.value] ?? 0);

              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => changeTab(tab.value)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold transition ${
                    active
                      ? "border-[#0b3d2e] bg-[#0b3d2e] text-white"
                      : "border-[#dfe5dc] bg-white text-[#3f4f48] hover:border-[#1b7a5a]"
                  }`}
                >
                  {tab.label}

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ${
                      active
                        ? "bg-white/15 text-white"
                        : "bg-[#f0f4ef] text-[#5b6b63]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead>
              <tr className="bg-[#f4f7f2] text-[10px] font-bold uppercase tracking-[0.14em] text-[#5b6b63]">
                {[
                  "Booking",
                  "Customer",
                  "Project / Plot",
                  "Booking date",
                  "Total amount",
                  "Booking amount",
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
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <Loader
                      size="sm"
                      variant="spinner"
                      label="Loading bookings..."
                    />
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f3ee] text-[#1b7a5a]">
                      <Search size={20} />
                    </span>

                    <p className="mt-4 text-sm font-bold text-[#14231d]">
                      No bookings found
                    </p>

                    <p className="mt-1 text-xs text-[#5b6b63]">
                      Try another status or change your search.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setStatusFilter("all");
                        setActiveTab("all");
                        setPage(1);
                      }}
                      className="mt-3 text-xs font-extrabold text-[#1b7a5a] hover:underline"
                    >
                      Reset filters
                    </button>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-t border-[#eef2ec] transition hover:bg-[#f8faf6]"
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold text-[#14231d]">
                        {booking.booking_number}
                      </p>

                      <p className="mt-1 text-xs text-[#8a958e]">
                        ID #{booking.id}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex min-w-[170px] items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e9f3ee] text-[#1b7a5a]">
                          <UserRound size={16} />
                        </span>

                        <div>
                          <p className="font-bold text-[#14231d]">
                            {booking.customer_name}
                          </p>

                          <p className="mt-1 text-xs text-[#5b6b63]">
                            {booking.customer_phone || "No phone"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#14231d]">
                        {booking.project_name}
                      </p>

                      <p className="mt-1 flex items-center gap-1 text-xs text-[#5b6b63]">
                        <MapPin size={12} />
                        Plot {booking.plot_number}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-xs text-[#5b6b63]">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={14} />
                        {formatDate(booking.booking_date)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 font-bold text-[#14231d]">
                      {formatINR(booking.total_amount)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-[#5b6b63]">
                      {formatINR(booking.booking_amount)}
                    </td>

                    <td className="px-5 py-4">
                      <Badge variant={getBadgeVariant(booking.status)}>
                        {titleCase(booking.status)}
                      </Badge>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {booking.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => openConfirmModal(booking)}
                            >
                              <CheckCircle2 size={14} />
                              Confirm
                            </Button>

                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleCancelBooking(booking)}
                            >
                              <XCircle size={14} />
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-side pagination */}
        <div className="flex flex-col gap-4 border-t border-[#eef2ec] bg-[#fafcf9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs text-[#5b6b63]">
              Showing{" "}
              <b className="text-[#14231d]">
                {pagination.total === 0
                  ? 0
                  : (pagination.page - 1) * pagination.limit + 1}
              </b>{" "}
              –{" "}
              <b className="text-[#14231d]">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </b>{" "}
              of <b className="text-[#14231d]">{pagination.total}</b>
            </p>

            <Select
              size="sm"
              aria-label="Rows per page"
              value={String(limit)}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setPage(1);
              }}
              className="min-h-9 px-3.5 text-xs"
              options={[
                { value: "10", label: "10 / page" },
                { value: "20", label: "20 / page" },
                { value: "50", label: "50 / page" },
                { value: "100", label: "100 / page" },
              ]}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={loading || !pagination.hasPreviousPage}
              onClick={() => setPage((current) => current - 1)}
            >
              <ChevronLeft size={15} />
              Previous
            </Button>

            <span className="px-2 text-xs text-[#5b6b63]">
              Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
            </span>

            <Button
              size="sm"
              variant="secondary"
              disabled={loading || !pagination.hasNextPage}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
              <ChevronRight size={15} />
            </Button>
          </div>
        </div>
      </section>
      {/* Booking details modal */}
      <Modal
        open={detailsOpen}
        onClose={closeDetails}
        size="lg"
        title="Booking details"
        description="Review the booking and payment information."
        footer={
          <div className="flex w-full justify-end">
            <Button variant="secondary" onClick={closeDetails}>
              Close
            </Button>
          </div>
        }
      >
        {selectedBooking && (
          <div className="space-y-5">
            <div className="flex flex-col justify-between gap-3 rounded-xl bg-[#f4f7f2] p-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs text-[#5b6b63]">Booking number</p>
                <p className="mt-1 text-lg font-bold text-[#14231d]">
                  {selectedBooking.booking_number}
                </p>
              </div>

              <Badge
                variant={getBadgeVariant(selectedBooking.status)}
                size="lg"
              >
                {titleCase(selectedBooking.status)}
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-[#e3e9e0] p-4">
                <h3 className="text-sm font-bold text-[#14231d]">
                  Customer & property
                </h3>

                <DetailLine icon={UserRound}>
                  {selectedBooking.customer_name}
                </DetailLine>

                <DetailLine icon={UserRound}>
                  {selectedBooking.customer_phone}
                </DetailLine>

                <DetailLine icon={MapPin}>
                  {selectedBooking.project_name} · Plot{" "}
                  {selectedBooking.plot_number}
                </DetailLine>

                <DetailLine icon={CalendarDays}>
                  {formatDate(selectedBooking.booking_date)}
                </DetailLine>

                <DetailLine icon={FileText}>
                  Created by: {selectedBooking.created_by_name}
                </DetailLine>
              </div>

              <div className="space-y-3 rounded-xl border border-[#e3e9e0] p-4">
                <h3 className="text-sm font-bold text-[#14231d]">
                  Payment summary
                </h3>

                <div className="flex justify-between gap-3 text-xs text-[#5b6b63]">
                  <span>Agreed price</span>
                  <span>{formatINR(selectedBooking.agreed_price)}</span>
                </div>

                <div className="flex justify-between gap-3 text-xs text-[#5b6b63]">
                  <span>Discount</span>
                  <span>− {formatINR(selectedBooking.discount_amount)}</span>
                </div>

                <div className="flex justify-between gap-3 text-xs text-[#5b6b63]">
                  <span>Tax</span>
                  <span>{formatINR(selectedBooking.tax_amount)}</span>
                </div>

                <div className="flex justify-between gap-3 border-t border-[#eef2ec] pt-3 text-sm font-bold text-[#14231d]">
                  <span>Total</span>
                  <span>{formatINR(selectedBooking.total_amount)}</span>
                </div>

                <div className="flex justify-between gap-3 text-xs text-[#5b6b63]">
                  <span>Booking amount</span>
                  <span>{formatINR(selectedBooking.booking_amount)}</span>
                </div>
              </div>
            </div>

            {selectedBooking.notes && (
              <div className="rounded-xl border border-[#e3e9e0] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#5b6b63]">
                  Notes
                </p>

                <p className="mt-2 text-sm leading-6 text-[#14231d]">
                  {selectedBooking.notes}
                </p>
              </div>
            )}

            {selectedBooking.cancellation_reason && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                  Cancellation reason
                </p>

                <p className="mt-2 text-sm text-red-800">
                  {selectedBooking.cancellation_reason}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
      <Modal
        open={confirmModalOpen}
        onClose={closeConfirmModal}
        size="lg"
        title="Confirm booking"
        description="Review the booking details, record the payment, and configure the installment plan."
        footer={
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={closeConfirmModal}
              disabled={savingConfirmation}
            >
              Cancel
            </Button>

            <Button
              onClick={handleConfirmBooking}
              disabled={savingConfirmation}
            >
              <CheckCircle2 size={16} className="mr-2" />
              {savingConfirmation ? "Confirming..." : "Confirm booking"}
            </Button>
          </div>
        }
      >
        {confirmingBooking && (
          <form
            id="confirm-booking-form"
            onSubmit={handleConfirmBooking}
            className="space-y-6"
          >
            {/* Booking summary */}
            <section className="overflow-hidden rounded-2xl border border-[#e1e8e2]">
              <div className="flex items-start justify-between gap-3 border-b border-[#e8ede8] bg-[#f7f9f6] p-4 sm:p-5">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-[#718078]">
                    Booking reference
                  </p>

                  <h3 className="mt-1 break-words text-lg font-bold text-[#14231d]">
                    {confirmingBooking.booking_number}
                  </h3>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Pending
                </span>
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                <div>
                  <p className="text-xs font-medium text-[#718078]">Customer</p>
                  <p className="mt-1 font-semibold text-[#14231d]">
                    {confirmingBooking.customer_name}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-[#718078]">
                      Project
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#263a30]">
                      {confirmingBooking.project_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-[#718078]">
                      Plot number
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#263a30]">
                      {confirmingBooking.plot_number}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="border-t border-[#e8ede8] p-4 sm:p-5">
                <h4 className="mb-3 text-sm font-semibold text-[#14231d]">
                  Price breakdown
                </h4>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#718078]">Agreed price</span>
                    <span className="font-medium tabular-nums text-[#263a30]">
                      {formatINR(confirmingBooking.agreed_price)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#718078]">Discount</span>
                    <span className="font-medium tabular-nums text-emerald-700">
                      −{formatINR(confirmingBooking.discount_amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#718078]">Tax</span>
                    <span className="font-medium tabular-nums text-[#263a30]">
                      {formatINR(confirmingBooking.tax_amount)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-[#edf5ef] p-4">
                  <div>
                    <p className="text-sm font-semibold text-[#244533]">
                      Total booking value
                    </p>
                    <p className="mt-0.5 text-xs text-[#617568]">
                      Final amount payable
                    </p>
                  </div>

                  <p className="text-xl font-bold tabular-nums text-[#176344]">
                    {formatINR(confirmingBooking.total_amount)}
                  </p>
                </div>
              </div>
            </section>

            {/* Initial payment */}

            {/* Installment plan */}
            <section className="space-y-4 rounded-2xl border border-[#e1e8e2] bg-[#fafbf9] p-4 sm:p-5">
              <div>
                <div className="flex items-center gap-2">
                  <Wallet size={18} className="text-[#1b7a5a]" />
                  <h3 className="text-base font-semibold text-[#14231d]">
                    Installment plan
                  </h3>
                </div>

                <p className="mt-1 text-sm text-[#718078]">
                  Configure how the remaining balance will be paid.
                </p>
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Down Payment"
                  name="down_payment"
                  type="text"
                  inputMode="decimal"
                  value={formatINRInput(confirmForm.down_payment)}
                  onChange={(event) => {
                    const rawValue = event.target.value.replace(/,/g, "");

                    if (rawValue === "" || /^\d*\.?\d{0,2}$/.test(rawValue)) {
                      setConfirmForm((current) => ({
                        ...current,
                        down_payment: rawValue,
                      }));

                      handleConfirmFieldChange("down_payment", rawValue);
                    }
                  }}
                  error={confirmErrors.down_payment}
                  placeholder="Enter down payment"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Number of installments"
                  name="installment_count"
                  type="number"
                  min="1"
                  step="1"
                  value={confirmForm.installment_count}
                  onChange={(event) =>
                    handleConfirmFieldChange(
                      "installment_count",
                      event.target.value,
                    )
                  }
                  error={confirmErrors.installment_count}
                  placeholder="e.g. 12"
                  required
                />
                <Select
                  label="Payment frequency"
                  name="frequency"
                  value={confirmForm.frequency}
                  onChange={(event) =>
                    handleConfirmFieldChange("frequency", event.target.value)
                  }
                  error={confirmErrors.frequency}
                  options={[
                    { value: "weekly", label: "Weekly" },
                    { value: "monthly", label: "Monthly" },
                    { value: "quarterly", label: "Quarterly" },
                    { value: "half_yearly", label: "Half-yearly" },
                    { value: "yearly", label: "Yearly" },
                    { value: "milestone", label: "Milestone-based" },
                    { value: "custom", label: "Custom" },
                  ]}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Installment start date"
                  name="start_date"
                  type="date"
                  min={confirmForm.start_date || undefined}
                  value={confirmForm.start_date}
                  onChange={(event) =>
                    handleConfirmFieldChange("start_date", event.target.value)
                  }
                  error={confirmErrors.start_date}
                  required
                />

                <Select
                  label="Plan status"
                  name="status"
                  size="md"
                  placeholder="Select status"
                  value={confirmForm.status}
                  onChange={(event) =>
                    handleConfirmFieldChange("status", event.target.value)
                  }
                  error={confirmErrors.status}
                  options={[
                    { value: "active", label: "Active" },
                    { value: "completed", label: "Completed" },
                    { value: "cancelled", label: "Cancelled" },
                  ]}
                  required
                />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-[#e1e8e2] bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[#53645a]">
                    Remaining balance
                  </p>
                  <p className="mt-0.5 text-xs text-[#89958d]">
                    After the initial payment
                  </p>
                </div>

                <div className="text-right">
                  <span className="block text-base font-bold tabular-nums text-[#14231d]">
                    {formatINR(
                      Math.max(
                        0,
                        Number(confirmingBooking.total_amount || 0) -
                          Math.max(0, Number(confirmForm.booking_amount || 0)),
                      ),
                    )}
                  </span>

                  <span className="mt-1 block text-xs font-medium text-[#89958d]">
                    Booking amount:{" "}
                    {formatINR(
                      Math.max(0, Number(confirmForm.booking_amount || 0)),
                    )}
                  </span>
                </div>
              </div>
            </section>

            {/* Notes */}
            <section>
              <label
                htmlFor="confirmation-notes"
                className="mb-1.5 block text-sm font-semibold text-[#263a30]"
              >
                Notes{" "}
                <span className="font-normal text-[#89958d]">(optional)</span>
              </label>

              <textarea
                id="confirmation-notes"
                name="notes"
                rows={3}
                value={confirmForm.notes}
                onChange={(event) =>
                  handleConfirmFieldChange("notes", event.target.value)
                }
                placeholder="Add payment or confirmation notes..."
                className="w-full resize-y rounded-xl border border-[#dfe5dc] bg-white px-3.5 py-3 text-sm text-[#14231d] outline-none transition placeholder:text-[#9aa59d] focus:border-[#1b7a5a] focus:ring-4 focus:ring-[#1b7a5a]/10"
              />
            </section>
          </form>
        )}
      </Modal>
    </div>
  );
}
