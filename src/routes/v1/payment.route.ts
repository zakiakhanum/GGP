import { Router } from "express";
import dotenv from "dotenv";
import {
  checkPaymentStatus,
  createPayment,
  createPayout,
  createWallet,
  listServices,
} from "../../controllers/payment.controller";
import { authenticateCryptomus, authenticateJWT } from "../../middlewares/auth.middleware";
dotenv.config();

const paymentRouter = Router();

 paymentRouter.post("/create_payment", authenticateCryptomus, createPayment);

paymentRouter.post("/create_wallet", authenticateJWT, createWallet);

paymentRouter.get("/services", listServices);

paymentRouter.get("/check_payment_status", authenticateCryptomus, checkPaymentStatus);

paymentRouter.post("/create_payout", authenticateJWT, createPayout);

paymentRouter.post("/check_payout_status", authenticateJWT, checkPaymentStatus);

export default paymentRouter;
