import { z } from "zod";

// Schema for creating/updating a subscription plan
export const subscriptionPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  duration: z.enum(["monthly", "yearly"], {
    errorMap: () => ({ message: "Duration must be either 'monthly' or 'yearly'" }),
  }),
  price: z.number().positive("Price must be a positive number"),
  description: z.string().optional(),
});

// Schema for purchasing a subscription
export const purchaseSubscriptionSchema = z.object({
  planId: z.string().uuid("Invalid plan ID"),
  paymentMethod: z.enum(["crypto", "payoneer"], {
    errorMap: () => ({ message: "Payment method must be either 'crypto' or 'payoneer'" }),
  }),
  network: z.string().optional(),
  to_currency: z.string().optional(),
  transactionId: z.string().optional(),
}).superRefine((data, ctx) => {
  console.log("Validating payment data:", data);
  
  if (data.paymentMethod === "crypto") {
    console.log("Validating crypto payment");
    if (!data.network) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Network is required for crypto payments",
        path: ["network"],
      });
    }
    if (!data.to_currency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "To currency is required for crypto payments",
        path: ["to_currency"],
      });
    }
  } else if (data.paymentMethod === "payoneer") {
    console.log("Validating Payoneer payment");
    if (!data.transactionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Transaction ID is required for Payoneer payments",
        path: ["transactionId"],
      });
    }
  }
});

// Schema for updating a subscription plan
export const updatePlanSchema = subscriptionPlanSchema.partial();

// Types
export type SubscriptionPlanInput = z.infer<typeof subscriptionPlanSchema>;
export type PurchaseSubscriptionInput = z.infer<typeof purchaseSubscriptionSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>; 