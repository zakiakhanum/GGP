import { Request, Response, NextFunction } from "express";
import subscriptionService from "../services/subscription.service";
import { BadRequestError, NotFoundError } from "../utils/errors";
import { asyncWrapper } from "../utils/wrapperFunctionTryCatch";
import { subscriptionPlanSchema, purchaseSubscriptionSchema, updatePlanSchema } from "../validators/subscription.validation";
import { UserSubscriptionRepository } from "../repositories";
import { sendSubscriptionActivationEmails, sendSubscriptionCancellationEmails } from "../utils/emails";

const getPlans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = await subscriptionService.getPlans();
    res.status(200).json({
      message: "Subscription plans retrieved successfully",
      plans,
    });
  } catch (error) {
    next(error);
  }
};

const purchaseSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Request headers:", req.headers);
    console.log("Content-Type:", req.headers['content-type']);
    console.log("Raw request body:", req.body);
    console.log("Request body type:", typeof req.body);
    
    const userId = req.user.userId;
    console.log("User ID:", userId);
    
    try {
      const validatedData = purchaseSubscriptionSchema.parse(req.body);
      console.log("Validation successful. Validated data:", validatedData);
    } catch (validationError) {
      console.error("Validation error details:", validationError);
      throw validationError;
    }
    
    const validatedData = purchaseSubscriptionSchema.parse(req.body);
    const { planId, paymentMethod } = validatedData;

    let result;
    if (paymentMethod === "crypto") {
      const { network, to_currency } = validatedData;
      result = await subscriptionService.purchaseSubscription(
        userId, 
        planId, 
        paymentMethod,
        network,
        to_currency
      );
    } else {
      const { transactionId } = validatedData;
      result = await subscriptionService.purchaseSubscription(
        userId, 
        planId, 
        paymentMethod,
        undefined,
        undefined,
        transactionId
      );
    }
    
    res.status(200).json({
      message: "Subscription purchase initiated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error in purchaseSubscription:", error);
    next(error);
  }
};

const getCurrentSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.userId;
    const subscription = await subscriptionService.getCurrentSubscription(userId);
    
    if (!subscription) {
      throw new NotFoundError("No active subscription found");
    }

    res.status(200).json({
      message: "Current subscription retrieved successfully",
      subscription,
    });
  } catch (error) {
    next(error);
  }
};

const cancelSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.userId;
    const result = await subscriptionService.cancelSubscription(userId);
    
    res.status(200).json({
      message: "Subscription cancelled successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Admin controllers
const createPlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = subscriptionPlanSchema.parse(req.body);
    const plan = await subscriptionService.createPlan(validatedData);
    
    res.status(201).json({
      message: "Subscription plan created successfully",
      plan,
    });
  } catch (error) {
    next(error);
  }
};

const updatePlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { planId } = req.params;
    const validatedData = updatePlanSchema.parse(req.body);
    
    const plan = await subscriptionService.updatePlan(planId, validatedData);
    
    res.status(200).json({
      message: "Subscription plan updated successfully",
      plan,
    });
  } catch (error) {
    next(error);
  }
};

const deletePlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { planId } = req.params;
    await subscriptionService.deletePlan(planId);
    
    res.status(200).json({
      message: "Subscription plan deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getAllSubscribedUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscriptions = await subscriptionService.getAllSubscribedUsers();
    res.status(200).json({
      message: "Fetched all active subscribed users successfully",
      data: subscriptions,
    });
  } catch (error) {
    next(error);
  }
};

const checkActiveSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.userId;
    const activeSubscription = await subscriptionService.getActiveSubscription(userId);
    if (activeSubscription) {
      res.status(200).json({
        hasActiveSubscription: true,
        subscription: activeSubscription,
      });
    } else {
      res.status(200).json({
        hasActiveSubscription: false,
        message: "User does not have any active subscription."
      });
    }
  } catch (error) {
    next(error);
  }
};

export const handlePaymentCallback = asyncWrapper(async (req: Request, res: Response) => {
  try {
    const { uuid, payment_status, txid } = req.body;

    // Find subscription by payment ID with user and plan relations
    const subscription = await UserSubscriptionRepository.findOne({
      where: { paymentId: uuid },
      relations: ["user", "plan"]
    });

    if (!subscription) {
      throw new NotFoundError("Subscription not found");
    }

    // Update subscription status based on payment status
    if (payment_status.toLowerCase() === "paid") {
      subscription.status = "active";
      
      // Save updated subscription
      await UserSubscriptionRepository.save(subscription);
      
      // Send activation emails
      const userName = subscription.user.firstName || subscription.user.email;
      await sendSubscriptionActivationEmails(
        subscription.user.email,
        userName,
        subscription.plan.name,
        subscription.startDate,
        subscription.endDate
      );
      
      console.log(`✅ Subscription activated for user ${subscription.user.email} with plan ${subscription.plan.name}`);
    } else if (payment_status.toLowerCase() === "canceled" || payment_status.toLowerCase() === "cancelled") {
      subscription.status = "cancelled";
      await UserSubscriptionRepository.save(subscription);
      
      // Send cancellation emails
      const userName = subscription.user.firstName || subscription.user.email;
      await sendSubscriptionCancellationEmails(
        subscription.user.email,
        userName,
        subscription.plan.name,
        subscription.endDate
      );
      
      console.log(`❌ Subscription cancelled for user ${subscription.user.email}`);
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error in subscription payment callback:", error);
    res.status(422).json({ error: error.message });
  }
});

const activatePayoneerSubscription = asyncWrapper(async (req: Request, res: Response) => {
  const { subscriptionId } = req.params;
  const subscription = await subscriptionService.activatePayoneerSubscription(subscriptionId);

  res.status(200).json({
    message: "Subscription for Payoneer payment activated successfully",
    data: subscription,
  });
});

const getPendingPayoneerSubscriptions = asyncWrapper(async (req: Request, res: Response) => {
  const subscriptions = await subscriptionService.getPendingPayoneerSubscriptions();
  res.status(200).json({
    message: "Fetched all pending Payoneer subscriptions successfully",
    count: subscriptions.length,
    data: subscriptions,
  });
});

export default {
  getPlans,
  purchaseSubscription,
  getCurrentSubscription,
  cancelSubscription,
  createPlan,
  updatePlan,
  deletePlan,
  handlePaymentCallback,
  getAllSubscribedUsers,
  checkActiveSubscription,
  activatePayoneerSubscription,
  getPendingPayoneerSubscriptions,
}; 