# Brand voice config

Create `launchkit.config.json` in your repo root (picked up automatically) or pass `--config path`.

```json
{
  "product": "Northwind",
  "url": "https://northwind.example.com",
  "changelog_url": "https://northwind.example.com/changelog",
  "audience": "B2B marketing and RevOps teams",
  "tone": "clear, confident, practical, no hype",
  "cta": { "text": "Try it now", "url": "https://northwind.example.com/app?utm_source=launch" },
  "hashtags": ["#RevOps", "#ProductUpdate"],
  "avoid": ["revolutionary", "game-changer", "seamless"],
  "sender": "Alex, Product at Northwind",
  "examples": "Optional: paste 2–3 past posts so AI mode can match your voice."
}
```

| Field | Used for | Default |
|---|---|---|
| `product` | Every asset | "Our product" |
| `url` / `cta` | Links and buttons (add UTM params here) | none |
| `changelog_url` | "Full release notes" links, sales FAQ | `url` |
| `audience` | Framing ("Built for…") | none |
| `tone`, `avoid`, `examples` | AI mode voice | neutral, no hype |
| `hashtags` | LinkedIn | none |
| `sender` | Email sign-off | "The {product} team" |

All fields are optional.
