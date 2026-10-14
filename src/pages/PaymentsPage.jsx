import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileDown,
  Search,
  Wallet,
} from "lucide-react";
import { payments, customers, inr } from "../data/mockData";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import { useToast } from "../components/common/Toast";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };
const GOLD = "#e4c48a";
const STATUSES = ["All", "Paid", "Pending"];
const METHODS = [...new Set(payments.map((p) => p.method))];

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function Stat({ icon: Icon, label, value, note, dark }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl ${dark ? "border-transparent bg-[#0b3d2e] text-white shadow-lg shadow-[#0b3d2e]/25" : "border-[#e3e9e0] bg-white hover:shadow-[#062a20]/5"}`}
    >
      <div className="flex items-start justify-between">
        <p
          className={`text-[11px] font-bold uppercase tracking-[0.14em] ${dark ? "text-white/60" : "text-[#5b6b63]"}`}
        >
          {label}
        </p>
        <span
          className={`grid h-9 w-9 place-items-center rounded-xl ${dark ? "text-[#062a20]" : "bg-[#e9f3ee] text-[#1b7a5a]"}`}
          style={dark ? { background: GOLD } : undefined}
        >
          <Icon size={17} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight" style={DISPLAY}>
        {value}
      </p>
      {note && (
        <p
          className={`mt-1 text-xs ${dark ? "text-white/55" : "text-[#5b6b63]"}`}
        >
          {note}
        </p>
      )}
      {dark && (
        <span
          aria-hidden="true"
          className="absolute -bottom-10 -right-10 h-28 w-28 rounded-full border border-white/10"
        />
      )}
    </div>
  );
}

export default function PaymentsPage() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [method, setMethod] = useState("");

  const list = payments.filter(
    (p) =>
      `${p.id} ${p.customer} ${p.plot}`
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      (status === "All" || p.status === status) &&
      (!method || p.method === method),
  );

  const stats = useMemo(() => {
    const sum = (s) =>
      payments.filter((p) => p.status === s).reduce((t, p) => t + p.amount, 0);
    const count = (s) => payments.filter((p) => p.status === s).length;
    const overdue = customers.filter((c) => c.status === "Overdue");
    return {
      paid: sum("Paid"),
      paidN: count("Paid"),
      pending: sum("Pending"),
      pendingN: count("Pending"),
      overdueN: overdue.length,
      overdueBal: overdue.reduce((t, c) => t + (c.total - c.paid), 0),
    };
  }, []);

  const shownTotal = list.reduce((t, p) => t + p.amount, 0);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#1b7a5a]">
            Cash flow
          </p>
          <h1
            className="mt-2 text-4xl font-semibold tracking-tight text-[#14231d]"
            style={DISPLAY}
          >
            Payments<span style={{ color: GOLD }}>.</span>
          </h1>
          <p className="mt-2 text-sm text-[#5b6b63]">
            Track collections and payment status.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => toast("Payment form can be connected next.", "info")}
        >
          <Wallet size={16} style={{ color: GOLD }} /> Record payment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          icon={CheckCircle2}
          label="Collected"
          value={inr(stats.paid)}
          note={`${stats.paidN} payments received`}
          dark
        />
        <Stat
          icon={Clock3}
          label="Pending collections"
          value={inr(stats.pending)}
          note={`${stats.pendingN} awaiting confirmation`}
        />
        <Stat
          icon={AlertTriangle}
          label="Overdue accounts"
          value={stats.overdueN}
          note={`${inr(stats.overdueBal)} balance outstanding`}
        />
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-[#e3e9e0] bg-white shadow-sm shadow-[#062a20]/[0.03]">
        <div className="grid gap-3 border-b border-[#eef2ec] p-5 lg:grid-cols-[1fr_auto_200px] lg:items-center">
          <Input
            leadingIcon={Search}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search payment, customer or plot"
            aria-label="Search payments"
          />
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by status"
          >
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={status === s}
                onClick={() => setStatus(s)}
                className={`rounded-full border px-4 py-2.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1b7a5a]/20 ${
                  status === s
                    ? "border-[#0b3d2e] bg-[#0b3d2e] text-white shadow-md shadow-[#0b3d2e]/20"
                    : "border-[#dfe5dc] bg-white text-[#3f4f48] hover:border-[#1b7a5a] hover:text-[#0b3d2e]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <Select
            aria-label="Payment method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            placeholder="All methods"
            options={METHODS}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="bg-[#f4f7f2] text-[10px] font-bold uppercase tracking-[0.14em] text-[#5b6b63]">
                {[
                  "Payment ref.",
                  "Customer",
                  "Plot",
                  "Date",
                  "Method",
                  "Amount",
                  "Status",
                  "",
                ].map((h, i) => (
                  <th key={i} className="px-5 py-3.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr
                  key={p.id}
                  className="group border-t border-[#eef2ec] transition hover:bg-[#f8faf6]"
                >
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs font-bold text-[#1b7a5a]">
                      {p.id}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0b3d2e] text-[10px] font-extrabold ring-2 ring-[#e4c48a]/40"
                        style={{ color: GOLD }}
                      >
                        {initials(p.customer)}
                      </span>
                      <span className="font-bold text-[#14231d]">
                        {p.customer}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-lg bg-[#e9f3ee] px-2.5 py-1 text-xs font-extrabold text-[#0b3d2e]">
                      {p.plot}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[#3f4f48]">
                    {fmtDate(p.date)}
                  </td>
                  <td className="px-5 py-4 text-[#3f4f48]">{p.method}</td>
                  <td className="px-5 py-4 font-extrabold text-[#14231d]">
                    {inr(p.amount)}
                  </td>
                  <td className="px-5 py-4">
                    <Badge>{p.status}</Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      disabled={p.status !== "Paid"}
                      onClick={() =>
                        toast(
                          `Receipt for ${p.id} is a static preview.`,
                          "info",
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-[#1b7a5a] transition hover:bg-[#e9f3ee] disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                      title={
                        p.status === "Paid"
                          ? "Download receipt"
                          : "Receipt available once paid"
                      }
                    >
                      <FileDown size={14} /> Receipt
                    </button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f3ee] text-[#1b7a5a]">
                      <Search size={20} />
                    </span>
                    <p className="mt-4 text-sm font-bold text-[#14231d]">
                      No payments found
                    </p>
                    <p className="mt-1 text-xs text-[#5b6b63]">
                      Try a different search or clear the filters.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setQ("");
                        setStatus("All");
                        setMethod("");
                      }}
                      className="mt-4 text-xs font-extrabold text-[#1b7a5a] hover:underline"
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#eef2ec] bg-[#fafcf9] px-5 py-3 text-xs text-[#5b6b63]">
          <span>
            Showing <b className="text-[#14231d]">{list.length}</b> of{" "}
            {payments.length} payments
          </span>
          <span>
            Total shown <b className="text-[#14231d]">{inr(shownTotal)}</b>
          </span>
        </div>
      </div>
    </div>
  );
}
