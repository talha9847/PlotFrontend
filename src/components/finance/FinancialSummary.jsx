import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Landmark,
  RefreshCw,
  Wallet,
} from "lucide-react";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const number = (value) => Number(value) || 0;

const pluralize = (count, singular, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

function SectionHeading({ eyebrow, title, description, badge }) {
  return (
    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#1b7a5a]">
          {eyebrow}
        </p>
        <h2
          className="mt-1 text-xl font-semibold tracking-tight text-[#14231d]"
          style={DISPLAY}
        >
          {title}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-[#5b6b63]">{description}</p>
      </div>
      <span className="self-start rounded-full bg-[#eef5f0] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#1b7a5a] sm:self-auto">
        {badge}
      </span>
    </div>
  );
}

function BalanceCard({ title, value, note, icon: Icon, total = false }) {
  if (total) {
    return (
      <article className="relative overflow-hidden rounded-2xl bg-[#142d24] p-5 text-white shadow-sm">
        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-3 -top-4 h-20 w-20 rounded-full border border-white/10" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-white/55">
              {title}
            </p>
            <p
              className="mt-2 break-words text-3xl font-semibold"
              style={DISPLAY}
            >
              {formatINR(value)}
            </p>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/10 text-[#e4c48a]">
            <Icon size={20} />
          </span>
        </div>

        <p className="relative mt-3 text-xs text-white/55">{note}</p>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-[#e5ebe2] bg-white p-5 shadow-[0_2px_12px_rgba(16,68,47,0.035)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-[#5b6b63]">
            {title}
          </p>
          <p
            className="mt-2 break-words text-3xl font-semibold text-[#0b3d2e]"
            style={DISPLAY}
          >
            {formatINR(value)}
          </p>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e9f3ee] text-[#1b7a5a]">
          <Icon size={20} />
        </span>
      </div>

      <p className="mt-3 text-xs text-[#5b6b63]">{note}</p>
    </article>
  );
}

function FlowAmount({ label, value, direction, dark = false }) {
  const isInflow = direction === "in";
  const Icon = isInflow ? ArrowDownLeft : ArrowUpRight;

  return (
    <div
      className={`rounded-xl px-3 py-2 ${
        dark
          ? "bg-white/10"
          : isInflow
            ? "bg-emerald-50/80"
            : "bg-rose-50/80"
      }`}
    >
      <span
        className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
          dark
            ? "text-white/55"
            : isInflow
              ? "text-emerald-700"
              : "text-rose-700"
        }`}
      >
        <Icon size={12} />
        {label}
      </span>
      <p
        className={`mt-0.5 truncate text-sm font-semibold ${
          dark
            ? "text-white"
            : isInflow
              ? "text-emerald-900"
              : "text-rose-900"
        }`}
      >
        {formatINR(value)}
      </p>
    </div>
  );
}

function FlowCard({ title, data, icon: Icon, total = false }) {
  const inflow = number(data?.inflow);
  const outflow = number(data?.outflow);
  const net = number(data?.net);

  if (total) {
    return (
      <article className="relative overflow-hidden rounded-2xl bg-[#142d24] p-5 text-white shadow-sm">
        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full border border-white/10" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-white/55">
              {title}
            </p>
            <p
              className="mt-2 break-words text-2xl font-semibold"
              style={DISPLAY}
            >
              {formatINR(net)}
            </p>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/10 text-[#e4c48a]">
            <Icon size={20} />
          </span>
        </div>

        <div className="relative mt-4 grid grid-cols-2 gap-2">
          <FlowAmount label="Inflow" value={inflow} direction="in" dark />
          <FlowAmount label="Outflow" value={outflow} direction="out" dark />
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-[#e5ebe2] bg-white p-5 shadow-[0_2px_12px_rgba(16,68,47,0.035)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-[#5b6b63]">
            {title}
          </p>
          <p
            className="mt-2 break-words text-2xl font-semibold text-[#0b3d2e]"
            style={DISPLAY}
          >
            {formatINR(net)}
          </p>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e9f3ee] text-[#1b7a5a]">
          <Icon size={20} />
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <FlowAmount label="Inflow" value={inflow} direction="in" />
        <FlowAmount label="Outflow" value={outflow} direction="out" />
      </div>
    </article>
  );
}

function AccountPanel({ title, description, count, children }) {
  return (
    <div className="rounded-2xl border border-[#e5ebe2] bg-white p-4 shadow-[0_2px_12px_rgba(16,68,47,0.035)] sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#14231d]">{title}</h3>
          <p className="mt-0.5 text-xs text-[#5b6b63]">{description}</p>
        </div>
        <span className="self-start rounded-full bg-[#f1f4ef] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#5b6b63] sm:self-auto">
          {pluralize(count, "account")}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

function BankIdentity({ account }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-[#1b7a5a] shadow-sm">
        <Building2 size={16} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#14231d]">
          {account.account_name}
        </p>
        <p className="truncate text-xs text-[#829087]">
          {account.bank_name || "Bank account"}
        </p>
      </div>
    </div>
  );
}

function InactiveBadge() {
  return (
    <span className="mt-1 inline-flex rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
      Inactive
    </span>
  );
}

function BankBalanceRow({ account }) {
  return (
    <article className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-[#eef2ec] bg-[#fafbf8] px-3.5 py-3">
      <BankIdentity account={account} />

      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-[#0b3d2e]">
          {formatINR(account.current_balance)}
        </p>
        {!account.is_active && <InactiveBadge />}
      </div>
    </article>
  );
}

function BankFlowRow({ account }) {
  const inflow = number(account.total_inflow);
  const outflow = number(account.total_outflow);
  const net = number(account.net_flow);

  return (
    <article className="rounded-xl border border-[#eef2ec] bg-[#fafbf8] px-3.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <BankIdentity account={account} />

        <div className="shrink-0 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#829087]">
            Net
          </p>
          <p
            className={`mt-0.5 text-sm font-semibold ${
              net < 0 ? "text-rose-700" : "text-[#0b3d2e]"
            }`}
          >
            {formatINR(net)}
          </p>
          {!account.is_active && <InactiveBadge />}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold">
        <span className="inline-flex items-center gap-1 text-emerald-700">
          <ArrowDownLeft size={12} />
          {formatINR(inflow)} in
        </span>
        <span className="inline-flex items-center gap-1 text-rose-700">
          <ArrowUpRight size={12} />
          {formatINR(outflow)} out
        </span>
      </div>
    </article>
  );
}

function SummarySkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      {[0, 1].map((section) => (
        <div key={section} className="space-y-3">
          <div className="h-4 w-40 animate-pulse rounded-full bg-[#dfe5dc]" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((card) => (
              <div
                key={card}
                className="h-32 animate-pulse rounded-2xl border border-[#e5ebe2] bg-white"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FinancialSummary({
  data,
  loading = false,
  error = "",
  onRetry,
}) {
  if (loading && !data) {
    return <SummarySkeleton />;
  }

  if (error && !data) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-amber-900">
              Financial summary unavailable
            </p>
            <p className="mt-0.5 text-xs text-amber-800">{error}</p>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-9 items-center justify-center gap-2 self-start rounded-xl border border-amber-300 bg-white px-3 text-xs font-bold text-amber-900 transition hover:bg-amber-100 sm:self-auto"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          )}
        </div>
      </section>
    );
  }

  const accounts = Array.isArray(data?.accounts) ? data.accounts : [];
  const cashAccounts = accounts.filter(
    (account) => account.account_type === "cash",
  );
  const bankAccounts = accounts.filter(
    (account) => account.account_type !== "cash",
  );
  const totals = data?.totals || {};
  const cash = totals.cash || {};
  const bank = totals.bank || {};
  const combined = totals.combined || {};

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <span>Could not refresh the summary. Showing the last loaded values.</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="self-start font-bold underline underline-offset-2 hover:text-amber-950 sm:self-auto"
            >
              Retry
            </button>
          )}
        </div>
      )}

      <section aria-labelledby="balance-summary-heading" className="space-y-3">
        <div id="balance-summary-heading">
          <SectionHeading
            eyebrow="Positions"
            title="Current balances"
            description="Live available funds across cash and every registered bank account."
            badge="As of today"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <BalanceCard
            title="Cash balance"
            value={cash.balance}
            note={cashAccounts[0]?.account_name || "Physical cash in hand"}
            icon={Wallet}
          />
          <BalanceCard
            title="Combined bank balance"
            value={bank.balance}
            note={
              bankAccounts.length > 0
                ? `${pluralize(bankAccounts.length, "bank account")} combined`
                : "No bank accounts registered"
            }
            icon={Landmark}
          />
          <BalanceCard
            title="Total balance"
            value={combined.balance}
            note="Cash plus all bank accounts"
            icon={RefreshCw}
            total
          />
        </div>

        {bankAccounts.length > 0 && (
          <AccountPanel
            title="Bank account balances"
            description="Current balance for each registered bank account."
            count={bankAccounts.length}
          >
            {bankAccounts.map((account) => (
              <BankBalanceRow key={account.id} account={account} />
            ))}
          </AccountPanel>
        )}
      </section>

      <section aria-labelledby="flow-summary-heading" className="space-y-3">
        <div id="flow-summary-heading">
          <SectionHeading
            eyebrow="Movement"
            title="Cash flow"
            description="Lifetime inflow and outflow. Transfers between accounts are excluded, and the ledger filters below do not change these totals."
            badge="All time"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <FlowCard title="Cash flow" data={cash} icon={Wallet} />
          <FlowCard
            title="Combined bank flow"
            data={bank}
            icon={Landmark}
          />
          <FlowCard title="Total flow" data={combined} icon={RefreshCw} total />
        </div>

        {bankAccounts.length > 0 && (
          <AccountPanel
            title="Bank-wise flow"
            description="Inflow, outflow and net movement for each bank account."
            count={bankAccounts.length}
          >
            {bankAccounts.map((account) => (
              <BankFlowRow key={account.id} account={account} />
            ))}
          </AccountPanel>
        )}
      </section>
    </div>
  );
}
