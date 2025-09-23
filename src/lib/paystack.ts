// @ts-ignore
import Paystack from 'paystack';

const paystack = Paystack(process.env.PAYSTACK_SECRET_KEY!);

export interface PaymentData {
  email: string;
  amount: number;
  currency?: string;
  reference?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export async function initializePayment(
  paymentData: PaymentData
): Promise<PaymentResponse> {
  try {
    const response = await paystack.transaction.initialize({
      email: paymentData.email,
      amount: paymentData.amount * 100, // Convert to kobo
      currency: paymentData.currency || 'NGN',
      reference: paymentData.reference,
      metadata: paymentData.metadata,
    });

    return response;
  } catch (error) {
    console.error('Paystack initialization error:', error);
    throw new Error('Failed to initialize payment');
  }
}

export async function verifyPayment(reference: string) {
  try {
    const response = await paystack.transaction.verify(reference);
    return response;
  } catch (error) {
    console.error('Paystack verification error:', error);
    throw new Error('Failed to verify payment');
  }
}

export function generatePaymentReference(): string {
  return `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}
