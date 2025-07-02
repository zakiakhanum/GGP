import { Router } from "express";
import AuthController, { contactAdmin, updateWallet } from "../../controllers/auth.controller";
import { authenticateJWT, validateRegistrationInput } from "../../middlewares/auth.middleware";
import passport from "passport";
import { User } from "../../models/user";
import { generateJWT } from "../../utils/generateJWT";
import { AuthInputSchemaWithoutPassword } from "../../validators/auth.validation";
import { validate } from "../../middlewares/validate";

const authRouter = Router();

authRouter.get("/", (req, res) => {
  res.send("Hit auth route");
});

authRouter.post("/register-publisher", AuthController.register);
authRouter.post("/register-user", validateRegistrationInput, AuthController.registerUser);
authRouter.post("/verify-otp", AuthController.verifyOtp);
authRouter.post("/login", AuthController.login);
authRouter.get("/get-profile", authenticateJWT, AuthController.getProfile);
authRouter.put("/update-profile", authenticateJWT, AuthController.updateProfile);
authRouter.post("/resend-otp", AuthController.resendOtp);
authRouter.post("/forget-password", AuthController.forgetPassword);
authRouter.post("/reset-password", AuthController.resetPasswords);
authRouter.post("/contact-user", AuthController.contactUsers);
authRouter.put("/update-wallet", authenticateJWT, updateWallet);
authRouter.put("/update-password", authenticateJWT, AuthController.updatePassword);
authRouter.get("/get-token-status", authenticateJWT, (req, res) => {
  return res.status(200).json({
    message: "Token is valid",
  });
});

authRouter.post("/contact-admin", contactAdmin);

authRouter.post(
  "/publisher/complete-signup",
  validate(AuthInputSchemaWithoutPassword),
  AuthController.completedSignupPublisher
);
// Google OAuth
authRouter.get(
  "/google",
  (req, res, next) => {
    req.role = req.query.role as string;
    console.log("Starting Google OAuth flow", req.role);
    next();
  },
  (req, res, next) => {
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account",
      state: req.query.role as string,
    })(req, res, next);
  }
);
//callback
authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "https://germanguestpost.com/en/sign-in" }),
  async (req, res) => {
    const user = req.user as User;
      const payload = {
      userId: user.id,
      email:user.email, // assuming your User has an id
      role: user.role,
      permissions: user.permissions  // add actual permissions if you have them
    };

    const token = generateJWT(payload, process.env.JWT_SECRET!, "24h");
    const userId = user.id;

    const queryParams = new URLSearchParams({
      userId,
      role: user.role,
      token,
      signupcomplete: String(user.completedSignup),
      isApproved: String(user.isApproved),
    });
    const frontendUrl = "https://germanguestpost.com/en/sign-in";

    res.redirect(`${frontendUrl}?${queryParams.toString()}`);
  }
);

authRouter.get("/facebook", (req, res, next) => {
  console.log("Starting Facebook OAuth flow");
  const role = req.query.role as string;

  passport.authenticate("facebook", {
    scope: ["email"],
    state: role,
  })(req, res, next);
});

authRouter.get(
  "/facebook/callback",
  passport.authenticate("facebook", { session: false, failureRedirect: "http://localhost:3000/en/sign-up" }),
  async (req, res) => {
    const user = req.user as User;
     const payload = {
      userId: user.id,
      email:user.email, // assuming your User has an id
      role: user.role,
      permissions: user.permissions  // add actual permissions if you have them
    };

    const token = generateJWT(payload, process.env.JWT_SECRET!, "24h");
    const userId = user.id;

    const queryParams = new URLSearchParams({
      userId,
      role: user.role,
      token,
      signupcomplete: String(user.completedSignup),
      isApproved: String(user.isApproved),
    });

    const frontendUrl = "https://germanguestpost.com/en/sign-in";

    res.redirect(`${frontendUrl}?${queryParams.toString()}`);
  }
);

authRouter.get(
  "/twitter",
  (req, res, next) => {
    const role = (req.query.role as string) || "user";
    req.session.oauthRole = role; // Save role in session
    console.log("Storing role in session:", role);
    next();
  },
  passport.authenticate("twitter")
);

authRouter.get(
  "/twitter/callback",
  passport.authenticate("twitter", { session: false, failureRedirect: "http://localhost:3000/en/sign-up" }),
  async (req, res) => {
    const user = req.user as User;
     const payload = {
      userId: user.id,
      email:user.email, // assuming your User has an id
      role: user.role,
      permissions: user.permissions  // add actual permissions if you have them
    };

    const token = generateJWT(payload, process.env.JWT_SECRET!, "24h");
    const userId = user.id;

    const queryParams = new URLSearchParams({
      userId,
      role: user.role,
      token,
      signupcomplete: String(user.completedSignup),
      isApproved: String(user.isApproved),
    });
    const frontendUrl = "http://localhost:3000/en/sign-in";

    res.redirect(`${frontendUrl}?${queryParams.toString()}`);
  }
);

export default authRouter;
