import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";

import Brand from "../components/common/Brand";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import { useToast } from "../components/common/Toast";
import { useAuth } from "../context/authContext";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };
const GOLD = "#e4c48a";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { login } = useAuth();

  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const upd = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      await login({
        email: form.email.trim(),
        password: form.password,
        remember,
      });

      toast?.success?.("Welcome back to Plotwise.");

      const requestedPath = location.state?.from;
      const destination =
        requestedPath?.pathname && requestedPath.pathname !== "/login"
          ? `${requestedPath.pathname}${requestedPath.search || ""}${requestedPath.hash || ""}`
          : "/dashboard";

      navigate(destination, { replace: true });
    } catch (err) {
      const status = err.response?.status;

      if (status === 401 || status === 403) {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to sign in. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen bg-[#fafaf6] lg:grid lg:grid-cols-[1.05fr_.95fr]"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700;800&display=swap');

        @keyframes up {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes kb {
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }

        .login-enter {
          animation: up .7s ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .login-enter {
            animation: none;
          }
        }
      `}</style>

      {/* Brand panel */}
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#062a20] p-10 text-white lg:flex xl:p-14">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1800&q=80"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
          style={{ animation: "kb 24s ease-out forwards" }}
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg,rgba(4,31,24,.95),rgba(11,61,46,.7) 55%,rgba(4,31,24,.95))",
          }}
        />

        <div className="relative z-10">
          <Brand light />
        </div>

        <div className="relative z-10 max-w-xl">
          <p
            className="text-[11px] font-extrabold uppercase tracking-[0.22em]"
            style={{ color: GOLD }}
          >
            The Plotwise workspace
          </p>

          <h1
            className="mt-5 font-semibold leading-[1.02] tracking-[-0.03em]"
            style={{
              ...DISPLAY,
              fontSize: "clamp(2.8rem,4.6vw,4.4rem)",
            }}
          >
            Every plot. Every detail.
            <br />
            <span className="italic" style={{ color: GOLD }}>
              In one place.
            </span>
          </h1>

          <p className="mt-6 max-w-md text-base leading-7 text-white/70">
            Manage plot inventory, customer bookings and payment schedules from
            one considered workspace.
          </p>

          <div className="mt-10 max-w-md rounded-3xl border border-white/15 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
              Your workspace
            </p>
            <p className="mt-3 text-sm leading-6 text-white/80">
              One place for land inventory, bookings, customers and payment
              schedules.
            </p>
          </div>
        </div>

        <p className="relative z-10 text-xs tracking-wide text-white/40">
          © {new Date().getFullYear()} Plotwise Estates
        </p>
      </section>

      {/* Sign-in panel */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-10">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#e9eee5] opacity-70 blur-3xl" />

        <div className="login-enter relative w-full max-w-[420px]">
          <Link
            to="/"
            className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#0b3d2e]"
          >
            <ArrowLeft size={16} />
            Back to website
          </Link>

          <div className="mb-8 lg:hidden">
            <Brand />
          </div>

          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#1b7a5a]">
            Welcome back
          </p>

          <h2
            className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-[#14231d]"
            style={DISPLAY}
          >
            Sign in to your{" "}
            <span className="italic text-[#1b7a5a]">workspace</span>
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#5b6b63]">
            Enter your details to manage plots, bookings and payments.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <Input
              label="Email address"
              type="email"
              name="email"
              autoComplete="username"
              leadingIcon={Mail}
              placeholder="you@company.com"
              value={form.email}
              onChange={(event) => upd("email", event.target.value)}
            />

            <Input
              label="Password"
              name="password"
              autoComplete="current-password"
              type={show ? "text" : "password"}
              leadingIcon={Lock}
              placeholder="Enter your password"
              value={form.password}
              onChange={(event) => upd("password", event.target.value)}
              labelAside={
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[#1b7a5a] hover:underline"
                >
                  Forgot password?
                </Link>
              }
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShow((current) => !current)}
                  aria-label={show ? "Hide password" : "Show password"}
                  aria-pressed={show}
                  className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-[#e9f3ee] hover:text-[#0b3d2e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b7a5a]"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#5b6b63]">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-4 w-4 rounded accent-[#0b3d2e]"
              />
              Keep me signed in
            </label>

            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              pill
              loading={loading}
              disabled={loading}
              className="w-full !justify-between"
            >
              <span>{loading ? "Signing in…" : "Sign in"}</span>

              {!loading && (
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 transition group-hover:translate-x-1">
                  <ArrowRight size={16} />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-7 text-center text-xs leading-5 text-slate-400">
            Secure access to your Plotwise workspace.
          </p>
        </div>
      </section>
    </main>
  );
}
