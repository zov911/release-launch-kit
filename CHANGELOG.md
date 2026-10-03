# Changelog

## [1.0.0] - 2026-10-02

### Added
- Launch kit generator that turns release notes into a blog post, email, LinkedIn post, X thread, in-app message, customer notes and sales brief
- AI mode with Claude, using brand voice config and schema-validated output
- Template mode that works offline with no API key
- Input from Keep a Changelog files, conventional commits, GitHub releases or plain text
- GitHub Action to generate a kit on every release
- In-browser demo page
- Launch checklist sized to the release (patch, minor, major)

### Fixed
- Character limits enforced for X, LinkedIn, email subjects and in-app messages

- chore: add tests for parsing, templates and output files
