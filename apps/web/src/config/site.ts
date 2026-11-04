import { DEFAULT_CITY_SLUG } from '@gog/domain';

interface SocialLink {
  label: string;
  url: string;
}

interface SiteConfig {
  /** Working title. Renaming the product is a search for this file plus copy (docs/spec/README.md). */
  name: string;
  tagline: string;
  description: string;
  /** Launch city, spelled the way it appears in copy; the synonym is for search metadata only. */
  city: { name: string; synonym: string };
  /** Custom URL scheme of the player app (`gog://cafe/<slug>`), the fallback for Universal Links. */
  appScheme: string;
  /** E.164 WhatsApp number for cafe owners, e.g. `+919876543210`. `null` hides the WhatsApp links. */
  whatsapp: string | null;
  /** Contact email for cafe owners. `null` hides the email links. */
  email: string | null;
  social: SocialLink[];
  defaultCitySlug: string;
}

// Fill `whatsapp`, `email` and `social` before launch; the pages render without them until then.
export const site: SiteConfig = {
  name: 'God of Gaming',
  tagline: 'Gaming cafes in Bengaluru, booked for your whole squad',
  description:
    'Find gaming cafes in Bengaluru with PC tiers, PS5, Xbox, VR and sim rigs. See prices per hour, games and opening hours, then hold seats for your squad in the app.',
  city: { name: 'Bengaluru', synonym: 'Bangalore' },
  appScheme: 'gog',
  whatsapp: null,
  email: null,
  social: [],
  defaultCitySlug: DEFAULT_CITY_SLUG,
};
