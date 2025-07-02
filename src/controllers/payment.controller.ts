import { CryptomusService } from "../services/cryptomus.service";
import { asyncWrapper } from "../utils/wrapperFunctionTryCatch";
import { CheckPaymentStatusValidation, checkPaymentStatusValidation } from "../validators/order.validation";
import { Request, Response } from "express";

const cryptomus = new CryptomusService(
  process.env.CRYPTOMUS_PAYMENT_KEY!,
  process.env.CRYPTOMUS_PAYOUT_KEY!,
  process.env.CRYPTOMUS_MERCHANT_ID!
);

export const createPayment = asyncWrapper(async (req, res) => {
  try {
    const result = await cryptomus.createPayment(req.body);
    res.json(result);
  } catch (e: any) {
    res.status(422).json({ error: e.message });
  }
});

export const createWallet = asyncWrapper(async (req, res) => {
  try {
    const result = await cryptomus.createWallet(req.body);
    res.json(result);
  } catch (e: any) {
    res.status(422).json({ error: e.message });
  }
});

export const checkPaymentStatus = asyncWrapper(async (req: Request, res: Response) => {
  try {
    const { orderId, uuid } = CheckPaymentStatusValidation.parse(req.query);

    const result = await cryptomus.checkPaymentStatus(uuid);
    // console.log("result: ", result);

    res.json({
      is_paid: result.status === "paid" || result.status === "paid_over",
      status: result.status,
    });
  } catch (e: any) {
    res.status(422).json({ error: e.message });
  }
});

export const createPayout = asyncWrapper(async (req, res) => {
  try {
    const result = await cryptomus.createPayout(req.body);
    res.json(result);
  } catch (e: any) {
    res.status(422).json({ error: e.message });
  }
});

export const checkPayoutStatus = asyncWrapper(async (req, res) => {
  try {
    const result = await cryptomus.checkPayoutStatus(req.body);
    res.json({ is_paid: result.status === "paid" });
  } catch (e: any) {
    res.status(422).json({ error: e.message });
  }
});

export const listServices = asyncWrapper(async (_req, res) => {
  try {
    const result = await cryptomus.listServices();
    res.json(result.filter((s: any) => s.is_available));
  } catch (e: any) {
    res.status(422).json({ error: e.message });
  }
});
