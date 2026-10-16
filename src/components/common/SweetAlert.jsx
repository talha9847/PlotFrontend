import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import "./SweetAlert.css";

const BASE_OPTIONS = {
  buttonsStyling: false,
  heightAuto: false,
  customClass: {
    popup: "app-swal-popup",
    title: "app-swal-title",
    htmlContainer: "app-swal-message",
    confirmButton: "app-swal-confirm",
    cancelButton: "app-swal-cancel",
    denyButton: "app-swal-deny",
    actions: "app-swal-actions",
  },
  showClass: {
    popup: "app-swal-show",
  },
  hideClass: {
    popup: "app-swal-hide",
  },
};

/** Show a reusable SweetAlert2 dialog with the application's green/gold styling. */
export function showSweetAlert(options = {}) {
  return Swal.fire({
    ...BASE_OPTIONS,
    ...options,
    customClass: {
      ...BASE_OPTIONS.customClass,
      ...(options.customClass || {}),
    },
  });
}

/** Ask the user to confirm an action. The caller should proceed only if isConfirmed is true. */
export function confirmSweetAlert({
  title = "Are you sure?",
  text = "This action cannot be undone.",
  confirmButtonText = "Yes, continue",
  cancelButtonText = "Go back",
  confirmButtonClass = "app-swal-confirm",
  icon = "warning",
  ...options
} = {}) {
  return showSweetAlert({
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    focusCancel: true,
    ...options,
    customClass: {
      confirmButton: confirmButtonClass,
      ...(options.customClass || {}),
    },
  });
}

export function successSweetAlert(options = {}) {
  return showSweetAlert({
    icon: "success",
    confirmButtonText: "Okay",
    ...options,
  });
}

export function errorSweetAlert(options = {}) {
  return showSweetAlert({
    icon: "error",
    confirmButtonText: "Okay",
    ...options,
  });
}

export default showSweetAlert;
