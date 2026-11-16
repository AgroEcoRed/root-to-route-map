import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { mapShareUrl } from '@/lib/mapSharing';

export default function EmbeddedMapHeader() {
  const { t } = useLanguage();
  return <header className="flex items-center justify-between gap-2 border-b border-border bg-background px-3 py-2 shrink-0">
    <span className="font-display text-lg text-primary">AgroEco.Red</span>
    <Button asChild size="sm" variant="outline"><a href={mapShareUrl(window.location.search)} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" />{t('export.openMap')}</a></Button>
  </header>;
}