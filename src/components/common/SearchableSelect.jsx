import { forwardRef, useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

const SearchableSelect = forwardRef(function SearchableSelect(
  {
    label,
    options = [],
    placeholder = "Select an option",
    searchPlaceholder = "Search options...",
    error,
    hint,
    id,
    required = false,
    className = "",
    wrapperClassName = "",
    disabled = false,
    value,
    defaultValue,
    onChange,
    name,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const helpId = `${selectId}-help`;

  const wrapperRef = useRef(null);
  const searchRef = useRef(null);

  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedValue = value !== undefined ? value : internalValue;

  const normalizedOptions = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );

  const selectedOption = normalizedOptions.find(
    (option) => String(option.value) === String(selectedValue),
  );

  const filteredOptions = normalizedOptions.filter((option) =>
    String(option.label).toLowerCase().includes(search.trim().toLowerCase()),
  );

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
        setSearch("");
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      searchRef.current?.focus();
    }
  }, [isOpen]);

  function handleSelect(option) {
    if (option.disabled) return;

    if (value === undefined) {
      setInternalValue(option.value);
    }

    onChange?.({
      target: {
        name,
        value: option.value,
      },
    });

    setIsOpen(false);
    setSearch("");
  }

  function handleClear(event) {
    event.stopPropagation();

    if (disabled) return;

    if (value === undefined) {
      setInternalValue("");
    }

    onChange?.({
      target: {
        name,
        value: "",
      },
    });

    setSearch("");
  }

  return (
    <div ref={wrapperRef} className={`min-w-0 ${wrapperClassName}`}>
      {label && (
        <label
          id={`${selectId}-label`}
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

      <div className="relative">
        <button
          ref={ref}
          id={selectId}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={label ? `${selectId}-label` : undefined}
          aria-invalid={!!error}
          aria-describedby={error || hint ? helpId : undefined}
          onClick={() => setIsOpen((previous) => !previous)}
          className={`flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl border bg-white py-3 pl-4 pr-4 text-left text-sm font-medium outline-none transition duration-150 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 ${
            error
              ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
              : "border-[#dfe5dc] hover:border-[#c3d0bf] focus:border-[#1b7a5a] focus:ring-[#1b7a5a]/15"
          } ${className}`}
          {...props}
        >
          <span
            className={
              selectedOption
                ? "truncate text-[#14231d]"
                : "truncate text-slate-400"
            }
          >
            {selectedOption?.label ?? placeholder}
          </span>

          <span className="flex shrink-0 items-center gap-2">
            {selectedValue !== "" &&
              selectedValue !== undefined &&
              selectedValue !== null && (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Clear selection"
                  onClick={handleClear}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleClear(event);
                    }
                  }}
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={15} />
                </span>
              )}

            <ChevronDown
              size={16}
              aria-hidden="true"
              className={`text-slate-400 transition ${
                isOpen ? "rotate-180 text-[#1b7a5a]" : ""
              }`}
            />
          </span>
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-[#dfe5dc] bg-white shadow-lg">
            <div className="border-b border-[#edf0eb] p-2">
              <div className="flex items-center gap-2 rounded-lg border border-[#dfe5dc] px-3 focus-within:border-[#1b7a5a]">
                <Search
                  size={16}
                  aria-hidden="true"
                  className="shrink-0 text-slate-400"
                />

                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label="Search options"
                  className="h-10 min-w-0 w-full bg-transparent text-sm text-[#14231d] outline-none placeholder:text-slate-400"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <ul
              role="listbox"
              aria-labelledby={label ? `${selectId}-label` : undefined}
              aria-activedescendant={undefined}
              className="max-h-60 overflow-y-auto p-1.5"
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => {
                  const isSelected =
                    String(option.value) === String(selectedValue);

                  return (
                    <li
                      key={`${String(option.value)}-${index}`}
                      id={`${selectId}-option-${index}`}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={!!option.disabled}
                      onClick={() => handleSelect(option)}
                      className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                        option.disabled
                          ? "cursor-not-allowed text-slate-300"
                          : "cursor-pointer"
                      } ${
                        isSelected
                          ? "bg-[#eaf4ee] font-semibold text-[#1b7a5a]"
                          : "text-[#14231d] hover:bg-slate-50"
                      }`}
                    >
                      <span className="break-words">{option.label}</span>

                      {isSelected && (
                        <Check
                          size={16}
                          aria-hidden="true"
                          className="shrink-0 text-[#1b7a5a]"
                        />
                      )}
                    </li>
                  );
                })
              ) : (
                <li className="px-3 py-8 text-center text-sm text-slate-500">
                  No options found.
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {required && (
        <input
          type="text"
          tabIndex={-1}
          aria-hidden="true"
          required
          value={selectedValue ?? ""}
          onChange={() => {}}
          className="pointer-events-none absolute h-px w-px opacity-0"
        />
      )}

      {name && <input type="hidden" name={name} value={selectedValue ?? ""} />}

      {(error || hint) && (
        <p
          id={helpId}
          role={error ? "alert" : undefined}
          className={`mt-1.5 text-xs leading-5 ${
            error ? "font-medium text-rose-600" : "text-slate-500"
          }`}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
});

export default SearchableSelect;
