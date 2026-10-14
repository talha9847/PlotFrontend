import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Brand from "../components/common/Brand";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import { useToast } from "../components/common/Toast";

const DEMO_EMAIL = "admin@terravista.example";
const DEMO_PASSWORD = "demo1234";

export default function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  function handleSubmit(event) {
    event.preventDefault();
    toast("Demo preview only — authentication is not connected.", "info");
    navigate("/admin");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f6f1] px-4 py-5 text-ink sm:px-6 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-brand-100/70 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-amber-100/50 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[1180px] flex-col">
        <header className="flex items-center justify-between px-1 py-2 sm:px-3">
          <Brand />
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-black/[0.07] bg-white/70 px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-brand-200 hover:text-brand-800"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Back to website</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </header>

        <section className="my-auto grid overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_24px_90px_-36px_rgba(24,50,35,0.25)] lg:min-h-[660px] lg:grid-cols-[1.02fr_0.98fr]">
          {/* Visual panel */}
          <div className="relative hidden min-h-[660px] overflow-hidden bg-[#163d2d] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-12">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1800&q=90)",
              }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-br from-[#102c20]/95 via-[#173d2c]/75 to-[#10271e]/90"
            />
            <div
              aria-hidden="true"
              className="absolute -right-24 top-16 h-80 w-80 rounded-full border border-white/10"
            />
            <div
              aria-hidden="true"
              className="absolute -right-8 top-32 h-48 w-48 rounded-full border border-white/10"
            />

            <div className="relative z-10 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              The Plotwise workspace
            </div>

            <div className="relative z-10 max-w-lg">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-2 text-xs font-medium text-white/85 backdrop-blur">
                <Sparkles size={14} className="text-amber-200" />
                Clarity for every square foot
              </div>
              <h1 className="font-display text-5xl font-semibold leading-[1.08] tracking-[-0.055em] xl:text-[3.8rem]">
                Your land business,
                <br />
                <span className="font-serif font-normal italic text-[#e4d6a7]">
                  in good order.
                </span>
              </h1>
              <p className="mt-6 max-w-md text-sm leading-7 text-white/70 xl:text-base">
                Bring plot inventory, customer bookings and payment progress
                together in one calm, organised workspace.
              </p>

              <div className="mt-10 max-w-sm rounded-2xl border border-white/15 bg-[#10291f]/55 p-4 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white/65">
                    Workspace overview
                  </span>
                  <span className="rounded-full bg-emerald-300/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-200">
                    DEMO
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 divide-x divide-white/10">
                  <div className="pr-3">
                    <p className="text-2xl font-semibold tracking-tight">124</p>
                    <p className="mt-1 text-[10px] text-white/55">
                      Total plots
                    </p>
                  </div>
                  <div className="px-3">
                    <p className="text-2xl font-semibold tracking-tight">38</p>
                    <p className="mt-1 text-[10px] text-white/55">Available</p>
                  </div>
                  <div className="pl-3">
                    <p className="text-2xl font-semibold tracking-tight">86%</p>
                    <p className="mt-1 text-[10px] text-white/55">Allocated</p>
                  </div>
                </div>
                <p className="mt-4 border-t border-white/10 pt-3 text-[10px] leading-5 text-white/45">
                  Illustrative figures shown for design preview only.
                </p>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between gap-4 text-[11px] text-white/45">
              <span>© {new Date().getFullYear()} Plotwise Estates</span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} />
                Demo environment
              </span>
            </div>
          </div>

          {/* Sign-in panel */}
          <div className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-10 xl:px-16">
            <div className="w-full max-w-[390px]">
              <div className="mb-8 flex items-center gap-2 text-xs font-semibold text-brand-800 lg:hidden">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-50">
                  <LockKeyhole size={15} />
                </span>
                Private workspace
              </div>

              <div className="mb-8 hidden h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-800 ring-1 ring-brand-100 lg:grid">
                <LockKeyhole size={21} strokeWidth={1.8} />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
                Welcome back
              </p>
              <h2 className="mt-3 text-[2rem] font-semibold leading-tight tracking-[-0.045em] text-[#18251d] sm:text-[2.35rem]">
                Sign in to Plotwise
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Pick up where you left off. Your workspace is waiting.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <Input
                  label="Email address"
                  type="email"
                  name="email"
                  autoComplete="username"
                  placeholder="you@company.com"
                  required
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-ink"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForm((current) => ({
                          ...current,
                          email: DEMO_EMAIL,
                          password: DEMO_PASSWORD,
                        }));
                        toast("Demo credentials filled in.", "info");
                      }}
                      className="text-xs font-semibold text-brand-700 transition hover:text-brand-900"
                    >
                      Use demo login
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      required
                      value={form.password}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-line bg-[#fbfcfa] px-4 py-3.5 pr-12 text-sm text-ink outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showPassword}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-brand-50 hover:text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-300"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full">
                  Sign in to workspace
                  <ArrowUpRight size={17} />
                </Button>
              </form>

              <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5">
                <ShieldCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-brand-700"
                />
                <p className="text-xs leading-5 text-slate-500">
                  <span className="font-semibold text-slate-700">
                    Demo access.
                  </span>{" "}
                  Authentication is not connected yet. Use the demo login option
                  to fill the preview credentials.
                </p>
              </div>

              <p className="mt-8 text-center text-[11px] leading-5 text-slate-400">
                By continuing, you agree to use this preview responsibly.
                <br />
                Do not enter a real password.
              </p>
            </div>
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-2 px-2 py-5 text-[11px] text-slate-400 sm:flex-row sm:px-3">
          <span>© {new Date().getFullYear()} Plotwise Estates</span>
          <span className="inline-flex items-center gap-1.5">
            Built for clearer land management
            <ArrowUpRight size={12} />
          </span>
        </footer>
      </div>
    </main>
  );
}
