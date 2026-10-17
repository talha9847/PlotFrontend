import { Home, Plus, Search } from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";
import Badge from "../common/Badge";
import Input from "../common/Input";

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
              <td className="px-5 py-4 font-semibold">#{item.installment_number}</td>
              <td className="px-5 py-4">
                <p className="font-bold text-[#0b5a3e]">{item.plot_number || "—"}</p>
                <p className="mt-1 text-[11px] text-[#5b6b63]">{item.booking_number || "—"}</p>
              </td>
              <td className="px-5 py-4 text-[#5b6b63]">{formatDate(item.due_date)}</td>
              <td className="px-5 py-4 font-extrabold">{money(item.amount_paid)}</td>
              <td className="px-5 py-4"><Badge status={item.status} size="sm" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PaymentsTab({
  rows,
  paymentSearch,
  onSearchChange,
  onRecordPayment,
}) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-3 p-5 sm:p-6">
        <div>
          <h2 className="text-base font-extrabold text-[#14231d]">Paid installments</h2>
          <p className="mt-1 text-xs text-[#5b6b63] sm:text-sm">
            Paid installment records from the customer schedule.
          </p>
        </div>
        <Button size="sm" onClick={onRecordPayment}>
          <Plus size={15} /> Record payment
        </Button>
      </div>

      <div className="px-5 pb-4 sm:px-6">
        <Input
          value={paymentSearch}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search plot, booking or installment..."
          leadingIcon={Search}
        />
      </div>

      <PaymentsTable rows={rows} />

      <div className="border-t border-[#edf1eb] px-5 py-3 text-xs text-[#5b6b63]">
        Showing {rows.length} paid installments
      </div>
    </Card>
  );
}
