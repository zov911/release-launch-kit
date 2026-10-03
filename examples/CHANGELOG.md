# Changelog

## [Unreleased]
### Added
- Experimental Salesforce sync

## [2.4.0] - 2026-09-30
### Added
- AI lead scoring that ranks every new HubSpot contact by fit and intent (#412)
- Slack alerts when a high-intent account visits the pricing page
- Shareable dashboard links with view-only access

### Changed
- Reports load up to 3x faster on accounts with more than 1M events
- feat(api): bulk export endpoint supports CSV and Parquet

### Fixed
- Attribution totals no longer double-count leads that convert twice in one day
- Fixed timezone offset in weekly email digests

### Removed
- **BREAKING** Legacy v1 REST API (deprecated since March). Migrate to v2.

### Security
- Upgraded session tokens to rotate every 12 hours

- chore: bump eslint to v10
- ci: cache Playwright browsers

## [2.3.1] - 2026-09-02
### Fixed
- CSV import handles semicolon delimiters
