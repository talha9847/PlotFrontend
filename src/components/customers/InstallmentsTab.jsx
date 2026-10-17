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

export default function InstallmentsTab({ installments }) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="p-5 sm:p-6">
        <h2 className="text-base font-extrabold text-[#14231d]">
          Installment schedule
        </h2>
        <p className="mt-1 text-xs text-[#5b6b63] sm:text-sm">
          Paid, pending, partially paid and overdue installments across all
          bookings.
        </p>
      </div>
      <InstallmentsTable rows={installments} />
      <div className="border-t border-[#edf1eb] px-5 py-3 text-xs text-[#5b6b63]">
        Showing {installments.length} installments
      </div>
    </Card>
  );
}
