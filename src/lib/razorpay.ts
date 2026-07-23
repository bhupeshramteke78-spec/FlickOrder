import crypto from "node:crypto";

type RazorpayOrderPayload = {
  amount: number;
  receipt: string;
  notes?: Record<string, string>;
};

type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: "INR";
  receipt: string | null;
  status: string;
};

export function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    return null;
  }

  return { keyId, keySecret };
}

export async function createRazorpayOrder({ amount, receipt, notes }: RazorpayOrderPayload) {
  const config = getRazorpayConfig();

  if (!config) {
    throw new Error("Razorpay keys are not configured.");
  }

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: toRupeeSubunits(amount),
      currency: "INR",
      receipt,
      notes,
    }),
  });

  const body = (await response.json().catch(() => null)) as RazorpayOrderResponse | { error?: { description?: string } } | null;

  if (!response.ok || !body || !("id" in body)) {
    const errorDescription = isRazorpayError(body) ? body.error?.description : null;
    throw new Error(errorDescription ?? "Unable to create Razorpay order.");
  }

  return body;
}

export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const config = getRazorpayConfig();

  if (!config) {
    return false;
  }

  const generatedSignature = crypto
    .createHmac("sha256", config.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const generatedBuffer = Buffer.from(generatedSignature);
  const receivedBuffer = Buffer.from(signature);

  if (generatedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(generatedBuffer, receivedBuffer);
}

export function verifyRazorpayWebhookSignature({ body, signature }: { body: string; signature: string }) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();

  if (!webhookSecret) {
    return false;
  }

  const generatedSignature = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");
  const generatedBuffer = Buffer.from(generatedSignature);
  const receivedBuffer = Buffer.from(signature);

  if (generatedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(generatedBuffer, receivedBuffer);
}

function toRupeeSubunits(amount: number) {
  return Math.round(amount * 100);
}

function isRazorpayError(body: unknown): body is { error?: { description?: string } } {
  return Boolean(body && typeof body === "object" && "error" in body);
}
