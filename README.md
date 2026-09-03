# stripe-mcp

A read-only [Model Context Protocol](https://modelcontextprotocol.io) server for querying Stripe — customers, payments, subscriptions, invoices, and refunds — from Claude or any MCP-compatible client.

Built as a companion to my [SaaS backend boilerplate](https://github.com/robinafaruqia/nodejsboilerplate).

## Why read-only

This server intentionally exposes **no write, refund, or delete tools**. It's designed for safely querying and exploring Stripe data from an AI assistant — not for taking billing actions. It also refuses to start if you pass a live secret key, to make accidental production use harder.

## Install

```bash
npm install -g @devtechtricks/stripe-mcp
```

Or run directly without installing:

```bash
npx -y @devtechtricks/stripe-mcp
```

## Setup

1. Grab a **test-mode** secret key (or better, a restricted key with only read scopes) from your [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys). It should start with `sk_test_` or `rk_test_`.
2. Add the server to your MCP client config:

```json
{
  "mcpServers": {
    "stripe-mcp": {
      "command": "npx",
      "args": ["-y", "@devtechtricks/stripe-mcp"],
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_..."
      }
    }
  }
}
```

For Claude Code:

```bash
claude mcp add stripe-mcp --env STRIPE_SECRET_KEY=sk_test_... -- npx -y @devtechtricks/stripe-mcp
```

## Available tools

| Tool | Description |
|---|---|
| `list_customers` | List recent customers. Optional `limit`, `email`. |
| `get_customer` | Get a customer by `customer_id`. |
| `list_payments` | List recent payment intents. Optional `limit`, `customer_id`. |
| `get_payment` | Get a payment intent by `payment_intent_id`. |
| `list_subscriptions` | List subscriptions. Optional `limit`, `customer_id`, `status`. |
| `get_subscription` | Get a subscription by `subscription_id`. |
| `list_invoices` | List invoices. Optional `limit`, `customer_id`, `status`. |
| `list_refunds` | List refunds. Optional `limit`, `payment_intent_id`. |

## Example

```
> list the 5 most recent customers
> get_customer cus_ABC123
> what subscriptions does cus_ABC123 have?
> any failed payments recently?
```

## Local development

```bash
git clone https://github.com/robinafaruqia/stripe-mcp.git
cd stripe-mcp
npm install
cp .env.example .env   # then put your sk_test_ / rk_test_ key in .env
node index.js
```

`index.js` loads `.env` from the package directory when `STRIPE_SECRET_KEY` is not already set. MCP clients should still pass the key in `env` (npm installs do not include `.env`).

## Roadmap

- [ ] `search_customers` using Stripe's search API
- [ ] Pagination cursors (`starting_after`) for large result sets
- [ ] Optional tools that cross-reference organization/billing data from the [SaaS boilerplate](https://github.com/robinafaruqia/nodejsboilerplate) once its billing module ships

## License

MIT
