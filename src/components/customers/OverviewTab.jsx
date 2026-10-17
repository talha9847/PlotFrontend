import {
  ArrowDownLeft,
  ChevronRight,
  Home,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";
import Badge from "../common/Badge";
import { PlotCard } from "./PlotsBookingsTab";

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
        {description && <p className="mt-1 text-xs text-[#5b6b63] sm:text-sm">{description}</p>}
      </div>
      {action}
    </div>
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

function CustomerInformation({ customer, customerName }) {
  return (
    <Card padding="md">
      <h3 className="font-extrabold">Customer information</h3>
      <div className="mt-4 space-y-4">
        <InfoRow icon={UserRound} label="Full name" value={customerName} />
        {customer?.phone && <InfoRow icon={Phone} label="Phone number" value={customer.phone} />}
        {customer?.email && <InfoRow icon={Mail} label="Email address" value={customer.email} breakAll />}
        {customer?.address && <InfoRow icon={MapPin} label="Address" value={customer.address} />}
        {customer?.broker_name && <InfoRow icon={UserRound} label="Assigned broker" value={customer.broker_name} />}
      </div>
    </Card>
  );
}

function InfoRow({ icon: Icon, label, value, breakAll = false }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={17} className="mt-0.5 text-[#5b6b63]" />
      <div className="min-w-0">
        <p className="text-[11px] text-[#5b6b63]">{label}</p>
        <p className={`mt-1 text-sm font-semibold ${breakAll ? "break-all" : ""}`}>{value}</p>
      </div>
    </div>
  );
}

export default function OverviewTab({
  customer,
  bookings,
  paidInstallments,
  upcoming,
  overdue,
  stats,
  onViewBookings,
  onViewPayments,
}) {
  const customerName = customer?.name || "Customer";
  const overdueAmount = overdue.reduce(
    (sum, item) => sum + Math.max(0, number(item.amount_due) - number(item.amount_paid)),
    0,
  );

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        <section>
          <SectionTitle
            title="Purchased plots"
            description="All plots purchased by this customer."
            action={
              <Button variant="ghost" size="sm" onClick={onViewBookings}>
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
              <EmptyState title="No bookings found" description="This customer does not have any active bookings." />
            </Card>
          )}
        </section>

        <Card padding="md">
          <SectionTitle
            title="Recent paid installments"
            description="Paid installment records across all bookings."
            action={
              <Button variant="ghost" size="sm" onClick={onViewPayments}>
                View all <ChevronRight size={15} />
              </Button>
            }
          />
          {paidInstallments.length ? (
            <div className="divide-y divide-[#edf1eb]">
              {paidInstallments.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e9f6ef] text-[#0b5a3e]">
                      <ArrowDownLeft size={19} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">
                        Installment #{item.installment_number} · {item.plot_number || item.booking_number}
                      </p>
                      <p className="mt-1 text-xs text-[#5b6b63]">Due date {formatDate(item.due_date)}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-extrabold text-[#0b5a3e]">{money(item.amount_paid)}</p>
                    <Badge status={item.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No paid installments yet" description="Completed installments will appear here." />
          )}
        </Card>
      </div>

      <aside className="space-y-6">
        <Card padding="md">
          <SectionTitle title="Upcoming installments" description="Next scheduled payments." />
          {upcoming.length ? (
            <div className="space-y-3">
              {[...upcoming]
                .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                .slice(0, 5)
                .map((item) => (
                  <div key={item.id} className="rounded-xl border border-[#edf1eb] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold">{item.plot_number || "Plot"}</p>
                        <p className="mt-1 text-[11px] text-[#5b6b63]">
                          Installment #{item.installment_number} · {item.booking_number}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-extrabold">
                        {money(Math.max(0, number(item.amount_due) - number(item.amount_paid)))}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-[#edf1eb] pt-3 text-[11px]">
                      <span className="text-[#5b6b63]">Due {formatDate(item.due_date)}</span>
                      <Badge status={item.status} size="sm" />
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="py-5 text-sm text-[#5b6b63]">No upcoming installments.</p>
          )}

          {overdue.length > 0 && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-xs font-bold text-red-700">
                {overdue.length} overdue installment{overdue.length > 1 ? "s" : ""}
              </p>
              <p className="mt-1 text-xs text-red-600">Outstanding overdue: {money(overdueAmount)}</p>
            </div>
          )}
        </Card>

        <CustomerInformation customer={customer} customerName={customerName} />
      </aside>
    </div>
  );
}
