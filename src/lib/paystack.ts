import "server-only";

const PAYSTACK_API_URL = "https://api.paystack.co";

type PaystackResponse<T> = {
  status: boolean;
  message: string;
  data: T;
};

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;

  if (!key) {
    throw new Error("Missing PAYSTACK_SECRET_KEY. Add it to .env.local.");
  }

  return key;
}

async function paystackRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${PAYSTACK_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  const body = (await response.json()) as PaystackResponse<T>;

  if (!response.ok || !body.status) {
    throw new Error(`Paystack request failed: ${body.message}`);
  }

  return body.data;
}

type InitializeParams = {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, string>;
};

type InitializedTransaction = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export function initializeTransaction(params: InitializeParams) {
  return paystackRequest<InitializedTransaction>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      currency: "NGN",
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });
}

export type VerifiedTransaction = {
  status: string;
  amount: number;
  currency: string;
  reference: string;
};

export function verifyTransaction(reference: string) {
  return paystackRequest<VerifiedTransaction>(
    `/transaction/verify/${encodeURIComponent(reference)}`
  );
}