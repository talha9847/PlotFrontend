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

const PASSWORD_RULES = [
  {
    key: "length",
    label: "At least 8 characters",
    test: (value) => value.length >= 8,
  },
  {
    key: "uppercase",
    label: "One uppercase letter (A–Z)",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    key: "lowercase",
    label: "One lowercase letter (a–z)",
    test: (value) => /[a-z]/.test(value),
  },
  {
    key: "number",
    label: "One number (0–9)",
    test: (value) => /\d/.test(value),
  },
];

const INITIAL_FORM = {
  newPassword: "",
  confirmPassword: "",
};

export default function ResetPassword() {
  const toast = useToast();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const passwordRules = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(form.newPassword),
  }));

  const isPasswordValid = passwordRules.every((rule) => rule.passed);

  const passwordsMatch =
    form.confirmPassword.length > 0 &&
    form.newPassword === form.confirmPassword;

  const isFormValid = isPasswordValid && passwordsMatch;

  const validateField = (name, value, currentForm = form) => {
    if (name === "newPassword") {
      if (!value) {
        return "New password is required.";
      }

      if (!PASSWORD_RULES.every((rule) => rule.test(value))) {
        return "Please meet all password requirements.";
      }

      if (value.length > 128) {
        return "Password cannot exceed 128 characters.";
      }

      return "";
    }

    if (name === "confirmPassword") {
      if (!value) {
        return "Please confirm your new password.";
      }

      if (value !== currentForm.newPassword) {
        return "Passwords do not match.";
      }

      return "";
    }

    return "";
  };

  const updateField = (event) => {
    const { name, value } = event.target;

    const nextForm = {
      ...form,
      [name]: value,
    };

    setForm(nextForm);
    setSuccess(false);
    setServerError("");

    setErrors((current) => {
      const nextErrors = { ...current };

      if (touched[name]) {
        nextErrors[name] = validateField(name, value, nextForm);
      }

      if (
        name === "newPassword" &&
        (touched.confirmPassword || nextForm.confirmPassword)
      ) {
        nextErrors.confirmPassword = validateField(
          "confirmPassword",
          nextForm.confirmPassword,
          nextForm,
        );
      }

      return nextErrors;
    });
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;

    setTouched((current) => ({
      ...current,
      [name]: true,
    }));

    setErrors((current) => ({
      ...current,
      [name]: validateField(name, value),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {
      newPassword: validateField("newPassword", form.newPassword),
      confirmPassword: validateField("confirmPassword", form.confirmPassword),
    };

    setErrors(nextErrors);
    setTouched({
      newPassword: true,
      confirmPassword: true,
    });

    if (Object.values(nextErrors).some(Boolean)) {
      setServerError("Please correct the highlighted fields.");
      return;
    }

    if (saving) return;

    setSaving(true);
    setServerError("");
    setSuccess(false);

    try {
      const response = await axios.post(
        "/api/auth/reset-password",
        {
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
        },
        {
          withCredentials: true,
        },
      );

      const message =
        response.data?.message || "Password updated successfully.";

      setForm(INITIAL_FORM);
      setErrors({});
      setTouched({});
      setShowPassword(false);
      setShowConfirmPassword(false);
      setSuccess(true);

      toast(message, "success");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Unable to update your password. Please try again.";

      setServerError(message);
      toast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-[#14231d]">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#1b7a5a]">
            Account settings
          </p>

          <h1
            className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl"
            style={DISPLAY}
          >
            Change password
            <span style={{ color: GOLD }}>.</span>
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5b6b63]">
            Manage your account security and keep your administrator account
            protected with a strong password.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#e5ebe2] bg-white px-3.5 py-2.5">
          <ShieldCheck size={17} className="text-[#1b7a5a]" />

          <span className="text-xs font-semibold text-[#5b6b63]">
            Password & security
          </span>
        </div>
      </div>

      {/* Main settings card */}
      <section className="overflow-hidden rounded-2xl border border-[#e5ebe2] bg-white">
        {/* Card heading */}
        <div className="flex items-start gap-3 border-b border-[#eef2ec] px-5 py-5 sm:px-7">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#edf5ef]">
            <LockKeyhole size={20} className="text-[#1b7a5a]" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-[#14231d]">
              Password and security
            </h2>

            <p className="mt-1 text-sm leading-5 text-[#5b6b63]">
              Set a new password for your account.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="max-w-3xl">
            {/* Security information */}
            <div className="mb-7 flex items-start gap-3 rounded-xl border border-[#e5ebe2] bg-[#f8faf6] p-4">
              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-[#1b7a5a]"
              />

              <div>
                <p className="text-sm font-bold text-[#14231d]">
                  Keep your account secure
                </p>

                <p className="mt-1 text-xs leading-5 text-[#5b6b63]">
                  Choose a password that is difficult to guess. Avoid reusing
                  passwords from other websites or applications.
                </p>
              </div>
            </div>

            {/* Success message */}
            {success && (
              <div
                role="status"
                className="mb-6 flex items-start gap-3 rounded-xl border border-[#cce7d5] bg-[#f0f9f2] p-4"
              >
                <CheckCircle2
                  size={19}
                  className="mt-0.5 shrink-0 text-[#1b7a5a]"
                />

                <div>
                  <p className="text-sm font-bold text-[#145c40]">
                    Password updated successfully
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#42745a]">
                    Your new password is saved. You can continue using the CRM.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* New password */}
              <div>
                <Input
                  label="New password"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={form.newPassword}
                  onChange={updateField}
                  onBlur={handleBlur}
                  leadingIcon={LockKeyhole}
                  placeholder="Enter your new password"
                  autoComplete="new-password"
                  required
                  disabled={saving}
                  error={touched.newPassword ? errors.newPassword : ""}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={saving}
                  aria-label={
                    showPassword ? "Hide new password" : "Show new password"
                  }
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1b7a5a] transition hover:text-[#0b3d2e] disabled:opacity-50"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}

                  {showPassword ? "Hide password" : "Show password"}
                </button>

                {/* Password requirements */}
                <div className="mt-4 rounded-xl border border-[#e5ebe2] bg-[#f9faf7] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#5b6b63]">
                      Password requirements
                    </p>

                    {isPasswordValid && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1b7a5a]">
                        <CheckCircle2 size={13} />
                        All requirements met
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
                          <Circle
                            size={16}
                            className="shrink-0 text-[#a5afa7]"
                          />
                        )}

                        <span
                          className={`text-xs transition ${
                            rule.passed
                              ? "font-medium text-[#1b7a5a]"
                              : "text-[#5b6b63]"
                          }`}
                        >
                          {rule.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <Input
                  label="Confirm new password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={updateField}
                  onBlur={handleBlur}
                  leadingIcon={KeyRound}
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                  required
                  disabled={saving}
                  error={touched.confirmPassword ? errors.confirmPassword : ""}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  disabled={saving}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirmation password"
                      : "Show confirmation password"
                  }
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1b7a5a] transition hover:text-[#0b3d2e] disabled:opacity-50"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={14} />
                  ) : (
                    <Eye size={14} />
                  )}

                  {showConfirmPassword ? "Hide password" : "Show password"}
                </button>

                {passwordsMatch && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#1b7a5a]">
                    <CheckCircle2 size={14} />
                    Passwords match
                  </p>
                )}
              </div>

              {/* API / form error */}
              {serverError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5"
                >
                  <AlertCircle
                    size={17}
                    className="mt-0.5 shrink-0 text-red-600"
                  />

                  <p className="text-sm leading-5 text-red-700">
                    {serverError}
                  </p>
                </div>
              )}

              {/* Footer actions */}
              <div className="flex flex-col gap-3 border-t border-[#eef2ec] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-[#849087]">
                  Your password is updated securely through your account.
                </p>

                <Button type="submit" disabled={saving || !isFormValid}>
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader
                        size="xs"
                        variant="spinner"
                        color="#ffffff"
                        label="Saving password..."
                      />
                      Saving...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Save password
                      <ArrowRight size={16} />
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Supporting note */}
      <div className="flex items-start gap-2.5 px-1">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#849087]" />

        <p className="max-w-3xl text-xs leading-5 text-[#849087]">
          For your security, never share your password with anyone. If you
          suspect unauthorized access, update your password immediately.
        </p>
      </div>
    </div>
  );
}
