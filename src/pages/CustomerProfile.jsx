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
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Badge from "../components/common/Badge";
import Loader, { PageLoader } from "../components/common/Loader";
import OverviewTab from "../components/customers/OverviewTab";
import PlotsBookingsTab from "../components/customers/PlotsBookingsTab";
import InstallmentsTab from "../components/customers/InstallmentsTab";
import PaymentsTab from "../components/customers/PaymentsTab";
import { useToast } from "../components/common/Toast";

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

// Normalize API aliases so shared UI components can consistently use id/uuid/status.
const normalizeInstallment = (item) => ({
  ...item,
  id: item.id ?? item.installment_id,
  uuid: item.uuid ?? item.installment_uuid,
  installment_id: item.installment_id ?? item.id,
  installment_uuid: item.installment_uuid ?? item.uuid,
});

const normalizePayment = (item) => ({
  ...item,
  id: item.id ?? item.payment_id,
  uuid: item.uuid ?? item.payment_uuid,
  status: item.status ?? item.payment_status,
  payment_id: item.payment_id ?? item.id,
  payment_uuid: item.payment_uuid ?? item.uuid,
  payment_status: item.payment_status ?? item.status,
});

const normalizeCustomerProfile = (payload) => {
  const installments = (payload.installments || []).map(normalizeInstallment);
  const payments = (payload.payments || []).map(normalizePayment);

  return {
    ...payload,
    installments,
    payments,
    upcoming_installments: (payload.upcoming_installments || []).map(
      normalizeInstallment,
    ),
    overdue_installments: (payload.overdue_installments || []).map(
      normalizeInstallment,
    ),
    bookings: (payload.bookings || []).map((booking) => ({
      ...booking,
      installments: (booking.installments || []).map((item) => ({
        ...normalizeInstallment(item),
        payments: (item.payments || []).map(normalizePayment),
      })),
      payments: (booking.payments || []).map(normalizePayment),
    })),
  };
};

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
  const toast = useToast();
  const uuid = location.state?.uuid;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [paymentSearch, setPaymentSearch] = useState("");

  // Payment modal state.
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentErrors, setPaymentErrors] = useState({});
  const [paymentSuccess, setPaymentSuccess] = useState("");
  const [accounts, setAccounts] = useState([]);

  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    installment_uuid: "",
    amount: "",
    account_id: "",
    paid_at: new Date().toISOString().slice(0, 10),
    payment_method: "",
    notes: "",
  });

  const getAccounts = async () => {
    setLoadingAccounts(true);

    try {
      const res = await axios.get("/api/accounts", {
        withCredentials: true,
      });

      if (res.status === 200) {
        setAccounts(res.data?.data?.accounts || []);
      }
    } catch (error) {
      toast(
        error.response?.data?.message || "Failed to load bank accounts.",
        "error",
      );
    } finally {
      setLoadingAccounts(false);
    }
  };
  useEffect(() => {
    getAccounts();
  }, []);
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

        setProfile(normalizeCustomerProfile(payload));
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

  const payments = profile?.payments || [];

  const paidInstallments = useMemo(
    () => installments.filter((item) => item.status === "paid"),
    [installments],
  );

  const filteredPayments = useMemo(() => {
    const search = paymentSearch.trim().toLowerCase();
    if (!search) return payments;

    return payments.filter((payment) =>
      [
        payment.payment_number,
        payment.booking_number,
        payment.plot_number,
        payment.installment_number,
        payment.payment_method,
        payment.payment_status,
        payment.amount,
        payment.received_by_name,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search),
    );
  }, [payments, paymentSearch]);

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

    if (!firstPayable) {
      toast("There are no payable installments for this customer.", "info");
      return;
    }

    setPaymentForm({
      installment_uuid: String(
        firstPayable.uuid || firstPayable.installment_uuid || firstPayable.id,
      ),
      amount: "",
      account_id: "",
      paid_at: new Date().toISOString().slice(0, 10),
      payment_method: "",
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

  const handleConfirmPayment = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    const amount = Number(paymentForm.amount);

    if (!selectedInstallment) {
      nextErrors.installment_uuid = "Select an installment.";
    }

    if (
      !String(paymentForm.amount).trim() ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      nextErrors.amount = "Enter a valid payment amount greater than ₹0.";
    } else if (amount > installmentPayable) {
      nextErrors.amount = `Payment cannot exceed ${money(installmentPayable)}.`;
    }

    if (!paymentForm.paid_at) {
      nextErrors.paid_at = "Select the payment date.";
    }

    if (!paymentForm.payment_method) {
      nextErrors.payment_method = "Select a payment method.";
    }

    if (!paymentForm.account_id) {
      nextErrors.account_id = "Select a receiving bank account.";
    }

    setPaymentErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const installmentId =
      selectedInstallment.installment_id ?? selectedInstallment.id;
    const installmentUuid =
      selectedInstallment.installment_uuid ?? selectedInstallment.uuid;
    const bookingId = selectedInstallment.booking_id;
    const customerId = selectedInstallment.customer_id ?? customer?.id;

    if (!installmentId || !installmentUuid || !bookingId || !customerId) {
      toast(
        "Required booking, customer, or installment details are missing.",
        "error",
      );
      return;
    }

    const payload = {
      amount: amount.toFixed(2),
      booking_id: Number(bookingId),
      customer_id: Number(customerId),
      installment_id: Number(installmentId),
      installment_uuid: installmentUuid,
      paid_at: paymentForm.paid_at,
      payment_method: paymentForm.payment_method,
      notes: paymentForm.notes.trim(),
      account_id: Number(paymentForm.account_id),
    };

    setSavingPayment(true);

    try {
      const response = await axios.post("/api/payments/received", payload, {
        withCredentials: true,
      });

      if (response.data?.success === false) {
        throw new Error(response.data.message || "Unable to record payment.");
      }

      toast(
        response.data?.message || "Payment recorded successfully.",
        "success",
      );

      setPaymentModalOpen(false);
      setPaymentErrors({});
      setPaymentSuccess("");
      setPaymentForm({
        installment_uuid: "",
        amount: "",
        account_id: "",
        paid_at: new Date().toISOString().slice(0, 10),
        payment_method: "",
        notes: "",
      });

      await fetchProfile(undefined, true);
    } catch (error) {
      toast(
        error.response?.data?.message ||
          error.message ||
          "Unable to record payment. Please try again.",
        "error",
      );
    } finally {
      setSavingPayment(false);
    }
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
      sum +
      Math.max(
        0,
        number(item.amount_due) +
          number(item.late_fee) -
          number(item.amount_paid),
      ),
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
                    {payments.length}
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
                loading={savingPayment}
                disabled={payableInstallments.length === 0}
              >
                <CheckCircle2 size={16} />
                Confirm payment
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
                <Select
                  id="payment-installment"
                  name="installment_uuid"
                  label="Installment"
                  placeholder="Select installment"
                  required
                  value={paymentForm.installment_uuid}
                  error={paymentErrors.installment_uuid}
                  onChange={(event) =>
                    handlePaymentFieldChange(
                      "installment_uuid",
                      event.target.value,
                    )
                  }
                  options={payableInstallments.map((item) => {
                    const itemKey = String(
                      item.uuid || item.installment_uuid || item.id,
                    );
                    const balance = Math.max(
                      0,
                      number(item.amount_due) +
                        number(item.late_fee) -
                        number(item.amount_paid),
                    );

                    const label = [
                      item.plot_number ? `Plot ${item.plot_number}` : "",
                      item.booking_number || "",
                      `Installment #${item.installment_number}`,
                      `${money(balance)} outstanding`,
                    ]
                      .filter(Boolean)
                      .join(" · ");

                    return { value: itemKey, label };
                  })}
                />
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
                  <Input
                    id="payment-amount"
                    name="amount"
                    label="Payment amount (₹)"
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
                    required
                    error={paymentErrors.amount}
                  />

                  <Input
                    id="payment-date"
                    name="paid_at"
                    label="Payment date"
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    value={paymentForm.paid_at}
                    onChange={(event) =>
                      handlePaymentFieldChange("paid_at", event.target.value)
                    }
                    required
                    error={paymentErrors.paid_at}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Select
                    id="payment-method"
                    name="payment_method"
                    label="Payment method"
                    placeholder="Select payment method"
                    required
                    value={paymentForm.payment_method}
                    error={paymentErrors.payment_method}
                    onChange={(event) =>
                      handlePaymentFieldChange(
                        "payment_method",
                        event.target.value,
                      )
                    }
                    options={[
                      { value: "cash", label: "Cash" },
                      { value: "upi", label: "UPI" },
                      { value: "bank_transfer", label: "Bank transfer" },
                      { value: "card", label: "Card" },
                      { value: "cheque", label: "Cheque" },
                      { value: "other", label: "Other" },
                    ]}
                  />
                  <Select
                    id="payment-account"
                    name="account_id"
                    label="Receiving bank account"
                    placeholder={
                      loadingAccounts
                        ? "Loading accounts..."
                        : accounts.length
                          ? "Select bank account"
                          : "No bank accounts available"
                    }
                    required
                    disabled={loadingAccounts || accounts.length === 0}
                    value={paymentForm.account_id}
                    error={paymentErrors.account_id}
                    onChange={(event) =>
                      handlePaymentFieldChange("account_id", event.target.value)
                    }
                    options={accounts.map((account) => ({
                      value: String(account.id),
                      label: `${account.account_name} — ${account.bank_name}`,
                    }))}
                  />
                </div>

                <Input
                  id="payment-notes"
                  name="notes"
                  label="Notes (optional)"
                  value={paymentForm.notes}
                  onChange={(event) =>
                    handlePaymentFieldChange("notes", event.target.value)
                  }
                  placeholder="Add payment notes..."
                />
                <div className="rounded-xl border border-[#e1e8e2] bg-[#f7f9f6] p-3 text-xs leading-5 text-[#5b6b63]">
                  Payment will be recorded against the selected installment.
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
