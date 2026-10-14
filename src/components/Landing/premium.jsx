import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Calculator,
  ChevronDown,
  MapPin,
  MessageCircle,
  Phone,
  Compass,
  FileCheck2,
  Leaf,
} from "lucide-react";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  return reduced;
}

export function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (reducedMotion || !("IntersectionObserver" in window)) {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition duration-700 ease-out ${
        shown || reducedMotion
          ? "translate-y-0 opacity-100"
          : "translate-y-5 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function useScrolled(offset = 40) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > offset);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [offset]);

  return scrolled;
}

export function CountUp({ to, suffix = "", duration = 1300 }) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (reducedMotion || !("IntersectionObserver" in window)) {
      setValue(to);
      return;
    }

    let frameId;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();

      const start = performance.now();
      const animate = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(to * eased));
        if (progress < 1) frameId = requestAnimationFrame(animate);
      };

      frameId = requestAnimationFrame(animate);
    });

    observer.observe(element);
    return () => {
      observer.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [to, duration, reducedMotion]);

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
}

const defaultAmenities = [
  {
    icon: Compass,
    title: "Understand the layout",
    text: "Review plot dimensions, access and available options with the project team.",
  },
  {
    icon: FileCheck2,
    title: "Make an informed decision",
    text: "Ask for relevant project documents and clarify the process before committing.",
  },
  {
    icon: Leaf,
    title: "Plan for your future",
    text: "Explore how a plot could fit your plans, budget and preferred location.",
  },
];

export function Amenities({ items = defaultAmenities }) {
  return (
    <section className="py-20 sm:py-28">
      <div className="container-wide">
        <Reveal>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-brand-700">
            The details that matter
          </p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-[1.05] tracking-[-0.065em] text-ink sm:text-5xl">
            More clarity at every step.
            <span className="block font-medium italic text-brand-600">
              A better way to choose.
            </span>
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, text }, index) => (
            <Reveal
              key={title}
              delay={index * 70}
              className="h-full bg-[#fafaf6]"
            >
              <div className="group h-full p-6 transition hover:bg-white sm:p-7">
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

const processSteps = [
  [
    "Share your requirements",
    "Tell the team what plot size, budget and timing you have in mind.",
  ],
  [
    "Arrange a site visit",
    "See the location and discuss the layout with the project team.",
  ],
  [
    "Review the details",
    "Request relevant documents, pricing and the proposed payment terms.",
  ],
  [
    "Confirm your choice",
    "Proceed only after your questions and terms have been clarified.",
  ],
  [
    "Complete the formalities",
    "Follow the agreed documentation and registration process.",
  ],
];

export function Process() {
  return (
    <section className="bg-[#e9eee5] py-20 sm:py-28">
      <div className="container-wide">
        <Reveal>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-brand-700">
            The buying journey
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.065em] text-ink sm:text-5xl">
            Five considered steps.
            <span className="block font-medium italic text-brand-600">
              No need to rush.
            </span>
          </h2>
        </Reveal>

        <ol className="mt-12 grid gap-8 sm:grid-cols-2 md:grid-cols-5 md:gap-5">
          {processSteps.map(([title, description], index) => (
            <Reveal key={title} delay={index * 70}>
              <li className="relative h-full border-t border-brand-700/30 pt-5">
                <span className="absolute -top-[5px] left-0 h-2.5 w-2.5 rounded-full bg-brand-700" />
                <span className="font-display text-3xl font-semibold tracking-[-0.06em] text-brand-600/60">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-sm font-extrabold text-ink">
                  {title}
                </h3>
                <p className="mt-1.5 text-xs leading-6 text-muted">
                  {description}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

const formatINR = (amount) => `₹${Math.round(amount).toLocaleString("en-IN")}`;

function RangeField({ label, value, onChange, min, max, step, format }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3 text-xs font-semibold text-ink">
        <span>{label}</span>
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
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 h-1.5 w-full cursor-pointer accent-brand-800"
      />
    </label>
  );
}

export function EmiCalculator({ onEnquire }) {
  const [price, setPrice] = useState(2000000);
  const [downPayment, setDownPayment] = useState(20);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(9);

  const { emi, loan, totalInterest } = useMemo(() => {
    const principal = price * (1 - downPayment / 100);
    const monthlyRate = rate / 1200;
    const months = years * 12;
    const payment =
      monthlyRate === 0
        ? principal / months
        : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
          (Math.pow(1 + monthlyRate, months) - 1);

    return {
      emi: payment,
      loan: principal,
      totalInterest: payment * months - principal,
    };
  }, [price, downPayment, years, rate]);

  return (
    <section className="py-20 sm:py-28">
      <div className="container-wide grid gap-10 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-brand-700">
            <Calculator size={14} /> Plan your purchase
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.065em] text-ink sm:text-5xl">
            Know your numbers.
            <span className="block font-medium italic text-brand-600">
              Start with an estimate.
            </span>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-muted">
            Explore a sample monthly repayment. This is an illustration only;
            land-loan availability, rates, fees and eligibility depend on the
            lender and your circumstances.
          </p>
          <div className="mt-7 flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 p-4">
            <Calculator size={18} className="mt-0.5 shrink-0 text-brand-700" />
            <p className="text-xs leading-6 text-brand-900">
              Change the price, down payment, tenure and interest rate to see
              how the estimate changes.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="rounded-3xl border border-line bg-white p-5 shadow-xl shadow-brand-900/5 sm:p-8">
            <div className="space-y-6">
              <RangeField
                label="Plot price"
                value={price}
                onChange={setPrice}
                min={1000000}
                max={5000000}
                step={50000}
                format={formatINR}
              />
              <RangeField
                label="Down payment"
                value={downPayment}
                onChange={setDownPayment}
                min={10}
                max={60}
                step={5}
                format={(value) => `${value}%`}
              />
              <RangeField
                label="Tenure"
                value={years}
                onChange={setYears}
                min={3}
                max={20}
                step={1}
                format={(value) => `${value} yrs`}
              />
              <RangeField
                label="Illustrative interest rate"
                value={rate}
                onChange={setRate}
                min={7}
                max={14}
                step={0.25}
                format={(value) => `${value}%`}
              />
            </div>

            <div className="mt-8 rounded-2xl bg-brand-900 p-5 text-white sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e4c48a]">
                Estimated monthly payment
              </p>
              <p className="mt-2 font-display text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
                {formatINR(emi)}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/15 pt-4 text-[11px] text-white/65">
                <div>
                  <p>Illustrative loan</p>
                  <p className="mt-1 font-bold text-white">{formatINR(loan)}</p>
                </div>
                <div>
                  <p>Total interest estimate</p>
                  <p className="mt-1 font-bold text-white">
                    {formatINR(totalInterest)}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onEnquire?.("")}
              className="mt-5 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand-800 transition hover:gap-3"
            >
              Discuss your options <ArrowUpRight size={15} />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const defaultFaqs = [
  [
    "How do I check plot availability?",
    "Contact the project team for the latest availability, plot dimensions and pricing. Information on this demo page is illustrative.",
  ],
  [
    "Can I arrange a site visit?",
    "Yes. Use the enquiry form to request a conversation and coordinate a suitable visit time with the project team.",
  ],
  [
    "Which documents should I review?",
    "Ask the seller and a qualified local property professional to explain the applicable title records, approvals, layout documents and agreement terms before you commit.",
  ],
  [
    "Are the prices on this page final?",
    "No. The collection prices are sample figures for this website concept. Confirm current prices, charges and payment terms directly with the project team.",
  ],
];

export function Faq({ items = defaultFaqs }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="bg-[#e9eee5] py-20 sm:py-28">
      <div className="container-wide grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-brand-700">
            Questions
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.065em] text-ink sm:text-5xl">
            Asked often.
            <span className="block font-medium italic text-brand-600">
              Answered plainly.
            </span>
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-muted">
            Still have a question? Send the team an enquiry and ask for the
            details that matter to you.
          </p>
        </Reveal>

        <div className="divide-y divide-[#cfd9cb] border-y border-[#cfd9cb]">
          {items.map(([question, answer], index) => {
            const isOpen = openIndex === index;
            const panelId = `faq-panel-${index}`;

            return (
              <div key={question}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-extrabold text-ink"
                >
                  {question}
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-brand-700 transition duration-300 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <div id={panelId} hidden={!isOpen} className="pb-5">
                  <p className="max-w-2xl text-xs leading-6 text-muted">
                    {answer}
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

export function StickyCta({
  phone = "",
  whatsapp = "",
  message = "Hi, I'd like to know more about the plots.",
}) {
  const phoneDigits = String(phone).replace(/\D/g, "");
  const whatsappDigits = String(whatsapp || phone).replace(/\D/g, "");
  const whatsappUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(message)}`
    : null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-2 gap-2 border-t border-white/10 bg-brand-900/95 p-3 backdrop-blur-md lg:hidden">
      {phoneDigits ? (
        <a
          href={`tel:${phoneDigits}`}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 py-3 text-xs font-bold text-white"
        >
          <Phone size={15} /> Call
        </a>
      ) : (
        <a
          href="#contact"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 py-3 text-xs font-bold text-white"
        >
          <Phone size={15} /> Contact
        </a>
      )}
      {whatsappUrl ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#e4c48a] py-3 text-xs font-extrabold text-brand-900"
        >
          <MessageCircle size={15} /> WhatsApp
        </a>
      ) : (
        <a
          href="#contact"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#e4c48a] py-3 text-xs font-extrabold text-brand-900"
        >
          <MessageCircle size={15} /> Enquire
        </a>
      )}
    </div>
  );
}

export function sendLead(form, whatsapp) {
  const digits = String(whatsapp ?? "").replace(/\D/g, "");
  if (!digits) return false;

  const message = [
    "New plot enquiry",
    `Name: ${form.name}`,
    `Phone: ${form.phone}`,
    `Interested in: ${form.interest || "Not specified"}`,
    `Note: ${form.message || "-"}`,
  ].join("\n");

  window.open(
    `https://wa.me/${digits}?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener,noreferrer",
  );

  return true;
}
