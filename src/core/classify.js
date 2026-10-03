// Decide what's worth announcing and to whom. Pure JS.

export const TYPE_ORDER = ['breaking', 'feature', 'security', 'improvement', 'fix', 'deprecation', 'removal'];
export const TYPE_LABEL = {
  breaking: '⚠️ Breaking changes', feature: '✨ New', security: '🔒 Security', improvement: '⚡ Improved',
  fix: '🐛 Fixed', deprecation: '⏳ Deprecated', removal: '🗑️ Removed',
};

/** Split a release into audiences: what customers see vs internal-only changes. */
export function classify(release) {
  const external = release.items.filter(i => i.type !== 'internal');
  const byType = Object.fromEntries(TYPE_ORDER.map(t => [t, external.filter(i => i.type === t)]));
  const features = byType.feature;
  // Headline = the most substantial feature (longest description is a decent proxy), else top improvement.
  const headline = [...features].sort((a, b) => b.text.length - a.text.length)[0] ?? byType.improvement[0] ?? external[0] ?? null;
  const size = features.length >= 3 || byType.breaking.length ? 'major' : features.length ? 'minor' : 'patch';
  return {
    ...release,
    external,
    internal: release.items.filter(i => i.type === 'internal'),
    byType,
    headline,
    size,              // major → full launch; minor → blog + email; patch → notes + in-app only
    counts: Object.fromEntries(TYPE_ORDER.map(t => [t, byType[t].length])),
  };
}

/** Recommended channels by release size. */
export function channelPlan(size) {
  return {
    major: ['blog', 'email', 'linkedin', 'x', 'in_app', 'customer_notes', 'sales_brief'],
    minor: ['blog', 'email', 'linkedin', 'in_app', 'customer_notes', 'sales_brief'],
    patch: ['in_app', 'customer_notes'],
  }[size];
}
