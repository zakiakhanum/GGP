export interface PaymentResponse {
  url?: string;
  uuid: string;
  expired_at: string;
  payment_status: string;
  txid?: string;
  address_qr_code?: string;
  payer_amount?: string;
  address?: string;
  merchant_amount?: string;
  payer_currency?: string;
}

export interface PaymentDetails {
  amount: string;
  currency: string;
  order_id: string;
  network: string;
  to_currency: string;
  url_return: string;
  url_callback: string;
  url_success: string;
}

export interface PaymentStatusResponse {
  uuid: string;
  status: string;
  [key: string]: any;
}
