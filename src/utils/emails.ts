import dotenv from "dotenv";
import { EmailOptions } from "../interfaces/email.interfaces";
import { generateEmailTemplate } from "./emailTemplates/emailTemplete";
import { sendBrevoEmail } from "./brevo";
import { findUsersWithNonEmptyCarts } from "../services/cart.service";
import { generateCartReminderHtml, generateCartReminderText } from "./emailTemplates/cartRemindar";
import { Others } from "../enums/others.enum";

dotenv.config();

/**
 * Send an email using Brevo
 * @param options Email options containing recipient, subject, and message
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const { toEmail, subject, text, toName, attachments, from } = options;

  if (!toEmail || !subject || !text) {
    throw new Error("Missing required fields: email, subject, message.");
  }

  const htmlContent = generateEmailTemplate(subject, text, "Customer");

  try {
    const info = await sendBrevoEmail({
      from,
      toEmail,
      toName,
      subject,
      htmlContent,
      text,
      attachments: attachments,
    });

    console.log(`✅ Email sent to ${toEmail}. Message ID: ${info.messageId || "N/A"}`);
  } catch (error: any) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

export async function sendDailyCartReminders() {
  try {
    const carts = await findUsersWithNonEmptyCarts();

    const usersMap = new Map<
      string,
      {
        user: { id: string; email: string; lastName?: string };
        cartItems: CartReminderEmailOptions["cartItems"];
        totalAmount: number;
      }
    >();

    for (const cart of carts) {
      const { user, products, totalAmount } = cart;
      if (!user || !products?.length) continue;

      let userData = usersMap.get(user.id);
      if (!userData) {
        userData = {
          user,
          cartItems: [],
          totalAmount: 0,
        };
        usersMap.set(user.id, userData);
      }

      for (const product of products) {
        userData.cartItems.push({
          siteName: product.siteName,
          price: Number(product.price), // Convert to number
          adjustedPrice: Number(product.adjustedPrice), // Convert to number
          websiteUrl: product.websiteUrl,
        });
      }

      userData.totalAmount += Number(totalAmount); // Convert to number
    }

    await Promise.all(
      Array.from(usersMap.values()).map(async ({ user, cartItems, totalAmount }) => {
        try {
          const name = user.lastName ?? "there";
          const emailHtml = generateCartReminderHtml(name, cartItems, totalAmount);
          const emailText = generateCartReminderText(name, cartItems, totalAmount);

          await sendEmail({
            toEmail: user.email,
            toName: name,
            subject: "Your Cart Items Are Waiting!",
            text: emailText,
            htmlContent: emailHtml,
          });

          console.log(`Cart reminder sent to ${user.email}`);
        } catch (emailErr) {
          console.error(`Failed to send cart reminder to ${user.email}:`, emailErr);
        }
      })
    );
  } catch (error) {
    console.error("Error sending cart reminders:", error);
    throw error;
  }
}

export const sendAdminEmailForPendingOrder = async (options: EmailOptions, role: Others.role): Promise<void> => {
  const { admins, subject, text, attachments } = options;

  if (!admins || admins.length === 0 || !subject || !text) {
    throw new Error("Missing required fields: admins, subject, or message.");
  }

  const htmlContent = generateEmailTemplate(subject, text, role);

  for (const admin of admins) {
    try {
      const info = await sendBrevoEmail({
        toEmail: admin.email,
        subject,
        htmlContent,
        text,
        attachments,
      });

      console.log(`✅ Email sent to ${admin.email}. Message ID: ${info.messageId || "N/A"}`);
    } catch (error: any) {
      console.error(`❌ Failed to send email to ${admin.email}: ${error.message}`);
    }
  }
};

export const sendSubscriptionActivationEmails = async (
  userEmail: string,
  userName: string,
  planName: string,
  startDate: Date,
  endDate: Date
): Promise<void> => {
  try {
    // Send email to user
    const userSubject = "Your Subscription is Now Active! 🎉";
    const userText = `Dear ${userName},

Congratulations! Your subscription to ${planName} is now active.

Subscription Details:
- Plan: ${planName}
- Start Date: ${startDate.toLocaleDateString()}
- End Date: ${endDate.toLocaleDateString()}

You now have access to all the premium features included in your subscription. If you have any questions or need assistance, please don't hesitate to contact our support team.

Thank you for choosing our service!

Best regards,
The Team`;

    await sendEmail({
      toEmail: userEmail,
      toName: userName,
      subject: userSubject,
      text: userText,
      from: process.env.NO_REPLY_EMAIL,
    });

    // Send email to admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const adminSubject = "New Active Subscription - User Notification";
      const adminText = `A new subscription has been activated.

User Details:
- Email: ${userEmail}
- Name: ${userName}

Subscription Details:
- Plan: ${planName}
- Start Date: ${startDate.toLocaleDateString()}
- End Date: ${endDate.toLocaleDateString()}
- Activation Time: ${new Date().toLocaleString()}

This is an automated notification.`;

      await sendEmail({
        toEmail: adminEmail,
        toName: "Admin",
        subject: adminSubject,
        text: adminText,
        from: process.env.NO_REPLY_EMAIL,
      });

      console.log(`✅ Subscription activation emails sent to user (${userEmail}) and admin (${adminEmail})`);
    } else {
      console.log(`⚠️  ADMIN_EMAIL not configured. Only sent email to user (${userEmail})`);
    }
  } catch (error) {
    console.error("❌ Error sending subscription activation emails:", error);
    // Don't throw error to avoid breaking the payment callback
  }
};

export const sendSubscriptionCancellationEmails = async (
  userEmail: string,
  userName: string,
  planName: string,
  endDate: Date
): Promise<void> => {
  try {
    // Send email to user
    const userSubject = "Your Subscription Has Been Cancelled";
    const userText = `Dear ${userName},

Your subscription to ${planName} has been cancelled.

Subscription Details:
- Plan: ${planName}
- Cancellation Date: ${new Date().toLocaleDateString()}
- Access until: ${endDate.toLocaleDateString()}

You will continue to have access to your subscription features until ${endDate.toLocaleDateString()}. After that, your access will be limited to basic features.

If you have any questions or would like to reactivate your subscription, please contact our support team.

Thank you for being our customer!

Best regards,
The Team`;

    await sendEmail({
      toEmail: userEmail,
      toName: userName,
      subject: userSubject,
      text: userText,
    });

    // Send email to admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const adminSubject = "Subscription Cancelled - User Notification";
      const adminText = `A subscription has been cancelled.

User Details:
- Email: ${userEmail}
- Name: ${userName}

Subscription Details:
- Plan: ${planName}
- Cancellation Date: ${new Date().toLocaleDateString()}
- Access until: ${endDate.toLocaleDateString()}

This is an automated notification.`;

      await sendEmail({
        toEmail: adminEmail,
        toName: "Admin",
        subject: adminSubject,
        text: adminText,
        from: process.env.NO_REPLY_EMAIL,
      });

      console.log(`✅ Subscription cancellation emails sent to user (${userEmail}) and admin (${adminEmail})`);
    } else {
      console.log(`⚠️  ADMIN_EMAIL not configured. Only sent cancellation email to user (${userEmail})`);
    }
  } catch (error) {
    console.error("❌ Error sending subscription cancellation emails:", error);
    // Don't throw error to avoid breaking the payment callback
  }
};
