import { Home } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";

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

function PlotCard({ booking }) {
  const total = number(booking.total_amount);
  const balance = number(booking.balance);
  const paid = Math.max(0, total - balance);
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
