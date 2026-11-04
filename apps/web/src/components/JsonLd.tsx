import type { JsonLd as JsonLdData } from '@/lib/seo';

/** Structured data for search engines. `<` is escaped so the JSON can never close the script. */
export function JsonLd({ data }: { data: JsonLdData }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
