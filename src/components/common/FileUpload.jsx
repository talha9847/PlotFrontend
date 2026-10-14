import { useId, useRef, useState } from "react";
import { FileUp, FileText, Image as ImageIcon, X, UploadCloud } from "lucide-react";

export default function FileUpload({
  label = "Upload files",
  accept = ".pdf,.png,.jpg,.jpeg",
  multiple = false,
  onChange,
  hint = "PDF or image files",
  disabled = false,
  error,
  className = "",
}) {
  const id = useId();
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);

  function publish(next) {
    setFiles(next);
    onChange?.(multiple ? next : next[0] || null);
  }

  function change(event) {
    const selected = Array.from(event.target.files || []);
    publish(multiple ? [...files, ...selected.filter((file) => !files.some((f) => f.name === file.name && f.size === file.size))] : selected.slice(0, 1));
    event.target.value = "";
  }

  function remove(index) {
    publish(files.filter((_, i) => i !== index));
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const dropped = Array.from(event.dataTransfer.files || []);
    publish(multiple ? [...files, ...dropped] : dropped.slice(0, 1));
  }

  return (
    <div className={`min-w-0 ${className}`}>
      {label && (
        <div className="mb-2 flex items-center justify-between gap-3">
          <label htmlFor={id} className="text-sm font-semibold text-slate-800">{label}</label>
          {multiple && <span className="text-xs text-slate-500">{files.length} selected</span>}
        </div>
      )}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={change}
        className="sr-only"
      />
      <label
        htmlFor={id}
        onDragEnter={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); }}
        onDrop={handleDrop}
        className={`group flex cursor-pointer flex-col items-center rounded-2xl border border-dashed px-5 py-7 text-center transition duration-200 ${dragging ? "border-emerald-500 bg-emerald-100/70" : "border-emerald-200 bg-emerald-50/60 hover:border-emerald-400 hover:bg-emerald-50"} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-emerald-100 bg-white text-emerald-700 shadow-sm transition group-hover:scale-105">
          {dragging ? <UploadCloud size={22} /> : <FileUp size={22} />}
        </span>
        <span className="text-sm font-semibold text-slate-800">Drop files here or <span className="text-emerald-700 underline decoration-emerald-300 underline-offset-4">browse</span></span>
        <span className="mt-1.5 max-w-xs text-xs leading-5 text-slate-500">{hint}{accept ? ` · ${accept}` : ""}</span>
      </label>
      {error && <p role="alert" className="mt-2 text-xs font-medium text-rose-600">{error}</p>}
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((file, index) => {
            const isImage = file.type.startsWith("image/");
            const FileIcon = isImage ? ImageIcon : FileText;
            return (
              <li key={`${file.name}-${file.size}-${index}`} className="flex min-w-0 items-center gap-3 rounded-xl border border-emerald-100 bg-white p-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><FileIcon size={18} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800">{file.name}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{file.size < 1024 * 1024 ? `${Math.max(1, Math.round(file.size / 1024))} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}</span>
                </span>
                <button type="button" disabled={disabled} onClick={() => remove(index)} aria-label={`Remove ${file.name}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-40">
                  <X size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
