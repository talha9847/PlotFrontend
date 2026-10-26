import { CalendarClock, Home } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";

const DUE_INSTALLMENT_STATUSES = new Set([
  "pending",
  "partially_paid",
  "overdue",
]);

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

const remainingAmount = (item) =>
  Math.max(
    0,
    number(item.amount_due) + number(item.late_fee) - number(item.amount_paid),
  );

const toDateKey = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isUnpaidInstallment = (item) =>
  DUE_INSTALLMENT_STATUSES.has(item.status) && remainingAmount(item) > 0;

const isDueUnpaidInstallment = (item) => {
  if (!isUnpaidInstallment(item)) return false;
  if (typeof item.is_due === "boolean") return item.is_due;

  const dueDate = toDateKey(item.due_date);
  const today = toDateKey(new Date());

  return Boolean(dueDate && today && dueDate <= today);
};

const isUpcomingUnpaidInstallment = (item) =>
  isUnpaidInstallment(item) && !isDueUnpaidInstallment(item);

const computeInstallmentStats = (rows) => {
  const dueRows = rows.filter(isDueUnpaidInstallment);

  return {
    total_installment_value: rows.reduce(
      (sum, item) => sum + number(item.amount_due),
      0,
    ),
    total_paid_amount: rows.reduce(
      (sum, item) => sum + number(item.amount_paid),
      0,
    ),
    total_pending_overdue_amount: dueRows.reduce(
      (sum, item) => sum + remainingAmount(item),
      0,
    ),
    overdue_count: dueRows.length,
    due_count: dueRows.length,
    total_installments: rows.length,
  };
};

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

function StatTile({ label, value, tone = "text-[#14231d]" }) {
  return (
    <div className="rounded-xl border border-[#e8ede8] bg-[#fafbf9] px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#718078]">
        {label}
      </p>
      <p className={`mt-1 text-base font-extrabold ${tone}`}>{value}</p>
    </div>
  );
}

function InstallmentSummary({ stats }) {
  const pendingOverdue = number(stats.total_pending_overdue_amount);
  const overdueCount = number(stats.overdue_count);

  return (
    <div className="border-b border-[#edf1eb] p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-[#14231d]">
            Installment summary
          </h3>
          <p className="mt-1 text-xs text-[#5b6b63]">
            Scheduled value, collections and currently due balance.
          </p>
        </div>
        <span className="rounded-full bg-[#eef1ec] px-2.5 py-1 text-[10px] font-bold text-[#52665b]">
          {number(stats.total_installments)} total installments
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatTile
          label="Total installment value"
          value={money(stats.total_installment_value)}
        />
        <StatTile
          label="Total paid"
          value={money(stats.total_paid_amount)}
          tone="text-[#0b5a3e]"
        />
        <StatTile
          label="Total pending"
          value={money(pendingOverdue)}
          tone={pendingOverdue > 0 ? "text-amber-700" : "text-[#0b5a3e]"}
        />
        <StatTile
          label="Overdue / missed"
          value={String(overdueCount)}
          tone={overdueCount > 0 ? "text-rose-700" : "text-[#0b5a3e]"}
        />
      </div>
    </div>
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
    <div className="max-h-[560px] overflow-auto">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="sticky top-0 z-10 bg-[#f7f8f6] text-[11px] uppercase tracking-wider text-[#5b6b63]">
          <tr>
            <th className="px-5 py-3">Installment</th>
            <th className="px-5 py-3">Plot / Booking</th>
            <th className="px-5 py-3">Due date</th>
            <th className="px-5 py-3">Due amount</th>
            <th className="px-5 py-3">Paid amount</th>
            <th className="px-5 py-3">Outstanding</th>
            <th className="px-5 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf1eb]">
          {rows.map((item) => {
            const isOverdue = item.status === "overdue";
            const isUpcoming = isUpcomingUnpaidInstallment(item);

            return (
              <tr
                key={item.id}
                className={
                  isOverdue
                    ? "bg-rose-50/50 hover:bg-rose-50"
                    : "hover:bg-[#fafbf9]"
                }
              >
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
                <td className="px-5 py-4 font-bold">
                  {money(item.amount_due)}
                </td>
                <td className="px-5 py-4 font-semibold">
                  {money(item.amount_paid)}
                </td>
                <td className="px-5 py-4 font-extrabold text-[#9a3412]">
                  {money(remainingAmount(item))}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-1">
                    <Badge status={item.status} size="sm" />
                    {isUpcoming && <Badge status="upcoming" size="sm" />}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function InstallmentsTab({
  installments = [],
  installmentStats,
}) {
  const rows = [...installments].sort(
    (a, b) =>
      toDateKey(a.due_date).localeCompare(toDateKey(b.due_date)) ||
      number(a.installment_number) - number(b.installment_number),
  );

  const stats =
    installmentStats?.total_installments !== undefined
      ? installmentStats
      : computeInstallmentStats(installments);

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-start gap-3 p-5 pb-0 sm:p-6 sm:pb-0">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fef3c7] text-[#b45309]">
          <CalendarClock size={20} />
        </span>
        <div>
          <h2 className="text-base font-extrabold text-[#14231d]">
            Installment schedule
          </h2>
          <p className="mt-1 text-xs text-[#5b6b63] sm:text-sm">
            Complete schedule across all bookings, including paid and upcoming
            installments.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <InstallmentSummary stats={stats} />
      </div>

      <InstallmentsTable rows={rows} />

      <div className="border-t border-[#edf1eb] px-5 py-3 text-xs text-[#5b6b63]">
        Showing {rows.length} installment{rows.length === 1 ? "" : "s"} across
        all bookings · Upcoming rows are not currently due.
      </div>
    </Card>
  );
}
