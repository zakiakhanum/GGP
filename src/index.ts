import Redis from "ioredis";
import session from "express-session";
import { RedisStore } from "connect-redis";
import passport from "passport";
import "./auth/passport";
import express from "express";
import dotenv from "dotenv";
import v1Router from "./routes/v1";
import errHandlingMiddleware from "./middlewares/error.middleware";
import sitemapRoutes from "./routes/sitemap.routes";
// import { rateLimit } from "express-rate-limit";
import cors from "cors";
import { startCartReminderCronJob } from "./cronjobs/cart-reminindar.cron";
dotenv.config();

const WEBAPP_URL = process.env.WEBAPP_URL;
const TEMP_WEBAPP_URL = process.env.TEMP_WEBAPP_URL;
const PROD_WEBAPP_URL = process.env.PROD_WEBAPP_URL;
const TESTING_URL = process.env.TESTING_URL;
// Start the cron job when your app starts
if (process.env.NODE_ENV === "production") {
  startCartReminderCronJob();
}

const PORT = process.env.PORT || 6543;
const app = express();
app.use(express.json());
const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  throw new Error("❌ REDIS_URL is not defined in environment variables");
}

// Create Redis client with error handling
const redisClient = new Redis(REDIS_URL);

// Add proper error handling
redisClient.on("error", (err) => {
  console.error("Redis connection error:", err);
  console.error("REDIS_URL:", REDIS_URL.replace(/redis:\/\/.*?@/, "redis://****@")); // Log URL with password hidden
});

redisClient.on("connect", () => {
  console.log("✅ Successfully connected to Redis");
});

// Initialize Redis store
const redisStore = new RedisStore({
  client: redisClient,
  disableTouch: true,
});

// Set up session middleware
app.use(
  session({
    store: redisStore,
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://germanguestpost.com",
      "http://94.130.162.216",
      "http://213.165.250.212:3001",
      "http://localhost:5173"
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204,
  })
);
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.send("Hello from WhaleServer");
});

app.use("/v1", v1Router);

app.use(errHandlingMiddleware);
app.use("/sitemaps", sitemapRoutes);
console.log("sitemap created, Check your folder");
console.log("changed port");

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
