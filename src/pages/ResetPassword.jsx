import { useState } from "react";
import axios from "axios";
import {
  LockKeyhole,
  ShieldCheck,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  ArrowRight,
  KeyRound,
  AlertCircle,
} from "lucide-react";

import Input from "../components/common/Input";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import { useToast } from "../components/common/Toast";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };
const GOLD = "#e4c48a";
const INITIAL_FORM = { newPassword: "", confirmPassword: "" };

const PASSWORD_RULES = [
  {
    key: "length",
    label: "8–128 characters",
    test: (v) => v.length >= 8 && v.length <= 128,
  },
  {
    key: "uppercase",
    label: "One uppercase letter",
    test: (v) => /[A-Z]/.test(v),
  },
  {
    key: "lowercase",
    label: "One lowercase letter",
    test: (v) => /[a-z]/.test(v),
  },
  { key: "number", label: "One number", test: (v) => /\d/.test(v) },
];

export default function ResetPassword() {
  const toast = useToast();
  const [form, setForm] = useState(INITIAL_FORM);
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordRules = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(form.newPassword),
  }));
  const validPassword = passwordRules.every((rule) => rule.passed);
  const passwordsMatch =
    !!form.confirmPassword && form.confirmPassword === form.newPassword;
  const canSubmit = validPassword && passwordsMatch && !saving;

  const getError = (name) => {
    if (!touched[name]) return "";
    if (!form[name])
      return name === "newPassword"
        ? "New password is required."
        : "Please confirm your new password.";
    if (name === "newPassword" && !validPassword)
      return "Please meet all password requirements.";
    if (name === "confirmPassword" && !passwordsMatch)
      return "Passwords do not match.";
    return "";
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setServerError("");
    setSuccess(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ newPassword: true, confirmPassword: true });
    if (!canSubmit) return;

    setSaving(true);
    setServerError("");
    setSuccess(false);
    try {
      const { data } = await axios.post(
        "/api/auth/reset-password",
        {
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
        },
        { withCredentials: true },
      );
      if (data?.success === false)
        throw new Error(data.message || "Unable to update password.");
      setForm(INITIAL_FORM);
      setTouched({});
      setShowPassword(false);
      setShowConfirmPassword(false);
      setSuccess(true);
      toast(data?.message || "Password updated successfully.", "success");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to update password. Please try again.";
      setServerError(message);
      toast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-[#14231d]">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#1b7a5a]">
            Account settings
          </p>
          <h1
            className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
            style={DISPLAY}
          >
            Change password<span style={{ color: GOLD }}>.</span>
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#5b6b63]">
            Update the password you use to access your CRM account.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#e5ebe2] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#5b6b63]">
          <ShieldCheck size={17} className="text-[#1b7a5a]" /> Account security
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-[#e5ebe2] bg-white">
        <div className="flex items-center gap-3 border-b border-[#eef2ec] px-5 py-5 sm:px-7">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#edf5ef]">
            <LockKeyhole size={20} className="text-[#1b7a5a]" />
          </div>
          <div>
            <h2 className="text-base font-bold">Password & security</h2>
            <p className="mt-1 text-sm text-[#5b6b63]">
              Choose a strong password to protect your account.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="max-w-2xl space-y-6"
          >
            <div className="rounded-xl border border-[#e5ebe2] bg-[#f8faf6] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-[#1b7a5a]"
                />
                <div>
                  <p className="text-sm font-bold">Keep your account secure</p>
                  <p className="mt-1 text-xs leading-5 text-[#5b6b63]">
                    Use a unique password that you don’t use on other websites.
                  </p>
                </div>
              </div>
            </div>

            {success && (
              <div
                role="status"
                className="flex items-start gap-3 rounded-xl border border-[#cce7d5] bg-[#f0f9f2] p-4"
              >
                <CheckCircle2
                  size={19}
                  className="mt-0.5 shrink-0 text-[#1b7a5a]"
                />
                <p className="text-sm font-medium text-[#145c40]">
                  Your password was changed successfully.
                </p>
              </div>
            )}

            <div>
              <Input
                label="New password"
                name="newPassword"
                type={showPassword ? "text" : "password"}
                value={form.newPassword}
                onChange={handleChange}
                onBlur={() =>
                  setTouched((current) => ({ ...current, newPassword: true }))
                }
                leadingIcon={LockKeyhole}
                placeholder="Enter your new password"
                autoComplete="new-password"
                required
                disabled={saving}
                error={getError("newPassword")}
              />
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowPassword((current) => !current)}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1b7a5a] hover:text-[#0b3d2e] disabled:opacity-50"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPassword ? "Hide password" : "Show password"}
              </button>
              <div className="mt-4 rounded-xl border border-[#e5ebe2] bg-[#f9faf7] p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#5b6b63]">
                    Password requirements
                  </p>
                  {validPassword && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1b7a5a]">
                      <CheckCircle2 size={13} /> All requirements met
                    </span>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {passwordRules.map((rule) => (
                    <div key={rule.key} className="flex items-center gap-2.5">
                      {rule.passed ? (
                        <CheckCircle2
                          size={16}
                          className="shrink-0 text-[#1b7a5a]"
                        />
                      ) : (
                        <Circle size={16} className="shrink-0 text-[#a5afa7]" />
                      )}
                      <span
                        className={`text-xs ${rule.passed ? "font-medium text-[#1b7a5a]" : "text-[#5b6b63]"}`}
                      >
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Input
                label="Confirm new password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={handleChange}
                onBlur={() =>
                  setTouched((current) => ({
                    ...current,
                    confirmPassword: true,
                  }))
                }
                leadingIcon={KeyRound}
                placeholder="Re-enter your new password"
                autoComplete="new-password"
                required
                disabled={saving}
                error={getError("confirmPassword")}
              />
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1b7a5a] hover:text-[#0b3d2e] disabled:opacity-50"
              >
                {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                {showConfirmPassword ? "Hide password" : "Show password"}
              </button>
              {passwordsMatch && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#1b7a5a]">
                  <CheckCircle2 size={14} /> Passwords match
                </p>
              )}
            </div>

            {serverError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5"
              >
                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0 text-red-600"
                />
                <p className="text-sm leading-5 text-red-700">{serverError}</p>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-[#eef2ec] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-[#849087]">
                Your changes will be saved securely.
              </p>
              <Button type="submit" disabled={!canSubmit}>
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader
                      size="xs"
                      variant="spinner"
                      color="#ffffff"
                      label="Saving password..."
                    />{" "}
                    Saving...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    Update password <ArrowRight size={16} />
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
