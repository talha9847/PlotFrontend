import { forwardRef, useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

const SearchableLeadSelect = forwardRef(function SearchableLeadSelect(
  {
    apiUrl,
    label = "Lead / Customer",
    placeholder = "Select a lead",
    searchPlaceholder = "Search by name or phone...",
    error,
    hint,
    id,
    name = "lead_id",
    required = false,
    disabled = false,
    className = "",
    wrapperClassName = "",
    value,
    defaultValue,
    onChange,
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
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const selectedValue = value !== undefined ? value : internalValue;

  const selectedOption =
    leads.find((lead) => String(lead.id) === String(selectedValue)) ||
    (selectedLead && String(selectedLead.id) === String(selectedValue)
      ? selectedLead
      : null);

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
    if (isOpen) searchRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !apiUrl) return;

    const controller = new AbortController();

    const timer = setTimeout(
      async () => {
        try {
          setLoading(true);
          setFetchError("");

          const params = new URLSearchParams();

          if (search.trim()) {
            params.set("search", search.trim());
          }

          const query = params.toString();
          const url = query ? `${apiUrl}?${query}` : apiUrl;

          const response = await fetch(url, {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.message || "Failed to fetch leads");
          }

          setLeads(result.data || []);
        } catch (err) {
          if (err.name !== "AbortError") {
            setLeads([]);
            setFetchError(err.message || "Failed to fetch leads");
          }
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      },
      search.trim() ? 300 : 0,
    );

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, search, apiUrl]);

  function handleSelect(lead) {
    const nextValue = String(lead.id);

    if (value === undefined) setInternalValue(nextValue);

    setSelectedLead(lead);

    onChange?.({
      target: {
        name,
        value: nextValue,
      },
    });

    setIsOpen(false);
    setSearch("");
  }

  function handleClear(event) {
    event.stopPropagation();

    if (disabled) return;

    if (value === undefined) setInternalValue("");

    setSelectedLead(null);

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
          {required && <span className="ml-1 text-rose-600">*</span>}
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
          aria-invalid={!!error}
          aria-describedby={error || hint ? helpId : undefined}
          onClick={() => setIsOpen((previous) => !previous)}
          className={`flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-left text-sm outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
            error
              ? "border-rose-300 focus:ring-rose-100"
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
            {selectedOption
              ? `${selectedOption.name} (${selectedOption.phone || "No phone"})`
              : placeholder}
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
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-100"
                >
                  <X size={15} />
                </span>
              )}

            <ChevronDown
              size={16}
              className={`text-slate-400 transition ${
                isOpen ? "rotate-180 text-[#1b7a5a]" : ""
              }`}
            />
          </span>
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-[#dfe5dc] bg-white shadow-lg">
            <div className="border-b border-[#edf0eb] p-2">
              <div className="flex items-center gap-2 rounded-lg border border-[#dfe5dc] px-3">
                <Search size={16} className="shrink-0 text-slate-400" />

                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label="Search leads"
                  className="h-10 w-full min-w-0 bg-transparent text-sm outline-none"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <ul
              role="listbox"
              aria-labelledby={`${selectId}-label`}
              className="max-h-60 overflow-y-auto p-1.5"
            >
              {loading ? (
                <li className="px-3 py-8 text-center text-sm text-slate-500">
                  Loading leads...
                </li>
              ) : fetchError ? (
                <li className="px-3 py-6 text-center text-sm text-rose-600">
                  {fetchError}
                  <button
                    type="button"
                    onClick={() => setSearch((current) => `${current}`)}
                    className="ml-2 underline"
                  >
                    Retry
                  </button>
                </li>
              ) : leads.length > 0 ? (
                leads.map((lead) => {
                  const isSelected = String(lead.id) === String(selectedValue);

                  return (
                    <li
                      key={lead.uuid || lead.id}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(lead)}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm ${
                        isSelected
                          ? "bg-[#eaf4ee] text-[#1b7a5a]"
                          : "text-[#14231d] hover:bg-slate-50"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">
                          {lead.name}
                        </span>

                        <span className="mt-0.5 block text-xs text-slate-500">
                          {lead.phone || "No phone"}
                          {lead.brokerName
                            ? ` · Broker: ${lead.brokerName}`
                            : ""}
                        </span>
                      </span>

                      {isSelected && <Check size={16} className="shrink-0" />}
                    </li>
                  );
                })
              ) : (
                <li className="px-3 py-8 text-center text-sm text-slate-500">
                  No leads found.
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
          required
          value={selectedValue ?? ""}
          onChange={() => {}}
          aria-hidden="true"
          className="pointer-events-none absolute h-px w-px opacity-0"
        />
      )}

      {name && <input type="hidden" name={name} value={selectedValue ?? ""} />}

      {(error || hint) && (
        <p
          id={helpId}
          role={error ? "alert" : undefined}
          className={`mt-1.5 text-xs ${
            error ? "text-rose-600" : "text-slate-500"
          }`}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
});

export default SearchableLeadSelect;
