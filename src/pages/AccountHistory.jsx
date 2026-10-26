import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  Search,
  Wallet,
  CheckCircle2,
  ReceiptText,
} from "lucide-react";

import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";

const PAGE_LIMIT = 10;

const KIND_LABELS = {
  booking_token: "Booking token",
  down_payment: "Down payment",
  installment: "Installment",
  income: "Income",
  expense: "Expense",
  transfer: "Transfer",
  refund: "Refund",
};

const SOURCE_LABELS = {
  payment: "Payment receipt",
  financial_transaction: "Income / expense",
  account_transfer: "Account transfer",
  payment_reversal: "Refund",
};

const KIND_OPTIONS = [
  ["", "All kinds"],
  ["booking_token", "Booking token"],
  ["down_payment", "Down payment"],
  ["installment", "Installment"],
  ["income", "Income"],
  ["expense", "Expense"],
  ["transfer", "Transfer"],
  ["refund", "Refund"],
];

const DIRECTION_OPTIONS = [
  ["", "All directions"],
  ["credit", "Money in"],
  ["debit", "Money out"],
];

const label = (map, value, fallback = "—") =>
  map[value] || (value ? String(value).replaceAll("_", " ") : fallback);

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount ?? 0));

const formatDate = (value) => {
  if (!value) return "—";

  const dateOnly =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = dateOnly
    ? new Date(`${value}T00:00:00.000Z`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(dateOnly ? { timeZone: "UTC" } : {}),
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function SummaryCard({ title, value, icon: Icon, description }) {
  return (
    <Card className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#64736b]">{title}</p>

          <p className="mt-3 break-words text-xl font-extrabold text-[#14231d] sm:text-2xl">
            {money(value)}
          </p>

          <p className="mt-2 text-xs text-[#64736b]">{description}</p>
        </div>

        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e9f6ef] text-[#0b5a3e]">
          <Icon size={21} />
        </div>
      </div>
    </Card>
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

function LoadingState() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#dce9df] border-t-[#0b5a3e]" />
      <p className="text-sm text-[#64736b]">Loading account transactions...</p>
    </div>
  );
}

function EmptyState({ search }) {
  return (
    <div className="px-5 py-14 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f6ef] text-[#0b5a3e]">
        <ReceiptText size={23} />
      </div>

      <h3 className="mt-4 text-sm font-bold text-[#14231d]">
        {search ? "No matching transactions" : "No transactions yet"}
      </h3>

      <p className="mt-1 text-xs text-[#64736b]">
        {search
          ? "Try another transaction number, party, plot, or reference."
          : "Payments and income / expense entries for this account will appear here."}
      </p>
    </div>
  );
}

export default function AccountHistory() {
  const location = useLocation();
  const navigate = useNavigate();

  // The account UUID comes from React Router location state.
  const accountUuid = location.state?.uuid;

  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    total_transactions: 0,
    totalInflow: 0,
    totalOutflow: 0,
    netFlow: 0,
    completedTotal: 0,
    pendingTotal: 0,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("");
  const [direction, setDirection] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Keep search requests separate from rendering.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchTransactions = useCallback(
    async (isRefresh = false) => {
      if (!accountUuid) {
        setLoading(false);
        setError(
          "Account UUID is missing. Please open the account from the accounts page.",
        );
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await axios.get(
          `/api/accounts/${encodeURIComponent(accountUuid)}/transactions`,
          {
            params: {
              page,
              limit: PAGE_LIMIT,
              search,
              kind: kind || undefined,
              direction: direction || undefined,
              start_date: startDate || undefined,
              end_date: endDate || undefined,
            },
            withCredentials: true,
          },
        );

        const result = response.data?.data;

        if (!response.data?.success || !result) {
          throw new Error(
            response.data?.message || "Unable to fetch account transactions",
          );
        }

        setAccount(result.account ?? null);
        setTransactions(result.transactions ?? []);

        setSummary({
          total_transactions: Number(
            result.summary?.total_transactions ??
              result.summary?.totalTransactions ??
              0,
          ),
          totalInflow: Number(
            result.summary?.totalInflow ??
              result.summary?.total_inflow ??
              0,
          ),
          totalOutflow: Number(
            result.summary?.totalOutflow ??
              result.summary?.total_outflow ??
              0,
          ),
          netFlow: Number(
            result.summary?.netFlow ?? result.summary?.net_flow ?? 0,
          ),
          completedTotal: Number(
            result.summary?.completedTotal ??
              result.summary?.total_completed_amount ??
              0,
          ),
          pendingTotal: Number(
            result.summary?.pendingTotal ??
              result.summary?.total_pending_amount ??
              0,
          ),
        });

        setPagination({
          page: Number(result.pagination?.page ?? page),
          limit: Number(result.pagination?.limit ?? PAGE_LIMIT),
          total: Number(result.pagination?.total ?? 0),
          totalPages: Number(result.pagination?.totalPages ?? 0),
          hasNextPage: Boolean(result.pagination?.hasNextPage),
          hasPreviousPage: Boolean(result.pagination?.hasPreviousPage),
        });
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load account transactions.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accountUuid, page, search, kind, direction, startDate, endDate],
  );

  useEffect(() => {
    // Data fetching is the external synchronization this effect performs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransactions();
  }, [fetchTransactions]);

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.totalPages) return;
    setPage(nextPage);
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setKind("");
    setDirection("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const hasFilters = Boolean(
    search || kind || direction || startDate || endDate,
  );

  if (!accountUuid) {
    return (
      <div className="space-y-4">
        <Button size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Back to accounts
        </Button>

        <Card>
          <p className="font-bold text-[#14231d]">Unable to open account</p>
          <p className="mt-2 text-sm text-red-600">
            {error ||
              "Account UUID is missing. Open this page from the accounts list."}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#e5ebe4] bg-white text-[#33463b] transition hover:bg-[#f4f7f3]"
          >
            <ArrowLeft size={19} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#64736b]">
              <span>Accounts</span>
              <span>/</span>
              <span>Account profile</span>
            </div>

            <h1 className="mt-2 break-words text-2xl font-extrabold tracking-tight text-[#14231d] sm:text-3xl">
              {account?.account_name || "Account Profile"}
            </h1>

            <p className="mt-1 text-sm text-[#64736b]">
              Unified account activity across payment receipts and income /
              expense entries.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => fetchTransactions(true)}
          disabled={loading || refreshing}
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => fetchTransactions(true)}
            className="font-bold underline"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : (
        <>
          {/* Account details */}
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#0b5a3e] text-white">
                  <Building2 size={27} />
                </div>

                <div className="min-w-0">
                  <h2 className="break-words text-lg font-extrabold text-[#14231d]">
                    {account?.account_name || "—"}
                  </h2>

                  <p className="mt-1 text-sm text-[#64736b]">
                    {account?.account_type === "cash"
                      ? "Cash account"
                      : account?.bank_name || "Bank name not provided"}
                  </p>

                  <p className="mt-2 break-all text-xs text-[#64736b]">
                    Account UUID: {account?.uuid || accountUuid}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start rounded-full bg-[#e9f6ef] px-3 py-2 text-xs font-bold text-[#0b5a3e] sm:self-center">
                <CheckCircle2 size={15} />
                Account details
              </div>
            </div>

            <div className="mt-5 grid gap-3 border-t border-[#edf1eb] pt-4 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <Wallet size={17} className="text-[#64736b]" />
                <div>
                  <p className="text-xs text-[#64736b]">Opening balance</p>
                  <p className="mt-1 text-sm font-semibold text-[#14231d]">
                    {money(account?.opening_balance)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CalendarDays size={17} className="text-[#64736b]" />
                <div>
                  <p className="text-xs text-[#64736b]">Created on</p>
                  <p className="mt-1 text-sm font-semibold text-[#14231d]">
                    {formatDate(account?.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <RefreshCw size={17} className="text-[#64736b]" />
                <div>
                  <p className="text-xs text-[#64736b]">Last updated</p>
                  <p className="mt-1 text-sm font-semibold text-[#14231d]">
                    {formatDate(account?.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <SummaryCard
              title="Current balance"
              value={account?.current_balance}
              icon={Wallet}
              description="Opening balance plus eligible credits minus debits"
            />

            <SummaryCard
              title="Inflow · filtered"
              value={summary.totalInflow}
              icon={ArrowDownLeft}
              description="Credits matching the current filters"
            />

            <SummaryCard
              title="Outflow · filtered"
              value={summary.totalOutflow}
              icon={ArrowUpRight}
              description="Debits matching the current filters"
            />

            <SummaryCard
              title="Net flow · filtered"
              value={summary.netFlow}
              icon={RefreshCw}
              description="Inflow minus outflow for the current filters"
            />

            <SummaryCard
              title="Completed · filtered"
              value={summary.completedTotal}
              icon={CheckCircle2}
              description="Completed credit volume"
            />

            <SummaryCard
              title="Pending · filtered"
              value={summary.pendingTotal}
              icon={Clock}
              description="Pending amount, excluded from balances"
            />
          </div>

          {/* Transactions table */}
          <Card padding="none" className="overflow-hidden">
            <div className="border-b border-[#edf1eb] p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-[#14231d]">
                    Transaction history
                  </h2>

                  <p className="mt-1 text-sm text-[#64736b]">
                    Payment receipts and income / expense entries for this
                    account.
                  </p>
                </div>

                <div className="w-full lg:max-w-sm">
                  <Input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search number, party, plot or reference..."
                    leadingIcon={Search}
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <label className="text-xs font-bold text-[#64736b]">
                  Kind
                  <select
                    value={kind}
                    onChange={(event) => {
                      setKind(event.target.value);
                      setPage(1);
                    }}
                    className="mt-1.5 min-h-10 w-full rounded-xl border border-[#dfe5dc] bg-white px-3 text-sm text-[#14231d]"
                  >
                    {KIND_OPTIONS.map(([value, text]) => (
                      <option key={value} value={value}>
                        {text}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-bold text-[#64736b]">
                  Direction
                  <select
                    value={direction}
                    onChange={(event) => {
                      setDirection(event.target.value);
                      setPage(1);
                    }}
                    className="mt-1.5 min-h-10 w-full rounded-xl border border-[#dfe5dc] bg-white px-3 text-sm text-[#14231d]"
                  >
                    {DIRECTION_OPTIONS.map(([value, text]) => (
                      <option key={value} value={value}>
                        {text}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-bold text-[#64736b]">
                  Start date
                  <input
                    type="date"
                    value={startDate}
                    max={endDate || undefined}
                    onChange={(event) => {
                      setStartDate(event.target.value);
                      setPage(1);
                    }}
                    className="mt-1.5 min-h-10 w-full rounded-xl border border-[#dfe5dc] bg-white px-3 text-sm text-[#14231d]"
                  />
                </label>

                <label className="text-xs font-bold text-[#64736b]">
                  End date
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(event) => {
                      setEndDate(event.target.value);
                      setPage(1);
                    }}
                    className="mt-1.5 min-h-10 w-full rounded-xl border border-[#dfe5dc] bg-white px-3 text-sm text-[#14231d]"
                  />
                </label>

                <div className="flex items-end">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={resetFilters}
                    disabled={!hasFilters}
                    className="w-full"
                  >
                    Clear filters
                  </Button>
                </div>
              </div>
            </div>

            {transactions.length === 0 ? (
              <EmptyState search={search} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="bg-[#f7f8f6] text-[11px] uppercase tracking-wider text-[#64736b]">
                    <tr>
                      <th className="px-5 py-3">Transaction</th>
                      <th className="px-5 py-3">Party</th>
                      <th className="px-5 py-3">Plot / category</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Channel / method</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#edf1eb]">
                    {transactions.map((item, index) => {
                      const incoming = item.direction === "credit";
                      const hasPlot = Boolean(item.plotNumber);

                      return (
                        <tr
                          key={
                            item.sourceRowId
                              ? `${item.sourceType}-${item.sourceRowId}`
                              : item.sourceUuid
                                ? `${item.sourceType}-${item.sourceUuid}`
                                : `transaction-${index}`
                          }
                          className="transition hover:bg-[#fafbf9]"
                        >
                          <td className="px-5 py-4">
                            <p className="font-bold text-[#0b5a3e]">
                              {item.transactionNumber || "—"}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span className="rounded-full bg-[#f1f4ef] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#64736b]">
                                {label(KIND_LABELS, item.kind)}
                              </span>
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#87938c]">
                                {label(SOURCE_LABELS, item.sourceType)}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-semibold text-[#14231d]">
                              {item.displayPartyName ||
                                item.customerName ||
                                item.partyName ||
                                "—"}
                            </p>
                            <p className="mt-1 text-xs text-[#64736b]">
                              {item.customerPhone ||
                                item.categoryName ||
                                item.referenceNumber ||
                                "—"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-bold text-[#14231d]">
                              {hasPlot
                                ? item.plotNumber
                                : item.categoryName || "General ledger"}
                            </p>
                            <p className="mt-1 text-xs text-[#64736b]">
                              {hasPlot
                                ? [item.projectName, item.bookingNumber]
                                    .filter(Boolean)
                                    .join(" · ") || "—"
                                : item.partyName ||
                                  label(SOURCE_LABELS, item.sourceType)}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-[#46564d]">
                            {formatDateTime(item.transactionDate)}
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-xs font-bold capitalize text-[#46564d]">
                              {item.channel || "—"}
                            </p>
                            <p className="mt-1 text-xs capitalize text-[#64736b]">
                              {label({}, item.paymentMethod, "—")}
                            </p>
                          </td>

                          <td
                            className={`whitespace-nowrap px-5 py-4 font-extrabold ${incoming ? "text-emerald-700" : "text-rose-700"}`}
                          >
                            {incoming ? "+" : "-"}
                            {money(item.amount)}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge status={item.status} />
                            {!item.countsAsBalance && (
                              <p className="mt-1 text-[10px] font-semibold text-[#87938c]">
                                Not in balance
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-[#edf1eb] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[#64736b]">
                {pagination.total === 0
                  ? "No transactions"
                  : `Showing ${
                      (pagination.page - 1) * pagination.limit + 1
                    }–${Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    )} of ${pagination.total} transactions`}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => goToPage(page - 1)}
                >
                  <ChevronLeft size={15} />
                  Previous
                </Button>

                <span className="px-2 text-xs font-semibold text-[#46564d]">
                  {pagination.page} / {Math.max(pagination.totalPages, 1)}
                </span>

                <Button
                  size="sm"
                  disabled={!pagination.hasNextPage}
                  onClick={() => goToPage(page + 1)}
                >
                  Next
                  <ChevronRight size={15} />
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
