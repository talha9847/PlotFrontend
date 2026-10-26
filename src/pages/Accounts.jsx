import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Landmark,
  Building2,
  Pencil,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  Wallet,
} from "lucide-react";
import axios from "axios";

import Button from "../components/common/Button";
import { useNavigate } from "react-router-dom";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };
const GOLD = "#e4c48a";

const inputClass =
  "w-full rounded-xl border border-[#dfe5dc] bg-white px-3.5 py-3 text-sm text-[#14231d] outline-none transition placeholder:text-[#9aa69e] focus:border-[#1b7a5a] focus:ring-4 focus:ring-[#1b7a5a]/10";

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const EMPTY_FORM = {
  account_name: "",
  bank_name: "",
  opening_balance: "",
};

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount ?? 0));

const isCashAccount = (account) => account?.account_type === "cash";

const sortAccounts = (list) =>
  [...list].sort((a, b) => {
    const aCash = isCashAccount(a);
    const bCash = isCashAccount(b);

    if (aCash !== bCash) {
      return aCash ? -1 : 1;
    }

    return String(a.account_name || "").localeCompare(
      String(b.account_name || ""),
      undefined,
      { sensitivity: "base" },
    );
  });

function CashAccountCard({ account, onEdit, onOpen }) {
  return (
    <article className="group relative overflow-hidden rounded-2xl bg-[#142d24] p-5 text-white shadow-sm">
      <div className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -right-2 -top-3 h-20 w-20 rounded-full border border-white/10" />

      <div className="relative flex items-start justify-between gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/10 text-[#e4c48a]">
          <Wallet size={22} />
        </span>

        <button
          type="button"
          onClick={() => onEdit(account)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white/75 transition hover:border-[#e4c48a]/50 hover:bg-white/10 hover:text-white"
          aria-label={`Edit ${account.account_name}`}
        >
          <Pencil size={13} />
          Edit
        </button>
      </div>

      <div className="relative mt-5">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-[#e4c48a]/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#e4c48a]">
            Cash
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">
            Physical till
          </span>
        </div>

        <h3 className="mt-2 break-words text-xl font-semibold" style={DISPLAY}>
          {account.account_name}
        </h3>

        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
              Opening balance
            </p>
            <p className="mt-0.5 truncate text-lg font-semibold" style={DISPLAY}>
              {money(account.opening_balance)}
            </p>
          </div>

          <Wallet size={18} className="shrink-0 text-[#e4c48a]" />
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-between border-t border-white/10 pt-3">
        <span className="font-mono text-xs font-semibold text-white/55">
          #{account.id}
        </span>

        <button
          type="button"
          onClick={() => onOpen(account)}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#e4c48a] transition hover:text-white"
        >
          View history
          <ArrowUpRight size={14} />
        </button>
      </div>
    </article>
  );
}

function BankAccountCard({ account, onEdit, onOpen }) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-[#e3e9e0] bg-white p-5 shadow-sm shadow-[#062a20]/[0.03] transition hover:-translate-y-0.5 hover:border-[#c8d9ce] hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f3ee] text-[#1b7a5a] transition group-hover:bg-[#1b7a5a] group-hover:text-white">
          <Landmark size={22} />
        </span>

        <button
          type="button"
          onClick={() => onEdit(account)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#e3e9e0] px-3 py-2 text-xs font-bold text-[#52665b] transition hover:border-[#b7d4c2] hover:bg-[#e9f3ee] hover:text-[#1b7a5a]"
          aria-label={`Edit ${account.account_name}`}
        >
          <Pencil size={13} />
          Edit
        </button>
      </div>

      <div className="mt-5 flex-1">
        <span className="rounded-md bg-[#eef2ec] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#52665b]">
          Bank
        </span>

        <h3
          className="mt-2 break-words text-xl font-semibold text-[#14231d]"
          style={DISPLAY}
        >
          {account.account_name}
        </h3>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#eef2ec] bg-[#fafbf8] p-3.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-[#1b7a5a] shadow-sm">
            <Building2 size={17} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#829087]">
              Bank
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-[#263a30]">
              {account.bank_name}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#eef2ec] pt-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#829087]">
            Opening balance
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-[#14231d]">
            {money(account.opening_balance)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpen(account)}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#1b7a5a] transition hover:text-[#14231d]"
        >
          View history
          <ArrowUpRight size={14} />
        </button>
      </div>
    </article>
  );
}

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const fetchAccounts = async (showLoader = false) => {
    if (showLoader) setLoading(true);

    setError("");

    try {
      const response = await axios.get("/api/accounts", {
        withCredentials: true,
      });

      const list = response?.data?.data?.accounts;

      if (!Array.isArray(list)) {
        throw new Error("Invalid response received from the server.");
      }

      setAccounts(list);
    } catch (err) {
      console.error("Failed to fetch accounts:", err);

      setError(
        err?.response?.data?.message ||
          (err?.response?.status === 401
            ? "Your session has expired. Please log in again."
            : "Unable to load accounts. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts(true);
  }, []);

  const filteredAccounts = useMemo(() => {
    const query = normalize(search);

    if (!query) {
      return accounts;
    }

    return accounts.filter((account) =>
      [
        account.account_name,
        account.bank_name,
        account.account_type,
        account.opening_balance,
      ].some((value) => normalize(value).includes(query)),
    );
  }, [accounts, search]);

  const cashAccounts = useMemo(
    () => filteredAccounts.filter((account) => isCashAccount(account)),
    [filteredAccounts],
  );

  const bankAccounts = useMemo(
    () => filteredAccounts.filter((account) => !isCashAccount(account)),
    [filteredAccounts],
  );

  const bankAccountCount = useMemo(
    () => accounts.filter((account) => !isCashAccount(account)).length,
    [accounts],
  );

  const distinctBankCount = useMemo(
    () =>
      new Set(
        accounts
          .filter((account) => !isCashAccount(account))
          .map((account) => normalize(account.bank_name))
          .filter(Boolean),
      ).size,
    [accounts],
  );

  const openCreateForm = () => {
    setEditingAccount(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (account) => {
    setEditingAccount(account);
    setForm({
      account_name: account.account_name || "",
      bank_name: account.bank_name || "",
      opening_balance:
        account.opening_balance === null ||
        account.opening_balance === undefined
          ? ""
          : String(account.opening_balance),
    });
    setFormError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingAccount(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setSuccess("");

    const accountName = form.account_name.trim();
    const editingCash = Boolean(editingAccount && isCashAccount(editingAccount));
    const bankName = editingCash ? null : form.bank_name.trim();
    const openingBalanceInput = form.opening_balance.trim();
    const openingBalance = openingBalanceInput
      ? Number(openingBalanceInput)
      : 0;

    if (!accountName) {
      setFormError("Account name is required.");
      return;
    }

    if (accountName.length > 100) {
      setFormError("Account name must be 100 characters or fewer.");
      return;
    }

    if (!editingCash) {
      if (!bankName) {
        setFormError("Bank name is required for bank accounts.");
        return;
      }

      if (bankName.length > 100) {
        setFormError("Bank name must be 100 characters or fewer.");
        return;
      }
    }

    if (
      !Number.isFinite(openingBalance) ||
      openingBalance < 0 ||
      openingBalance > 999999999999.99
    ) {
      setFormError("Opening balance must be a non-negative amount.");
      return;
    }

    const payload = {
      account_name: accountName,
      bank_name: bankName,
      opening_balance: openingBalance,
    };

    setSaving(true);

    try {
      if (editingAccount) {
        const response = await axios.put(
          `/api/accounts/${editingAccount.id}`,
          payload,
          { withCredentials: true },
        );

        const updatedAccount = response?.data?.data?.account;

        if (!updatedAccount) {
          throw new Error("Invalid response received from the server.");
        }

        setAccounts((current) =>
          sortAccounts(
            current.map((account) =>
              account.id === editingAccount.id ? updatedAccount : account,
            ),
          ),
        );

        setSuccess("Account updated successfully.");
      } else {
        const response = await axios.post(
          "/api/accounts/create",
          payload,
          { withCredentials: true },
        );

        const newAccount = response?.data?.data?.account;

        if (!newAccount) {
          throw new Error("Invalid response received from the server.");
        }

        setAccounts((current) => sortAccounts([...current, newAccount]));
        setSuccess("Account created successfully.");
      }

      setShowForm(false);
      setEditingAccount(null);
      setForm(EMPTY_FORM);
      setFormError("");
    } catch (err) {
      console.error("Failed to save account:", err);

      setFormError(
        err?.response?.data?.message ||
          err.message ||
          "Unable to save account. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const isEditingCash = Boolean(editingAccount && isCashAccount(editingAccount));

  return (
    <div className="min-h-full space-y-7 bg-[#fafbf8] p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#1b7a5a]">
            Finance management
          </p>

          <h1
            className="mt-2 text-4xl font-semibold tracking-tight text-[#14231d]"
            style={DISPLAY}
          >
            Accounts<span style={{ color: GOLD }}>.</span>
          </h1>

          <p className="mt-2 text-sm text-[#718078]">
            Manage the cash and bank accounts used as payment destinations.
          </p>
        </div>

        <Button type="button" onClick={openCreateForm}>
          <Plus size={17} />
          Add account
        </Button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl bg-[#142d24] p-5 text-white shadow-sm">
          <div className="absolute -right-5 -top-7 h-32 w-32 rounded-full border border-white/10" />
          <div className="absolute -right-1 -top-2 h-20 w-20 rounded-full border border-white/10" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-white/65">
                Total accounts
              </p>
              <p className="mt-3 text-4xl font-semibold" style={DISPLAY}>
                {accounts.length}
              </p>
              <p className="mt-2 text-xs text-white/55">
                Cash and bank payment destinations
              </p>
            </div>

            <span className="rounded-xl border border-white/10 bg-white/10 p-3">
              <Landmark size={22} color={GOLD} />
            </span>
          </div>

          <div className="relative mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-white/70">
            <CheckCircle2 size={15} color={GOLD} />
            Account directory
          </div>
        </div>

        <div className="rounded-2xl border border-[#e3e9e0] bg-white p-5 shadow-sm shadow-[#062a20]/[0.03]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[#718078]">
                Bank accounts
              </p>
              <p
                className="mt-3 text-4xl font-semibold text-[#14231d]"
                style={DISPLAY}
              >
                {bankAccountCount}
              </p>
              <p className="mt-2 text-xs text-[#829087]">
                {distinctBankCount}{" "}
                {distinctBankCount === 1 ? "distinct bank" : "distinct banks"}
              </p>
            </div>

            <span className="rounded-xl bg-[#e9f3ee] p-3 text-[#1b7a5a]">
              <Building2 size={22} />
            </span>
          </div>

          <div className="mt-5 flex items-center gap-2 border-t border-[#eef2ec] pt-4 text-xs text-[#718078]">
            <ArrowUpRight size={15} className="text-[#1b7a5a]" />
            Across your bank directory
          </div>
        </div>
      </section>

      {success && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-[#cce5d6] bg-[#edf7f0] px-4 py-3 text-sm font-medium text-[#1b7a5a]"
        >
          <CheckCircle2 size={17} />
          {success}
          <button
            type="button"
            className="ml-auto"
            onClick={() => setSuccess("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <section className="rounded-2xl border border-[#e3e9e0] bg-white p-4 shadow-sm shadow-[#062a20]/[0.03] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#829087]"
            />
            <input
              className={`${inputClass} pl-10`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search account or bank name..."
              aria-label="Search accounts"
            />
          </div>

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="rounded-xl px-3 py-2 text-sm font-bold text-[#1b7a5a] hover:bg-[#e9f3ee]"
            >
              Clear search
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#eef2ec] pt-4">
          <p className="text-xs text-[#718078]">
            Showing{" "}
            <span className="font-extrabold text-[#14231d]">
              {filteredAccounts.length}
            </span>{" "}
            of {accounts.length} accounts
          </p>

          <span className="rounded-lg bg-[#e9f3ee] px-3 py-1.5 text-xs font-extrabold text-[#1b7a5a]">
            Account directory
          </span>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2
              className="text-xl font-semibold text-[#14231d]"
              style={DISPLAY}
            >
              Account directory
            </h2>
            <p className="mt-1 text-xs text-[#718078]">
              Cash is listed first, followed by every bank account.
            </p>
          </div>

          <span className="rounded-lg border border-[#e3e9e0] bg-white px-3 py-1.5 text-xs font-extrabold text-[#14231d]">
            {filteredAccounts.length} records
          </span>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#e3e9e0] bg-white px-6 py-16 text-center">
            <div
              className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#e3e9e0] border-t-[#1b7a5a]"
              role="status"
              aria-label="Loading accounts"
            />
            <p className="mt-4 text-sm text-[#718078]">
              Loading your accounts...
            </p>
          </div>
        ) : error ? (
          <div
            className="rounded-2xl border border-rose-200 bg-white px-6 py-12 text-center"
            role="alert"
          >
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertCircle size={22} />
            </span>
            <h3 className="mt-4 font-bold text-[#14231d]">
              Could not load accounts
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#718078]">
              {error}
            </p>
            <div className="mt-5">
              <Button type="button" onClick={() => fetchAccounts(true)}>
                Try again
              </Button>
            </div>
          </div>
        ) : filteredAccounts.length > 0 ? (
          <div className="space-y-7">
            {cashAccounts.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#829087]">
                    Cash account
                  </p>
                  <span className="rounded-md bg-[#f7efdc] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#8a6a2f]">
                    One active till
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {cashAccounts.map((account) => (
                    <CashAccountCard
                      key={account.uuid || account.id}
                      account={account}
                      onEdit={openEditForm}
                      onOpen={(item) =>
                        navigate("/admin/history", {
                          state: { uuid: item.uuid },
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {bankAccounts.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#829087]">
                    Bank accounts
                  </p>
                  <span className="rounded-md bg-[#eef2ec] px-2 py-0.5 text-[10px] font-extrabold text-[#52665b]">
                    {bankAccounts.length}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {bankAccounts.map((account) => (
                    <BankAccountCard
                      key={account.uuid || account.id}
                      account={account}
                      onEdit={openEditForm}
                      onOpen={(item) =>
                        navigate("/admin/history", {
                          state: { uuid: item.uuid },
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#cbd7cc] bg-white px-6 py-16 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f3ee] text-[#1b7a5a]">
              {search ? <Search size={21} /> : <Wallet size={21} />}
            </span>

            <h3 className="mt-4 font-bold text-[#14231d]">
              {accounts.length === 0 ? "No accounts yet" : "No accounts found"}
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-sm text-[#718078]">
              {accounts.length === 0
                ? "Add your first bank account to start recording payment destinations."
                : "Try another account or bank name, or clear your search."}
            </p>

            {accounts.length === 0 && (
              <div className="mt-5">
                <Button type="button" onClick={openCreateForm}>
                  <Plus size={17} />
                  Add your first account
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#10231b]/50 p-4 backdrop-blur-[3px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-modal-title"
            className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-[#e3e9e0] bg-[#fafbf8] shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-[#e3e9e0] bg-white px-5 py-5 sm:px-6">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#1b7a5a]">
                  Finance management
                </p>
                <h2
                  id="account-modal-title"
                  className="mt-1 text-2xl font-semibold text-[#14231d]"
                  style={DISPLAY}
                >
                  {editingAccount ? "Edit account" : "New account"}
                  <span style={{ color: GOLD }}>.</span>
                </h2>
                <p className="mt-1 text-xs text-[#718078]">
                  {editingAccount
                    ? isEditingCash
                      ? "Update the physical cash account."
                      : "Update your bank account details."
                    : "Add a bank account to your directory."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-xl border border-[#e3e9e0] p-2 text-[#718078] transition hover:bg-[#fafbf8] hover:text-[#14231d] disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700"
                >
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {isEditingCash && (
                <div className="flex items-start gap-2 rounded-xl border border-[#f0e3c6] bg-[#fbf6ea] px-3.5 py-3 text-xs text-[#8a6a2f]">
                  <Wallet size={16} className="mt-0.5 shrink-0" />
                  <span>
                    Cash is physical money. This account has no bank name and is
                    used automatically for cash payments.
                  </span>
                </div>
              )}

              <div>
                <label
                  htmlFor="account_name"
                  className="mb-2 block text-xs font-bold text-[#263a30]"
                >
                  Account name <span className="text-rose-600">*</span>
                </label>
                <input
                  id="account_name"
                  name="account_name"
                  value={form.account_name}
                  onChange={updateField}
                  className={inputClass}
                  placeholder={
                    isEditingCash ? "Cash in Hand" : "e.g. Main Business Account"
                  }
                  maxLength={100}
                  required
                  autoFocus
                  disabled={saving}
                />
                <p className="mt-1.5 text-[11px] text-[#829087]">
                  A name to identify this account in your application.
                </p>
              </div>

              {!isEditingCash && (
                <div>
                  <label
                    htmlFor="bank_name"
                    className="mb-2 block text-xs font-bold text-[#263a30]"
                  >
                    Bank name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="bank_name"
                    name="bank_name"
                    value={form.bank_name}
                    onChange={updateField}
                    className={inputClass}
                    placeholder="e.g. Bank of Baroda"
                    maxLength={100}
                    required
                    disabled={saving}
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="opening_balance"
                  className="mb-2 block text-xs font-bold text-[#263a30]"
                >
                  Opening balance (₹)
                </label>
                <input
                  id="opening_balance"
                  name="opening_balance"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.opening_balance}
                  onChange={updateField}
                  className={inputClass}
                  placeholder="0.00"
                  disabled={saving}
                />
                <p className="mt-1.5 text-[11px] text-[#829087]">
                  The starting balance for this account. Current balances arrive
                  with the transaction ledger.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[#e3e9e0] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-[#dfe5dc] bg-white px-4 py-3 text-sm font-bold text-[#52665b] transition hover:bg-[#f4f6f1] disabled:opacity-50"
                >
                  Cancel
                </button>

                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingAccount ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <Plus size={17} />
                      )}
                      {editingAccount ? "Save changes" : "Create account"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
