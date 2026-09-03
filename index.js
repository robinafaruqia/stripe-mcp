#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import Stripe from "stripe";

function loadDotEnv() {
  const envPath = join(dirname(fileURLToPath(import.meta.url)), ".env");
  if (!existsSync(envPath)) return;
  for (const raw of readFileSync(envPath, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnv();

const apiKey = process.env.STRIPE_SECRET_KEY;
if (!apiKey) {
  console.error(
    "Missing STRIPE_SECRET_KEY. Set it to a Stripe *test* restricted key (starts with sk_test_ or rk_test_)."
  );
  process.exit(1);
}
if (apiKey.startsWith("sk_live_") || apiKey.startsWith("rk_live_")) {
  console.error(
    "Refusing to start with a live Stripe key. This server is read-only by design, but please use a test key while developing/demoing."
  );
  process.exit(1);
}

const stripe = new Stripe(apiKey, { apiVersion: "2024-06-20" });

const server = new Server(
  { name: "stripe-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

// ---- Tool definitions -----------------------------------------------------

const tools = [
  {
    name: "list_customers",
    description: "List recent Stripe customers, most recent first.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max results (1-100)", default: 10 },
        email: { type: "string", description: "Filter by exact customer email" },
      },
    },
  },
  {
    name: "get_customer",
    description: "Get full details for a single customer by ID.",
    inputSchema: {
      type: "object",
      properties: {
        customer_id: { type: "string", description: "Stripe customer ID, e.g. cus_ABC123" },
      },
      required: ["customer_id"],
    },
  },
  {
    name: "list_payments",
    description: "List recent payment intents, most recent first.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", default: 10 },
        customer_id: { type: "string", description: "Filter by customer ID" },
      },
    },
  },
  {
    name: "get_payment",
    description: "Get full details for a single payment intent by ID.",
    inputSchema: {
      type: "object",
      properties: {
        payment_intent_id: { type: "string", description: "e.g. pi_ABC123" },
      },
      required: ["payment_intent_id"],
    },
  },
  {
    name: "list_subscriptions",
    description: "List subscriptions, optionally filtered by customer or status.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", default: 10 },
        customer_id: { type: "string" },
        status: {
          type: "string",
          description: "e.g. active, past_due, canceled, trialing, all",
          default: "all",
        },
      },
    },
  },
  {
    name: "get_subscription",
    description: "Get full details for a single subscription by ID.",
    inputSchema: {
      type: "object",
      properties: {
        subscription_id: { type: "string", description: "e.g. sub_ABC123" },
      },
      required: ["subscription_id"],
    },
  },
  {
    name: "list_invoices",
    description: "List invoices, optionally filtered by customer or status.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", default: 10 },
        customer_id: { type: "string" },
        status: {
          type: "string",
          description: "draft, open, paid, uncollectible, or void",
        },
      },
    },
  },
  {
    name: "list_refunds",
    description: "List recent refunds, most recent first.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", default: 10 },
        payment_intent_id: { type: "string", description: "Filter refunds for a specific payment" },
      },
    },
  },
];

// ---- Helpers ----------------------------------------------------------------

function clampLimit(limit) {
  const n = Number(limit) || 10;
  return Math.min(Math.max(n, 1), 100);
}

function toText(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function toError(err) {
  return {
    content: [{ type: "text", text: `Stripe error: ${err.message}` }],
    isError: true,
  };
}

// ---- Handlers -----------------------------------------------------------

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case "list_customers": {
        const params = { limit: clampLimit(args.limit) };
        if (args.email) params.email = args.email;
        const result = await stripe.customers.list(params);
        return toText(result.data);
      }

      case "get_customer": {
        const result = await stripe.customers.retrieve(args.customer_id);
        return toText(result);
      }

      case "list_payments": {
        const params = { limit: clampLimit(args.limit) };
        if (args.customer_id) params.customer = args.customer_id;
        const result = await stripe.paymentIntents.list(params);
        return toText(result.data);
      }

      case "get_payment": {
        const result = await stripe.paymentIntents.retrieve(args.payment_intent_id);
        return toText(result);
      }

      case "list_subscriptions": {
        const params = { limit: clampLimit(args.limit), status: args.status || "all" };
        if (args.customer_id) params.customer = args.customer_id;
        const result = await stripe.subscriptions.list(params);
        return toText(result.data);
      }

      case "get_subscription": {
        const result = await stripe.subscriptions.retrieve(args.subscription_id);
        return toText(result);
      }

      case "list_invoices": {
        const params = { limit: clampLimit(args.limit) };
        if (args.customer_id) params.customer = args.customer_id;
        if (args.status) params.status = args.status;
        const result = await stripe.invoices.list(params);
        return toText(result.data);
      }

      case "list_refunds": {
        const params = { limit: clampLimit(args.limit) };
        if (args.payment_intent_id) params.payment_intent = args.payment_intent_id;
        const result = await stripe.refunds.list(params);
        return toText(result.data);
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (err) {
    return toError(err);
  }
});

// ---- Start ----------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("stripe-mcp server running on stdio (read-only mode)");
