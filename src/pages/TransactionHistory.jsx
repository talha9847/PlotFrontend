import { useEffect, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  RotateCcw,
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
import PaymentAccountFields from "../components/common/PaymentAccountFields";
import FinancialSummary from "../components/finance/FinancialSummary";
import { useToast } from "../components/common/Toast";
import { useAuth } from "../context/authContext";
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

const SOURCE_TYPES = [
  ["", "All sources"],
  ["payment", "Payment receipt"],
  ["financial_transaction", "Income / expense"],
  ["account_transfer", "Account transfer"],
  ["payment_reversal", "Refund"],
];

const KINDS = [
  ["", "All kinds"],
  ["booking_token", "Booking token"],
  ["down_payment", "Down payment"],
  ["installment", "Installment"],
  ["income", "Income"],
  ["expense", "Expense"],
  ["transfer", "Transfer"],
  ["refund", "Refund"],
];

const DIRECTIONS = [
  ["", "All directions"],
  ["credit", "Money in"],
  ["debit", "Money out"],
];

const CHANNELS = [
  ["", "All accounts"],
  ["cash", "Cash"],
  ["bank", "Bank"],
];

const KIND_LABELS = Object.fromEntries(KINDS.filter(([value]) => value));
const SOURCE_LABELS = Object.fromEntries(
  SOURCE_TYPES.filter(([value]) => value),
);

const formatKind = (kind) =>
  KIND_LABELS[kind] || String(kind || "—").replaceAll("_", " ");

const first = (...values) =>
  values.find((value) => value !== undefined && value !== null);

function normalizeTransaction(row) {
  const sourceType = first(row.sourceType, row.source_type, "payment");
  const sourceUuid = String(
    first(
      row.sourceUuid,
      row.source_uuid,
      row.payment_uuid,
      row.uuid,
      row.id,
      "",
    ),
  );
  const sourceRowId = String(
    first(row.sourceRowId, row.source_row_id, "") || "",
  );
  const kind = first(
    row.kind,
    row.payment_purpose,
    row.paymentPurpose,
    "installment",
  );
  const direction = first(
    row.direction,
    kind === "expense" ? "debit" : "credit",
  );

  return {
    ...row,
    // Transfer legs share a source UUID, so the row id keeps them distinct.
    key: `${sourceType}:${sourceRowId || sourceUuid}`,
    sourceType,
    sourceUuid,
    sourceRowId,
    sourceLabel: SOURCE_LABELS[sourceType] || sourceType,
    id: first(
      sourceRowId,
      row.source_row_id,
      row.id,
      row.payment_id,
      sourceUuid,
    ),
    uuid: sourceUuid,
    number: first(
      row.transactionNumber,
      row.transaction_number,
      row.payment_number,
      row.paymentNumber,
      "—",
    ),
    date: first(
      row.transactionDate,
      row.transaction_date,
      row.payment_date,
      row.paymentDate,
      "",
    ),
    kind,
    kindLabel: formatKind(kind),
    direction,
    channel: first(row.channel, row.account_type, ""),
    customerId: first(
      row.customer_id,
      row.customerId,
      row.customer_uuid,
      row.customerUuid,
      "",
    ),
    customerUuid: first(row.customerUuid, row.customer_uuid, ""),
    customerName: first(row.customer_name, row.customerName, ""),
    customerPhone: first(row.customer_phone, row.customerPhone, ""),
    partyName: first(row.partyName, row.party_name, ""),
    displayPartyName: first(
      row.displayPartyName,
      row.display_party_name,
      row.customerName,
      row.customer_name,
      row.partyName,
      row.party_name,
      "—",
    ),
    categoryName: first(row.categoryName, row.category_name, ""),
    projectId: first(row.project_id, row.projectId, ""),
    projectName: first(row.project_name, row.projectName, row.project, "—"),
    plotId: first(row.plot_id, row.plotId, ""),
    plotNumber: first(row.plot_number, row.plotNumber, "—"),
    accountId: first(row.account_id, row.accountId, ""),
    accountName: first(row.account_name, row.accountName, "—"),
    bankName: first(row.bank_name, row.bankName, ""),
    method: first(row.payment_method, row.paymentMethod, row.method, "other"),
    status: first(row.status, "pending"),
    amount: Number(first(row.amount, 0)),
    booking: first(row.bookingNumber, row.booking_number, row.booking, "—"),
    bookingNumber: first(row.bookingNumber, row.booking_number, ""),
    bookingUuid: first(row.bookingUuid, row.booking_uuid, ""),
    referenceNumber: first(
      row.referenceNumber,
      row.reference_number,
      row.transaction_reference,
      "",
    ),
    installmentNumber: first(
      row.installmentNumber,
      row.installment_number,
      "",
    ),
    installmentCount: first(row.installmentCount, row.installment_count, ""),
    receivedBy: first(
      row.createdByName,
      row.created_by_name,
      row.received_by_name,
      row.receivedBy,
      row.received_by,
      "—",
    ),
    note: first(row.notes, row.note, ""),
    countsAsBalance: Boolean(
      first(row.countsAsBalance, row.counts_as_balance, false),
    ),
    createdAt: first(row.createdAt, row.created_at, ""),
    updatedAt: first(row.updatedAt, row.updated_at, ""),
  };
}

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const isDateOnly = (value) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const parseDate = (value) => {
  if (!value) return null;

  // Date-only values are calendar dates, not instants. Parsing them as UTC
  // avoids the previous-day shift in negative-offset time zones.
  const date = isDateOnly(value)
    ? new Date(`${value}T00:00:00.000Z`)
    : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (value) => {
  const date = parseDate(value);

  if (!date) return "—";

  const format = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };

  if (!isDateOnly(value)) {
    format.hour = "2-digit";
    format.minute = "2-digit";
  } else {
    format.timeZone = "UTC";
  }

  return new Intl.DateTimeFormat("en-IN", format).format(date);
};

function KindBadge({ kind }) {
  if (!kind) return null;

  return (
    <span className="inline-flex whitespace-nowrap rounded-full bg-[#f1f4ef] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5b6b63]">
      {formatKind(kind)}
    </span>
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
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);
  const detailRequestRef = useRef(0);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [savingTransaction, setSavingTransaction] = useState(false);

  const [transferOpen, setTransferOpen] = useState(false);
  const [savingTransfer, setSavingTransfer] = useState(false);
  const [transferForm, setTransferForm] = useState({
    from_account_id: "",
    to_account_id: "",
    amount: "",
    transfer_date: new Date().toISOString().slice(0, 10),
    reference_number: "",
    notes: "",
  });

  const [refundTransaction, setRefundTransaction] = useState(null);
  const [savingRefund, setSavingRefund] = useState(false);
  const [refundForm, setRefundForm] = useState({
    amount: "",
    reason: "",
    payment_method: "cash",
    account_id: "",
    refund_date: new Date().toISOString().slice(0, 10),
    reference_number: "",
  });

  const [categories, setCategories] = useState([]);
  const [newTransaction, setNewTransaction] = useState({
    transaction_type: "income",
    party_id: "",
    category_id: "",
    amount: "",
    account_id: "",
    payment_method: "cash",
    transaction_date: new Date().toISOString().slice(0, 10),
    reference_number: "",
    notes: "",
  });
  const [accounts, setAccounts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();
  const [balances, setBalances] = useState(null);
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [balancesError, setBalancesError] = useState("");
  const toast = useToast();
  const { user } = useAuth();
  const role = user?.role;
  const canWrite = ["admin", "manager", "accountant"].includes(role);
  const canRefund = ["admin", "manager"].includes(role);

  async function handleAddTransaction(event) {
    event.preventDefault();
    if (savingTransaction) return;

    const amount = Number(newTransaction.amount);

    if (!newTransaction.category_id) {
      toast("Please select a category.", "error");
      return;
    }

    if (!newTransaction.payment_method) {
      toast("Please select a payment method.", "error");
      return;
    }

    if (
      newTransaction.payment_method !== "cash" &&
      !newTransaction.account_id
    ) {
      toast("Select the bank account for this transaction.", "error");
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
          party_id: newTransaction.party_id
            ? Number(newTransaction.party_id)
            : null,
          category_id: Number(newTransaction.category_id),
          amount,
          account_id:
            newTransaction.payment_method === "cash" ||
            !newTransaction.account_id
              ? null
              : Number(newTransaction.account_id),
          payment_method: newTransaction.payment_method,
          // The API expects a calendar date in YYYY-MM-DD form.
          transaction_date: newTransaction.transaction_date || undefined,
          reference_number:
            newTransaction.reference_number.trim() || undefined,
          notes: newTransaction.notes.trim() || undefined,
        },
        {
          withCredentials: true,
          headers: { "Idempotency-Key": crypto.randomUUID() },
        },
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
          reference_number: "",
          notes: "",
        });
        setPage(1);
        await refreshLedger();
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

  async function handleTransfer(event) {
    event.preventDefault();
    if (savingTransfer) return;

    if (!transferForm.from_account_id || !transferForm.to_account_id) {
      toast("Select both the source and destination accounts.", "error");
      return;
    }

    if (transferForm.from_account_id === transferForm.to_account_id) {
      toast("Source and destination accounts must be different.", "error");
      return;
    }

    const amount = Number(transferForm.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast("Transfer amount must be greater than zero.", "error");
      return;
    }

    try {
      setSavingTransfer(true);
      const response = await axios.post(
        "/api/transactions/transfers",
        {
          from_account_id: Number(transferForm.from_account_id),
          to_account_id: Number(transferForm.to_account_id),
          amount,
          transfer_date: transferForm.transfer_date || undefined,
          reference_number: transferForm.reference_number.trim() || undefined,
          notes: transferForm.notes.trim() || undefined,
        },
        {
          withCredentials: true,
          headers: { "Idempotency-Key": crypto.randomUUID() },
        },
      );

      toast(
        response.data?.message || "Transfer recorded successfully.",
        "success",
      );
      setTransferOpen(false);
      setTransferForm({
        from_account_id: "",
        to_account_id: "",
        amount: "",
        transfer_date: new Date().toISOString().slice(0, 10),
        reference_number: "",
        notes: "",
      });
      setPage(1);
      await refreshLedger();
    } catch (error) {
      toast(
        error.response?.data?.message || "Failed to record transfer.",
        "error",
      );
    } finally {
      setSavingTransfer(false);
    }
  }

  function openRefundModal(transaction) {
    setRefundTransaction(transaction);
    setRefundForm({
      amount: "",
      reason: "",
      payment_method: transaction.method || "cash",
      account_id: "",
      refund_date: new Date().toISOString().slice(0, 10),
      reference_number: "",
    });
  }

  function closeRefundModal() {
    if (savingRefund) return;

    setRefundTransaction(null);
  }

  async function handleRefund(event) {
    event.preventDefault();
    if (!refundTransaction || savingRefund) return;

    const amount = Number(refundForm.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast("Refund amount must be greater than zero.", "error");
      return;
    }

    if (amount > Number(refundTransaction.amount)) {
      toast(
        "Refund cannot exceed the original payment amount (less any prior refunds).",
        "error",
      );
      return;
    }

    if (!refundForm.reason.trim()) {
      toast("A refund reason is required.", "error");
      return;
    }

    if (refundForm.payment_method !== "cash" && !refundForm.account_id) {
      toast("Select the bank account for this refund.", "error");
      return;
    }

    try {
      setSavingRefund(true);
      const response = await axios.post(
        `/api/payments/${encodeURIComponent(refundTransaction.sourceUuid)}/refund`,
        {
          amount,
          reason: refundForm.reason.trim(),
          payment_method: refundForm.payment_method,
          account_id:
            refundForm.payment_method === "cash" || !refundForm.account_id
              ? null
              : Number(refundForm.account_id),
          refund_date: refundForm.refund_date || undefined,
          reference_number: refundForm.reference_number.trim() || undefined,
        },
        {
          withCredentials: true,
          headers: { "Idempotency-Key": crypto.randomUUID() },
        },
      );

      toast(response.data?.message || "Refund recorded successfully.", "success");
      setRefundTransaction(null);
      setDetail(null);
      await refreshLedger();
    } catch (error) {
      toast(
        error.response?.data?.message || "Failed to record refund.",
        "error",
      );
    } finally {
      setSavingRefund(false);
    }
  }

  const [filters, setFilters] = useState({
    customer_id: "",
    project_id: "",
    plot_id: "",
    account_id: "",
    payment_method: "",
    source_type: "",
    kind: "",
    direction: "",
    channel: "",
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

  const fetchAccountBalances = async () => {
    setBalancesLoading(true);
    setBalancesError("");

    try {
      const res = await axios.get("/api/accounts/balances", {
        withCredentials: true,
      });
      setBalances(res.data?.data || null);
    } catch (error) {
      setBalancesError(
        error.response?.data?.message ||
          "Unable to load account balances. Please try again.",
      );
    } finally {
      setBalancesLoading(false);
    }
  };

  const refreshLedger = async () => {
    await Promise.all([fetchTransactions(), fetchAccountBalances()]);
  };

  const getCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await axios.get("/api/categories", {
        params: { limit: 100, isActive: "true", sortBy: "name", sortOrder: "asc" },
        withCredentials: true,
      });
      if (res.status === 200) {
        const rows = res.data?.data;
        setCategories(Array.isArray(rows) ? rows : []);
      }
    } catch (error) {
      toast(
        error.response?.data?.message || "Failed to load transaction categories.",
        "error",
      );
    } finally {
      setLoadingCategories(false);
    }
  };

  const buildParams = (includePagination = true) => {
    const params = {
      search: search.trim() || undefined,
      customer_id: filters.customer_id || undefined,
      project_id: filters.project_id || undefined,
      plot_id: filters.plot_id || undefined,
      account_id: filters.account_id || undefined,
      payment_method: filters.payment_method || undefined,
      source_type: filters.source_type || undefined,
      kind: filters.kind || undefined,
      direction: filters.direction || undefined,
      channel: filters.channel || undefined,
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
      const pagination = data.pagination || payload.pagination || {};
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
    // These initial lookups populate external data for the filters.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getAccounts();
    getProjects();
    getCategories();
    fetchAccountBalances();
    // Loaders run once on mount; re-running would refetch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const pageIds = pageRows.map((item) => item.key);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

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
      source_type: "",
      kind: "",
      direction: "",
      channel: "",
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

  async function openDetail(transaction) {
    if (!transaction?.sourceType || !transaction?.sourceUuid) {
      setDetail(transaction);
      return;
    }

    const requestId = ++detailRequestRef.current;
    setDetail(transaction);
    setDetailError("");
    setDetailLoading(true);

    try {
      const response = await axios.get(
        `/api/transactions/${encodeURIComponent(transaction.sourceType)}/${encodeURIComponent(transaction.sourceUuid)}`,
        {
          withCredentials: true,
          params: transaction.sourceRowId
            ? { source_row_id: transaction.sourceRowId }
            : undefined,
        },
      );
      if (requestId !== detailRequestRef.current) return;
      const row = response.data?.data?.transaction;
      if (row) setDetail(normalizeTransaction(row));
    } catch (error) {
      if (requestId !== detailRequestRef.current) return;
      setDetailError(
        error.response?.data?.message || "Failed to load transaction details.",
      );
    } finally {
      if (requestId === detailRequestRef.current) setDetailLoading(false);
    }
  }

  function closeDetail() {
    detailRequestRef.current += 1;
    setDetail(null);
    setDetailLoading(false);
    setDetailError("");
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
          selectedIds.includes(tx.key),
        );
        // Also include selected records on the currently displayed page.
        pageRows.forEach((tx) => {
          if (
            selectedIds.includes(tx.key) &&
            !rows.some((row) => row.key === tx.key)
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
        "Source",
        "Kind",
        "Direction",
        "Date",
        "Party",
        "Phone",
        "Project",
        "Plot",
        "Booking",
        "Category",
        "Account",
        "Channel",
        "Payment method",
        "Status",
        "Amount",
        "Reference",
        "Recorded by",
        "Notes",
      ];
      const data = rows.map((tx) => [
        tx.number,
        tx.sourceLabel,
        tx.kindLabel,
        tx.direction,
        tx.date,
        tx.displayPartyName,
        tx.customerPhone,
        tx.projectName,
        tx.plotNumber,
        tx.booking,
        tx.categoryName,
        tx.accountName,
        tx.channel,
        tx.method,
        tx.status,
        tx.direction === "debit" ? -tx.amount : tx.amount,
        tx.referenceNumber,
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
            Unified finance ledger
          </p>
          <h1
            className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl"
            style={DISPLAY}
          >
            Transaction history<span style={{ color: GOLD }}>.</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#5b6b63]">
            Payments, booking receipts and income / expense entries in one
            ledger, with cash and bank reported separately.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canWrite && (
            <>
              <button
                type="button"
                onClick={() => setAddTransactionOpen(true)}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0b3d2e] px-4 text-sm font-semibold text-white transition hover:bg-[#145640]"
              >
                <Plus size={16} /> Add transaction
              </button>
              <button
                type="button"
                onClick={() => setTransferOpen(true)}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#dfe5dc] bg-white px-4 text-sm font-semibold hover:bg-[#f4f7f2]"
              >
                <ArrowLeftRight size={16} /> Transfer
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#dfe5dc] bg-white px-4 text-sm font-semibold hover:bg-[#f4f7f2]"
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
          {canWrite && (
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
          )}
        </div>
      </div>

      <FinancialSummary
        data={balances}
        loading={balancesLoading}
        error={balancesError}
        onRetry={fetchAccountBalances}
      />

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
                placeholder="Search number, party, phone, plot, account or reference..."
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
                label: account.bank_name
                  ? `${account.account_name} — ${account.bank_name}`
                  : `${account.account_name} — Cash`,
              }))}
            />

            <Select
              id="payment_method"
              name="payment_method"
              label="Payment Method"
              value={filters.payment_method}
              onChange={(event) =>
                updateFilter("payment_method", event.target.value)
              }
              placeholder="All payment methods"
              options={METHODS.map(([value, label]) => ({
                value,
                label,
              }))}
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
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#5b6b63]">
                  Source
                </label>
                <select
                  value={filters.source_type}
                  onChange={(event) =>
                    updateFilter("source_type", event.target.value)
                  }
                  className="min-h-11 w-full rounded-xl border border-[#dfe5dc] bg-white px-3 text-sm"
                >
                  {SOURCE_TYPES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#5b6b63]">
                  Kind
                </label>
                <select
                  value={filters.kind}
                  onChange={(event) =>
                    updateFilter("kind", event.target.value)
                  }
                  className="min-h-11 w-full rounded-xl border border-[#dfe5dc] bg-white px-3 text-sm"
                >
                  {KINDS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#5b6b63]">
                  Direction
                </label>
                <select
                  value={filters.direction}
                  onChange={(event) =>
                    updateFilter("direction", event.target.value)
                  }
                  className="min-h-11 w-full rounded-xl border border-[#dfe5dc] bg-white px-3 text-sm"
                >
                  {DIRECTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#5b6b63]">
                  Account channel
                </label>
                <select
                  value={filters.channel}
                  onChange={(event) =>
                    updateFilter("channel", event.target.value)
                  }
                  className="min-h-11 w-full rounded-xl border border-[#dfe5dc] bg-white px-3 text-sm"
                >
                  {CHANNELS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
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
          {(loadingAccounts || loadingProjects || loadingCategories) && (
            <div className="flex flex-wrap gap-4">
              {loadingAccounts && (
                <Loader size="sm" label="Loading accounts..." />
              )}
              {loadingProjects && (
                <Loader size="sm" label="Loading projects..." />
              )}
              {loadingCategories && (
                <Loader size="sm" label="Loading categories..." />
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
                            if (event.target.checked) updated[tx.key] = tx;
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
                  label="Party"
                  column="customer"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-4 py-3">Plot / category</th>
                <th className="px-4 py-3">Account / channel</th>
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
                  const selected = selectedIds.includes(tx.key);
                  const incoming = tx.direction === "credit";
                  const hasPlot = tx.plotNumber && tx.plotNumber !== "—";
                  return (
                    <tr
                      key={tx.key}
                      className="group cursor-pointer border-t border-[#eef2ec] transition hover:bg-[#f8faf6]"
                      onClick={() => openDetail(tx)}
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
                                ? [...new Set([...current, tx.key])]
                                : current.filter((id) => id !== tx.key);
                              setSelectedTransactions((cached) => ({
                                ...cached,
                                [tx.key]: tx,
                              }));
                              return next;
                            })
                          }
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${incoming ? "bg-[#e9f3ee] text-[#1b7a5a]" : "bg-rose-50 text-rose-600"}`}
                          >
                            {incoming ? (
                              <ArrowDownLeft size={18} />
                            ) : (
                              <ArrowUpRight size={18} />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-[#14231d]">
                              {tx.number}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <KindBadge kind={tx.kind} />
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#839087]">
                                {tx.sourceLabel}
                              </span>
                            </div>
                            {tx.kind === "installment" &&
                              tx.installmentNumber && (
                                <p className="mt-1 text-xs text-[#839087]">
                                  Installment {tx.installmentNumber}
                                  {tx.installmentCount
                                    ? ` of ${tx.installmentCount}`
                                    : ""}
                                </p>
                              )}
                            {tx.note && (
                              <p className="mt-1 max-w-[170px] truncate text-xs text-[#839087]">
                                {tx.note}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td
                        onClick={(event) => {
                          if (!tx.customerUuid) return;
                          event.stopPropagation();
                          navigate("/customer/profile", {
                            state: {
                              uuid: tx.customerUuid,
                            },
                          });
                        }}
                        className={
                          tx.customerUuid
                            ? "cursor-pointer px-4 py-4"
                            : "px-4 py-4"
                        }
                      >
                        <p className="font-semibold">
                          {tx.displayPartyName || "—"}
                        </p>
                        <p className="mt-1 text-xs text-[#839087]">
                          {tx.customerPhone || tx.categoryName || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold">
                          {hasPlot ? tx.plotNumber : tx.categoryName || "—"}
                        </p>
                        <p className="mt-1 text-xs text-[#839087]">
                          {hasPlot
                            ? `${tx.projectName || "—"} · ${tx.booking}`
                            : tx.partyName
                              ? `Party: ${tx.partyName}`
                              : tx.sourceLabel}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold">{tx.accountName || "—"}</p>
                        <p className="mt-1 text-xs capitalize text-[#839087]">
                          {tx.channel ? `${tx.channel} · ` : ""}
                          {String(tx.method || "other").replaceAll("_", " ")}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-[#5b6b63]">
                        {formatDateTime(tx.date)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <p
                          className={`font-bold ${incoming ? "text-emerald-700" : "text-rose-700"}`}
                        >
                          {incoming ? "+" : "-"}
                          {formatINR(tx.amount)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={tx.status} />
                        {!tx.countsAsBalance && (
                          <p className="mt-1 text-[10px] font-semibold text-[#839087]">
                            Not in balance
                          </p>
                        )}
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
              Select a party (optional), category and account, then enter the
              amount.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SearchablePartySelect
              apiUrl="/api/parties/dropdown"
              name="party_id"
              label="Party"
              value={newTransaction.party_id}
              onChange={(event) =>
                setNewTransaction((current) => ({
                  ...current,
                  party_id: event.target.value,
                }))
              }
              placeholder="Select a party"
              disabled={savingTransaction}
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
              options={categories.map((category) => ({
                value: String(category.id),
                label: category.name,
              }))}
              required
              disabled={savingTransaction || loadingCategories}
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
            <PaymentAccountFields
              paymentMethod={newTransaction.payment_method}
              accountId={newTransaction.account_id}
              accounts={accounts}
              loadingAccounts={loadingAccounts}
              disabled={savingTransaction}
              onMethodChange={(value) =>
                setNewTransaction((current) => ({
                  ...current,
                  payment_method: value,
                  account_id: "",
                }))
              }
              onAccountChange={(value) =>
                setNewTransaction((current) => ({
                  ...current,
                  account_id: value,
                }))
              }
              accountLabelText="Receiving / paying bank account"
            />
            <Input
              wrapperClassName="sm:col-span-2"
              label="Reference number (optional)"
              name="reference_number"
              value={newTransaction.reference_number}
              onChange={(event) =>
                setNewTransaction((current) => ({
                  ...current,
                  reference_number: event.target.value,
                }))
              }
              placeholder="UPI / cheque / transfer reference"
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

      <Modal
        open={transferOpen}
        onClose={() => {
          if (savingTransfer) return;
          setTransferOpen(false);
        }}
        size="lg"
        title="Transfer between accounts"
        description="Move money between cash and bank accounts. Transfers affect balances but are excluded from inflow and outflow."
        footer={
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              disabled={savingTransfer}
              onClick={() => setTransferOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={savingTransfer}
              onClick={() =>
                document.getElementById("transfer-form")?.requestSubmit()
              }
            >
              {savingTransfer ? (
                <Loader
                  size="xs"
                  variant="spinner"
                  color="#ffffff"
                  label="Saving..."
                />
              ) : (
                <ArrowLeftRight size={16} className="mr-2" />
              )}
              {savingTransfer ? "Recording transfer..." : "Record transfer"}
            </Button>
          </div>
        }
      >
        <form
          id="transfer-form"
          onSubmit={handleTransfer}
          className="space-y-5"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="From account"
              name="from_account_id"
              value={transferForm.from_account_id}
              onChange={(event) =>
                setTransferForm((current) => ({
                  ...current,
                  from_account_id: event.target.value,
                }))
              }
              placeholder="Select source account"
              options={accounts
                .filter((account) => account.is_active !== false)
                .map((account) => ({
                  value: String(account.id),
                  label: account.bank_name
                    ? `${account.account_name} — ${account.bank_name}`
                    : `${account.account_name} — Cash`,
                }))}
              required
              disabled={savingTransfer || loadingAccounts}
            />
            <Select
              label="To account"
              name="to_account_id"
              value={transferForm.to_account_id}
              onChange={(event) =>
                setTransferForm((current) => ({
                  ...current,
                  to_account_id: event.target.value,
                }))
              }
              placeholder="Select destination account"
              options={accounts
                .filter((account) => account.is_active !== false)
                .map((account) => ({
                  value: String(account.id),
                  label: account.bank_name
                    ? `${account.account_name} — ${account.bank_name}`
                    : `${account.account_name} — Cash`,
                }))}
              required
              disabled={savingTransfer || loadingAccounts}
            />
            <Input
              label="Amount (₹)"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={transferForm.amount}
              onChange={(event) =>
                setTransferForm((current) => ({
                  ...current,
                  amount: event.target.value,
                }))
              }
              placeholder="Enter transfer amount"
              required
              disabled={savingTransfer}
            />
            <Input
              label="Transfer date"
              name="transfer_date"
              type="date"
              value={transferForm.transfer_date}
              onChange={(event) =>
                setTransferForm((current) => ({
                  ...current,
                  transfer_date: event.target.value,
                }))
              }
              disabled={savingTransfer}
            />
            <Input
              wrapperClassName="sm:col-span-2"
              label="Reference number (optional)"
              name="reference_number"
              value={transferForm.reference_number}
              onChange={(event) =>
                setTransferForm((current) => ({
                  ...current,
                  reference_number: event.target.value,
                }))
              }
              placeholder="Cheque / UPI / transfer reference"
              disabled={savingTransfer}
            />
          </div>

          <div>
            <label
              htmlFor="transfer-notes"
              className="mb-2 block text-sm font-semibold text-[#14231d]"
            >
              Notes{" "}
              <span className="font-normal text-[#89958d]">(optional)</span>
            </label>
            <textarea
              id="transfer-notes"
              name="notes"
              rows={3}
              value={transferForm.notes}
              onChange={(event) =>
                setTransferForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              disabled={savingTransfer}
              placeholder="Add a note about this transfer..."
              className="w-full resize-y rounded-xl border border-[#dfe5dc] bg-white px-3.5 py-3 text-sm text-[#14231d] outline-none transition placeholder:text-[#9aa59d] focus:border-[#1b7a5a] focus:ring-4 focus:ring-[#1b7a5a]/10 disabled:bg-slate-50"
            />
          </div>

          <div className="rounded-xl border border-[#e3e9e0] bg-[#f7f9f6] p-4 text-xs leading-5 text-[#5b6b63]">
            Both accounts must be active. The transfer is recorded as a debit
            from the source account and a credit to the destination account.
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(refundTransaction)}
        onClose={closeRefundModal}
        size="lg"
        title="Refund payment"
        description="Refunds are recorded separately and never edit or delete the original receipt."
        footer={
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              disabled={savingRefund}
              onClick={closeRefundModal}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={savingRefund}
              onClick={() =>
                document.getElementById("refund-payment-form")?.requestSubmit()
              }
            >
              {savingRefund ? (
                <Loader
                  size="xs"
                  variant="spinner"
                  color="#ffffff"
                  label="Saving..."
                />
              ) : (
                <RotateCcw size={16} className="mr-2" />
              )}
              {savingRefund ? "Recording refund..." : "Record refund"}
            </Button>
          </div>
        }
      >
        {refundTransaction && (
          <form
            id="refund-payment-form"
            onSubmit={handleRefund}
            className="space-y-5"
          >
            <div className="rounded-xl border border-[#e3e9e0] bg-[#f7f9f6] p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-[#718078]">
                Original payment
              </p>
              <p className="mt-1 text-base font-bold text-[#14231d]">
                {refundTransaction.number}
              </p>
              <p className="mt-1 text-sm text-[#5b6b63]">
                {refundTransaction.displayPartyName || "—"} ·{" "}
                {formatINR(refundTransaction.amount)} ·{" "}
                {formatDateTime(refundTransaction.date)}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Refund amount (₹)"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                max={Number(refundTransaction.amount)}
                value={refundForm.amount}
                onChange={(event) =>
                  setRefundForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
                placeholder="Enter refund amount"
                hint="Cannot exceed the original amount less any prior refunds."
                required
                disabled={savingRefund}
              />
              <Input
                label="Refund date"
                name="refund_date"
                type="date"
                value={refundForm.refund_date}
                onChange={(event) =>
                  setRefundForm((current) => ({
                    ...current,
                    refund_date: event.target.value,
                  }))
                }
                disabled={savingRefund}
              />
              <PaymentAccountFields
                paymentMethod={refundForm.payment_method}
                accountId={refundForm.account_id}
                accounts={accounts}
                loadingAccounts={loadingAccounts}
                disabled={savingRefund}
                onMethodChange={(value) =>
                  setRefundForm((current) => ({
                    ...current,
                    payment_method: value,
                    account_id: "",
                  }))
                }
                onAccountChange={(value) =>
                  setRefundForm((current) => ({ ...current, account_id: value }))
                }
                methodLabel="Refund method"
                accountLabelText="Refund from bank account"
                cashHint="Cash refunds are paid out of the Cash in Hand account."
              />
              <Input
                label="Reference number (optional)"
                name="reference_number"
                value={refundForm.reference_number}
                onChange={(event) =>
                  setRefundForm((current) => ({
                    ...current,
                    reference_number: event.target.value,
                  }))
                }
                placeholder="UPI / cheque / transfer reference"
                disabled={savingRefund}
              />
            </div>

            <div>
              <label
                htmlFor="refund-reason"
                className="mb-2 block text-sm font-semibold text-[#14231d]"
              >
                Refund reason
              </label>
              <textarea
                id="refund-reason"
                name="reason"
                rows={3}
                value={refundForm.reason}
                onChange={(event) =>
                  setRefundForm((current) => ({
                    ...current,
                    reason: event.target.value,
                  }))
                }
                disabled={savingRefund}
                placeholder="Why is this payment being refunded?"
                required
                className="w-full resize-y rounded-xl border border-[#dfe5dc] bg-white px-3.5 py-3 text-sm text-[#14231d] outline-none transition placeholder:text-[#9aa59d] focus:border-[#1b7a5a] focus:ring-4 focus:ring-[#1b7a5a]/10 disabled:bg-slate-50"
              />
            </div>
          </form>
        )}
      </Modal>

      {detail && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDetail();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-detail-title"
            className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#1b7a5a]">
                  {detail.sourceLabel || "Transaction details"}
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
                onClick={closeDetail}
                aria-label="Close details"
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 rounded-xl bg-[#f4f7f2] p-4">
              <p className="text-xs text-[#5b6b63]">Transaction amount</p>
              <p
                className={`mt-1 text-3xl font-semibold ${detail.direction === "debit" ? "text-rose-700" : "text-[#0b3d2e]"}`}
                style={DISPLAY}
              >
                {detail.direction === "debit" ? "-" : "+"}
                {formatINR(detail.amount)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={detail.status} />
                <KindBadge kind={detail.kind} />
                <span className="text-xs font-semibold text-[#5b6b63]">
                  {detail.direction === "debit"
                    ? "Money out"
                    : "Money in"}
                </span>
              </div>
            </div>

            {detailLoading && (
              <div className="mt-4 rounded-xl border border-[#e5ebe2] px-4 py-3">
                <Loader size="sm" label="Loading full details..." />
              </div>
            )}

            {detailError && (
              <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {detailError}
              </p>
            )}

            <dl className="mt-4 divide-y divide-[#eef2ec] text-sm">
              {[
                ["Kind", detail.kindLabel],
                ["Party", detail.partyName || detail.customerName],
                ["Phone", detail.customerPhone],
                ["Category", detail.categoryName],
                ["Project", detail.projectName],
                ["Plot", detail.plotNumber],
                ["Booking", detail.booking],
                [
                  "Installment",
                  detail.kind === "installment" && detail.installmentNumber
                    ? `${detail.installmentNumber}${detail.installmentCount ? ` of ${detail.installmentCount}` : ""}`
                    : "",
                ],
                [
                  "Account",
                  detail.bankName
                    ? `${detail.accountName} · ${detail.bankName}`
                    : detail.accountName,
                ],
                [
                  "Channel",
                  detail.channel
                    ? String(detail.channel).replaceAll("_", " ")
                    : "",
                ],
                [
                  "Payment method",
                  String(detail.method || "other").replaceAll("_", " "),
                ],
                ["Reference", detail.referenceNumber],
                ["Date", formatDateTime(detail.date)],
                ["Recorded by", detail.receivedBy],
                ["Created", formatDateTime(detail.createdAt)],
                ["Updated", formatDateTime(detail.updatedAt)],
                ["Notes", detail.note],
              ]
                .filter(([, value]) => value && value !== "—")
                .map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 py-3">
                    <dt className="shrink-0 text-[#5b6b63]">{label}</dt>
                    <dd className="max-w-[65%] break-words text-right font-semibold capitalize">
                      {value}
                    </dd>
                  </div>
                ))}
            </dl>

            {canRefund &&
              detail.sourceType === "payment" &&
              ["completed", "partially_refunded"].includes(detail.status) && (
                <div className="mt-5 flex justify-end border-t border-[#eef2ec] pt-4">
                  <Button
                    variant="danger"
                    onClick={() => openRefundModal(detail)}
                  >
                    <RotateCcw size={15} className="mr-2" />
                    Refund payment
                  </Button>
                </div>
              )}
          </section>
        </div>
      )}
      <p className="text-center text-xs text-[#839087]">
        Unified ledger from payments and income / expense transactions.
      </p>
    </div>
  );
}
