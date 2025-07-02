import { Router } from "express";
import subscriptionController from "../../controllers/subscription.controller";
import { authenticateJWT, authenticateCryptomus } from "../../middlewares/auth.middleware";
import { Others } from "../../enums/others.enum";
import { authorizeRole } from "../../middlewares/role.middleware";

const subscriptionRouter = Router();

// Get all subscription plans
subscriptionRouter.get("/plans", subscriptionController.getPlans);

// Purchase a subscription
subscriptionRouter.post("/purchase", authenticateJWT, subscriptionController.purchaseSubscription);

// Get user's current subscription
subscriptionRouter.get("/current", authenticateJWT, subscriptionController.getCurrentSubscription);

// Cancel subscription
subscriptionRouter.post("/cancel", authenticateJWT, subscriptionController.cancelSubscription);

// Admin routes
subscriptionRouter.post("/create-plan", authenticateJWT, authorizeRole(Others.role.MODERATOR), subscriptionController.createPlan);
subscriptionRouter.put("/update-plan/:planId", authenticateJWT, authorizeRole(Others.role.ADMIN), subscriptionController.updatePlan);
subscriptionRouter.delete("/delete-plan/:planId", authenticateJWT, authorizeRole(Others.role.ADMIN), subscriptionController.deletePlan);

// Payment callback route
subscriptionRouter.post("/payment-callback", subscriptionController.handlePaymentCallback);

// Admin route to fetch all active subscribed users
subscriptionRouter.get("/all-subscribed-users", authenticateJWT, authorizeRole(Others.role.MODERATOR, Others.role.ADMIN, Others.role.SUPERADMIN), subscriptionController.getAllSubscribedUsers);

// Admin route to manually activate a Payoneer subscription
subscriptionRouter.patch(
  "/activate-payoneer/:subscriptionId",
  authenticateJWT,
  authorizeRole(Others.role.ADMIN, Others.role.SUPERADMIN, Others.role.MODERATOR),
  subscriptionController.activatePayoneerSubscription
);

// Admin route to get all pending Payoneer subscriptions
subscriptionRouter.get(
  "/pending-payoneer",
  authenticateJWT,
  authorizeRole(Others.role.ADMIN, Others.role.SUPERADMIN, Others.role.MODERATOR),
  subscriptionController.getPendingPayoneerSubscriptions
);

// Route to check if the logged-in user has an active subscription
subscriptionRouter.get("/check-active", authenticateJWT, subscriptionController.checkActiveSubscription);

export default subscriptionRouter; 