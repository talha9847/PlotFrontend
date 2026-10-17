import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  ArrowDownLeft,
  CalendarDays,
  ChevronRight,
  Download,
  Home,
  IndianRupee,
  MapPin,
  Mail,
  Phone,
  Plus,
  ReceiptText,
  Search,
  TrendingUp,
  UserRound,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Input from "../components/common/Input";
import Loader, {
  PageLoader,
  SkeletonLoader,
} from "../components/common/Loader";

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const formatDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const number = (value) => Number(value || 0);

function SectionTitle({ title, description, action }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-base font-extrabold text-[#14231d]">{title}</h2>
        {description && (
          <p className="mt-1 text-xs text-[#5b6b63] sm:text-sm">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, tone }) {
  return (
    <Card padding="md" className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#5b6b63] sm:text-sm">
            {label}
          </p>
          <p className="mt-2 break-words text-xl font-extrabold tracking-tight text-[#14231d] sm:text-2xl">
            {value}
          </p>
          <p className="mt-2 text-xs leading-5 text-[#5b6b63]">{hint}</p>
        </div>
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}
        >
          <Icon size={19} />
        </span>
      </div>
    </Card>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="px-5 py-12 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f6ef] text-[#0b5a3e]">
        <Home size={22} />
      </div>
      <p className="mt-3 text-sm font-bold text-[#14231d]">{title}</p>
      <p className="mt-1 text-xs text-[#5b6b63]">{description}</p>
    </div>
  );
}

function PlotCard({ booking }) {
  const total = number(booking.total_amount);
  const paid = Math.max(0, total - number(booking.balance));
  const balance = number(booking.balance);
  const progress =
    total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const nextInstallment = (booking.installments || [])
    .filter((item) =>
      ["pending", "partially_paid", "overdue"].includes(item.status),
    )
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];

  return (
    <Card padding="md" className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e9f6ef] text-[#0b5a3e]">
            <Home size={20} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-extrabold text-[#14231d]">
              Plot {booking.plot_number || "—"}
            </h3>
            <p className="mt-1 truncate text-xs text-[#5b6b63]">
              {booking.project_name || "Project"}
            </p>
          </div>
        </div>
        <Badge
          status={booking.booking_status || booking.plot_status || "Active"}
          size="sm"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[#5b6b63]">
        {booking.plot_type && <span>{booking.plot_type}</span>}
        {booking.booking_date && (
          <span>Booked {formatDate(booking.booking_date)}</span>
        )}
        <span>{booking.booking_number}</span>
      </div>

      <div className="mt-4 rounded-xl bg-[#f7f8f6] p-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-[#5b6b63]">Payment progress</span>
          <span className="font-extrabold text-[#0b5a3e]">{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e3e9e0]">
          <div
            className="h-full rounded-full bg-[#1b7a5a]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between gap-2 text-xs">
          <span className="text-[#5b6b63]">Total value</span>
          <span className="font-bold text-[#14231d]">{money(total)}</span>
        </div>
        <div className="mt-2 flex justify-between gap-2 text-xs">
          <span className="text-[#5b6b63]">Outstanding</span>
          <span className="font-extrabold text-[#14231d]">
            {money(balance)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#edf1eb] pt-3">
        <div>
          <p className="text-[11px] text-[#5b6b63]">Next installment</p>
          <p className="mt-1 text-xs font-bold text-[#14231d]">
            {nextInstallment
              ? formatDate(nextInstallment.due_date)
              : "No upcoming installment"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-[#5b6b63]">Due amount</p>
          <p className="mt-1 text-sm font-extrabold text-[#0b5a3e]">
            {nextInstallment
              ? money(
                  number(nextInstallment.amount_due) -
                    number(nextInstallment.amount_paid),
                )
              : money(0)}
          </p>
        </div>
      </div>
    </Card>
  );
}

function InstallmentsTable({ rows }) {
  if (!rows.length) {
    return (
      <EmptyState
        title="No installments found"
        description="Installments will appear here when a payment plan is created."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[780px] text-left text-sm">
        <thead className="bg-[#f7f8f6] text-[11px] uppercase tracking-wider text-[#5b6b63]">
          <tr>
            <th className="px-5 py-3">Installment</th>
            <th className="px-5 py-3">Plot / Booking</th>
            <th className="px-5 py-3">Due date</th>
            <th className="px-5 py-3">Due amount</th>
            <th className="px-5 py-3">Paid amount</th>
            <th className="px-5 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf1eb]">
          {rows.map((item) => (
            <tr key={item.id} className="hover:bg-[#fafbf9]">
              <td className="px-5 py-4 font-semibold">
                #{item.installment_number}
              </td>
              <td className="px-5 py-4">
                <p className="font-bold text-[#0b5a3e]">
                  {item.plot_number || "—"}
                </p>
                <p className="mt-1 text-[11px] text-[#5b6b63]">
                  {item.booking_number || "—"}
                </p>
              </td>
              <td className="px-5 py-4 text-[#5b6b63]">
                {formatDate(item.due_date)}
              </td>
              <td className="px-5 py-4 font-bold">{money(item.amount_due)}</td>
              <td className="px-5 py-4 font-semibold">
                {money(item.amount_paid)}
              </td>
              <td className="px-5 py-4">
                <Badge status={item.status} size="sm" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaymentsTable({ rows }) {
  if (!rows.length) {
    return (
      <EmptyState
        title="No completed installments"
        description="Paid installments will appear here. This is not a transaction-level receipt ledger."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="bg-[#f7f8f6] text-[11px] uppercase tracking-wider text-[#5b6b63]">
          <tr>
            <th className="px-5 py-3">Installment</th>
            <th className="px-5 py-3">Plot / Booking</th>
            <th className="px-5 py-3">Due date</th>
            <th className="px-5 py-3">Amount paid</th>
            <th className="px-5 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf1eb]">
          {rows.map((item) => (
            <tr key={item.id} className="hover:bg-[#fafbf9]">
              <td className="px-5 py-4 font-semibold">
                #{item.installment_number}
              </td>
              <td className="px-5 py-4">
                <p className="font-bold text-[#0b5a3e]">
                  {item.plot_number || "—"}
                </p>
                <p className="mt-1 text-[11px] text-[#5b6b63]">
                  {item.booking_number || "—"}
                </p>
              </td>
              <td className="px-5 py-4 text-[#5b6b63]">
                {formatDate(item.due_date)}
              </td>
              <td className="px-5 py-4 font-extrabold">
                {money(item.amount_paid)}
              </td>
              <td className="px-5 py-4">
                <Badge status={item.status} size="sm" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CustomerProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const uuid = location.state?.uuid;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [paymentSearch, setPaymentSearch] = useState("");

  const fetchProfile = useCallback(
    async (signal, isRefresh = false) => {
      if (!uuid) {
        setError(
          "Customer UUID is missing. Open this page from the customers list.",
        );
        setLoading(false);
        return;
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      try {
        const response = await axios.get(
          `/api/customers/${encodeURIComponent(uuid)}/profile`,
          { signal, withCredentials: true },
        );
        const payload = response.data?.data;
        if (!payload?.customer) {
          throw new Error(
            response.data?.message || "Customer profile was not returned.",
          );
        }
        setProfile(payload);
      } catch (err) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
        const message =
          err.response?.data?.message ||
          err.message ||
          "Unable to load customer profile.";
        setError(message);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [uuid],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchProfile(controller.signal);
    return () => controller.abort();
  }, [fetchProfile]);

  const customer = profile?.customer;
  const stats = profile?.stats || {};
  const bookings = profile?.bookings || [];
  const installments = profile?.installments || [];
  const upcoming = profile?.upcoming_installments || [];
  const overdue = profile?.overdue_installments || [];

  const paidInstallments = useMemo(
    () => installments.filter((item) => item.status === "paid"),
    [installments],
  );

  const filteredPayments = useMemo(() => {
    const search = paymentSearch.trim().toLowerCase();
    if (!search) return paidInstallments;
    return paidInstallments.filter((item) =>
      [
        item.plot_number,
        item.booking_number,
        item.installment_number,
        item.description,
        item.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search),
    );
  }, [paidInstallments, paymentSearch]);

  const tabs = ["Overview", "Plots & Bookings", "Installments", "Payments"];

  if (loading) {
    return <PageLoader label="Loading customer profile..." />;
  }

  if (error && !profile) {
    return (
      <div className="min-h-[60vh] bg-[#fafaf6] p-5">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#e4e9e1] bg-white p-6 text-center shadow-sm">
          <p className="text-lg font-extrabold text-[#14231d]">
            Unable to load customer
          </p>
          <p className="mt-2 text-sm text-[#5b6b63]">{error}</p>
          <div className="mt-5 flex justify-center gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate("/admin/customers")}
            >
              <ArrowLeft size={15} /> Back to customers
            </Button>
            <Button onClick={() => fetchProfile(undefined, false)}>
              <RefreshCw size={15} /> Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const customerName = customer?.name || "Customer";
  const initials = customerName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const totalValue = number(stats.total_investment);
  const totalPaid = number(stats.total_collected);
  const totalBalance = number(stats.outstanding_balance);
  const collectionPercentage =
    totalValue > 0
      ? Math.min(100, Math.round((totalPaid / totalValue) * 100))
      : 0;

  return (
    <div className="min-h-screen bg-[#fafaf6] p-4 text-[#14231d] sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-[#5b6b63]">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} /> Customers
            </Button>
            <ChevronRight size={15} />
            <span className="font-semibold text-[#14231d]">
              Customer Profile
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
            >
              <Download size={15} /> Export / Print
            </Button>
            <Button size="sm" onClick={() => setActiveTab("Payments")}>
              <Plus size={16} /> Record Payment
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={refreshing}
              onClick={() => fetchProfile(undefined, true)}
            >
              {refreshing ? <Loader size="xs" /> : <RefreshCw size={15} />}
              Refresh
            </Button>
          </div>
        </div>

        {error && profile && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        <section className="relative overflow-hidden rounded-2xl bg-[#0b3d2e] p-5 text-white shadow-lg sm:p-7">
          <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border-[34px] border-white/[0.04]" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex min-w-0 items-center gap-4 sm:gap-5">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 text-2xl font-extrabold text-[#e4c48a] sm:h-20 sm:w-20">
                {initials || <UserRound size={28} />}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                    {customerName}
                  </h1>
                  <Badge status={customer?.status || "Active"} size="sm" />
                </div>
                {/* <p className="mt-1.5 text-xs text-white/60">
                  Customer ID: {customer?.uuid || customer?.id || uuid}
                </p> */}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/85">
                  {customer?.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone size={13} />
                      {customer.phone}
                    </span>
                  )}
                  {customer?.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail size={13} />
                      {customer.email}
                    </span>
                  )}
                  {customer?.address && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} />
                      {customer.address}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-4">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e4c48a]/15 text-[#e4c48a]">
                <Home size={22} />
              </span>
              <div>
                <p className="text-xs text-white/65">Total plots owned</p>
                <p className="mt-1 text-2xl font-extrabold">
                  {number(stats.total_plots ?? bookings.length)}
                </p>
                <p className="text-[10px] text-white/60">
                  {number(stats.total_projects)} projects
                </p>
              </div>
            </div>
          </div>
          <div className="relative mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-4 text-xs text-white/75">
            <span>
              Customer since{" "}
              <strong className="ml-1 text-white">
                {formatDate(customer?.customer_since)}
              </strong>
            </span>
            {customer?.broker_name && (
              <span>
                Assigned broker{" "}
                <strong className="ml-1 text-white">
                  {customer.broker_name}
                </strong>
              </span>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={IndianRupee}
            label="Total Investment"
            value={money(totalValue)}
            hint="Combined value of all bookings"
            tone="bg-blue-50 text-blue-700"
          />
          <StatCard
            icon={Wallet}
            label="Total Collected"
            value={money(totalPaid)}
            hint={`${collectionPercentage}% of total investment`}
            tone="bg-[#e9f6ef] text-[#0b5a3e]"
          />
          <StatCard
            icon={TrendingUp}
            label="Outstanding Balance"
            value={money(totalBalance)}
            hint="Remaining across all bookings"
            tone="bg-amber-50 text-amber-700"
          />
          <StatCard
            icon={CalendarDays}
            label="Upcoming Installments"
            value={money(
              upcoming.reduce(
                (sum, item) =>
                  sum +
                  Math.max(
                    0,
                    number(item.amount_due) - number(item.amount_paid),
                  ),
                0,
              ),
            )}
            hint={`${upcoming.length} scheduled installments${overdue.length ? ` · ${overdue.length} overdue` : ""}`}
            tone="bg-purple-50 text-purple-700"
          />
        </section>

        <Card padding="md">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-extrabold">Overall payment progress</h2>
              <p className="mt-1 text-xs text-[#5b6b63]">
                Collection progress across all bookings
              </p>
            </div>
            <p className="text-2xl font-extrabold text-[#0b5a3e]">
              {collectionPercentage}%
            </p>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#e3e9e0]">
            <div
              className="h-full rounded-full bg-[#1b7a5a]"
              style={{ width: `${collectionPercentage}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs">
            <span className="font-semibold text-[#0b5a3e]">
              Collected: {money(totalPaid)}
            </span>
            <span className="text-[#5b6b63]">
              Remaining: {money(totalBalance)}
            </span>
          </div>
        </Card>

        <div className="overflow-x-auto border-b border-[#dfe5dc]">
          <div className="flex min-w-max gap-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-1 pb-3 text-sm font-bold transition ${activeTab === tab ? "border-[#1b7a5a] text-[#0b5a3e]" : "border-transparent text-[#5b6b63] hover:text-[#14231d]"}`}
              >
                {tab}
                {tab === "Plots & Bookings" && (
                  <span className="ml-2 rounded-full bg-[#eef1ec] px-2 py-0.5 text-[10px]">
                    {bookings.length}
                  </span>
                )}
                {tab === "Installments" && (
                  <span className="ml-2 rounded-full bg-[#eef1ec] px-2 py-0.5 text-[10px]">
                    {installments.length}
                  </span>
                )}
                {tab === "Payments" && (
                  <span className="ml-2 rounded-full bg-[#eef1ec] px-2 py-0.5 text-[10px]">
                    {paidInstallments.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "Overview" && (
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <section>
                <SectionTitle
                  title="Purchased plots"
                  description="All plots purchased by this customer."
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("Plots & Bookings")}
                    >
                      View all plots <ChevronRight size={15} />
                    </Button>
                  }
                />
                {bookings.length ? (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {bookings.slice(0, 2).map((booking) => (
                      <PlotCard key={booking.booking_id} booking={booking} />
                    ))}
                  </div>
                ) : (
                  <Card padding="none">
                    <EmptyState
                      title="No bookings found"
                      description="This customer does not have any active bookings."
                    />
                  </Card>
                )}
              </section>

              <Card padding="md">
                <SectionTitle
                  title="Recent paid installments"
                  description="Paid installment records across all bookings."
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("Payments")}
                    >
                      View all <ChevronRight size={15} />
                    </Button>
                  }
                />
                {paidInstallments.length ? (
                  <div className="divide-y divide-[#edf1eb]">
                    {paidInstallments.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e9f6ef] text-[#0b5a3e]">
                            <ArrowDownLeft size={19} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold">
                              Installment #{item.installment_number} ·{" "}
                              {item.plot_number || item.booking_number}
                            </p>
                            <p className="mt-1 text-xs text-[#5b6b63]">
                              Due date {formatDate(item.due_date)}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-extrabold text-[#0b5a3e]">
                            {money(item.amount_paid)}
                          </p>
                          <Badge status={item.status} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No paid installments yet"
                    description="Completed installments will appear here."
                  />
                )}
              </Card>
            </div>

            <aside className="space-y-6">
              <Card padding="md">
                <SectionTitle
                  title="Upcoming installments"
                  description="Next scheduled payments."
                />
                {upcoming.length ? (
                  <div className="space-y-3">
                    {[...upcoming]
                      .sort(
                        (a, b) => new Date(a.due_date) - new Date(b.due_date),
                      )
                      .slice(0, 5)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl border border-[#edf1eb] p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-extrabold">
                                {item.plot_number || "Plot"}
                              </p>
                              <p className="mt-1 text-[11px] text-[#5b6b63]">
                                Installment #{item.installment_number} ·{" "}
                                {item.booking_number}
                              </p>
                            </div>
                            <p className="shrink-0 text-sm font-extrabold">
                              {money(
                                Math.max(
                                  0,
                                  number(item.amount_due) -
                                    number(item.amount_paid),
                                ),
                              )}
                            </p>
                          </div>
                          <div className="mt-3 flex items-center justify-between border-t border-[#edf1eb] pt-3 text-[11px]">
                            <span className="text-[#5b6b63]">
                              Due {formatDate(item.due_date)}
                            </span>
                            <Badge status={item.status} size="sm" />
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="py-5 text-sm text-[#5b6b63]">
                    No upcoming installments.
                  </p>
                )}
                {overdue.length > 0 && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
                    <p className="text-xs font-bold text-red-700">
                      {overdue.length} overdue installment
                      {overdue.length > 1 ? "s" : ""}
                    </p>
                    <p className="mt-1 text-xs text-red-600">
                      Outstanding overdue:{" "}
                      {money(
                        overdue.reduce(
                          (sum, item) =>
                            sum +
                            Math.max(
                              0,
                              number(item.amount_due) -
                                number(item.amount_paid),
                            ),
                          0,
                        ),
                      )}
                    </p>
                  </div>
                )}
              </Card>

              <Card padding="md">
                <h3 className="font-extrabold">Customer information</h3>
                <div className="mt-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <UserRound size={17} className="mt-0.5 text-[#5b6b63]" />
                    <div>
                      <p className="text-[11px] text-[#5b6b63]">Full name</p>
                      <p className="mt-1 text-sm font-semibold">
                        {customerName}
                      </p>
                    </div>
                  </div>
                  {customer?.phone && (
                    <div className="flex items-start gap-3">
                      <Phone size={17} className="mt-0.5 text-[#5b6b63]" />
                      <div>
                        <p className="text-[11px] text-[#5b6b63]">
                          Phone number
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {customer.phone}
                        </p>
                      </div>
                    </div>
                  )}
                  {customer?.email && (
                    <div className="flex items-start gap-3">
                      <Mail size={17} className="mt-0.5 text-[#5b6b63]" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-[#5b6b63]">
                          Email address
                        </p>
                        <p className="mt-1 break-all text-sm font-semibold">
                          {customer.email}
                        </p>
                      </div>
                    </div>
                  )}
                  {customer?.address && (
                    <div className="flex items-start gap-3">
                      <MapPin size={17} className="mt-0.5 text-[#5b6b63]" />
                      <div>
                        <p className="text-[11px] text-[#5b6b63]">Address</p>
                        <p className="mt-1 text-sm font-semibold">
                          {customer.address}
                        </p>
                      </div>
                    </div>
                  )}
                  {customer?.broker_name && (
                    <div className="flex items-start gap-3">
                      <UserRound size={17} className="mt-0.5 text-[#5b6b63]" />
                      <div>
                        <p className="text-[11px] text-[#5b6b63]">
                          Assigned broker
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {customer.broker_name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </aside>
          </div>
        )}

        {activeTab === "Plots & Bookings" && (
          <section>
            <SectionTitle
              title="All plots & bookings"
              description={`${bookings.length} bookings across ${number(stats.total_projects)} projects.`}
            />
            {bookings.length ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                {bookings.map((booking) => (
                  <PlotCard key={booking.booking_id} booking={booking} />
                ))}
              </div>
            ) : (
              <Card padding="none">
                <EmptyState
                  title="No bookings found"
                  description="There are no bookings to display for this customer."
                />
              </Card>
            )}
          </section>
        )}

        {activeTab === "Installments" && (
          <Card padding="none" className="overflow-hidden">
            <div className="p-5 sm:p-6">
              <SectionTitle
                title="Installment schedule"
                description="Paid, pending, partially paid and overdue installments across all bookings."
              />
            </div>
            <InstallmentsTable rows={installments} />
            <div className="border-t border-[#edf1eb] px-5 py-3 text-xs text-[#5b6b63]">
              Showing {installments.length} installments
            </div>
          </Card>
        )}

        {activeTab === "Payments" && (
          <Card padding="none" className="overflow-hidden">
            <div className="flex flex-wrap items-end justify-between gap-3 p-5 sm:p-6">
              <SectionTitle
                title="Paid installments"
                description="Paid installment records from the customer schedule."
              />
              <Button
                size="sm"
                onClick={() =>
                  window.alert(
                    "Connect this action to your payment recording form.",
                  )
                }
              >
                <Plus size={15} /> Record payment
              </Button>
            </div>
            <div className="px-5 pb-4 sm:px-6">
              <Input
                value={paymentSearch}
                onChange={(event) => setPaymentSearch(event.target.value)}
                placeholder="Search plot, booking or installment..."
                leadingIcon={Search}
              />
            </div>
            <PaymentsTable rows={filteredPayments} />
            <div className="border-t border-[#edf1eb] px-5 py-3 text-xs text-[#5b6b63]">
              Showing {filteredPayments.length} of {paidInstallments.length}{" "}
              paid installments
            </div>
          </Card>
        )}

        <footer className="flex flex-wrap justify-between gap-2 pb-4 text-[11px] text-[#87928b]">
          <span>Plotwise · Customer profile</span>
          <span>Live customer data</span>
        </footer>
      </div>
    </div>
  );
}
