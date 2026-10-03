## Northwind v2.4.0 (2026-09-30)

### ⚠️ Breaking changes

- Legacy v1 REST API (deprecated since March). Migrate to v2

### ✨ New

- AI lead scoring that ranks every new HubSpot contact by fit and intent
- Slack alerts when a high-intent account visits the pricing page
- Shareable dashboard links with view-only access
- Bulk export endpoint supports CSV and Parquet

### 🔒 Security

- Upgraded session tokens to rotate every 12 hours

### ⚡ Improved

- Reports load up to 3x faster on accounts with more than 1M events

### 🐛 Fixed

- Attribution totals no longer double-count leads that convert twice in one day
- Fixed timezone offset in weekly email digests
