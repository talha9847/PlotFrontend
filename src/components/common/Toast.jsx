import { createContext, useCallback, useContext } from "react";
import { ToastContainer, toast as toastify } from "react-toastify";
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

const ToastContext = createContext(null);

export function ToastProvider({ children, position = "top-right" }) {
  const toast = useCallback((message, type = "success", options = {}) => {
    const methods = {
      success: toastify.success,
      error: toastify.error,
      info: toastify.info,
      warning: toastify.warning,
    };
    (methods[type] || toastify)(message, options);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer
        position={position}
        autoClose={3500}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
        icon={({ type }) => {
          const Icon = type === "success" ? CheckCircle2 : type === "error" ? AlertCircle : type === "warning" ? AlertTriangle : Info;
          return <Icon size={19} strokeWidth={2.2} />;
        }}
        toastClassName={() => "relative mb-3 flex min-h-14 items-center overflow-hidden rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-[0_12px_35px_rgba(16,68,47,0.12)]"}
        progressClassName="!bg-emerald-600"
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error("useToast must be used inside ToastProvider");
  return toast;
}
