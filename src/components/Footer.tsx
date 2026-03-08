import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-forest text-forest-foreground py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Leaf className="h-6 w-6 text-wheat" />
              <span className="font-display text-xl">AgroRed</span>
            </Link>
            <p className="text-forest-foreground/70 text-sm max-w-sm">
              Plataforma digital para el mapeo, conexión y comercialización de alimentos agroecológicos. Cadenas cortas, producción sustentable, comercio justo.
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm mb-3">Plataforma</h4>
            <ul className="space-y-2 text-sm text-forest-foreground/70">
              <li><Link to="/mapa" className="hover:text-wheat transition-colors">Mapa Interactivo</Link></li>
              <li><Link to="/mercado" className="hover:text-wheat transition-colors">Marketplace</Link></li>
              <li><Link to="/actores" className="hover:text-wheat transition-colors">Red de Actores</Link></li>
              <li><Link to="/registro" className="hover:text-wheat transition-colors">Registrarse</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm mb-3">Recursos</h4>
            <ul className="space-y-2 text-sm text-forest-foreground/70">
              <li><span className="hover:text-wheat transition-colors cursor-pointer">Documentación API</span></li>
              <li><span className="hover:text-wheat transition-colors cursor-pointer">Certificación Participativa</span></li>
              <li><span className="hover:text-wheat transition-colors cursor-pointer">Contacto</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-forest-foreground/10 text-center text-xs text-forest-foreground/50">
          © 2026 AgroRed. Soberanía alimentaria y agroecología.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
