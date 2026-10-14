import { useMemo, useState } from "react";
import { IndianRupee, Plus, Search, Users, Wallet } from "lucide-react";
import { customers, inr } from "../data/mockData";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import { useToast } from "../components/common/Toast";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };
const GOLD = "#e4c48a";
const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

function StatCard({ icon: Icon, label, value, note, dark = false }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl ${
        dark
          ? "border-transparent bg-[#0b3d2e] text-white shadow-lg shadow-[#0b3d2e]/25"
          : "border-[#e3e9e0] bg-white hover:shadow-[#062a20]/5"
      }`}
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

export default function CustomersPage() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", plot: "" });

  const statuses = useMemo(
    () => ["All", ...new Set(customers.map((c) => c.status).filter(Boolean))],
    [],
  );

  const list = customers.filter(
    (c) =>
      (filter === "All" || c.status === filter) &&
      `${c.name} ${c.phone} ${c.plot}`.toLowerCase().includes(q.toLowerCase()),
  );

  const totals = useMemo(() => {
    const total = customers.reduce((s, c) => s + (c.total || 0), 0);
    const paid = customers.reduce((s, c) => s + (c.paid || 0), 0);
    return {
      total,
      paid,
      balance: total - paid,
      pct: total ? Math.round((paid / total) * 100) : 0,
    };
  }, []);

  function submit(e) {
    e.preventDefault();
    setOpen(false);
    toast(`Customer ${form.name} previewed; no record was saved.`);
    setForm({ name: "", phone: "", plot: "" });
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#1b7a5a]">
            Relationships
          </p>
          <h1
            className="mt-2 text-4xl font-semibold tracking-tight text-[#14231d]"
            style={DISPLAY}
          >
            Customers<span style={{ color: GOLD }}>.</span>
          </h1>
          <p className="mt-2 text-sm text-[#5b6b63]">
            Manage buyer details and payment progress.
          </p>
        </div>
        <Button size="lg" onClick={() => setOpen(true)}>
          <Plus size={16} style={{ color: GOLD }} /> Add customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Users}
          label="Total customers"
          value={customers.length}
          note="Across all plots"
          dark
        />
        <StatCard
          icon={IndianRupee}
          label="Collected"
          value={inr(totals.paid)}
          note={`${totals.pct}% of total value`}
        />
        <StatCard
          icon={Wallet}
          label="Outstanding"
          value={inr(totals.balance)}
          note="Balance to collect"
        />
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-[#e3e9e0] bg-white shadow-sm shadow-[#062a20]/[0.03]">
        <div className="flex flex-col gap-4 border-b border-[#eef2ec] p-5 lg:flex-row lg:items-center lg:justify-between">
          <Input
            wrapperClassName="w-full max-w-md"
            leadingIcon={Search}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, phone or plot"
            aria-label="Search customers"
          />
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by status"
          >
            {statuses.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                aria-pressed={filter === s}
                className={`rounded-full border px-4 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1b7a5a]/20 ${
                  filter === s
                    ? "border-[#0b3d2e] bg-[#0b3d2e] text-white shadow-md shadow-[#0b3d2e]/20"
                    : "border-[#dfe5dc] bg-white text-[#3f4f48] hover:border-[#1b7a5a] hover:text-[#0b3d2e]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="bg-[#f4f7f2] text-[10px] font-bold uppercase tracking-[0.14em] text-[#5b6b63]">
                {[
                  "Customer",
                  "Plot",
                  "Total price",
                  "Paid",
                  "Balance",
                  "Status",
                ].map((x) => (
                  <th key={x} className="px-5 py-3.5">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((c) => {
                const pct = c.total
                  ? Math.min(100, Math.round((c.paid / c.total) * 100))
                  : 0;
                return (
                  <tr
                    key={c.id}
                    className="group border-t border-[#eef2ec] transition hover:bg-[#f8faf6]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0b3d2e] text-[11px] font-extrabold ring-2 ring-[#e4c48a]/40"
                          style={{ color: GOLD }}
                        >
                          {initials(c.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-[#14231d]">
                            {c.name}
                          </p>
                          <p className="text-xs text-[#5b6b63]">{c.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-[#e9f3ee] px-2.5 py-1 text-xs font-extrabold text-[#0b3d2e]">
                        {c.plot}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-[#14231d]">
                      {inr(c.total)}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-[#14231d]">
                        {inr(c.paid)}
                      </p>
                      <div
                        className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-[#e9eee5]"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${pct}% paid`}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg,#1b7a5a,${GOLD})`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#14231d]">
                      {inr(c.total - c.paid)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge>{c.status}</Badge>
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f3ee] text-[#1b7a5a]">
                      <Search size={20} />
                    </span>
                    <p className="mt-4 text-sm font-bold text-[#14231d]">
                      No customers found
                    </p>
                    <p className="mt-1 text-xs text-[#5b6b63]">
                      Try a different search or clear the status filter.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setQ("");
                        setFilter("All");
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

        <div className="border-t border-[#eef2ec] bg-[#fafcf9] px-5 py-3 text-xs text-[#5b6b63]">
          Showing <b className="text-[#14231d]">{list.length}</b> of{" "}
          {customers.length} customers
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add customer"
        description="Static form preview"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                document.getElementById("customer-form")?.requestSubmit()
              }
            >
              Preview customer
            </Button>
          </>
        }
      >
        <form id="customer-form" onSubmit={submit} className="space-y-4">
          {[
            ["name", "Full name", "text"],
            ["phone", "Mobile number", "tel"],
            ["plot", "Plot number", "text"],
          ].map(([k, label, type]) => (
            <Input
              key={k}
              label={label}
              type={type}
              required
              value={form[k]}
              onChange={(e) => setForm((v) => ({ ...v, [k]: e.target.value }))}
            />
          ))}
        </form>
      </Modal>
    </div>
  );
}
