interface SiteConfig {
  /** Working title. Renaming the product is a search for this file plus copy (docs/spec/README.md). */
  name: string;
  /** E.164 WhatsApp number of the founder's support line, e.g. `+919876543210`; `null` hides it. */
  supportWhatsapp: string | null;
  /** The founder's support email; `null` hides it. */
  supportEmail: string | null;
}

// Placeholders until the founder supplies them (docs/spec/iteration-2/07-launch.md).
export const site: SiteConfig = {
  name: 'God of Gaming',
  supportWhatsapp: null,
  supportEmail: null,
};
