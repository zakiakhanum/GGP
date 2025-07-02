import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // Check if the Authorization header is missing
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  // Extract the token from the Authorization header
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token not provided" });
  }

  try {
    const secret = process.env.JWT_SECRET!;
    
    // Verify the token
    const decoded = jwt.verify(token, secret) as JwtPayload;
    console.log("Decoded payload:", decoded);

    // Check if the payload is valid
    if (!decoded || !decoded.userId) {
      return res.status(403).json({ message: "Invalid token payload" });
    }

    // Attach the decoded payload to the request object
    req.user = decoded;

    // Pass control to the next middleware or route handler
    next();
  } catch (error: any) {
    // Handle specific JWT errors for better responses
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Generic error handling
    console.error("Error in authenticateJWT middleware:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Middleware to validate user registration input
 */
export function validateRegistrationInput(req: Request, res: Response, next: NextFunction) {
  try {
    // If using Google auth, only validate the Google token
    if (req.body.googleToken) {
      if (!req.body.googleToken || typeof req.body.googleToken !== "string") {
        return res.status(400).json({
          success: false,
          message: "Valid Google token is required",
        });
      }
      return next();
    }

    // Otherwise validate traditional registration fields
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    // Basic validation - you may want to enhance this with more sophisticated validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // Validate required fields
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "First name and last name are required",
      });
    }

    // Validate phone number if provided
    if (phoneNumber) {
      // Simple phone validation - customize based on your requirements
      const phoneRegex = /^\+?[0-9]{10,15}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number format",
        });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error validating registration input",
    });
  }
}
// middleware/auth.ts
export const authenticateCryptomus = (req:Request, res:Response, next:NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  const HARDCODED_TOKEN = "halwapuri"; // Replace with your actual token

  if (!token || token !== HARDCODED_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

export const transformUser = (req: Request, res: Response, next: NextFunction) => {
  
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: "User not authenticated" 
      });
    }

    // Verify required properties exist
    if (!req.user.userId) {
      return res.status(400).json({
        success: false,
        message: "Malformed user data: missing userId"
      });
    }

    // Transform the JWT payload into User entity format
    req.user = {
      id: req.user.userId,  // Map userId to id
      email: req.user.email || null,
      role: req.user.role || null,
      permissions: req.user.permissions || []
      // Add other properties as needed
    };

    next();
  } catch (error:any) {
    console.error('Error in transformUser middleware:', error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during user transformation",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};