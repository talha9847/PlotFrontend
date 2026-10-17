import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Wallet,
  CheckCircle2,
  Clock,
  ReceiptText,
} from "lucide-react";

import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Input from "../components/common/Input";

const PAGE_LIMIT = 10;

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount ?? 0));

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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
          ? "Try another payment number, customer, plot, or payment method."
          : "Payments received into this account will appear here."}
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
    total_completed_amount: 0,
    total_pending_amount: 0,
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
          total_transactions: Number(result.summary?.total_transactions ?? 0),
          total_completed_amount: Number(
            result.summary?.total_completed_amount ?? 0,
          ),
          total_pending_amount: Number(
            result.summary?.total_pending_amount ?? 0,
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
    [accountUuid, page, search],
  );

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.totalPages) return;
    setPage(nextPage);
  };

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
              View account activity and payment transactions.
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
                    {account?.bank_name || "Bank name not provided"}
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

            <div className="mt-5 grid gap-3 border-t border-[#edf1eb] pt-4 sm:grid-cols-2">
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
              title="Completed payments"
              value={summary.total_completed_amount}
              icon={Wallet}
              description="Completed payment amount in the current results"
            />

            <SummaryCard
              title="Pending payments"
              value={summary.total_pending_amount}
              icon={Clock}
              description="Payments currently marked as pending"
            />

            <Card className="h-full">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#64736b]">
                    Transactions
                  </p>

                  <p className="mt-3 text-2xl font-extrabold text-[#14231d]">
                    {summary.total_transactions.toLocaleString("en-IN")}
                  </p>

                  <p className="mt-2 text-xs text-[#64736b]">
                    Matching records for this account
                  </p>
                </div>

                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fff4dc] text-[#936510]">
                  <ReceiptText size={21} />
                </div>
              </div>
            </Card>
          </div>

          {/* Transactions table */}
          <Card padding="none" className="overflow-hidden">
            <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-[#14231d]">
                  Transaction history
                </h2>

                <p className="mt-1 text-sm text-[#64736b]">
                  Payments recorded against this account.
                </p>
              </div>

              <div className="w-full lg:max-w-sm">
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search payment, customer or plot..."
                  leadingIcon={Search}
                />
              </div>
            </div>

            {transactions.length === 0 ? (
              <EmptyState search={search} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left text-sm">
                  <thead className="bg-[#f7f8f6] text-[11px] uppercase tracking-wider text-[#64736b]">
                    <tr>
                      <th className="px-5 py-3">Transaction</th>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Plot / Booking</th>
                      <th className="px-5 py-3">Payment date</th>
                      <th className="px-5 py-3">Method</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#edf1eb]">
                    {transactions.map((item, index) => (
                      <tr
                        key={
                          item.payment_uuid ||
                          item.payment_id ||
                          `payment-${index}`
                        }
                        className="transition hover:bg-[#fafbf9]"
                      >
                        <td className="px-5 py-4">
                          <p className="font-bold text-[#0b5a3e]">
                            {item.payment_number || "—"}
                          </p>
                          <p className="mt-1 text-[11px] text-[#64736b]">
                            ID: {item.payment_id || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#14231d]">
                            {item.customer_name || "—"}
                          </p>
                          <p className="mt-1 text-xs text-[#64736b]">
                            {item.customer_phone || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-bold text-[#14231d]">
                            {item.plot_number || "—"}
                          </p>
                          <p className="mt-1 text-xs text-[#64736b]">
                            {item.booking_number || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-[#46564d]">
                          {formatDateTime(item.payment_date)}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-lg bg-[#f1f4ef] px-2.5 py-1.5 text-xs font-semibold capitalize text-[#46564d]">
                            {(item.payment_method || "—").replaceAll("_", " ")}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-extrabold text-[#14231d]">
                          {money(item.amount)}
                        </td>

                        <td className="px-5 py-4">
                          {item.payment_status ? (
                            <Badge status={item.payment_status} size="sm" />
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
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
