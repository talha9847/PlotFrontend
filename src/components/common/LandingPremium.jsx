// landing-premium.jsx — drop-in upgrade for LandingPage.jsx (no new dependencies)
// Put in: src/components/landing/premium.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Calculator,
  ChevronDown,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

/* ───────── 1. Scroll reveal (fade + rise, respects reduced motion) ───────── */
export function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition duration-700 ease-out ${
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ───────── 2. Header that turns solid after scrolling ───────── */
// In LandingPage: const scrolled = useScrolled();
// <header className={`fixed inset-x-0 top-0 z-40 transition duration-300 ${scrolled ? "bg-brand-900/95 shadow-lg backdrop-blur-md" : ""}`}>
export function useScrolled(offset = 40) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > offset);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [offset]);
  return scrolled;
}

/* ───────── 3. Count-up number ───────── */
export function CountUp({ to, suffix = "", duration = 1400 }) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);
  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
}

/* ───────── 4. Amenities ───────── */
// Pass icons from lucide-react: <Amenities items={[{icon: Trees, title:"Landscaped park", text:"..."}]} />
export function Amenities({ items }) {
  return (
    <section className="py-20 sm:py-28">
      <div className="container-wide">
        <Reveal>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-brand-700">
            Life around the land
          </p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-[1.05] tracking-[-0.065em] sm:text-5xl">
            Everything a good plot{" "}
            <span className="font-medium italic text-brand-600">
              should come with.
            </span>
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 70} className="bg-[#fafaf6]">
              <div className="group h-full p-7 transition hover:bg-white">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-800 group-hover:text-white">
                  <Icon size={19} />
                </span>
                <h3 className="mt-5 text-sm font-extrabold text-ink">
                  {title}
                </h3>
                <p className="mt-2 text-xs leading-6 text-muted">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── 5. Buying process timeline ───────── */
const steps = [
  ["Enquire", "Share your requirement. We call you back the same day."],
  ["Visit the site", "Walk the land with our team. No pressure, no rush."],
  ["Verify documents", "Title, approvals and layout plan shared upfront."],
  ["Book your plot", "Token amount, agreement and clear payment schedule."],
  ["Registration", "Sale deed registered and possession handed over."],
];
export function Process() {
  return (
    <section className="bg-[#e9eee5] py-20 sm:py-28">
      <div className="container-wide">
        <Reveal>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-brand-700">
            The process
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.065em] sm:text-5xl">
            Five steps.{" "}
            <span className="font-medium italic text-brand-600">
              Zero surprises.
            </span>
          </h2>
        </Reveal>
        <ol className="mt-12 grid gap-8 md:grid-cols-5 md:gap-5">
          {steps.map(([title, text], i) => (
            <Reveal key={title} delay={i * 90}>
              <li className="relative border-t border-brand-700/30 pt-5">
                <span className="absolute -top-[5px] left-0 h-2.5 w-2.5 rounded-full bg-brand-700" />
                <span className="font-display text-3xl font-semibold tracking-[-0.06em] text-brand-600/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-sm font-extrabold text-ink">
                  {title}
                </h3>
                <p className="mt-1.5 text-xs leading-6 text-muted">{text}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ───────── 6. EMI / affordability calculator (the "wow" feature) ───────── */
const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

export function EmiCalculator({ onEnquire }) {
  const [price, setPrice] = useState(2000000);
  const [down, setDown] = useState(20);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(9);

  const { emi, loan, interest } = useMemo(() => {
    const loan = price * (1 - down / 100);
    const r = rate / 12 / 100;
    const n = years * 12;
    const emi =
      r === 0
        ? loan / n
        : (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return { emi, loan, interest: emi * n - loan };
  }, [price, down, years, rate]);

  const Slider = ({ label, value, set, min, max, step, format }) => (
    <label className="block">
      <span className="flex items-baseline justify-between text-xs font-semibold text-ink">
        {label}
        <span className="font-display text-base font-bold text-brand-800">
          {format(value)}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        className="mt-3 h-1.5 w-full cursor-pointer accent-[#0f5a43]"
      />
    </label>
  );

  return (
    <section className="py-20 sm:py-28">
      <div className="container-wide grid gap-10 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-brand-700">
            <Calculator size={14} /> Plan your purchase
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.065em] sm:text-5xl">
            Know your numbers{" "}
            <span className="font-medium italic text-brand-600">
              before you visit.
            </span>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-muted">
            Estimate your monthly instalment in seconds. Final figures depend on
            your lender and the project team's confirmed pricing.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="rounded-3xl border border-line bg-white p-6 shadow-xl shadow-brand-900/5 sm:p-8">
            <div className="space-y-6">
              <Slider
                label="Plot price"
                value={price}
                set={setPrice}
                min={1000000}
                max={5000000}
                step={50000}
                format={inr}
              />
              <Slider
                label="Down payment"
                value={down}
                set={setDown}
                min={10}
                max={60}
                step={5}
                format={(v) => v + "%"}
              />
              <Slider
                label="Tenure"
                value={years}
                set={setYears}
                min={3}
                max={20}
                step={1}
                format={(v) => v + " yrs"}
              />
              <Slider
                label="Interest rate"
                value={rate}
                set={setRate}
                min={7}
                max={14}
                step={0.25}
                format={(v) => v + "%"}
              />
            </div>
            <div className="mt-8 rounded-2xl bg-brand-900 p-6 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e4c48a]">
                Estimated monthly EMI
              </p>
              <p className="mt-2 font-display text-5xl font-semibold tracking-[-0.06em]">
                {inr(emi)}
              </p>
              <div className="mt-4 flex justify-between border-t border-white/15 pt-4 text-[11px] text-white/65">
                <span>Loan {inr(loan)}</span>
                <span>Interest {inr(interest)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEnquire?.("")}
              className="mt-5 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand-800 transition hover:gap-3"
            >
              Discuss payment plans <ArrowUpRight size={15} />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────── 7. FAQ accordion (accessible) ───────── */
export function Faq({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <section className="bg-[#e9eee5] py-20 sm:py-28">
      <div className="container-wide grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-brand-700">
            Questions
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.065em] sm:text-5xl">
            Asked often.{" "}
            <span className="font-medium italic text-brand-600">
              Answered plainly.
            </span>
          </h2>
        </Reveal>
        <div className="divide-y divide-[#cfd9cb] border-y border-[#cfd9cb]">
          {items.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <div key={q}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-extrabold text-ink"
                >
                  {q}
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-brand-700 transition duration-300 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"}`}
                >
                  <p className="overflow-hidden text-xs leading-6 text-muted">
                    {a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────── 8. Sticky mobile CTA bar (call + WhatsApp) ───────── */
export function StickyCta({
  phone,
  whatsapp,
  message = "Hi, I'd like to know more about the plots.",
}) {
  const wa = `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-2 gap-2 border-t border-white/10 bg-brand-900/95 p-3 backdrop-blur-md lg:hidden">
      <a
        href={`tel:${phone.replace(/\s/g, "")}`}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 py-3 text-xs font-bold text-white"
      >
        <Phone size={15} /> Call
      </a>
      <a
        href={wa}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#e4c48a] py-3 text-xs font-extrabold text-brand-900"
      >
        <MessageCircle size={15} /> WhatsApp
      </a>
    </div>
  );
}

/* ───────── 9. Real form submit: opens WhatsApp with the lead (works with no backend) ───────── */
// Replace submitForm in LandingPage with:
//   const submitForm = (e) => { e.preventDefault(); sendLead(form, project.whatsapp); setSubmitted(true); };
export function sendLead(form, whatsapp) {
  const text = `New enquiry\nName: ${form.name}\nPhone: ${form.phone}\nInterested in: ${form.interest || "Not specified"}\nNote: ${form.message || "-"}`;
  window.open(
    `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`,
    "_blank",
    "noopener",
  );
  // Later: also POST to your CRM, e.g. fetch("/api/leads", { method: "POST", body: JSON.stringify(form) })
}

/* ───────── Integration order in <main> ─────────
  Hero → Snapshot → Collections → <Amenities/> → Philosophy → <EmiCalculator onEnquire={enquireAbout}/>
  → <Process/> → Location → <Faq/> → Contact
  Wrap each section's heading block and cards in <Reveal>. Add <StickyCta/> before </div> and pb-20 on <footer> for mobile.
*/
