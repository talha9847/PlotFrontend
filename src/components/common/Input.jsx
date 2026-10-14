import { forwardRef, useId } from "react";

const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    id,
    required = false,
    className = "",
    wrapperClassName = "",
    leadingIcon: LeadingIcon,
    trailingIcon: TrailingIcon,
    endAdornment, // interactive element on the right, e.g. show/hide password button
    labelAside, // small node on the label row's right, e.g. "Forgot password?"
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const hasRight = TrailingIcon || endAdornment;

  return (
    <div className={`min-w-0 ${wrapperClassName}`}>
      {(label || labelAside) && (
        <div className="mb-2 flex items-center justify-between gap-3">
          {label && (
            <label
              htmlFor={inputId}
              className="text-sm font-semibold text-[#14231d]"
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
          {labelAside}
        </div>
      )}
      <div className="group relative">
        {LeadingIcon && (
          <LeadingIcon
            aria-hidden="true"
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#1b7a5a]"
          />
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={`block min-h-[52px] w-full rounded-xl border bg-white px-4 py-3 text-sm font-medium text-[#14231d] outline-none transition duration-150 placeholder:font-normal placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 ${
            LeadingIcon ? "pl-11" : ""
          } ${hasRight ? "pr-12" : ""} ${
            error
              ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
              : "border-[#dfe5dc] hover:border-[#c3d0bf] focus:border-[#1b7a5a] focus:ring-[#1b7a5a]/15"
          } ${className}`}
          {...props}
        />
        {TrailingIcon && !endAdornment && (
          <TrailingIcon
            aria-hidden="true"
            size={17}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
        )}
        {endAdornment && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            {endAdornment}
          </div>
        )}
      </div>
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-xs font-medium text-rose-600"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-xs leading-5 text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
