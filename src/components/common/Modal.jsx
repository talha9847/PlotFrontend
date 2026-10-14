import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Button from "./Button";

const DISPLAY = {
  fontFamily: "'Fraunces', Georgia, serif",
};

const WIDTHS = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
  full: "max-w-[min(96vw,90rem)]",
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

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
  closeDisabled = false,
}) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef(null);
  const previousFocus = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return undefined;
    }

    previousFocus.current = document.activeElement;

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let frameId;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && closeOnEscape) {
        event.preventDefault();
        event.stopPropagation();

        if (!closeDisabled) {
          onCloseRef.current?.();
        }

        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = Array.from(
        dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR),
      ).filter((element) => {
        return (
          element.getClientRects().length > 0 &&
          element.getAttribute("aria-hidden") !== "true"
        );
      });

      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !dialogRef.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !dialogRef.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    frameId = requestAnimationFrame(() => {
      const first = dialogRef.current?.querySelector(
        "input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])",
      );

      (first || dialogRef.current)?.focus();
    });

    return () => {
      cancelAnimationFrame(frameId);

      document.removeEventListener("keydown", handleKeyDown);

      document.body.style.overflow = oldOverflow;

      if (previousFocus.current?.isConnected) {
        previousFocus.current.focus?.();
      }
    };
  }, [open, closeOnEscape, closeDisabled]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="
        fixed inset-0 z-[100]
        grid place-items-center
        overflow-y-auto
        bg-[#041f18]/55
        p-3 backdrop-blur-[4px]
        sm:p-6
      "
      onMouseDown={(event) => {
        if (
          closeOnBackdrop &&
          !closeDisabled &&
          event.target === event.currentTarget
        ) {
          onCloseRef.current?.();
        }
      }}
    >
      <style>
        {`
          @keyframes modalIn {
            from {
              opacity: 0;
              transform: translateY(12px) scale(0.985);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .modal-panel {
              animation: none !important;
            }
          }
        `}
      </style>

      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        style={{
          animation: "modalIn 220ms ease-out both",
        }}
        className={`
          modal-panel
          my-auto flex max-h-[min(90vh,60rem)]
          w-full ${WIDTHS[size] || WIDTHS.md}
          flex-col overflow-hidden
          rounded-3xl bg-[#fffefa]
          shadow-[0_30px_100px_rgba(4,31,24,0.35)]
          outline-none
        `}
      >
        {/* Header */}
        <header
          className="
            relative flex shrink-0 items-start justify-between
            gap-4 overflow-hidden
            bg-[#062a20]
            px-5 py-5 text-white
            sm:px-7 sm:py-6
          "
        >
          <span
            aria-hidden="true"
            className="
              pointer-events-none absolute
              -right-10 -top-14 h-36 w-36
              rounded-full border border-white/10
            "
          />

          <span
            aria-hidden="true"
            className="
              absolute inset-x-0 bottom-0 h-[3px]
              bg-gradient-to-r
              from-[#e4c48a] via-[#e4c48a]/40 to-transparent
            "
          />

          <div className="relative min-w-0">
            <h2
              id={titleId}
              className="text-xl font-semibold tracking-tight sm:text-2xl"
              style={DISPLAY}
            >
              {title}
            </h2>

            {description && (
              <p
                id={descriptionId}
                className="mt-1.5 max-w-2xl text-sm leading-6 text-white/65"
              >
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (!closeDisabled) {
                onCloseRef.current?.();
              }
            }}
            disabled={closeDisabled}
            aria-label="Close dialog"
            className="
              relative grid h-10 w-10 shrink-0 place-items-center
              rounded-xl border border-white/15
              text-white/75 transition
              hover:bg-white/10 hover:text-white
              focus-visible:outline-none
              focus-visible:ring-4 focus-visible:ring-[#e4c48a]/40
              disabled:cursor-not-allowed disabled:opacity-40
            "
          >
            <X size={18} />
          </button>
        </header>

        {/* Scrollable body */}
        <div
          className="
            min-h-0 flex-1 overflow-y-auto
            px-5 py-6
            sm:px-7 sm:py-7
          "
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <footer
            className="
              flex shrink-0 flex-col-reverse gap-3
              border-t border-[#e3e9e0]
              bg-[#f6f8f4]
              px-5 py-4
              sm:flex-row sm:justify-end sm:px-7
            "
          >
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
  const closeDialog = () => {
    if (!loading) {
      onClose?.();
    }
  };

  return (
    <Modal
      open={open}
      onClose={closeDialog}
      title={title}
      description={message}
      size="sm"
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
      closeDisabled={loading}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={closeDialog}
            disabled={loading}
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
          >
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
