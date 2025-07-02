import { PaymentDetails, PaymentResponse } from "./interfaces/payment.interfaces";
import { CryptomusService } from "../services/cryptomus.service";

const cryptomus = new CryptomusService(
  process.env.CRYPTOMUS_PAYMENT_KEY!,
  process.env.CRYPTOMUS_PAYOUT_KEY!,
  process.env.CRYPTOMUS_MERCHANT_ID!
);

export const processPayment = async (
  orderNumber: number,
  amount: number,
  currency: string,
  network: string,
  to_currency: string,
  url_callback?: string,
  url_success?: string
): Promise<PaymentResponse> => {
  try {
    const paymentDetail: PaymentDetails = {
      order_id: orderNumber.toString(),
      amount: amount.toString(),
      currency: currency.toString(),
      network: network,
      to_currency: to_currency,
      url_success:url_success ||`${process.env.PAYMENT_FRONTEND_URL}/thankyou?orderNumber=${orderNumber}`,
      url_return: `${process.env.PAYMENT_FRONTEND_URL}`,
      url_callback: url_callback || "https://ggp-production-5e27.up.railway.app/v1/order/cryptomus-callback",
    };

    const response = await cryptomus.createPayment(paymentDetail);
    return response;
  } catch (error) {
    console.error("Payment processing failed:", error);
    throw new Error("Failed to process payment");
  }
};
