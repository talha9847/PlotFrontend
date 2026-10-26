import { useEffect } from "react";

import Input from "./Input";
import Select from "./Select";

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "card", label: "Card" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

function accountLabel(account) {
  if (!account) return "";

  return account.bank_name
    ? `${account.account_name} — ${account.bank_name}`
    : `${account.account_name} — Cash`;
}

/**
 * Shared payment-method and account picker.
 *
 * Cash always posts to the single Cash in Hand account, so no account choice
 * is shown. Non-cash methods require an explicit active bank account.
 */
export default function PaymentAccountFields({
  paymentMethod,
  accountId,
  onMethodChange,
  onAccountChange,
  paymentMethodError,
  accountError,
  accounts = [],
  loadingAccounts = false,
  disabled = false,
  methodLabel = "Payment method",
  accountLabelText = "Receiving account",
  cashHint = "Cash always posts to the Cash in Hand account.",
  bankPlaceholder = "Select bank account",
}) {
  const bankAccounts = accounts.filter(
    (account) => account.account_type === "bank" && account.is_active !== false,
  );
  const isCash = paymentMethod === "cash";

  useEffect(() => {
    // Never keep a stale bank selection attached to a cash payment.
    if (isCash && accountId) {
      onAccountChange("");
    }
  }, [isCash, accountId, onAccountChange]);

  return (
    <>
      <Select
        id="payment-method"
        name="payment_method"
        label={methodLabel}
        placeholder="Select payment method"
        required
        value={paymentMethod}
        error={paymentMethodError}
        disabled={disabled}
        onChange={(event) => onMethodChange(event.target.value)}
        options={PAYMENT_METHOD_OPTIONS}
      />

      {isCash ? (
        <Input
          id="payment-account-cash"
          name="account_id"
          label={accountLabelText}
          value="Cash in Hand (automatic)"
          readOnly
          disabled
          hint={cashHint}
        />
      ) : (
        <Select
          id="payment-account"
          name="account_id"
          label={accountLabelText}
          placeholder={
            loadingAccounts
              ? "Loading accounts..."
              : bankAccounts.length
                ? bankPlaceholder
                : "No bank accounts available"
          }
          required
          disabled={disabled || loadingAccounts || bankAccounts.length === 0}
          value={accountId}
          error={accountError}
          onChange={(event) => onAccountChange(event.target.value)}
          options={bankAccounts.map((account) => ({
            value: String(account.id),
            label: accountLabel(account),
          }))}
        />
      )}
    </>
  );
}
