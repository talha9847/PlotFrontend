import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Search,
  SlidersHorizontal,
  Wallet,
  X,
} from "lucide-react";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };
const GOLD = "#e4c48a";

const CUSTOMERS = [
  { uuid: "cus-001", name: "Aarav Patel", phone: "9876543210" },
  { uuid: "cus-002", name: "Fatima Shaikh", phone: "9825012345" },
  { uuid: "cus-003", name: "Rohan Mehta", phone: "9898012345" },
  { uuid: "cus-004", name: "Priya Desai", phone: "9712345678" },
  { uuid: "cus-005", name: "Imran Malek", phone: "9909012345" },
  { uuid: "cus-006", name: "Neha Shah", phone: "9723456789" },
];

const PLOTS = [
  { uuid: "plot-001", number: "A-101", project: "Green Valley" },
  { uuid: "plot-002", number: "A-102", project: "Green Valley" },
  { uuid: "plot-003", number: "B-204", project: "Sunrise Residency" },
  { uuid: "plot-004", number: "C-012", project: "Riverfront Enclave" },
  { uuid: "plot-005", number: "C-013", project: "Riverfront Enclave" },
  { uuid: "plot-006", number: "D-008", project: "Sunrise Residency" },
];

const ACCOUNTS = [
  { uuid: "acc-001", name: "HDFC Bank", detail: "Current account" },
  { uuid: "acc-002", name: "ICICI Bank", detail: "Collection account" },
  { uuid: "acc-003", name: "Cash Account", detail: "Office collections" },
];

const TRANSACTIONS = [
  {
    uuid: "txn-001",
    number: "PAY-2026-0108",
    date: "2026-10-18T10:30:00",
    customerUuid: "cus-001",
    plotUuid: "plot-001",
    accountUuid: "acc-001",
    method: "upi",
    status: "completed",
    amount: 50000,
    booking: "BK-1001",
    receivedBy: "Ayesha Khan",
    note: "October installment",
  },
  {
    uuid: "txn-002",
    number: "PAY-2026-0107",
    date: "2026-10-17T15:15:00",
    customerUuid: "cus-002",
    plotUuid: "plot-003",
    accountUuid: "acc-003",
    method: "cash",
    status: "completed",
    amount: 25000,
    booking: "BK-1002",
    receivedBy: "Rahul Patel",
    note: "Booking payment",
  },
  {
    uuid: "txn-003",
    number: "PAY-2026-0106",
    date: "2026-10-16T12:20:00",
    customerUuid: "cus-003",
    plotUuid: "plot-004",
    accountUuid: "acc-002",
    method: "bank_transfer",
    status: "refunded",
    amount: 10000,
    booking: "BK-1003",
    receivedBy: "Ayesha Khan",
    note: "Payment refund",
  },
  {
    uuid: "txn-004",
    number: "PAY-2026-0105",
    date: "2026-10-15T09:45:00",
    customerUuid: "cus-004",
    plotUuid: "plot-002",
    accountUuid: "acc-001",
    method: "cheque",
    status: "pending",
    amount: 75000,
    booking: "BK-1004",
    receivedBy: "Mehul Shah",
    note: "Cheque under clearance",
  },
  {
    uuid: "txn-005",
    number: "PAY-2026-0104",
    date: "2026-10-12T16:05:00",
    customerUuid: "cus-005",
    plotUuid: "plot-006",
    accountUuid: "acc-003",
    method: "cash",
    status: "completed",
    amount: 15000,
    booking: "BK-1005",
    receivedBy: "Rahul Patel",
    note: "Part payment",
  },
  {
    uuid: "txn-006",
    number: "PAY-2026-0103",
    date: "2026-10-09T11:25:00",
    customerUuid: "cus-006",
    plotUuid: "plot-005",
    accountUuid: "acc-002",
    method: "upi",
    status: "failed",
    amount: 12000,
    booking: "BK-1006",
    receivedBy: "Mehul Shah",
    note: "UPI payment failed",
  },
  {
    uuid: "txn-007",
    number: "PAY-2026-0102",
    date: "2026-10-06T13:50:00",
    customerUuid: "cus-001",
    plotUuid: "plot-001",
    accountUuid: "acc-001",
    method: "bank_transfer",
    status: "completed",
    amount: 100000,
    booking: "BK-1001",
    receivedBy: "Ayesha Khan",
    note: "Down payment",
  },
  {
    uuid: "txn-008",
    number: "PAY-2026-0101",
    date: "2026-10-02T10:10:00",
    customerUuid: "cus-002",
    plotUuid: "plot-003",
    accountUuid: "acc-002",
    method: "card",
    status: "cancelled",
    amount: 8000,
    booking: "BK-1002",
    receivedBy: "Rahul Patel",
    note: "Cancelled transaction",
  },
  {
    uuid: "txn-009",
    number: "PAY-2026-0099",
    date: "2026-09-29T14:35:00",
    customerUuid: "cus-004",
    plotUuid: "plot-002",
    accountUuid: "acc-001",
    method: "upi",
    status: "completed",
    amount: 30000,
    booking: "BK-1004",
    receivedBy: "Mehul Shah",
    note: "September installment",
  },
  {
    uuid: "txn-010",
    number: "PAY-2026-0098",
    date: "2026-09-21T12:00:00",
    customerUuid: "cus-003",
    plotUuid: "plot-004",
    accountUuid: "acc-002",
    method: "bank_transfer",
    status: "completed",
    amount: 45000,
    booking: "BK-1003",
    receivedBy: "Ayesha Khan",
    note: "Installment payment",
  },
  {
    uuid: "txn-011",
    number: "PAY-2026-0097",
    date: "2026-09-16T17:10:00",
    customerUuid: "cus-005",
    plotUuid: "plot-006",
    accountUuid: "acc-003",
    method: "cash",
    status: "pending",
    amount: 20000,
    booking: "BK-1005",
    receivedBy: "Rahul Patel",
    note: "Cash receipt pending verification",
  },
  {
    uuid: "txn-012",
    number: "PAY-2026-0096",
    date: "2026-09-04T09:20:00",
    customerUuid: "cus-006",
    plotUuid: "plot-005",
    accountUuid: "acc-001",
    method: "cheque",
    status: "completed",
    amount: 60000,
    booking: "BK-1006",
    receivedBy: "Mehul Shah",
    note: "Booking installment",
  },
];

const METHODS = [
  ["All", "All methods"],
  ["cash", "Cash"],
  ["upi", "UPI"],
  ["bank_transfer", "Bank transfer"],
  ["card", "Card"],
  ["cheque", "Cheque"],
  ["other", "Other"],
];

const STATUSES = [
  ["All", "All statuses"],
  ["pending", "Pending"],
  ["completed", "Completed"],
  ["failed", "Failed"],
  ["cancelled", "Cancelled"],
  ["partially_refunded", "Partially refunded"],
  ["refunded", "Refunded"],
];

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

function StatusBadge({ status }) {
  const styles = {
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    failed: "bg-red-50 text-red-700 ring-red-600/20",
    cancelled: "bg-slate-100 text-slate-600 ring-slate-500/20",
    refunded: "bg-blue-50 text-blue-700 ring-blue-600/20",
    partially_refunded: "bg-violet-50 text-violet-700 ring-violet-600/20",
  };
  const label = status.replaceAll("_", " ");
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${styles[status] || styles.pending}`}
    >
      {label}
    </span>
  );
}

function SearchableDummySelect({
  label,
  placeholder,
  searchPlaceholder,
  options,
  value,
  onChange,
  getLabel,
  getSubtitle,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);

  const selected = options.find((option) => option.uuid === value);
  const filtered = options.filter((option) =>
    `${getLabel(option)} ${getSubtitle(option)}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  useEffect(() => {
    function close(event) {
      if (!ref.current?.contains(event.target)) setOpen(false);
    }
    function escape(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div className="relative min-w-0" ref={ref}>
      <label className="mb-1.5 block text-xs font-bold text-[#5b6b63]">
        {label}
      </label>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-[#dfe5dc] bg-white px-3 py-2 text-left text-sm outline-none transition hover:border-[#b9c9bc] focus:border-[#1b7a5a]"
      >
        <span
          className={`truncate ${selected ? "text-[#14231d]" : "text-slate-400"}`}
        >
          {selected ? getLabel(selected) : placeholder}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {selected && (
            <span
              role="button"
              tabIndex={0}
              aria-label={`Clear ${label}`}
              onClick={(event) => {
                event.stopPropagation();
                onChange("");
                setSearch("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onChange("");
                  setSearch("");
                }
              }}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-100"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={15}
            className={`text-slate-400 transition ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-[#dfe5dc] bg-white shadow-xl">
          <div className="border-b border-[#edf0eb] p-2">
            <div className="flex items-center gap-2 rounded-lg border border-[#dfe5dc] px-2.5">
              <Search size={15} className="text-slate-400" />
              <input
                ref={inputRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 w-full min-w-0 bg-transparent text-sm outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
          <ul role="listbox" className="max-h-56 overflow-y-auto p-1.5">
            <li
              role="option"
              aria-selected={!value}
              onClick={() => {
                onChange("");
                setOpen(false);
                setSearch("");
              }}
              className={`cursor-pointer rounded-lg px-3 py-2.5 text-sm ${!value ? "bg-[#e9f3ee] text-[#1b7a5a]" : "hover:bg-slate-50"}`}
            >
              {placeholder}
            </li>
            {filtered.length ? (
              filtered.map((option) => (
                <li
                  key={option.uuid}
                  role="option"
                  aria-selected={value === option.uuid}
                  onClick={() => {
                    onChange(option.uuid);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm ${value === option.uuid ? "bg-[#e9f3ee] text-[#1b7a5a]" : "hover:bg-slate-50"}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">
                      {getLabel(option)}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {getSubtitle(option)}
                    </span>
                  </span>
                  {value === option.uuid && <Check size={15} />}
                </li>
              ))
            ) : (
              <li className="px-3 py-6 text-center text-sm text-slate-500">
                No results found.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
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

export default function TransactionHistoryDummy() {
  const [transactions] = useState(TRANSACTIONS);
  const [search, setSearch] = useState("");
  const [customerUuid, setCustomerUuid] = useState("");
  const [plotUuid, setPlotUuid] = useState("");
  const [accountUuid, setAccountUuid] = useState("");
  const [method, setMethod] = useState("All");
  const [status, setStatus] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [detail, setDetail] = useState(null);

  const customerById = useMemo(
    () => Object.fromEntries(CUSTOMERS.map((item) => [item.uuid, item])),
    [],
  );
  const plotById = useMemo(
    () => Object.fromEntries(PLOTS.map((item) => [item.uuid, item])),
    [],
  );
  const accountById = useMemo(
    () => Object.fromEntries(ACCOUNTS.map((item) => [item.uuid, item])),
    [],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = transactions.filter((tx) => {
      const customer = customerById[tx.customerUuid];
      const plot = plotById[tx.plotUuid];
      const account = accountById[tx.accountUuid];
      const matchesSearch =
        !term ||
        [
          tx.number,
          tx.booking,
          tx.note,
          tx.method,
          tx.status,
          customer?.name,
          customer?.phone,
          plot?.number,
          plot?.project,
          account?.name,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(term),
        );
      const day = tx.date.slice(0, 10);
      return (
        matchesSearch &&
        (!customerUuid || tx.customerUuid === customerUuid) &&
        (!plotUuid || tx.plotUuid === plotUuid) &&
        (!accountUuid || tx.accountUuid === accountUuid) &&
        (method === "All" || tx.method === method) &&
        (status === "All" || tx.status === status) &&
        (!startDate || day >= startDate) &&
        (!endDate || day <= endDate) &&
        (minAmount === "" || tx.amount >= Number(minAmount)) &&
        (maxAmount === "" || tx.amount <= Number(maxAmount))
      );
    });

    const getSortValue = (tx) => {
      if (sortBy === "amount") return tx.amount;
      if (sortBy === "customer")
        return customerById[tx.customerUuid]?.name || "";
      if (sortBy === "number") return tx.number;
      if (sortBy === "status") return tx.status;
      return new Date(tx.date).getTime();
    };
    result.sort((a, b) => {
      const av = getSortValue(a);
      const bv = getSortValue(b);
      const comparison =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortOrder === "asc" ? comparison : -comparison;
    });
    return result;
  }, [
    transactions,
    search,
    customerUuid,
    plotUuid,
    accountUuid,
    method,
    status,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    sortBy,
    sortOrder,
    customerById,
    plotById,
    accountById,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * limit,
    currentPage * limit,
  );
  const pageIds = pageRows.map((item) => item.uuid);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const completedTotal = filtered
    .filter((tx) => tx.status === "completed")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const pendingTotal = filtered
    .filter((tx) => tx.status === "pending")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const refundedTotal = filtered
    .filter(
      (tx) => tx.status === "refunded" || tx.status === "partially_refunded",
    )
    .reduce((sum, tx) => sum + tx.amount, 0);

  function updateFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  function resetFilters() {
    setSearch("");
    setCustomerUuid("");
    setPlotUuid("");
    setAccountUuid("");
    setMethod("All");
    setStatus("All");
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
    setSortBy("date");
    setSortOrder("desc");
    setPage(1);
    setSelectedIds([]);
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

  function exportCsv(mode = "filtered") {
    const rows =
      mode === "selected"
        ? filtered.filter((tx) => selectedIds.includes(tx.uuid))
        : filtered;
    if (!rows.length) {
      window.alert("There are no transactions to export.");
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
    const data = rows.map((tx) => {
      const customer = customerById[tx.customerUuid];
      const plot = plotById[tx.plotUuid];
      const account = accountById[tx.accountUuid];
      return [
        tx.number,
        tx.date,
        customer?.name,
        customer?.phone,
        plot?.project,
        plot?.number,
        tx.booking,
        account?.name,
        tx.method,
        tx.status,
        tx.amount,
        tx.receivedBy,
        tx.note,
      ];
    });
    const escapeCell = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [headers, ...data]
      .map((row) => row.map(escapeCell).join(","))
      .join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transactions-${mode}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
              <Download size={16} /> Export <ChevronDown size={15} />
            </button>
            <div className="invisible absolute right-0 top-full z-40 mt-2 w-56 rounded-xl border border-[#dfe5dc] bg-white p-1.5 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <button
                type="button"
                onClick={() => exportCsv("filtered")}
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-slate-50"
              >
                Export all filtered results ({filtered.length})
              </button>
              <button
                type="button"
                disabled={!selectedIds.length}
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
            <SearchableDummySelect
              label="Customer"
              placeholder="All customers"
              searchPlaceholder="Search name or phone..."
              options={CUSTOMERS}
              value={customerUuid}
              onChange={(value) => updateFilter(setCustomerUuid, value)}
              getLabel={(item) => item.name}
              getSubtitle={(item) => item.phone}
            />
            <SearchableDummySelect
              label="Plot / project"
              placeholder="All plots"
              searchPlaceholder="Search plot or project..."
              options={PLOTS}
              value={plotUuid}
              onChange={(value) => updateFilter(setPlotUuid, value)}
              getLabel={(item) => item.number}
              getSubtitle={(item) => item.project}
            />
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#5b6b63]">
                Account
              </label>
              <select
                value={accountUuid}
                onChange={(event) =>
                  updateFilter(setAccountUuid, event.target.value)
                }
                className="min-h-11 w-full rounded-xl border border-[#dfe5dc] bg-white px-3 text-sm outline-none focus:border-[#1b7a5a]"
              >
                <option value="">All accounts</option>
                {ACCOUNTS.map((account) => (
                  <option key={account.uuid} value={account.uuid}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#5b6b63]">
                Payment method
              </label>
              <select
                value={method}
                onChange={(event) =>
                  updateFilter(setMethod, event.target.value)
                }
                className="min-h-11 w-full rounded-xl border border-[#dfe5dc] bg-white px-3 text-sm outline-none focus:border-[#1b7a5a]"
              >
                {METHODS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-[#5b6b63]">
              {filtered.length} matching transaction
              {filtered.length === 1 ? "" : "s"} · dummy data
            </p>
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

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead>
              <tr className="bg-[#f4f7f2] text-[10px] font-bold uppercase tracking-[0.12em] text-[#5b6b63]">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select current page"
                    checked={allPageSelected}
                    onChange={(event) =>
                      setSelectedIds((current) =>
                        event.target.checked
                          ? [...new Set([...current, ...pageIds])]
                          : current.filter((id) => !pageIds.includes(id)),
                      )
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
              {pageRows.length ? (
                pageRows.map((tx) => {
                  const customer = customerById[tx.customerUuid];
                  const plot = plotById[tx.plotUuid];
                  const account = accountById[tx.accountUuid];
                  const selected = selectedIds.includes(tx.uuid);
                  const incoming = tx.status === "completed";
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
                            setSelectedIds((current) =>
                              event.target.checked
                                ? [...current, tx.uuid]
                                : current.filter((id) => id !== tx.uuid),
                            )
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
                            <p className="mt-1 max-w-[170px] truncate text-xs text-[#839087]">
                              {tx.note}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold">{customer?.name || "—"}</p>
                        <p className="mt-1 text-xs text-[#839087]">
                          {customer?.phone || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold">{plot?.number || "—"}</p>
                        <p className="mt-1 text-xs text-[#839087]">
                          {plot?.project || "—"} · {tx.booking}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold">{account?.name || "—"}</p>
                        <p className="mt-1 text-xs capitalize text-[#839087]">
                          {tx.method.replaceAll("_", " ")}
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
                    <p className="mt-4 font-bold">No transactions found</p>
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
              {filtered.length ? (currentPage - 1) * limit + 1 : 0}
            </b>
            –
            <b className="text-[#14231d]">
              {Math.min(currentPage * limit, filtered.length)}
            </b>{" "}
            of <b className="text-[#14231d]">{filtered.length}</b> transactions
          </p>
          <div className="flex items-center gap-2">
            <span className="mr-2 text-xs text-[#5b6b63]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage <= 1}
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
              disabled={currentPage >= totalPages}
              aria-label="Next page"
              className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe5dc] bg-white text-[#0b3d2e] disabled:opacity-40"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>

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
                ["Customer", customerById[detail.customerUuid]?.name],
                ["Phone", customerById[detail.customerUuid]?.phone],
                ["Project", plotById[detail.plotUuid]?.project],
                ["Plot", plotById[detail.plotUuid]?.number],
                ["Booking", detail.booking],
                ["Account", accountById[detail.accountUuid]?.name],
                ["Payment method", detail.method.replaceAll("_", " ")],
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
        Demo screen · all transaction and account records are dummy data.
      </p>
    </div>
  );
}
