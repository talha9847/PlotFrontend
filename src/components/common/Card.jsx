export default function Card({
  children,
  className = "",
  as: Component = "section",
  padding = "md",
  interactive = false,
  ...props
}) {
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-5 sm:p-6",
    lg: "p-6 sm:p-8",
  };

  return (
    <Component
      className={`min-w-0 rounded-2xl border border-emerald-100/90 bg-white shadow-[0_2px_12px_rgba(16,68,47,0.035)] ${interactive ? "transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_12px_32px_rgba(16,68,47,0.08)]" : ""} ${paddings[padding] ?? paddings.md} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
