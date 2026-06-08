import { LICENSES, LicenseCode, DEFAULT_LICENSE } from "@/lib/licenses";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

interface Props {
  value: LicenseCode | string;
  onChange: (v: LicenseCode) => void;
  attribution?: string;
  onAttributionChange?: (v: string) => void;
  showAttribution?: boolean;
  compact?: boolean;
}

const LicenseSelector = ({
  value,
  onChange,
  attribution,
  onAttributionChange,
  showAttribution = true,
  compact = false,
}: Props) => {
  const current = LICENSES.find((l) => l.code === value) ||
    LICENSES.find((l) => l.code === DEFAULT_LICENSE)!;

  return (
    <div className="space-y-2">
      <Label className="text-sm">Licencia de uso</Label>
      <Select value={value} onValueChange={(v) => onChange(v as LicenseCode)}>
        <SelectTrigger>
          <SelectValue placeholder="Elegí una licencia" />
        </SelectTrigger>
        <SelectContent>
          {LICENSES.map((l) => (
            <SelectItem key={l.code} value={l.code}>
              {l.short} — {l.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!compact && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {current.description}{" "}
          <Link to="/licencias" className="underline hover:text-primary">
            Más info sobre licencias
          </Link>
          .
        </p>
      )}
      {showAttribution && onAttributionChange && (
        <div className="pt-1">
          <Label className="text-xs text-muted-foreground">
            Crédito / atribución (opcional)
          </Label>
          <Input
            placeholder="Ej: Cooperativa La Semilla, 2026"
            value={attribution || ""}
            onChange={(e) => onAttributionChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

export default LicenseSelector;