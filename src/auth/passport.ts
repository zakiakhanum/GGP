import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as TwitterStrategy } from "passport-twitter";
import { UserRepository } from "../repositories";
import { generateReferralCode } from "../utils/generateReffralCode";
import { DeepPartial } from "typeorm";
import { User } from "../models/user";
import { Others } from "../enums/others.enum";
import { sendEmail } from "../utils/emails";

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  const user = await UserRepository.findOneBy({ id });
  done(null, user);
});

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      callbackURL:
        process.env.NODE_ENV === "production"
          ? "https://ggp-production.up.railway.app/v1/auth/facebook/callback"
          : "http://localhost:6543/v1/auth/facebook/callback",
      profileFields: ["id", "emails", "name", "displayName"],
      passReqToCallback: true,
    },
    async (req, _accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        const role = req.query.state;

        let user = await UserRepository.findOne({ where: { email } });

        if (user) {
          return done(null, user); // ✅ Log in existing user
        }
        if (!user) {
          user = await UserRepository.save(
            UserRepository.create({
              email,
              role: role,
              referralCode: generateReferralCode(),
              isAffiliateRequested: false,
              isAffiliate: false,
              isApproved: role == Others.role.PUBLISHER ? false : true,
              isVerified: true,
              authProvider: Others.authProvider.FACEBOOK,
            } as DeepPartial<User>)
          );
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL:
        process.env.NODE_ENV === "production"
          ? "https://ggp-production-5e27.up.railway.app/v1/auth/google/callback"
          : "https://ggp-production-5e27.up.railway.app/v1/auth/google/callback",
      passReqToCallback: true,
    },
    async (req, _accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        const role = req.query.state;

        let user = await UserRepository.findOne({ where: { email } });
        console.log("user found: ", user?.email);
        if (user) {
          return done(null, user); // ✅ Log in existing user
        }
        if (!user) {
          user = await UserRepository.save(
            UserRepository.create({
              email,
              name: profile.displayName,
              role: role,
              referralCode: generateReferralCode(),
              isAffiliateRequested: false,
              isAffiliate: false,
              isApproved: role == Others.role.PUBLISHER ? false : true,
              isVerified: true,
              authProvider: Others.authProvider.GOOGLE,
            } as DeepPartial<User>)
          );

          // Send email to admin about new user registration
          if (process.env.ADMIN_EMAIL) {
            await sendEmail({
              from: process.env.NO_REPLY_EMAIL,
              toEmail: process.env.ADMIN_EMAIL,
              subject: "New User Registration via Google",
              text: `A new user has registered via Google authentication:
                
Name: ${profile.displayName}
Email: ${email}
Role: ${role}
Auth Provider: Google
Registration Date: ${new Date().toISOString()}

Please review the user in the admin panel.`,
            });
            console.log("Admin notification email sent successfully");
          }
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_CONSUMER_KEY!,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET!,
      callbackURL:
        process.env.NODE_ENV === "production"
          ? "https://ggp-production.up.railway.app/v1/auth/twitter/callback"
          : "http://localhost:8080/v1/auth/twitter/callback",
      includeEmail: true,
      passReqToCallback: true,
    },
    async (req, _token, _tokenSecret, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const role = req.session.oauthRole;
        if (!email) {
          return done(new Error("Email not provided by Twitter"));
        }

        let user = await UserRepository.findOne({ where: { email } });
        if (user) {
          return done(null, user); // ✅ Log in existing user
        }

        // Create new user
        user = await UserRepository.save(
          UserRepository.create({
            email,
            // name: profile.displayName,
            role: role,
            referralCode: generateReferralCode(),
            isAffiliateRequested: false,
            isAffiliate: false,
            isApproved: role == Others.role.PUBLISHER ? false : true,
            isVerified: true,
            authProvider: Others.authProvider.TWITTER,
          } as DeepPartial<User>)
        );

        return done(null, user);
      } catch (err) {
        console.error("Twitter auth error:", err);
        return done(err);
      }
    }
  )
);

