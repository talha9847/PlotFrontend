import { Home, Plus, Search } from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";
import Badge from "../common/Badge";
import Input from "../common/Input";

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount ?? 0));

const formatDate = (value) => {
  if (!value || value === "--" || value === "—") return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getValue = (...values) =>
  values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== "--" &&
      value !== "—",
  );

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

function PaymentsTable({ rows = [] }) {
  console.log(rows);
  if (!rows.length) {
    return (
      <EmptyState
        title="No paid installments found"
        description="Installments with recorded payments will appear here."
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
          {rows.map((item, index) => {
            const id = getValue(
              item.installment_id,
              item.id,
              item.installment_uuid,
              item.uuid,
            );

            const installmentNumber = getValue(
              item.installment_number,
              item.installmentNumber,
            );

            const plotNumber = getValue(item.plot_number, item.plotNumber);

            const bookingNumber = getValue(
              item.booking_number,
              item.bookingNumber,
            );

            const dueDate = getValue(item.due_date, item.dueDate);

            const amountPaid = getValue(item.amount, item.amountPaid);

            const status = getValue(item.status, item.payment_status);

            return (
              <tr
                key={id ?? `installment-${index}`}
                className="hover:bg-[#fafbf9]"
              >
                <td className="px-5 py-4 font-semibold">
                  {installmentNumber != null ? `#${installmentNumber}` : "—"}
                </td>

                <td className="px-5 py-4">
                  <p className="font-bold text-[#0b5a3e]">
                    {plotNumber ?? "—"}
                  </p>

                  <p className="mt-1 text-[11px] text-[#5b6b63]">
                    {bookingNumber ?? "—"}
                  </p>
                </td>

                <td className="px-5 py-4 text-[#5b6b63]">
                  {formatDate(dueDate)}
                </td>

                <td className="px-5 py-4 font-extrabold">
                  {money(amountPaid)}
                </td>

                <td className="px-5 py-4">
                  {status ? <Badge status={status} size="sm" /> : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function PaymentsTab({
  rows = [],
  paymentSearch = "",
  onSearchChange,
  onRecordPayment,
}) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-3 p-5 sm:p-6">
        <div>
          <h2 className="text-base font-extrabold text-[#14231d]">
            Paid installments
          </h2>

          <p className="mt-1 text-xs text-[#5b6b63] sm:text-sm">
            Installment payment progress for this customer.
          </p>
        </div>

        <Button size="sm" onClick={onRecordPayment}>
          <Plus size={15} />
          Record payment
        </Button>
      </div>

      <div className="px-5 pb-4 sm:px-6">
        <Input
          value={paymentSearch}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder="Search plot, booking or installment..."
          leadingIcon={Search}
        />
      </div>

      <PaymentsTable rows={rows} />

      <div className="border-t border-[#edf1eb] px-5 py-3 text-xs text-[#5b6b63]">
        Showing {rows.length} installments
      </div>
    </Card>
  );
}
