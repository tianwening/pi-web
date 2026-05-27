---
name: awesome-design-md
description: Use when the user wants UI styling inspired by a known product or website, asks to use VoltAgent/awesome-design-md, DESIGN.md, or wants an AI-readable design system reference for frontend work.
license: MIT
---

# Awesome DESIGN.md

Use the public `VoltAgent/awesome-design-md` collection as a source of AI-readable design-system references.

Source repository: https://github.com/VoltAgent/awesome-design-md

## When To Use

Use this skill when the user asks for:

- a UI or page inspired by a named product, brand, or website
- "use awesome-design-md"
- "use DESIGN.md"
- a specific style such as Vercel, Linear, Stripe, Apple, Supabase, Cursor, Raycast, Shopify, Airbnb, Tesla, etc.

## Workflow

1. Identify the requested design reference.
2. Map it to a slug under `design-md/<slug>/DESIGN.md`.
3. Fetch or read that DESIGN.md before implementing UI changes.
4. Treat the document as design guidance, not as a requirement to copy a brand exactly.
5. Apply the style through this project's existing components, CSS variables, and frontend conventions.
6. If the user does not name a reference, choose the closest match to the product domain and state that choice.

## Fetch Pattern

Use this raw URL pattern:

```text
https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/<slug>/DESIGN.md
```

Examples:

```text
https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/vercel/DESIGN.md
https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/linear.app/DESIGN.md
https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/stripe/DESIGN.md
https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/supabase/DESIGN.md
https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/cursor/DESIGN.md
```

## Common Slugs

- AI/LLM: `claude`, `cohere`, `elevenlabs`, `minimax`, `mistral.ai`, `ollama`, `opencode.ai`, `replicate`, `runwayml`, `together.ai`, `voltagent`, `x.ai`
- Developer tools: `cursor`, `expo`, `lovable`, `raycast`, `superhuman`, `vercel`, `warp`
- Backend/devops: `clickhouse`, `composio`, `hashicorp`, `mongodb`, `posthog`, `sanity`, `sentry`, `supabase`
- SaaS/productivity: `cal`, `intercom`, `linear.app`, `mintlify`, `notion`, `resend`, `zapier`
- Design/creative: `airtable`, `clay`, `figma`, `framer`, `miro`, `webflow`
- Fintech/crypto: `binance`, `coinbase`, `kraken`, `mastercard`, `revolut`, `stripe`, `wise`
- Commerce/media: `airbnb`, `apple`, `hp`, `ibm`, `meta`, `nike`, `nvidia`, `pinterest`, `playstation`, `shopify`, `spacex`, `spotify`, `starbucks`, `theverge`, `uber`, `vodafone`, `wired`
- Automotive: `bmw`, `bmw-m`, `bugatti`, `ferrari`, `lamborghini`, `renault`, `tesla`

## Guardrails

- Do not copy logos, trademarks, text, or exact branded assets unless the user explicitly provides rights or asks only for private mockup work.
- Use the DESIGN.md as an inspiration and system reference: color roles, density, spacing, component treatment, typography rhythm, and interaction tone.
- Keep the implementation consistent with this repo's existing architecture and CSS variables.
- Avoid making unrelated redesigns when the user asks for a narrow change.
