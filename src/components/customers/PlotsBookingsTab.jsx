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

function StatTile({ label, value, tone = "text-[#14231d]" }) {
  return (
    <div className="rounded-lg border border-[#e8ede8] bg-white px-2.5 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#718078]">
        {label}
      </p>
      <p className={`mt-1 text-sm font-extrabold ${tone}`}>{value}</p>
    </div>
  );
}

function PlotCard({ booking }) {
  const total = number(booking.total_amount);
  const balance = number(booking.balance);
  const paid = Math.max(0, total - balance);
  const progress =
    total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

  const allInstallments = booking.installments || [];
  const dueInstallments = (
    Array.isArray(booking.due_installments) && booking.due_installments.length
      ? booking.due_installments
      : allInstallments.filter(isDueUnpaidInstallment)
  ).sort((a, b) => toDateKey(a.due_date).localeCompare(toDateKey(b.due_date)));

  const nextUpcomingInstallment =
    booking.next_upcoming_installment ||
    allInstallments.find(isUpcomingUnpaidInstallment) ||
    null;

  const isAdvanceMode =
    dueInstallments.length === 0 && Boolean(nextUpcomingInstallment);

  const visibleInstallments = dueInstallments.length
    ? dueInstallments
    : nextUpcomingInstallment
      ? [nextUpcomingInstallment]
      : [];

  const installmentStats =
    booking.installment_stats || computeInstallmentStats(allInstallments);

  const totalInstallmentValue = number(
    installmentStats.total_installment_value,
  );
  const totalPaidAmount = number(installmentStats.total_paid_amount);
  const pendingOverdueAmount = number(
    installmentStats.total_pending_overdue_amount,
  );
  const overdueCount = number(installmentStats.overdue_count);

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
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <StatTile
          label="Total installment value"
          value={money(totalInstallmentValue)}
        />
        <StatTile label="Total paid" value={money(totalPaidAmount)} />
        <StatTile
          label="Total pending"
          value={money(pendingOverdueAmount)}
          tone={pendingOverdueAmount > 0 ? "text-amber-700" : "text-[#0b5a3e]"}
        />
        <StatTile
          label="Overdue / missed"
          value={String(overdueCount)}
          tone={overdueCount > 0 ? "text-rose-700" : "text-[#0b5a3e]"}
        />
      </div>

      <div className="mt-4 border-t border-[#edf1eb] pt-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <CalendarClock
              size={14}
              className={isAdvanceMode ? "text-sky-600" : "text-[#b45309]"}
            />
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#5b6b63]">
              {isAdvanceMode ? "Upcoming installment" : "Due & overdue"}
            </p>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isAdvanceMode
                ? "bg-sky-50 text-sky-700"
                : "bg-[#fef3c7] text-[#92400e]"
            }`}
          >
            {visibleInstallments.length}
          </span>
        </div>

        {visibleInstallments.length ? (
          <div className="mt-2 max-h-44 space-y-2 overflow-y-auto pr-1">
            {visibleInstallments.map((item) => {
              const isUpcoming = isUpcomingUnpaidInstallment(item);

              return (
                <div
                  key={
                    item.id ??
                    item.installment_id ??
                    item.uuid ??
                    item.installment_uuid
                  }
                  className={`rounded-lg border px-2.5 py-2 ${
                    isUpcoming
                      ? "border-sky-200 bg-sky-50/60"
                      : "border-[#f0d9b5] bg-[#fffbf3]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-[#14231d]">
                        Installment #{item.installment_number}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#7c6a4d]">
                        Due {formatDate(item.due_date)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-extrabold text-[#9a3412]">
                        {money(remainingAmount(item))}
                      </p>
                      <div className="mt-1">
                        <Badge
                          status={isUpcoming ? "upcoming" : item.status}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 rounded-lg border border-dashed border-[#dfe5dc] px-3 py-2 text-[11px] text-[#5b6b63]">
            No pending installment.
          </p>
        )}
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

export default function PlotsBookingsTab({ bookings, stats }) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-base font-extrabold text-[#14231d]">
          All plots &amp; bookings
        </h2>
        <p className="mt-1 text-xs text-[#5b6b63] sm:text-sm">
          {bookings.length} bookings across {number(stats?.total_projects)}{" "}
          projects.
        </p>
      </div>

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
  );
}

export { PlotCard };
