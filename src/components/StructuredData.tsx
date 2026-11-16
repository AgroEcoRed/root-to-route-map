import { schemaJson } from '@/lib/structuredData';

export default function StructuredData({ nodes }: { nodes: unknown[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaJson(nodes) }} />;
}