const GOLD = "#e4c48a";
const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };

const formatNumber = (value) => Number(value || 0).toLocaleString("en-IN");

const formatArea = (value, unit) => {
  if (value === null || value === undefined || value === "") {
    return "Not specified";
  }

  const label =
    AREA_UNITS.find((item) => item.value === unit)?.label || unit || "";

  return `${Number(value).toLocaleString("en-IN")} ${label}`;
};

export default function StatCard({ icon: Icon, label, value, dark, caption }) {
  return (
    <div
      className={`rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
        dark
          ? "border-[#0b3d2e] bg-[#0b3d2e] text-white shadow-md shadow-[#0b3d2e]/10"
          : "border-[#e3e9e0] bg-white text-[#14231d]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className={`text-[10px] font-extrabold uppercase tracking-[0.14em] ${
            dark ? "text-white/65" : "text-[#718078]"
          }`}
        >
          {label}
        </p>

        <span
          className={`grid h-9 w-9 place-items-center rounded-xl ${
            dark ? "text-[#0b3d2e]" : "bg-[#e9f3ee] text-[#1b7a5a]"
          }`}
          style={dark ? { background: GOLD } : undefined}
        >
          <Icon size={17} />
        </span>
      </div>

      <p className="mt-4 text-3xl font-semibold tracking-tight" style={DISPLAY}>
        {formatNumber(value)}
      </p>

      <p
        className={`mt-1 text-xs ${dark ? "text-white/60" : "text-[#7b8981]"}`}
      >
        {caption}
      </p>
    </div>
  );
}
