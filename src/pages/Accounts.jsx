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
};

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

    return accounts.filter((account) =>
      [account.account_name, account.bank_name].some((value) =>
        normalize(value).includes(query),
      ),
    );
  }, [accounts, search]);

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
    const bankName = form.bank_name.trim();

    if (!accountName || !bankName) {
      setFormError("Account name and bank name are required.");
      return;
    }

    if (accountName.length > 100 || bankName.length > 100) {
      setFormError("Each field must be 100 characters or fewer.");
      return;
    }

    setSaving(true);

    try {
      if (editingAccount) {
        const response = await axios.put(
          `/api/accounts/${editingAccount.id}`,
          {
            account_name: accountName,
            bank_name: bankName,
          },
          { withCredentials: true },
        );

        const updatedAccount = response?.data?.data?.account;

        if (!updatedAccount) {
          throw new Error("Invalid response received from the server.");
        }

        setAccounts((current) =>
          current.map((account) =>
            account.id === editingAccount.id ? updatedAccount : account,
          ),
        );

        setSuccess("Account updated successfully.");
      } else {
        const response = await axios.post(
          "/api/accounts/create",
          {
            account_name: accountName,
            bank_name: bankName,
          },
          { withCredentials: true },
        );

        const newAccount = response?.data?.data?.account;

        if (!newAccount) {
          throw new Error("Invalid response received from the server.");
        }

        setAccounts((current) => [...current, newAccount]);
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
            Manage your bank accounts and payment destinations.
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
                Registered payment destinations
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
                Banks represented
              </p>
              <p
                className="mt-3 text-4xl font-semibold text-[#14231d]"
                style={DISPLAY}
              >
                {
                  new Set(
                    accounts.map((account) => normalize(account.bank_name)),
                  ).size
                }
              </p>
              <p className="mt-2 text-xs text-[#829087]">Distinct bank names</p>
            </div>

            <span className="rounded-xl bg-[#e9f3ee] p-3 text-[#1b7a5a]">
              <Building2 size={22} />
            </span>
          </div>

          <div className="mt-5 flex items-center gap-2 border-t border-[#eef2ec] pt-4 text-xs text-[#718078]">
            <ArrowUpRight size={15} className="text-[#1b7a5a]" />
            Across your account directory
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
              All accounts
            </h2>
            <p className="mt-1 text-xs text-[#718078]">
              Manage the accounts available for recording payments.
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredAccounts.map((account) => (
              <article
                key={account.uuid || account.id}
                className="group rounded-2xl border border-[#e3e9e0] bg-white p-5 shadow-sm shadow-[#062a20]/[0.03] transition hover:-translate-y-0.5 hover:border-[#c8d9ce] hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f3ee] text-[#1b7a5a] transition group-hover:bg-[#1b7a5a] group-hover:text-white">
                    <Landmark size={22} />
                  </span>

                  <button
                    type="button"
                    onClick={() => openEditForm(account)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#e3e9e0] px-3 py-2 text-xs font-bold text-[#52665b] transition hover:border-[#b7d4c2] hover:bg-[#e9f3ee] hover:text-[#1b7a5a]"
                    aria-label={`Edit ${account.account_name}`}
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                </div>
                <div
                  onClick={() => {
                    console.log(account);
                    navigate("/admin/history", {
                      state: {
                        uuid: account.uuid,
                      },
                    });
                  }}
                >
                  <div className="mt-5">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#829087]">
                      Account name
                    </p>
                    <h3
                      className="mt-1 break-words text-xl font-semibold text-[#14231d]"
                      style={DISPLAY}
                    >
                      {account.account_name}
                    </h3>
                  </div>

                  <div className="mt-5 flex items-center gap-3 rounded-xl border border-[#eef2ec] bg-[#fafbf8] p-3.5">
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

                  <div className="mt-4 flex items-center justify-between border-t border-[#eef2ec] pt-3">
                    <span className="text-[11px] text-[#829087]">
                      Account reference
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#52665b]">
                      #{account.id}
                    </span>
                  </div>
                </div>
              </article>
            ))}
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
                    ? "Update your account details."
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
                  placeholder="e.g. Main Business Account"
                  maxLength={100}
                  required
                  autoFocus
                  disabled={saving}
                />
                <p className="mt-1.5 text-[11px] text-[#829087]">
                  A name to identify this account in your application.
                </p>
              </div>

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
