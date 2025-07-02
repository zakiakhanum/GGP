import axios from "axios";
import * as crypto from "crypto";
import { PaymentDetails, PaymentStatusResponse } from "../utils/interfaces/payment.interfaces";
import * as dotenv from "dotenv";
dotenv.config(); // Ensure environment is loaded

export class CryptomusService {
  private baseUrl = process.env.CRYPTOMUS_BASE_URL;
  paymentKey: string;
  payoutKey: string;
  merchantId: string;

  constructor(paymentKey: string, payoutKey: string, merchantId: string) {
    this.paymentKey = paymentKey;
    this.payoutKey = payoutKey;
    this.merchantId = merchantId;
  }

  private async request(endpoint: string, data: any, type: "payment" | "payout") {
    const key = type === "payment" ? this.paymentKey : this.payoutKey;
    return axios
      .post(`${this.baseUrl}/${endpoint}`, data, {
        headers: {
          merchant: this.merchantId,
          sign: this.generateSign(data, key),
        },
      })
      .then((res) => res.data);
  }

  private generateSign(data: object, apiKey: string): string {
    const jsonString = JSON.stringify(data);
    const base64Data = Buffer.from(jsonString).toString("base64");
    return crypto
      .createHash("md5")
      .update(base64Data + apiKey)
      .digest("hex");
  }

  async createPayment(paymentDetail: PaymentDetails) {
    try {
      const requestData = {
        ...paymentDetail,
        is_payment_multiple: false,
        lifetime: "43200",
      };
      console.log("requestDatta:", requestData);

      const sign = this.generateSign(requestData, this.paymentKey);

      const response = await axios.post(`${this.baseUrl}/payment`, requestData, {
        headers: {
          merchant: this.merchantId,
          sign: sign,
          "Content-Type": "application/json",
          
        },
      });

      // Convert expired_at timestamp to formatted datetime
      if (response.data.result?.expired_at) {
        const date = new Date(response.data.result.expired_at * 1000);
        response.data.result.expired_at = date.toISOString();
      }

      return response.data.result;
    } catch (err: any) {
      console.error("Cryptomus createPayment error:", err.response?.data || err.message);
      throw new Error(`Failed to create payment: ${err.message}`);
    }
  }

  async listServices() {
    try {
      const requestData = {}; // Empty object as required
      const sign = this.generateSign(requestData, this.paymentKey);
      console.log("sign: ", sign);

      const response = await axios.post(`${this.baseUrl}/payment/services`, requestData, {
        headers: {
          merchant: this.merchantId,
          sign: sign,
          "Content-Type": "application/json",
        },
      });
      console.log("response", response.data);

      const services = response.data.result || [];
      return services.filter((item: any) => item.is_available);
    } catch (err: any) {
      console.error("Cryptomus listServices error:", err.response?.data || err.message);
      throw new Error(`Failed to fetch services from Cryptomus: ${err.message}`);
    }
  }

  async createWallet(data: any) {
    return this.request("payment/create-wallet", data, "payment");
  }

  async checkPaymentStatus(uuid: string): Promise<PaymentStatusResponse> {
    const payloadObject = { uuid };

    // Convert payload to base64 string first
    const jsonString = JSON.stringify(payloadObject);
    const base64Data = Buffer.from(jsonString).toString("base64");

    // Create signature using the same method as your generateSign function
    const signature = crypto
      .createHash("md5")
      .update(base64Data + this.paymentKey)
      .digest("hex");

    const headers = {
      merchant: this.merchantId,
      sign: signature,
      "Content-Type": "application/json",
    };

    console.log("📦 Payload:", jsonString);
    console.log("🔑 Signature:", signature);

    try {
      // Send the original JSON payload, not the base64 version
      const response = await axios.post("https://api.cryptomus.com/v1/payment/info", payloadObject, { headers });
      return response.data.result;
    } catch (error: any) {
      console.error("❌ Cryptomus Error:", error.response?.data || error.message);
      throw new Error("Payment status check failed");
    }
  }

  // TEST IT

  async createPayout(data: any) {
    return this.request("payout", data, "payout");
  }

  async checkPayoutStatus(data: any) {
    return this.request("payout/info", data, "payout");
  }
}
