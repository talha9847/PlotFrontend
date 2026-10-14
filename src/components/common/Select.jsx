import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";

const Select = forwardRef(function Select(
  {
    label,
    options = [],
    placeholder = "Select an option",
    error,
    hint,
    id,
    required = false,
    className = "",
    wrapperClassName = "",
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const helpId = `${selectId}-help`;

  return (
    <div className={`min-w-0 ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="mb-2 block text-sm font-semibold text-[#14231d]"
        >
          {label}
          {required && (
            <span className="ml-1 text-rose-600" aria-hidden="true">
              *
            </span>
          )}
          {required && <span className="sr-only"> (required)</span>}
        </label>
      )}
      <div className="group relative">
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error || hint ? helpId : undefined}
          className={`block min-h-[52px] w-full cursor-pointer appearance-none rounded-xl border bg-white py-3 pl-4 pr-11 text-sm font-medium text-[#14231d] outline-none transition duration-150 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 ${
            error
              ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
              : "border-[#dfe5dc] hover:border-[#c3d0bf] focus:border-[#1b7a5a] focus:ring-[#1b7a5a]/15"
          } ${className}`}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) =>
            typeof option === "string" ? (
              <option key={option} value={option}>
                {option}
              </option>
            ) : (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ),
          )}
        </select>
        <ChevronDown
          aria-hidden="true"
          size={16}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#1b7a5a]"
        />
      </div>
      {(error || hint) && (
        <p
          id={helpId}
          role={error ? "alert" : undefined}
          className={`mt-1.5 text-xs leading-5 ${error ? "font-medium text-rose-600" : "text-slate-500"}`}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
});

export default Select;
