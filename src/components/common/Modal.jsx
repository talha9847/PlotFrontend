import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Button from "./Button";

const DISPLAY = { fontFamily: "'Fraunces', Georgia, serif" };

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnBackdrop = true,
  closeOnEscape = true,
}) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    previousFocus.current = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape" && closeOnEscape) {
        event.stopPropagation();
        onClose?.();
      }
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable.length) {
          event.preventDefault();
          dialogRef.current.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => {
      const first = dialogRef.current?.querySelector(
        "input, select, textarea, [tabindex]:not([tabindex='-1'])",
      );
      (first || dialogRef.current)?.focus();
    });

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = oldOverflow;
      previousFocus.current?.focus?.();
    };
  }, [open, onClose, closeOnEscape]);

  if (!open || typeof document === "undefined") return null;

  const widths = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
    full: "max-w-[min(96vw,90rem)]",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#041f18]/55 p-3 backdrop-blur-[4px] sm:p-6"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget)
          onClose?.();
      }}
    >
      <style>{`@keyframes modalIn{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:none}}`}</style>
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        style={{ animation: "modalIn .25s ease-out both" }}
        className={`my-auto flex max-h-[min(90vh,60rem)] w-full ${widths[size] || widths.md} flex-col overflow-hidden rounded-3xl bg-[#fffefa] shadow-[0_30px_100px_rgba(4,31,24,0.35)] outline-none`}
      >
        <header className="relative flex items-start justify-between gap-4 overflow-hidden bg-[#062a20] px-5 py-5 text-white sm:px-7">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-14 h-36 w-36 rounded-full border border-white/10"
          />
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-[#e4c48a] via-[#e4c48a]/40 to-transparent"
          />
          <div className="relative min-w-0">
            <h2
              id={titleId}
              className="text-xl font-semibold tracking-tight"
              style={DISPLAY}
            >
              {title}
            </h2>
            {description && (
              <p
                id={descriptionId}
                className="mt-1.5 text-sm leading-6 text-white/60"
              >
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/15 text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e4c48a]/40"
          >
            <X size={17} />
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {children}
        </div>
        {footer && (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-[#e3e9e0] bg-[#f6f9f4] px-5 py-4 sm:px-7">
            {footer}
          </footer>
        )}
      </section>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={message}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-6 text-[#5b6b63]">
        Please review this action before continuing.
      </p>
    </Modal>
  );
}
