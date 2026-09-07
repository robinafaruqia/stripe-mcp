[![npm version](https://img.shields.io/npm/v/@devtechtricks/stripe-mcp.svg)](https://www.npmjs.com/package/@devtechtricks/stripe-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@devtechtricks/stripe-mcp.svg)](https://www.npmjs.com/package/@devtechtricks/stripe-mcp)
[![license](https://img.shields.io/npm/l/@devtechtricks/stripe-mcp.svg)](https://github.com/robinafaruqia/stripe-mcp/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/robinafaruqia/stripe-mcp.svg?style=social)](https://github.com/robinafaruqia/stripe-mcp)
# stripe-mcp

A **read-only MCP server** for querying **Stripe** — customers, payments, subscriptions, invoices, and refunds.

Use it with **any AI or client that supports MCP** (Model Context Protocol)—Cursor, Claude Desktop, Claude Code, Windsurf, or other MCP hosts.

## Features

- **Read-only by design** — no charge, refund, update, or delete tools
- **Test keys only** — refuses to start with `sk_live_` / `rk_live_`
- **Single file** — just `index.js`, no build step
- **Works with any MCP client** — Cursor, Claude, Windsurf, and others

## MCP Configuration

### Cursor — one-click install

[![Add MCP server to Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en-US/install-mcp?name=stripe-mcp&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBkZXZ0ZWNodHJpY2tzL3N0cmlwZS1tY3AiXSwiZW52Ijp7IlNUUklQRV9TRUNSRVRfS0VZIjoiWU9VUl9TVFJJUEVfVEVTVF9LRVkifX0=)

After install, replace `YOUR_STRIPE_TEST_KEY` with a Stripe **test** secret (`sk_test_...` or `rk_test_...`) from the [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys). A restricted key with only read scopes is preferred.

### Using npx (recommended)

Add to your MCP client config (e.g. Cursor: `~/.cursor/mcp.json` or Settings → MCP; Claude: `claude_desktop_config.json`; etc.):

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

Claude Code:

```bash
claude mcp add stripe-mcp --env STRIPE_SECRET_KEY=sk_test_... -- npx -y @devtechtricks/stripe-mcp
```

### From source (development)

```bash
git clone https://github.com/robinafaruqia/stripe-mcp.git
cd stripe-mcp
npm install
cp .env.example .env   # then put your sk_test_ / rk_test_ key in .env
```

Then in your MCP config:

```json
{
  "mcpServers": {
    "stripe-mcp": {
      "command": "node",
      "args": ["/path/to/stripe-mcp/index.js"]
    }
  }
}
```

`index.js` loads `.env` from the package directory when `STRIPE_SECRET_KEY` is not already set. npm installs do not include `.env` — MCP clients should pass the key in `env`.

## Available Tools

| Tool | Description |
|------|-------------|
| `list_customers` | List recent customers. Optional: `limit`, `email`. |
| `get_customer` | Get a customer by ID. Required: `customer_id`. |
| `list_payments` | List recent payment intents. Optional: `limit`, `customer_id`. |
| `get_payment` | Get a payment intent by ID. Required: `payment_intent_id`. |
| `list_subscriptions` | List subscriptions. Optional: `limit`, `customer_id`, `status`. |
| `get_subscription` | Get a subscription by ID. Required: `subscription_id`. |
| `list_invoices` | List invoices. Optional: `limit`, `customer_id`, `status`. |
| `list_refunds` | List refunds. Optional: `limit`, `payment_intent_id`. |

## Example

```
1. list_customers({ limit: 5 })
2. get_customer({ customer_id: "cus_ABC123" })
3. list_subscriptions({ customer_id: "cus_ABC123" })
4. list_payments({ limit: 10 })
```

## License

MIT
