import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Download,
  Home,
  IndianRupee,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  TrendingUp,
  UserRound,
  Wallet,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../components/common/Card";
import Modal from "../components/common/Modal";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Loader, { PageLoader } from "../components/common/Loader";
import OverviewTab from "../components/customers/OverviewTab";
import PlotsBookingsTab from "../components/customers/PlotsBookingsTab";
import InstallmentsTab from "../components/customers/InstallmentsTab";
import PaymentsTab from "../components/customers/PaymentsTab";

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

  // Static/demo payment modal state. This updates the profile only in memory.
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentErrors, setPaymentErrors] = useState({});
  const [paymentSuccess, setPaymentSuccess] = useState("");
  const [paymentForm, setPaymentForm] = useState({
    installment_uuid: "",
    amount: "",
    paid_at: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const fetchProfile = useCallback(
    async (signal, isRefresh = false) => {
      if (!uuid) {
        setError(
          "Customer UUID is missing. Open this page from the customers list.",
        );
        setLoading(false);
        setRefreshing(false);
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
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load customer profile.",
        );
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

  const payableInstallments = installments.filter((item) =>
    ["pending", "partially_paid", "overdue"].includes(item.status),
  );

  const selectedInstallment = payableInstallments.find(
    (item) =>
      String(item.uuid || item.installment_uuid || item.id) ===
      paymentForm.installment_uuid,
  );

  const installmentPayable = selectedInstallment
    ? Math.max(
        0,
        number(selectedInstallment.amount_due) +
          number(selectedInstallment.late_fee) -
          number(selectedInstallment.amount_paid),
      )
    : 0;

  const closePaymentModal = () => {
    if (savingPayment) return;
    setPaymentModalOpen(false);
    setPaymentErrors({});
    setPaymentSuccess("");
  };

  const openPaymentModal = () => {
    const firstPayable = payableInstallments[0];
    setPaymentForm({
      installment_uuid: firstPayable
        ? String(
            firstPayable.uuid ||
              firstPayable.installment_uuid ||
              firstPayable.id,
          )
        : "",
      amount: "",
      paid_at: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    setPaymentErrors({});
    setPaymentSuccess("");
    setPaymentModalOpen(true);
  };

  const handlePaymentFieldChange = (field, value) => {
    setPaymentForm((current) => ({ ...current, [field]: value }));
    setPaymentErrors((current) => ({ ...current, [field]: "" }));
    setPaymentSuccess("");
  };

  const handleConfirmPayment = (event) => {
    event.preventDefault();

    const nextErrors = {};
    const amount = Number(paymentForm.amount);
    const due = selectedInstallment
      ? Math.max(
          0,
          number(selectedInstallment.amount_due) +
            number(selectedInstallment.late_fee) -
            number(selectedInstallment.amount_paid),
        )
      : 0;

    if (!paymentForm.installment_uuid) {
      nextErrors.installment_uuid = "Select an installment.";
    }
    if (!paymentForm.amount.trim() || !Number.isFinite(amount) || amount <= 0) {
      nextErrors.amount = "Enter a payment amount greater than ₹0.";
    } else if (amount > due) {
      nextErrors.amount = `Payment cannot exceed the outstanding amount of ${money(due)}.`;
    }
    if (!paymentForm.paid_at) {
      nextErrors.paid_at = "Select the payment date.";
    }

    setPaymentErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSavingPayment(true);

    // Static/demo confirmation: update this page's local state only.
    // Replace this block with your payment API call when the backend is ready.
    const newAmountPaid = number(selectedInstallment.amount_paid) + amount;
    const totalPayable =
      number(selectedInstallment.amount_due) +
      number(selectedInstallment.late_fee);
    const newStatus =
      newAmountPaid >= totalPayable
        ? "paid"
        : newAmountPaid > 0
          ? "partially_paid"
          : selectedInstallment.status;

    const updatedInstallments = installments.map((item) => {
      const itemKey = String(item.uuid || item.installment_uuid || item.id);
      if (itemKey !== paymentForm.installment_uuid) return item;

      return {
        ...item,
        amount_paid: newAmountPaid,
        status: newStatus,
        paid_at: newStatus === "paid" ? paymentForm.paid_at : item.paid_at,
        notes: paymentForm.notes.trim() || item.notes,
      };
    });

    const collectedDelta = amount;
    setProfile((current) => ({
      ...current,
      installments: updatedInstallments,
      upcoming_installments: (current.upcoming_installments || [])
        .map((item) => {
          const itemKey = String(item.uuid || item.installment_uuid || item.id);
          if (itemKey !== paymentForm.installment_uuid) return item;
          return {
            ...item,
            amount_paid: newAmountPaid,
            status: newStatus,
            paid_at: newStatus === "paid" ? paymentForm.paid_at : item.paid_at,
            notes: paymentForm.notes.trim() || item.notes,
          };
        })
        .filter((item) => item.status !== "paid"),
      overdue_installments: (current.overdue_installments || [])
        .map((item) => {
          const itemKey = String(item.uuid || item.installment_uuid || item.id);
          if (itemKey !== paymentForm.installment_uuid) return item;
          return {
            ...item,
            amount_paid: newAmountPaid,
            status: newStatus,
            paid_at: newStatus === "paid" ? paymentForm.paid_at : item.paid_at,
            notes: paymentForm.notes.trim() || item.notes,
          };
        })
        .filter((item) => item.status === "overdue"),
      stats: {
        ...(current.stats || {}),
        total_collected:
          number(current.stats?.total_collected) + collectedDelta,
        outstanding_balance: Math.max(
          0,
          number(current.stats?.outstanding_balance) - collectedDelta,
        ),
      },
    }));

    setSavingPayment(false);
    setPaymentSuccess(
      "Payment confirmed in this page for preview only. It has not been saved to the server.",
    );
    setPaymentForm((current) => ({ ...current, amount: "" }));
  };

  if (loading) return <PageLoader label="Loading customer profile..." />;

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

  const upcomingAmount = upcoming.reduce(
    (sum, item) =>
      sum + Math.max(0, number(item.amount_due) - number(item.amount_paid)),
    0,
  );

  const tabs = ["Overview", "Plots & Bookings", "Installments", "Payments"];

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
            <Button size="sm" onClick={openPaymentModal}>
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
            value={money(upcomingAmount)}
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
                className={`border-b-2 px-1 pb-3 text-sm font-bold transition ${
                  activeTab === tab
                    ? "border-[#1b7a5a] text-[#0b5a3e]"
                    : "border-transparent text-[#5b6b63] hover:text-[#14231d]"
                }`}
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
          <OverviewTab
            customer={customer}
            bookings={bookings}
            paidInstallments={paidInstallments}
            upcoming={upcoming}
            overdue={overdue}
            stats={stats}
            onViewBookings={() => setActiveTab("Plots & Bookings")}
            onViewPayments={() => setActiveTab("Payments")}
          />
        )}

        {activeTab === "Plots & Bookings" && (
          <PlotsBookingsTab bookings={bookings} stats={stats} />
        )}

        {activeTab === "Installments" && (
          <InstallmentsTab installments={installments} />
        )}

        {activeTab === "Payments" && (
          <PaymentsTab
            rows={filteredPayments}
            paymentSearch={paymentSearch}
            onSearchChange={setPaymentSearch}
            onRecordPayment={openPaymentModal}
          />
        )}

        <Modal
          open={paymentModalOpen}
          onClose={closePaymentModal}
          size="lg"
          title="Record payment"
          description="Select an installment, enter the payment amount, and confirm the details."
          footer={
            <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={closePaymentModal}
                disabled={savingPayment}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="record-customer-payment-form"
                disabled={savingPayment || payableInstallments.length === 0}
              >
                <CheckCircle2 size={16} className="mr-2" />
                {savingPayment ? "Confirming..." : "Confirm payment"}
              </Button>
            </div>
          }
        >
          <form
            id="record-customer-payment-form"
            onSubmit={handleConfirmPayment}
            className="space-y-5"
            noValidate
          >
            <div className="rounded-2xl border border-[#e1e8e2] bg-[#f7f9f6] p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-[#718078]">
                Customer
              </p>
              <p className="mt-1 text-base font-bold text-[#14231d]">
                {customerName}
              </p>
              {customer?.phone && (
                <p className="mt-1 text-sm text-[#5b6b63]">{customer.phone}</p>
              )}
            </div>

            {payableInstallments.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                There are no pending, partially paid, or overdue installments
                for this customer.
              </div>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="payment-installment"
                    className="mb-1.5 block text-sm font-semibold text-[#263a30]"
                  >
                    Installment <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="payment-installment"
                    name="installment_uuid"
                    value={paymentForm.installment_uuid}
                    onChange={(event) =>
                      handlePaymentFieldChange(
                        "installment_uuid",
                        event.target.value,
                      )
                    }
                    className={`w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-[#14231d] outline-none focus:border-[#1b7a5a] focus:ring-4 focus:ring-[#1b7a5a]/10 ${
                      paymentErrors.installment_uuid
                        ? "border-red-400"
                        : "border-[#dfe5dc]"
                    }`}
                    aria-invalid={Boolean(paymentErrors.installment_uuid)}
                  >
                    <option value="">Select installment</option>
                    {payableInstallments.map((item) => {
                      const itemKey = String(
                        item.uuid || item.installment_uuid || item.id,
                      );
                      const balance = Math.max(
                        0,
                        number(item.amount_due) +
                          number(item.late_fee) -
                          number(item.amount_paid),
                      );
                      return (
                        <option key={itemKey} value={itemKey}>
                          {item.plot_number
                            ? `Plot ${item.plot_number} · `
                            : ""}
                          {item.booking_number
                            ? `${item.booking_number} · `
                            : ""}
                          Installment #{item.installment_number} ·{" "}
                          {money(balance)} outstanding
                        </option>
                      );
                    })}
                  </select>
                  {paymentErrors.installment_uuid && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {paymentErrors.installment_uuid}
                    </p>
                  )}
                </div>

                {selectedInstallment && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-[#e1e8e2] p-3">
                      <p className="text-xs text-[#718078]">Amount due</p>
                      <p className="mt-1 font-bold text-[#14231d]">
                        {money(number(selectedInstallment.amount_due))}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#e1e8e2] p-3">
                      <p className="text-xs text-[#718078]">Late fee</p>
                      <p className="mt-1 font-bold text-[#14231d]">
                        {money(number(selectedInstallment.late_fee))}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#b8d9c4] bg-[#edf5ef] p-3">
                      <p className="text-xs text-[#536b5c]">Outstanding</p>
                      <p className="mt-1 font-bold text-[#176344]">
                        {money(installmentPayable)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="payment-amount"
                      className="mb-1.5 block text-sm font-semibold text-[#263a30]"
                    >
                      Payment amount (INR){" "}
                      <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="payment-amount"
                      name="amount"
                      type="number"
                      min="0.01"
                      max={installmentPayable || undefined}
                      step="0.01"
                      inputMode="decimal"
                      value={paymentForm.amount}
                      onChange={(event) =>
                        handlePaymentFieldChange("amount", event.target.value)
                      }
                      placeholder="Enter amount"
                      className={`w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-[#14231d] outline-none focus:border-[#1b7a5a] focus:ring-4 focus:ring-[#1b7a5a]/10 ${
                        paymentErrors.amount
                          ? "border-red-400"
                          : "border-[#dfe5dc]"
                      }`}
                      aria-invalid={Boolean(paymentErrors.amount)}
                    />
                    {paymentErrors.amount && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {paymentErrors.amount}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="payment-date"
                      className="mb-1.5 block text-sm font-semibold text-[#263a30]"
                    >
                      Payment date <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="payment-date"
                      name="paid_at"
                      type="date"
                      max={new Date().toISOString().slice(0, 10)}
                      value={paymentForm.paid_at}
                      onChange={(event) =>
                        handlePaymentFieldChange("paid_at", event.target.value)
                      }
                      className={`w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-[#14231d] outline-none focus:border-[#1b7a5a] focus:ring-4 focus:ring-[#1b7a5a]/10 ${
                        paymentErrors.paid_at
                          ? "border-red-400"
                          : "border-[#dfe5dc]"
                      }`}
                      aria-invalid={Boolean(paymentErrors.paid_at)}
                    />
                    {paymentErrors.paid_at && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {paymentErrors.paid_at}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="payment-notes"
                    className="mb-1.5 block text-sm font-semibold text-[#263a30]"
                  >
                    Notes{" "}
                    <span className="font-normal text-[#89958d]">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    id="payment-notes"
                    name="notes"
                    rows={3}
                    value={paymentForm.notes}
                    onChange={(event) =>
                      handlePaymentFieldChange("notes", event.target.value)
                    }
                    placeholder="Add payment notes..."
                    className="w-full resize-y rounded-xl border border-[#dfe5dc] bg-white px-3.5 py-3 text-sm text-[#14231d] outline-none transition placeholder:text-[#9aa59d] focus:border-[#1b7a5a] focus:ring-4 focus:ring-[#1b7a5a]/10"
                  />
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-800">
                  Demo mode: confirming updates this page only. No payment is
                  saved to the database until an API endpoint is connected.
                </div>
              </>
            )}

            {paymentSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                {paymentSuccess}
              </div>
            )}
          </form>
        </Modal>

        <footer className="flex flex-wrap justify-between gap-2 pb-4 text-[11px] text-[#87928b]">
          <span>Plotwise · Customer profile</span>
          <span>Live customer data</span>
        </footer>
      </div>
    </div>
  );
}
