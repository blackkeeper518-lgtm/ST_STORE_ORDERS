import dotenv from "dotenv";

// Vercel injects process.env; these files are only local fallbacks.
dotenv.config({ path: ".env.development.local" });
dotenv.config({ path: ".env.local" });
dotenv.config();

import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// MANUS3 runtime: the dashboard currently needs only the typed tRPC API.
// OAuth, Meta webhook, and storage proxy are intentionally not mounted here.
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

export default app;
