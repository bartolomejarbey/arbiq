/**
 * Server-friendly JSON-LD injektor. Vlož kamkoliv do JSX tree.
 *
 * Použití:
 *   <JsonLd data={organizationSchema} />
 *   <JsonLd data={[organizationSchema, websiteSchema, localBusinessSchema]} />
 */
export default function JsonLd({ data }: { data: unknown | unknown[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }}
        />
      ))}
    </>
  );
}
