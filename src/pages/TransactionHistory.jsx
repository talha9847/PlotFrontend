import { useEffect, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import SearchableLeadSelect from "../components/common/SearchableLeadSelect";
import SearchablePlotSelect2 from "../components/common/SearchablePlotSelect2";
import Select from "../components/common/Select";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import { useToast } from "../components/common/Toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import SearchablePartySelect from "../components/common/SearchablePartySelect";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };
const GOLD = "#e4c48a";

const METHODS = [
  ["cash", "Cash"],
  ["upi", "UPI"],
  ["bank_transfer", "Bank transfer"],
  ["card", "Card"],
  ["cheque", "Cheque"],
  ["other", "Other"],
];

const STATUSES = [
  ["", "All statuses"],
  ["pending", "Pending"],
  ["completed", "Completed"],
  ["failed", "Failed"],
  ["cancelled", "Cancelled"],
  ["partially_refunded", "Partially refunded"],
  ["refunded", "Refunded"],
];

const first = (...values) =>
  values.find((value) => value !== undefined && value !== null);

function normalizeTransaction(row) {
  const id = first(row.id, row.uuid, row.payment_id);
  return {
    ...row,
    id,
    uuid: String(first(row.uuid, row.id, row.payment_id, "")),
    number: first(row.payment_number, row.paymentNumber, row.number, "—"),
    date: first(row.payment_date, row.paymentDate, row.date, ""),
    customerId: first(
      row.customer_id,
      row.customerId,
      row.customer_uuid,
      row.customerUuid,
      "",
    ),
    customerName: first(row.customer_name, row.customerName, row.name, "—"),
    customerPhone: first(row.customer_phone, row.customerPhone, row.phone, "—"),
    projectId: first(row.project_id, row.projectId, ""),
    projectName: first(row.project_name, row.projectName, row.project, "—"),
    plotId: first(row.plot_id, row.plotId, ""),
    plotNumber: first(row.plot_number, row.plotNumber, "—"),
    accountId: first(row.account_id, row.accountId, ""),
    accountName: first(row.account_name, row.accountName, "—"),
    method: first(row.payment_method, row.paymentMethod, row.method, "other"),
    status: first(row.status, "pending"),
    amount: Number(first(row.amount, 0)),
    booking: first(row.booking_number, row.bookingNumber, row.booking, "—"),
    receivedBy: first(
      row.received_by_name,
      row.receivedBy,
      row.received_by,
      "—",
    ),
    note: first(row.notes, row.note, ""),
  };
}

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const formatDateTime = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

function getInstallmentProgress(row) {
  // Supports common API naming conventions. Prefer the paid/current installment
  // count and the total installment count supplied by the backend.
  const paid = first(
    row.paid_installments,
    row.paidInstallments,
    row.installments_paid,
    row.installmentsPaid,
    row.completed_installments,
    row.completedInstallments,
    row.installment_paid_count,
    row.installmentPaidCount,
    row.current_installment,
    row.currentInstallment,
    row.installment_number,
    row.installmentNumber,
    row.installment_no,
    row.installmentNo,
  );
  const total = first(
    row.total_installments,
    row.totalInstallments,
    row.installment_total,
    row.installmentTotal,
    row.installment_count,
    row.installmentCount,
    row.number_of_installments,
    row.numberOfInstallments,
  );

  const paidCount = Number(paid);
  const totalCount = Number(total);
  if (
    paid === undefined ||
    total === undefined ||
    !Number.isFinite(paidCount) ||
    !Number.isFinite(totalCount) ||
    totalCount <= 0
  )
    return null;

  const completed = Math.max(0, Math.min(paidCount, totalCount));
  return {
    completed,
    total: totalCount,
    percentage: Math.round((completed / totalCount) * 100),
  };
}

function InstallmentProgress({ progress }) {
  if (!progress) return null;

  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress.percentage / 100);

  return (
    <div
      className="mt-2 inline-flex items-center gap-2"
      title={`${progress.completed} of ${progress.total} installments paid (${progress.percentage}%)`}
      aria-label={`${progress.completed} of ${progress.total} installments paid, ${progress.percentage}%`}
    >
      <span className="relative grid h-9 w-9 shrink-0 place-items-center">
        <svg
          viewBox="0 0 36 36"
          className="absolute inset-0 h-9 w-9 -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke="#e5ebe2"
            strokeWidth="3.5"
          />
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke="#1b7a5a"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="text-[9px] font-extrabold leading-none text-[#0b3d2e]">
          {progress.percentage}%
        </span>
      </span>
      <span className="text-xs font-semibold text-[#5b6b63]">
        {progress.completed}/{progress.total} installments
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    failed: "bg-red-50 text-red-700 ring-red-600/20",
    cancelled: "bg-slate-100 text-slate-600 ring-slate-500/20",
    refunded: "bg-blue-50 text-blue-700 ring-blue-600/20",
    partially_refunded: "bg-violet-50 text-violet-700 ring-violet-600/20",
  };
  const label = String(status || "pending").replaceAll("_", " ");
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${styles[status] || styles.pending}`}
    >
      {label}
    </span>
  );
}

function SortableHeader({ label, column, sortBy, sortOrder, onSort }) {
  const active = sortBy === column;
  return (
    <th scope="col" className="whitespace-nowrap px-4 py-3 text-left">
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex items-center gap-1.5 hover:text-[#0b3d2e]"
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

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedTransactions, setSelectedTransactions] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [savingTransaction, setSavingTransaction] = useState(false);

  const getParties = async () => {
    try {
      const res = await axios.get("/api/parties/dropdown", {
        withCredentials: true,
      });
      if (res.status == 200) {
        console.log(res.data.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getParties();
  });
  const [newTransaction, setNewTransaction] = useState({
    transaction_type: "income",
    party_id: "",
    category_id: "",
    amount: "",
    account_id: "",
    payment_method: "cash",
    transaction_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [accounts, setAccounts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    completedTotal: 0,
    pendingTotal: 0,
    refundedTotal: 0,
  });
  const toast = useToast();

  // Static options for the initial UI. Replace these IDs/labels with values
  // returned by your parties, transaction-categories, and accounts APIs.
  const STATIC_CUSTOMERS = [
    { value: "1", label: "Walk-in Customer" },
    { value: "2", label: "Rahul Sharma" },
    { value: "3", label: "Priya Patel" },
  ];
  const STATIC_CATEGORIES = [
    { value: "1", label: "Sales" },
    { value: "2", label: "Office expenses" },
    { value: "3", label: "Other" },
  ];
  const STATIC_ACCOUNTS = [
    { value: "1", label: "Cash" },
    { value: "2", label: "BOB" },
    { value: "3", label: "SBI" },
  ];

  async function handleAddTransaction(event) {
    event.preventDefault();
    if (savingTransaction) return;

    const amount = Number(newTransaction.amount);
    if (
      !newTransaction.party_id ||
      !newTransaction.category_id ||
      !newTransaction.account_id
    ) {
      toast("Please select a customer, category, and account.", "error");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast("Amount must be greater than zero.", "error");
      return;
    }

    try {
      setSavingTransaction(true);
      const response = await axios.post(
        "/api/transactions",
        {
          transaction_type: newTransaction.transaction_type,
          party_id: Number(newTransaction.party_id),
          category_id: Number(newTransaction.category_id),
          amount,
          account_id: Number(newTransaction.account_id),
          payment_method: newTransaction.payment_method,
          transaction_date: newTransaction.transaction_date
            ? new Date(
                `${newTransaction.transaction_date}T00:00:00`,
              ).toISOString()
            : undefined,
          notes: newTransaction.notes.trim() || undefined,
        },
        { withCredentials: true },
      );

      if (response.status === 200 || response.status === 201) {
        toast(
          response.data?.message || "Transaction added successfully.",
          "success",
        );
        setAddTransactionOpen(false);
        setNewTransaction({
          transaction_type: "income",
          party_id: "",
          category_id: "",
          amount: "",
          account_id: "",
          payment_method: "cash",
          transaction_date: new Date().toISOString().slice(0, 10),
          notes: "",
        });
        setPage(1);
        await fetchTransactions();
      }
    } catch (error) {
      toast(
        error.response?.data?.message || "Failed to add transaction.",
        "error",
      );
    } finally {
      setSavingTransaction(false);
    }
  }

  const [filters, setFilters] = useState({
    customer_id: "",
    project_id: "",
    plot_id: "",
    account_id: "",
    payment_method: "",
  });

  const getProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await axios.get("/api/plots/projects", {
        withCredentials: true,
      });
      if (res.status === 200) setProjects(res.data?.data?.projects || []);
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast(
        error.response?.data?.message || "Failed to load projects.",
        "error",
      );
    } finally {
      setLoadingProjects(false);
    }
  };

  const getAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await axios.get("/api/accounts", { withCredentials: true });
      if (res.status === 200) setAccounts(res.data?.data?.accounts || []);
    } catch (error) {
      toast(
        error.response?.data?.message || "Failed to load bank accounts.",
        "error",
      );
    } finally {
      setLoadingAccounts(false);
    }
  };

  const buildParams = (includePagination = true) => {
    console.log(filters);
    const params = {
      search: search.trim() || undefined,
      customer_id: filters.customer_id || undefined,
      project_id: filters.project_id || undefined,
      plot_id: filters.plot_id || undefined,
      account_id: filters.account_id || undefined,
      payment_method: filters.payment_method || undefined,
      status: status || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      min_amount: minAmount === "" ? undefined : minAmount,
      max_amount: maxAmount === "" ? undefined : maxAmount,
      sort_by: sortBy,
      sort_order: sortOrder,
    };
    if (includePagination) {
      params.page = page;
      params.limit = limit;
    }
    return params;
  };

  const fetchTransactions = async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const res = await axios.get("/api/transactions", {
        params: buildParams(true),
        withCredentials: true,
      });
      const payload = res.data || {};
      const data = payload.data || {};
      const rows =
        data.transactions ||
        payload.transactions ||
        (Array.isArray(data) ? data : []);
      // Ignore outdated responses if a newer filter request has already started.
      if (requestId !== requestIdRef.current) return;
      setTransactions(rows.map(normalizeTransaction));
      const pagination = payload.pagination || data.pagination || {};
      const nextTotal =
        Number(
          first(
            pagination.total,
            pagination.totalRecords,
            payload.total,
            rows.length,
          ),
        ) || 0;
      setTotal(nextTotal);
      setTotalPages(
        Math.max(
          1,
          Number(
            first(
              pagination.totalPages,
              pagination.total_pages,
              Math.ceil(nextTotal / limit),
            ),
          ) || 1,
        ),
      );
      const totals = payload.summary || data.summary || {};
      setSummary({
        completedTotal:
          Number(
            first(
              totals.completedTotal,
              totals.completed_total,
              totals.completed_amount,
              0,
            ),
          ) || 0,
        pendingTotal:
          Number(
            first(
              totals.pendingTotal,
              totals.pending_total,
              totals.pending_amount,
              0,
            ),
          ) || 0,
        refundedTotal:
          Number(
            first(
              totals.refundedTotal,
              totals.refunded_total,
              totals.refunded_amount,
              0,
            ),
          ) || 0,
      });
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      toast(
        error.response?.data?.message || "Failed to load transactions.",
        "error",
      );
      setTransactions([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    getAccounts();
    getProjects();
  }, []);

  useEffect(() => {
    fetchTransactions();
    // API requests are intentionally triggered whenever a query parameter changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    search,
    filters,
    status,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    sortBy,
    sortOrder,
    page,
    limit,
  ]);

  const currentPage = Math.min(page, totalPages);
  const pageRows = transactions;
  const pageIds = pageRows.map((item) => item.uuid);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const completedTotal = summary.completedTotal;
  const pendingTotal = summary.pendingTotal;
  const refundedTotal = summary.refundedTotal;

  // One updater for both individual state values and the filters object.
  function updateFilter(fieldOrSetter, value) {
    if (typeof fieldOrSetter === "function") {
      fieldOrSetter(value);
    } else {
      setFilters((prev) => ({ ...prev, [fieldOrSetter]: value }));
    }
    setPage(1);
  }

  function resetFilters() {
    setSearch("");
    setFilters({
      customer_id: "",
      project_id: "",
      plot_id: "",
      account_id: "",
      payment_method: "",
    });
    setStatus("");
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
    setSortBy("date");
    setSortOrder("desc");
    setPage(1);
    setSelectedIds([]);
    setSelectedTransactions({});
  }

  function handleSort(column) {
    if (sortBy === column)
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    else {
      setSortBy(column);
      setSortOrder(column === "date" ? "desc" : "asc");
    }
    setPage(1);
  }

  async function exportCsv(mode = "filtered") {
    setExporting(true);
    try {
      let rows = [];
      if (mode === "selected") {
        rows = Object.values(selectedTransactions).filter((tx) =>
          selectedIds.includes(tx.uuid),
        );
        // Also include selected records on the currently displayed page.
        pageRows.forEach((tx) => {
          if (
            selectedIds.includes(tx.uuid) &&
            !rows.some((row) => row.uuid === tx.uuid)
          )
            rows.push(tx);
        });
      } else {
        const res = await axios.get("/api/transactions/export", {
          params: buildParams(false),
          withCredentials: true,
        });
        const payload = res.data || {};
        const data = payload.data || {};
        const rawRows = Array.isArray(data)
          ? data
          : data.transactions || payload.transactions || data.data || [];
        rows = rawRows.map(normalizeTransaction);
      }

      if (!rows.length) {
        toast("There are no transactions to export.", "error");
        return;
      }
      const headers = [
        "Transaction ID",
        "Date",
        "Customer",
        "Phone",
        "Project",
        "Plot",
        "Booking",
        "Account",
        "Payment method",
        "Status",
        "Amount",
        "Received by",
        "Notes",
      ];
      const data = rows.map((tx) => [
        tx.number,
        tx.date,
        tx.customerName,
        tx.customerPhone,
        tx.projectName,
        tx.plotNumber,
        tx.booking,
        tx.accountName,
        tx.method,
        tx.status,
        tx.amount,
        tx.receivedBy,
        tx.note,
      ]);
      const escapeCell = (value) =>
        `"${String(value ?? "").replace(/"/g, '""')}"`;
      const csv = [headers, ...data]
        .map((row) => row.map(escapeCell).join(","))
        .join("\r\n");
      const blob = new Blob(["\uFEFF", csv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `transactions-${mode}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast(
        error.response?.data?.message || "Failed to export transactions.",
        "error",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6 text-[#14231d]">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#1b7a5a]">
            Payments & collections
          </p>
          <h1
            className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl"
            style={DISPLAY}
          >
            Transaction history<span style={{ color: GOLD }}>.</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#5b6b63]">
            Search, filter, sort and export every transaction from one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAddTransactionOpen(true)}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0b3d2e] px-4 text-sm font-semibold text-white transition hover:bg-[#145640]"
          >
            <Plus size={16} /> Add transaction
          </button>
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#dfe5dc] bg-white px-4 text-sm font-semibold hover:bg-[#f4f7f2]"
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
          <div className="group relative">
            <button
              type="button"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0b3d2e] px-4 text-sm font-semibold text-white hover:bg-[#145640]"
            >
              {exporting ? (
                <Loader size="xs" color="#ffffff" label="Exporting..." />
              ) : (
                <>
                  <Download size={16} /> Export <ChevronDown size={15} />
                </>
              )}
            </button>
            <div className="invisible absolute right-0 top-full z-40 mt-2 w-56 rounded-xl border border-[#dfe5dc] bg-white p-1.5 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <button
                type="button"
                onClick={() => exportCsv("filtered")}
                disabled={exporting}
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-slate-50"
              >
                Export all filtered results ({total})
              </button>
              <button
                type="button"
                disabled={!selectedIds.length || exporting}
                onClick={() => exportCsv("selected")}
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Export selected rows ({selectedIds.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#e5ebe2] bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#5b6b63]">
            Completed · filtered
          </p>
          <p className="mt-2 text-2xl font-semibold" style={DISPLAY}>
            {formatINR(completedTotal)}
          </p>
          <p className="mt-1 text-xs text-[#5b6b63]">
            Money received from completed payments
          </p>
        </div>
        <div className="rounded-2xl border border-[#e5ebe2] bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#5b6b63]">
            Pending · filtered
          </p>
          <p className="mt-2 text-2xl font-semibold" style={DISPLAY}>
            {formatINR(pendingTotal)}
          </p>
          <p className="mt-1 text-xs text-[#5b6b63]">Awaiting completion</p>
        </div>
        <div className="rounded-2xl border border-[#e5ebe2] bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#5b6b63]">
            Refund status · filtered
          </p>
          <p className="mt-2 text-2xl font-semibold" style={DISPLAY}>
            {formatINR(refundedTotal)}
          </p>
          <p className="mt-1 text-xs text-[#5b6b63]">
            Payment amounts marked refunded
          </p>
        </div>
      </div>

      <section className="overflow-visible rounded-2xl border border-[#e5ebe2] bg-white">
        <div className="space-y-4 border-b border-[#eef2ec] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) =>
                  updateFilter(setSearch, event.target.value)
                }
                placeholder="Search transaction, customer, phone, plot or booking..."
                className="min-h-11 w-full rounded-xl border border-[#dfe5dc] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#1b7a5a]"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-[#5b6b63]">
              Rows
              <select
                value={limit}
                onChange={(event) =>
                  updateFilter(setLimit, Number(event.target.value))
                }
                className="min-h-11 rounded-xl border border-[#dfe5dc] bg-white px-3 text-sm text-[#14231d]"
              >
                {[5, 8, 10, 20].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SearchableLeadSelect
              label="Customer"
              name="customer_id"
              apiUrl="/api/customers/dropdown"
              value={filters.customer_id}
              onChange={(value) =>
                updateFilter("customer_id", value.target.value)
              }
              placeholder="Select customer"
              searchPlaceholder="Search by name or phone..."
            />

            <Select
              id="project_id"
              name="project_id"
              label="Project"
              value={filters.project_id}
              onChange={(value) =>
                updateFilter("project_id", value.target.value)
              }
              placeholder="Select project"
              options={projects.map((project) => ({
                value: String(project.id),
                label: project.name,
              }))}
            />

            <SearchablePlotSelect2
              label="Plot"
              name="plot_id"
              value={filters.plot_id}
              onChange={(value) => updateFilter("plot_id", value.target.value)}
              placeholder="Select plot"
              searchPlaceholder="Search by plot number..."
            />

            <Select
              id="account_id"
              name="account_id"
              label="Receiving Account"
              value={filters.account_id}
              onChange={(value) =>
                updateFilter("account_id", value.target.value)
              }
              placeholder="Select receiving account"
              disabled={loadingAccounts || accounts.length === 0}
              options={accounts.map((account) => ({
                value: String(account.id),
                label: `${account.account_name} — ${account.bank_name}`,
              }))}
            />

            <Select
              id="payment_method"
              name="payment_method"
              label="Payment Method"
              value={filters.payment_method}
              onChange={(value) => updateFilter("payment_method", value)}
              placeholder="All payment methods"
              options={METHODS.filter(([value]) => value !== "All").map(
                ([value, label]) => ({
                  value,
                  label,
                }),
              )}
            />
          </div>

          {showFilters && (
            <div className="grid gap-3 rounded-xl bg-[#f8faf6] p-3 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#5b6b63]">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(event) =>
                    updateFilter(setStatus, event.target.value)
                  }
                  className="min-h-11 w-full rounded-xl border border-[#dfe5dc] bg-white px-3 text-sm"
                >
                  {STATUSES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#5b6b63]">
                  Start date
                </label>
                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(event) =>
                    updateFilter(setStartDate, event.target.value)
                  }
                  className="min-h-11 w-full rounded-xl border border-[#dfe5dc] bg-white px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#5b6b63]">
                  End date
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) =>
                    updateFilter(setEndDate, event.target.value)
                  }
                  className="min-h-11 w-full rounded-xl border border-[#dfe5dc] bg-white px-3 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#5b6b63]">
                    Min amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minAmount}
                    onChange={(event) =>
                      updateFilter(setMinAmount, event.target.value)
                    }
                    placeholder="₹ 0"
                    className="min-h-11 w-full rounded-xl border border-[#dfe5dc] bg-white px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#5b6b63]">
                    Max amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maxAmount}
                    onChange={(event) =>
                      updateFilter(setMaxAmount, event.target.value)
                    }
                    placeholder="No limit"
                    className="min-h-11 w-full rounded-xl border border-[#dfe5dc] bg-white px-3 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-end xl:col-span-4">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-bold text-[#1b7a5a] hover:bg-white"
                >
                  <X size={15} /> Clear all filters
                </button>
              </div>
            </div>
          )}
          {(loadingAccounts || loadingProjects) && (
            <div className="flex flex-wrap gap-4">
              {loadingAccounts && (
                <Loader size="sm" label="Loading accounts..." />
              )}
              {loadingProjects && (
                <Loader size="sm" label="Loading projects..." />
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs text-[#5b6b63]">
                {total} matching transaction
                {total === 1 ? "" : "s"} · live results
              </p>
              <button
                type="button"
                onClick={fetchTransactions}
                disabled={loading}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#0b3d2e] px-4 text-sm font-semibold text-white transition hover:bg-[#145640] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <Loader size="xs" color="#ffffff" />
                ) : (
                  <SlidersHorizontal size={15} />
                )}
                {loading ? "Applying filters" : "Apply filters"}
              </button>
            </div>
            <label className="flex items-center gap-2 text-xs text-[#5b6b63]">
              Sort by
              <select
                value={sortBy}
                onChange={(event) => {
                  setSortBy(event.target.value);
                  setPage(1);
                }}
                className="min-h-9 rounded-lg border border-[#dfe5dc] bg-white px-2 text-sm text-[#14231d]"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="customer">Customer</option>
                <option value="number">Transaction ID</option>
                <option value="status">Status</option>
              </select>
              <button
                type="button"
                onClick={() =>
                  setSortOrder((value) => (value === "asc" ? "desc" : "asc"))
                }
                aria-label="Toggle sort direction"
                className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe5dc] bg-white"
              >
                {sortOrder === "asc" ? (
                  <ArrowUp size={15} />
                ) : (
                  <ArrowDown size={15} />
                )}
              </button>
            </label>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dcece1] bg-[#f0f8f2] px-4 py-3">
            <p className="text-sm font-semibold text-[#0b3d2e]">
              {selectedIds.length} transaction
              {selectedIds.length === 1 ? "" : "s"} selected
            </p>
            <button
              type="button"
              onClick={() => exportCsv("selected")}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0b3d2e] px-3 py-2 text-xs font-bold text-white"
            >
              <Download size={14} /> Export selected CSV
            </button>
          </div>
        )}

        <div className="relative overflow-x-auto">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-start justify-center bg-white/75 px-4 py-12 backdrop-blur-[1px]">
              <Loader size="lg" label="Loading transactions..." centered />
            </div>
          )}
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead>
              <tr className="bg-[#f4f7f2] text-[10px] font-bold uppercase tracking-[0.12em] text-[#5b6b63]">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select current page"
                    checked={allPageSelected}
                    onChange={(event) =>
                      setSelectedIds((current) => {
                        const next = event.target.checked
                          ? [...new Set([...current, ...pageIds])]
                          : current.filter((id) => !pageIds.includes(id));
                        setSelectedTransactions((cached) => {
                          const updated = { ...cached };
                          pageRows.forEach((tx) => {
                            if (event.target.checked) updated[tx.uuid] = tx;
                          });
                          return updated;
                        });
                        return next;
                      })
                    }
                  />
                </th>
                <SortableHeader
                  label="Transaction"
                  column="number"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Customer"
                  column="customer"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-4 py-3">Plot / project</th>
                <th className="px-4 py-3">Account / method</th>
                <SortableHeader
                  label="Date"
                  column="date"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Amount"
                  column="amount"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <Loader
                      size="lg"
                      centered
                      label="Loading transactions..."
                    />
                  </td>
                </tr>
              ) : pageRows.length ? (
                pageRows.map((tx) => {
                  const selected = selectedIds.includes(tx.uuid);
                  const incoming = tx.status === "completed";
                  const installmentProgress = getInstallmentProgress(tx);
                  return (
                    <tr
                      key={tx.uuid}
                      className="group cursor-pointer border-t border-[#eef2ec] transition hover:bg-[#f8faf6]"
                      onClick={() => setDetail(tx)}
                    >
                      <td
                        className="px-4 py-4"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          aria-label={`Select ${tx.number}`}
                          checked={selected}
                          onChange={(event) =>
                            setSelectedIds((current) => {
                              const next = event.target.checked
                                ? [...new Set([...current, tx.uuid])]
                                : current.filter((id) => id !== tx.uuid);
                              setSelectedTransactions((cached) => ({
                                ...cached,
                                [tx.uuid]: tx,
                              }));
                              return next;
                            })
                          }
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${incoming ? "bg-[#e9f3ee] text-[#1b7a5a]" : "bg-slate-100 text-slate-600"}`}
                          >
                            {incoming ? (
                              <ArrowDownLeft size={18} />
                            ) : (
                              <ArrowUpRight size={18} />
                            )}
                          </span>
                          <div>
                            <p className="font-bold text-[#14231d]">
                              {tx.number}
                            </p>
                            {tx.note && (
                              <p className="mt-1 max-w-[170px] truncate text-xs text-[#839087]">
                                {tx.note}
                              </p>
                            )}
                            <InstallmentProgress
                              progress={installmentProgress}
                            />
                          </div>
                        </div>
                      </td>
                      <td
                        onClick={() => {
                          navigate("/customer/profile", {
                            state: {
                              uuid: tx.uuid,
                            },
                          });
                        }}
                        className="px-4 py-4 cursor-pointer"
                      >
                        <p className="font-semibold">
                          {tx.customerName || "—"}
                        </p>
                        <p className="mt-1 text-xs text-[#839087]">
                          {tx.customerPhone || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold">{tx.plotNumber || "—"}</p>
                        <p className="mt-1 text-xs text-[#839087]">
                          {tx.projectName || "—"} · {tx.booking}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold">{tx.accountName || "—"}</p>
                        <p className="mt-1 text-xs capitalize text-[#839087]">
                          {String(tx.method || "other").replaceAll("_", " ")}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-[#5b6b63]">
                        {formatDateTime(tx.date)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <p
                          className={`font-bold ${incoming ? "text-emerald-700" : "text-[#14231d]"}`}
                        >
                          {incoming ? "+" : ""}
                          {formatINR(tx.amount)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={tx.status} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f3ee] text-[#1b7a5a]">
                      <Search size={20} />
                    </span>
                    <div className="mt-4 font-bold">
                      {loading ? (
                        <Loader
                          size="md"
                          label="Loading transactions..."
                          centered
                        />
                      ) : (
                        "No transactions found"
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[#5b6b63]">
                      Try a different search or clear your filters.
                    </p>
                    <button
                      type="button"
                      onClick={resetFilters}
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

        <div className="flex flex-col gap-3 border-t border-[#eef2ec] bg-[#fafcf9] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#5b6b63]">
            Showing{" "}
            <b className="text-[#14231d]">
              {total ? (currentPage - 1) * limit + 1 : 0}
            </b>
            –
            <b className="text-[#14231d]">
              {Math.min(currentPage * limit, total)}
            </b>{" "}
            of <b className="text-[#14231d]">{total}</b> transactions
          </p>
          <div className="flex items-center gap-2">
            <span className="mr-2 text-xs text-[#5b6b63]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={loading || currentPage <= 1}
              aria-label="Previous page"
              className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe5dc] bg-white text-[#0b3d2e] disabled:opacity-40"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={loading || currentPage >= totalPages}
              aria-label="Next page"
              className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe5dc] bg-white text-[#0b3d2e] disabled:opacity-40"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>

      <Modal
        open={addTransactionOpen}
        onClose={() => {
          if (savingTransaction) return;
          setAddTransactionOpen(false);
        }}
        size="lg"
        title="Add transaction"
        description="Record an income or expense transaction."
        footer={
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              disabled={savingTransaction}
              onClick={() => setAddTransactionOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={savingTransaction}
              onClick={() =>
                document.getElementById("add-transaction-form")?.requestSubmit()
              }
            >
              {savingTransaction ? (
                <Loader
                  size="xs"
                  variant="spinner"
                  color="#ffffff"
                  label="Saving..."
                />
              ) : (
                <Plus size={16} className="mr-2" />
              )}
              {savingTransaction ? "Saving transaction..." : "Save transaction"}
            </Button>
          </div>
        }
      >
        <form
          id="add-transaction-form"
          onSubmit={handleAddTransaction}
          className="space-y-5"
        >
          <div className="rounded-xl bg-[#e9f6ef] p-4 text-[#0b3d2e]">
            <p className="text-xs font-semibold uppercase tracking-wider">
              New transaction
            </p>
            <p className="mt-1 text-sm text-[#426b56]">
              Select the party, category and account, then enter the amount.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SearchablePartySelect
              apiUrl="/api/parties"
              name="party_id"
              label="Customer"
              // value={formData.party_id}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  party_id: e.target.value,
                }))
              }
            />
            <Select
              label="Transaction type"
              name="transaction_type"
              value={newTransaction.transaction_type}
              onChange={(event) =>
                setNewTransaction((current) => ({
                  ...current,
                  transaction_type: event.target.value,
                }))
              }
              options={[
                { value: "income", label: "Income" },
                { value: "expense", label: "Expense" },
              ]}
              required
              disabled={savingTransaction}
            />
            <Select
              label="Category"
              name="category_id"
              value={newTransaction.category_id}
              onChange={(event) =>
                setNewTransaction((current) => ({
                  ...current,
                  category_id: event.target.value,
                }))
              }
              placeholder="Select category"
              options={STATIC_CATEGORIES}
              required
              disabled={savingTransaction}
            />
            <Input
              label="Amount (₹)"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={newTransaction.amount}
              onChange={(event) =>
                setNewTransaction((current) => ({
                  ...current,
                  amount: event.target.value,
                }))
              }
              placeholder="Enter amount"
              required
              disabled={savingTransaction}
            />
            <Select
              label="Account"
              name="account_id"
              value={newTransaction.account_id}
              onChange={(event) =>
                setNewTransaction((current) => ({
                  ...current,
                  account_id: event.target.value,
                }))
              }
              placeholder="Select account"
              options={STATIC_ACCOUNTS}
              required
              disabled={savingTransaction}
            />
            <Select
              label="Payment method"
              name="payment_method"
              value={newTransaction.payment_method}
              onChange={(event) =>
                setNewTransaction((current) => ({
                  ...current,
                  payment_method: event.target.value,
                }))
              }
              options={METHODS.map(([value, label]) => ({ value, label }))}
              required
              disabled={savingTransaction}
            />
            <Input
              wrapperClassName="sm:col-span-2"
              label="Transaction date"
              name="transaction_date"
              type="date"
              value={newTransaction.transaction_date}
              onChange={(event) =>
                setNewTransaction((current) => ({
                  ...current,
                  transaction_date: event.target.value,
                }))
              }
              disabled={savingTransaction}
            />
          </div>

          <div>
            <label
              htmlFor="transaction-notes"
              className="mb-2 block text-sm font-semibold text-[#14231d]"
            >
              Notes{" "}
              <span className="font-normal text-[#89958d]">(optional)</span>
            </label>
            <textarea
              id="transaction-notes"
              name="notes"
              value={newTransaction.notes}
              onChange={(event) =>
                setNewTransaction((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              rows={3}
              disabled={savingTransaction}
              placeholder="Add a note about this transaction..."
              className="w-full resize-y rounded-xl border border-[#dfe5dc] bg-white px-3.5 py-3 text-sm text-[#14231d] outline-none transition placeholder:text-[#9aa59d] focus:border-[#1b7a5a] focus:ring-4 focus:ring-[#1b7a5a]/10 disabled:bg-slate-50"
            />
          </div>
        </form>
      </Modal>

      {detail && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetail(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-detail-title"
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#1b7a5a]">
                  Transaction details
                </p>
                <h2
                  id="transaction-detail-title"
                  className="mt-1 text-2xl font-semibold"
                  style={DISPLAY}
                >
                  {detail.number}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                aria-label="Close details"
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 rounded-xl bg-[#f4f7f2] p-4">
              <p className="text-xs text-[#5b6b63]">Transaction amount</p>
              <p className="mt-1 text-3xl font-semibold" style={DISPLAY}>
                {formatINR(detail.amount)}
              </p>
              <div className="mt-3">
                <StatusBadge status={detail.status} />
              </div>
            </div>
            <dl className="mt-4 divide-y divide-[#eef2ec] text-sm">
              {[
                ["Customer", detail.customerName],
                ["Phone", detail.customerPhone],
                ["Project", detail.projectName],
                ["Plot", detail.plotNumber],
                ["Booking", detail.booking],
                ["Account", detail.accountName],
                [
                  "Payment method",
                  String(detail.method || "other").replaceAll("_", " "),
                ],
                ["Date", formatDate(detail.date)],
                ["Received by", detail.receivedBy],
                ["Notes", detail.note],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-3">
                  <dt className="text-[#5b6b63]">{label}</dt>
                  <dd className="max-w-[65%] text-right font-semibold capitalize">
                    {value || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      )}
      <p className="text-center text-xs text-[#839087]">
        Transaction history is loaded from your payments API.
      </p>
    </div>
  );
}
