import "server-only";

export type ManualSubscriptionPayment = {
  upiUrl: string;
  payeeName: string;
  amount: number;
  transactionNote: string;
};

export function isManualSubscriptionPaymentEnabled() {
  return (process.env.SUBSCRIPTION_PAYMENT_PROVIDER?.trim().toLowerCase() || "manual_upi") === "manual_upi";
}

export function createManualSubscriptionPayment({
  amount,
  transactionNote,
}: {
  amount: number;
  transactionNote: string;
}): ManualSubscriptionPayment | null {
  if (!isManualSubscriptionPaymentEnabled()) {
    return null;
  }

  const upiId = process.env.KHAOSCAN_UPI_ID?.trim() || process.env.FLICKORDER_UPI_ID?.trim();
  const payeeName = process.env.KHAOSCAN_UPI_DISPLAY_NAME?.trim() || process.env.FLICKORDER_UPI_DISPLAY_NAME?.trim() || "KhaoScan";

  if (!upiId) {
    return null;
  }

  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: amount.toFixed(2),
    cu: "INR",
    tn: transactionNote,
  });

  return {
    upiUrl: `upi://pay?${params.toString()}`,
    payeeName,
    amount,
    transactionNote,
  };
}
