import { useEffect, useState } from "react";
import {
  IndianRupee,
  Search,
  Users,
  Wallet,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from "lucide-react";
import axios from "axios";

import Input from "../components/common/Input";
import Badge from "../components/common/Badge";
import { useToast } from "../components/common/Toast";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };
const GOLD = "#e4c48a";

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const formatDate = (value) => {
  if (!value) return "—";

  // Avoid timezone shifts for PostgreSQL DATE values.
  const date = String(value).slice(0, 10);
  const [year, month, day] = date.split("-").map(Number);

  if (!year || !month || !day) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
};

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "?";

const STATUSES = [
  "All",
  "On track",
  "Due soon",
  "Overdue",
  "Paid",
  "Cancelled",
];

function StatCard({ icon: Icon, label, value, note, dark = false }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl ${
        dark
          ? "border-transparent bg-[#0b3d2e] text-white shadow-lg shadow-[#0b3d2e]/25"
          : "border-[#e3e9e0] bg-white hover:shadow-[#062a20]/5"
      }`}
    >
      <div className="flex items-start justify-between">
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

      <p
        className="mt-4 break-words text-2xl font-semibold tracking-tight sm:text-3xl"
        style={DISPLAY}
      >
        {value}
      </p>

      {note && (
        <p
          className={`mt-1 text-xs ${
            dark ? "text-white/55" : "text-[#5b6b63]"
          }`}
        >
          {note}
        </p>
      )}

      {dark && (
        <span
          aria-hidden="true"
          className="absolute -bottom-10 -right-10 h-28 w-28 rounded-full border border-white/10"
        />
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    "On track": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    "Due soon": "bg-amber-50 text-amber-700 ring-amber-600/20",
    Overdue: "bg-red-50 text-red-700 ring-red-600/20",
    Paid: "bg-blue-50 text-blue-700 ring-blue-600/20",
    Cancelled: "bg-gray-100 text-gray-600 ring-gray-500/20",
  };

  return (
    <Badge>
      <span
        className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
          styles[status] || styles["On track"]
        }`}
      >
        {status || "On track"}
      </span>
    </Badge>
  );
}

export default function Customers() {
  const toast = useToast();

  // Server response
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({
    total_customers: 0,
    total_value: 0,
    collected: 0,
    outstanding: 0,
    collected_percentage: 0,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Query state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState("booking_date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [limit, setLimit] = useState(10);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Debounce search to avoid requesting the API on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  // Reset pagination when search/filter/sorting changes.
  useEffect(() => {
    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  }, [debouncedSearch, filter, sortBy, sortOrder, limit]);

  // Fetch actual customer data.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchCustomers() {
      setLoading(true);
      setError("");

      try {
        const response = await axios.get("/api/customers", {
          withCredentials: true,
          signal: controller.signal,
          params: {
            page: pagination.page,
            limit,
            search: debouncedSearch,
            ...(filter !== "All" && { status: filter }),
            sortBy,
            sortOrder,
          },
        });

        const result = response.data.data;

        setCustomers(result.customers || []);

        setStats({
          total_customers: Number(result.stats?.total_customers) || 0,
          total_value: Number(result.stats?.total_value) || 0,
          collected: Number(result.stats?.collected) || 0,
          outstanding: Number(result.stats?.outstanding) || 0,
          collected_percentage: Number(result.stats?.collected_percentage) || 0,
        });

        setPagination((current) => ({
          ...current,
          ...(result.pagination || {}),
        }));
      } catch (err) {
        if (err.code === "ERR_CANCELED") return;

        setError(
          err.response?.data?.message ||
            "Unable to load customers. Please try again.",
        );

        toast(err.response?.data?.message || "Failed to fetch customers.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchCustomers();

    return () => controller.abort();
  }, [pagination.page, limit, debouncedSearch, filter, sortBy, sortOrder]);

  function handleSort(column) {
    if (sortBy === column) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  }

  function changePage(nextPage) {
    setPagination((current) => ({
      ...current,
      page: nextPage,
    }));
  }

  function clearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setFilter("All");
    setSortBy("booking_date");
    setSortOrder("desc");
    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  }

  function SortableHeader({ label, column, align = "left" }) {
    const active = sortBy === column;

    return (
      <th scope="col" className={`px-5 py-3.5 text-${align}`}>
        <button
          type="button"
          onClick={() => handleSort(column)}
          className="inline-flex items-center gap-1.5 whitespace-nowrap hover:text-[#0b3d2e]"
          aria-label={`Sort by ${label}`}
        >
          {label}
          {active ? (
            sortOrder === "asc" ? (
              <ArrowUp size={13} />
            ) : (
              <ArrowDown size={13} />
            )
          ) : (
            <ArrowUpDown size={13} className="opacity-40" />
          )}
        </button>
      </th>
    );
  }

  const start =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;

  const end = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#1b7a5a]">
            Relationships
          </p>

          <h1
            className="mt-2 text-4xl font-semibold tracking-tight text-[#14231d]"
            style={DISPLAY}
          >
            Customers<span style={{ color: GOLD }}>.</span>
          </h1>

          <p className="mt-2 text-sm text-[#5b6b63]">
            Manage buyer details and payment progress.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setPagination((current) => ({
              ...current,
              page: 1,
            }));
            setDebouncedSearch(search.trim());
          }}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dfe5dc] bg-white px-4 py-2.5 text-sm font-semibold text-[#0b3d2e] transition hover:bg-[#f4f7f2] disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={Users}
          label="Total customers"
          value={stats.total_customers.toLocaleString("en-IN")}
          note="Across all plots"
          dark
        />

        <StatCard
          icon={IndianRupee}
          label="Collected"
          value={formatINR(stats.collected)}
          note={`${stats.collected_percentage}% of total value`}
        />

        <StatCard
          icon={Wallet}
          label="Outstanding"
          value={formatINR(stats.outstanding)}
          note="Balance to collect"
        />
      </div>

      {/* Customer table */}
      <div className="overflow-hidden rounded-2xl border border-[#e3e9e0] bg-white shadow-sm shadow-[#062a20]/[0.03]">
        {/* Search and status filters */}
        <div className="space-y-4 border-b border-[#eef2ec] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              wrapperClassName="w-full max-w-md"
              leadingIcon={Search}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, phone, plot or project..."
              aria-label="Search customers"
            />

            <div className="flex items-center gap-2">
              <label
                htmlFor="customer-page-size"
                className="whitespace-nowrap text-xs text-[#5b6b63]"
              >
                Rows per page
              </label>

              <select
                id="customer-page-size"
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value))}
                className="rounded-lg border border-[#dfe5dc] bg-white px-3 py-2 text-sm text-[#14231d] outline-none focus:border-[#1b7a5a]"
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by payment status"
          >
            {STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                aria-pressed={filter === status}
                className={`rounded-full border px-4 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1b7a5a]/20 ${
                  filter === status
                    ? "border-[#0b3d2e] bg-[#0b3d2e] text-white shadow-md shadow-[#0b3d2e]/20"
                    : "border-[#dfe5dc] bg-white text-[#3f4f48] hover:border-[#1b7a5a] hover:text-[#0b3d2e]"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead>
              <tr className="bg-[#f4f7f2] text-[10px] font-bold uppercase tracking-[0.12em] text-[#5b6b63]">
                <SortableHeader label="Customer" column="name" />
                <SortableHeader label="Project" column="project" />
                <SortableHeader label="Plot" column="plot" />
                <SortableHeader label="Total price" column="total" />
                <SortableHeader label="Paid" column="paid" />
                <SortableHeader label="Balance" column="balance" />
                <SortableHeader label="Status" column="status" />
                <SortableHeader label="Booking date" column="booking_date" />
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 5 }, (_, index) => (
                  <tr
                    key={index}
                    className="animate-pulse border-t border-[#eef2ec]"
                  >
                    {Array.from({ length: 8 }, (_, cell) => (
                      <td key={cell} className="px-5 py-5">
                        <div className="h-4 rounded bg-[#edf1eb]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error && customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <p className="font-semibold text-red-700">{error}</p>

                    <button
                      type="button"
                      onClick={() =>
                        setPagination((current) => ({
                          ...current,
                          page: 1,
                        }))
                      }
                      className="mt-3 text-sm font-bold text-[#1b7a5a] hover:underline"
                    >
                      Try again
                    </button>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f3ee] text-[#1b7a5a]">
                      <Search size={20} />
                    </span>

                    <p className="mt-4 text-sm font-bold text-[#14231d]">
                      No customers found
                    </p>

                    <p className="mt-1 text-xs text-[#5b6b63]">
                      Try another search or clear your filters.
                    </p>

                    <button
                      type="button"
                      onClick={clearFilters}
                      className="mt-4 text-xs font-extrabold text-[#1b7a5a] hover:underline"
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const total = Number(customer.total) || 0;
                  const paid = Number(customer.paid) || 0;
                  const balance = Number(customer.balance) || 0;

                  const percentage = total
                    ? Math.min(100, Math.round((paid / total) * 100))
                    : 0;

                  return (
                    <tr
                      key={customer.booking_uuid || customer.id}
                      className="group border-t border-[#eef2ec] transition hover:bg-[#f8faf6]"
                    >
                      {/* Customer */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0b3d2e] text-[11px] font-extrabold ring-2 ring-[#e4c48a]/40"
                            style={{ color: GOLD }}
                          >
                            {initials(customer.name)}
                          </span>

                          <div className="min-w-0">
                            <p className="max-w-[180px] truncate font-bold text-[#14231d]">
                              {customer.name}
                            </p>

                            <p className="mt-0.5 text-xs text-[#5b6b63]">
                              {customer.phone || "No phone"}
                            </p>

                            {customer.booking_number && (
                              <p className="mt-0.5 text-[10px] text-[#839087]">
                                {customer.booking_number}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Project */}
                      <td className="px-5 py-4">
                        <span className="font-medium text-[#14231d]">
                          {customer.project_name || "—"}
                        </span>
                      </td>

                      {/* Plot */}
                      <td className="px-5 py-4">
                        <span className="whitespace-nowrap rounded-lg bg-[#e9f3ee] px-2.5 py-1 text-xs font-extrabold text-[#0b3d2e]">
                          {customer.plot || "—"}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-[#14231d]">
                        {formatINR(total)}
                      </td>

                      {/* Paid + progress */}
                      <td className="px-5 py-4">
                        <p className="whitespace-nowrap font-medium text-[#14231d]">
                          {formatINR(paid)}
                        </p>

                        <div
                          className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-[#e9eee5]"
                          role="progressbar"
                          aria-valuenow={percentage}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${percentage}% paid`}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                              background: `linear-gradient(90deg,#1b7a5a,${GOLD})`,
                            }}
                          />
                        </div>
                      </td>

                      {/* Balance */}
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-[#14231d]">
                        {formatINR(balance)}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <StatusBadge status={customer.status} />
                      </td>

                      {/* Booking date */}
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-[#5b6b63]">
                        {formatDate(customer.booking_date)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-[#eef2ec] bg-[#fafcf9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#5b6b63]">
            Showing <b className="text-[#14231d]">{start}</b>–{" "}
            <b className="text-[#14231d]">{end}</b> of{" "}
            <b className="text-[#14231d]">{pagination.total}</b> bookings
          </p>

          <div className="flex items-center gap-2">
            <span className="mr-2 text-xs text-[#5b6b63]">
              Page {pagination.page} of {Math.max(1, pagination.totalPages)}
            </span>

            <button
              type="button"
              onClick={() => changePage(pagination.page - 1)}
              disabled={
                loading || !pagination.hasPrevPage || pagination.page <= 1
              }
              aria-label="Previous page"
              className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe5dc] bg-white text-[#0b3d2e] transition hover:bg-[#e9f3ee] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={17} />
            </button>

            <button
              type="button"
              onClick={() => changePage(pagination.page + 1)}
              disabled={
                loading ||
                !pagination.hasNextPage ||
                pagination.page >= pagination.totalPages
              }
              aria-label="Next page"
              className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe5dc] bg-white text-[#0b3d2e] transition hover:bg-[#e9f3ee] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
