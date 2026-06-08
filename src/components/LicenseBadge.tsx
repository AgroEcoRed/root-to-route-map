import { getLicense } from "@/lib/licenses";
import { Badge } from "@/components/ui/badge";

interface Props {
  code?: string | null;
  attribution?: string | null;
  className?: string;
}

const LicenseBadge = ({ code, attribution, className }: Props) => {
  const lic = getLicense(code);
  const body = (
    <Badge variant={lic.open ? "secondary" : "outline"} className={className}>
      {lic.short}
      {attribution ? ` · ${attribution}` : ""}
    </Badge>
  );
  if (!lic.url) return body;
  return (
    <a
      href={lic.url}
      target="_blank"
      rel="noopener noreferrer"
      title={lic.name}
      className="inline-flex"
    >
      {body}
    </a>
  );
};

export default LicenseBadge;