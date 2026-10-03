// Channel constraints, enforced for both template and AI output.
export const LIMITS = {
  x_tweet: 280,
  linkedin_post: 3000,        // hard limit; ~1,300 performs best
  in_app_title: 50,
  in_app_body: 140,
  email_subject: 60,
  email_preview: 110,
  meta_description: 155,
};

export function truncate(s, max) {
  if (!s || s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const sp = cut.lastIndexOf(' ');
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,.;:–-]+$/, '') + '…';
}

/** Returns a list of human-readable warnings for anything over its limit. */
export function checkLimits(kit) {
  const w = [];
  const over = (label, s, max) => { if (s && s.length > max) w.push(`${label}: ${s.length}/${max} chars`); };
  kit.email?.subject_options?.forEach((s, i) => over(`Email subject ${i + 1}`, s, LIMITS.email_subject));
  over('Email preview text', kit.email?.preview_text, LIMITS.email_preview);
  over('LinkedIn post', kit.linkedin?.post, LIMITS.linkedin_post);
  kit.x?.thread?.forEach((t, i) => over(`X post ${i + 1}`, t, LIMITS.x_tweet));
  over('In-app title', kit.in_app?.title, LIMITS.in_app_title);
  over('In-app body', kit.in_app?.body, LIMITS.in_app_body);
  over('Blog meta description', kit.blog?.meta_description, LIMITS.meta_description);
  return w;
}
