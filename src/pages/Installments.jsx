import { useEffect, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import axios from "axios";

import Input from "../components/common/Input";
import Badge from "../components/common/Badge";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import { useToast } from "../components/common/Toast";
import { useNavigate } from "react-router-dom";

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
  const date = String(value).slice(0, 10);
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
};

const STATUSES = [
  "upcoming",
  "overdue",
  "All",
  "pending",
  "partially_paid",
];

const STATUS_LABELS = {
  upcoming: "Upcoming",
  All: "All open",
  pending: "Pending",
  partially_paid: "Partially paid",
  overdue: "Overdue",
};

function StatCard({ icon: Icon, label, value, note, dark = false }) {
  return (
    <Card
      padding="md"
      className={`relative h-full overflow-hidden ${
        dark ? "border-transparent bg-[#0b3d2e] text-white" : "bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-[11px] font-bold uppercase tracking-[0.14em] ${dark ? "text-white/65" : "text-[#5b6b63]"}`}
          >
            {label}
          </p>
          <p
            className="mt-3 break-words text-2xl font-semibold tracking-tight sm:text-3xl"
            style={DISPLAY}
          >
            {value}
          </p>
          {note && (
            <p
              className={`mt-1 text-xs ${dark ? "text-white/65" : "text-[#5b6b63]"}`}
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
    </Card>
  );
}

function InstallmentStatus({ status }) {
  const styles = {
    pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    partially_paid: "bg-orange-50 text-orange-700 ring-orange-600/20",
    overdue: "bg-red-50 text-red-700 ring-red-600/20",
  };

  return (
    <Badge>
      <span
        className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status] || styles.pending}`}
      >
        {STATUS_LABELS[status] || status || "Pending"}
      </span>
    </Badge>
  );
}

function SortableHeader({ label, column, sortBy, sortOrder, onSort }) {
  const active = sortBy === column;
  return (
    <th scope="col" className="whitespace-nowrap px-5 py-3.5 text-left">
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex items-center gap-1.5 hover:text-[#0b3d2e]"
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

export default function Installments() {
  const toast = useToast();

  const [installments, setInstallments] = useState([]);
  const [stats, setStats] = useState({
    total_installments: 0,
    paid_amount: 0,
    outstanding_amount: 0,
    overdue_count: 0,
    upcoming_count: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState("upcoming");
  const [sortBy, setSortBy] = useState("due_date");
  const [sortOrder, setSortOrder] = useState("asc");
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPagination((current) => ({ ...current, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchInstallments() {
      setLoading(true);
      setError("");

      try {
        const response = await axios.get("/api/customers/installments", {
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

        const result = response.data?.data || {};
        setInstallments(result.installments || []);
        setStats({
          total_installments:
            Number(
              result.stats?.total_installments ?? result.pagination?.total,
            ) || 0,
          paid_amount: Number(result.stats?.paid_amount) || 0,
          outstanding_amount: Number(result.stats?.outstanding_amount) || 0,
          overdue_count: Number(result.stats?.overdue_count) || 0,
          upcoming_count: Number(result.stats?.upcoming_count) || 0,
        });
        setPagination((current) => ({
          ...current,
          ...(result.pagination || {}),
        }));
      } catch (err) {
        if (err.code === "ERR_CANCELED") return;
        const message =
          err.response?.data?.message ||
          "Unable to load installments. Please try again.";
        setError(message);
        toast(message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchInstallments();
    return () => controller.abort();
  }, [
    pagination.page,
    limit,
    debouncedSearch,
    filter,
    sortBy,
    sortOrder,
    refreshKey,
    toast,
  ]);

  function handleSort(column) {
    if (sortBy === column) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }

    setPagination((current) => ({ ...current, page: 1 }));
  }

  function changeFilter(status) {
    setFilter(status);
    setPagination((current) => ({ ...current, page: 1 }));
  }

  function changeLimit(event) {
    setLimit(Number(event.target.value));
    setPagination((current) => ({ ...current, page: 1 }));
  }

  function clearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setFilter("upcoming");
    setSortBy("due_date");
    setSortOrder("asc");
    setPagination((current) => ({ ...current, page: 1 }));
  }

  const start =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#1b7a5a]">
            Payments & collections
          </p>
          <h1
            className="mt-2 text-4xl font-semibold tracking-tight text-[#14231d]"
            style={DISPLAY}
          >
            Installments<span style={{ color: GOLD }}>.</span>
          </h1>
          <p className="mt-2 text-sm text-[#5b6b63]">
            Track the next upcoming installment for each plan, plus overdue
            balances across all customers.
          </p>
        </div>
        <Button
          variant="secondary"
          disabled={loading}
          onClick={() => setRefreshKey((value) => value + 1)}
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarClock}
          label="Upcoming installments"
          value={stats.upcoming_count.toLocaleString("en-IN")}
          note={`Next per plan · ${stats.total_installments} open`}
        />
        <StatCard
          icon={CheckCircle2}
          label="Collected"
          value={formatINR(stats.paid_amount)}
          note="Paid toward open installments"
        />
        <StatCard
          icon={Wallet}
          label="Outstanding amount"
          value={formatINR(stats.outstanding_amount)}
          note="Remaining on open installments"
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue installments"
          value={stats.overdue_count.toLocaleString("en-IN")}
          note="Past due balances"
        />
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="space-y-4 border-b border-[#eef2ec] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              wrapperClassName="w-full max-w-md"
              leadingIcon={Search}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer, phone, plot or booking..."
              aria-label="Search installments"
            />
            <div className="flex items-center gap-2">
              <label
                htmlFor="installment-page-size"
                className="whitespace-nowrap text-xs text-[#5b6b63]"
              >
                Rows per page
              </label>
              <select
                id="installment-page-size"
                value={limit}
                onChange={changeLimit}
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
            aria-label="Filter by installment status"
          >
            {STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => changeFilter(status)}
                aria-pressed={filter === status}
                title={
                  status === "upcoming"
                    ? "Next upcoming installment for each plan"
                    : undefined
                }
                className={`rounded-full border px-4 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1b7a5a]/20 ${
                  filter === status
                    ? "border-[#0b3d2e] bg-[#0b3d2e] text-white shadow-md shadow-[#0b3d2e]/20"
                    : "border-[#dfe5dc] bg-white text-[#3f4f48] hover:border-[#1b7a5a] hover:text-[#0b3d2e]"
                }`}
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead>
              <tr className="bg-[#f4f7f2] text-[10px] font-bold uppercase tracking-[0.12em] text-[#5b6b63]">
                <SortableHeader
                  label="Customer"
                  column="customer_name"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Project"
                  column="project_name"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Plot / Booking"
                  column="plot_number"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Installment"
                  column="installment_number"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Due date"
                  column="due_date"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Due amount"
                  column="amount_due"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Paid"
                  column="amount_paid"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-5 py-3.5 text-left">Remaining</th>
                <th className="px-5 py-3.5 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }, (_, index) => (
                  <tr
                    key={index}
                    className="animate-pulse border-t border-[#eef2ec]"
                  >
                    {Array.from({ length: 9 }, (_, cell) => (
                      <td key={cell} className="px-5 py-5">
                        <div className="h-4 rounded bg-[#edf1eb]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error && installments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <p className="font-semibold text-red-700">{error}</p>
                    <Button
                      className="mt-3"
                      variant="secondary"
                      onClick={() => setRefreshKey((value) => value + 1)}
                    >
                      Try again
                    </Button>
                  </td>
                </tr>
              ) : installments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f3ee] text-[#1b7a5a]">
                      <Search size={20} />
                    </span>
                    <p className="mt-4 text-sm font-bold text-[#14231d]">
                      {filter === "All"
                        ? "No open installments"
                        : `No ${STATUS_LABELS[filter].toLowerCase()} installments`}
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
                installments.map((item) => {
                  const due = Number(item.amount_due) || 0;
                  const paid = Number(item.amount_paid) || 0;
                  const remaining = Math.max(0, Number(item.remaining) || 0);
                  return (
                    <tr
                      key={item.uuid || item.id}
                      className="group border-t border-[#eef2ec] transition hover:bg-[#f8faf6]"
                    >
                      <td
                        onClick={() => {
                          navigate("/customer/profile", {
                            state: {
                              uuid: item.customer_uuid,
                            },
                          });
                        }}
                        className="px-5 py-4 cursor-pointer"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-[#e4c48a]/70 bg-[#0b3d2e] text-xs font-bold text-[#e4c48a] shadow-sm"
                            aria-hidden="true"
                          >
                            {(item.customer_name || item.name || "C")
                              .trim()
                              .split(/\\s+/)
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join("")
                              .toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="max-w-[190px] truncate font-bold text-[#14231d]">
                              {item.customer_name || item.name || "—"}
                            </p>
                            <p className="mt-1 text-xs text-[#5b6b63]">
                              {item.customer_phone || item.phone || "—"}
                            </p>
                            <p className="mt-1 max-w-[190px] truncate text-[10px] text-[#839087]">
                              {item.booking_number || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium">
                        {item.project_name || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-[#0b3d2e]">
                          {item.plot_number || "—"}
                        </p>
                        <p className="mt-1 text-[10px] text-[#839087]">
                          {item.booking_number || "—"}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <p className="font-bold">
                          #{item.installment_number ?? "—"}
                        </p>
                        {item.description && (
                          <p className="mt-1 max-w-[150px] truncate text-xs text-[#5b6b63]">
                            {item.description}
                          </p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-[#5b6b63]">
                        {formatDate(item.due_date)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-semibold">
                        {formatINR(due)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-emerald-700">
                        {formatINR(paid)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-bold text-[#14231d]">
                        {formatINR(remaining)}
                      </td>
                      <td className="px-5 py-4">
                        <InstallmentStatus status={item.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#eef2ec] bg-[#fafcf9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#5b6b63]">
            Showing <b className="text-[#14231d]">{start}</b>–{" "}
            <b className="text-[#14231d]">{end}</b> of{" "}
            <b className="text-[#14231d]">{pagination.total}</b> installments
          </p>
          <div className="flex items-center gap-2">
            <span className="mr-2 text-xs text-[#5b6b63]">
              Page {pagination.page} of {Math.max(1, pagination.totalPages)}
            </span>
            <button
              type="button"
              onClick={() =>
                setPagination((current) => ({
                  ...current,
                  page: current.page - 1,
                }))
              }
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
              onClick={() =>
                setPagination((current) => ({
                  ...current,
                  page: current.page + 1,
                }))
              }
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
      </Card>
    </div>
  );
}
