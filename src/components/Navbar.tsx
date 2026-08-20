import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, MapPin, ShoppingBasket, Leaf, LogOut, User, Globe, BookOpen, ShoppingCart, Sprout, Activity, ShieldCheck, BarChart3 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, Lang } from "@/contexts/LanguageContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useLayerManager } from "@/hooks/useLayerManager";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedLogo from "@/components/AnimatedLogo";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  // Gestoras de capa (no admin global): acceso directo a su panel.
  const { layers: managedLayers } = useLayerManager();
  const myLayer = !isAdmin && managedLayers.length > 0 ? managedLayers[0] : null;
  const { t, lang, setLang, langs } = useLanguage();
  const { totalItems, setIsOpen: setCartOpen } = useCart();

  // Esenciales: SIEMPRE visibles (incluso en móvil), nunca colapsan.
  const essentialNav = [
    { to: "/mapa", label: t("nav.map"), icon: MapPin },
    { to: "/mercado", label: t("nav.market"), icon: ShoppingBasket },
  ];
  // Secundarios: van apareciendo a medida que hay espacio, y al hamburguesa
  // si no entran. Orden de prioridad: SPG → Comunidad → Recursos → Observatorio.
  const secondaryNav = [
    { to: "/garantias", label: t("nav.spg"), icon: ShieldCheck, showFrom: "xl" as const },
    { to: "/comunidad", label: t("nav.community"), icon: BookOpen, showFrom: "xl" as const },
    { to: "/biblioteca", label: "Biblioteca", icon: BookOpen, showFrom: "2xl" as const },
    { to: "/recursos", label: t("nav.services"), icon: Sprout, showFrom: "2xl" as const },
    { to: "/observatorio", label: t("nav.observatory"), icon: BarChart3, showFrom: "2xl" as const },
  ];
  const allNavItems = [
    { to: "/", label: t("nav.home"), icon: Leaf },
    ...essentialNav,
    ...secondaryNav.map(({ showFrom: _omit, ...rest }) => rest),
  ];
  const visibilityClass = (showFrom: "xl" | "2xl") =>
    showFrom === "xl" ? "hidden xl:inline-flex" : "hidden 2xl:inline-flex";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close lang dropdown on outside click
  useEffect(() => {
    if (!langOpen) return;
    const close = () => setLangOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [langOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Detectar si estamos en páginas de autenticación para mantener navbar oscuro
  const isAuthPage = ["/ingresar", "/registro", "/reset-password"].includes(location.pathname);
  const navbarScrolled = scrolled || isAuthPage;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        navbarScrolled
          ? "bg-background/90 backdrop-blur-xl shadow-sm border-b border-border"
          : "bg-gradient-to-b from-black/55 via-black/30 to-transparent border-b border-transparent text-white"
      }`}
    >
      <div className="container flex items-center justify-between gap-2 h-16">
        <Link to="/" className="flex items-center gap-2 group min-w-0 flex-shrink-0">
          <div className="transition-transform group-hover:scale-110">
            <AnimatedLogo size={32} />
          </div>
          <span className={`font-display text-base sm:text-xl whitespace-nowrap ${navbarScrolled ? "text-foreground" : "text-white"}`}>
            AgroEco<span className="text-wheat">.Red</span>
          </span>
        </Link>

        {/* Esenciales: SIEMPRE visibles (logo, mapa, mercado) */}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-1 justify-center md:justify-start md:ml-2">
          {essentialNav.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                className={`relative flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  active
                    ? navbarScrolled ? "text-primary bg-primary/10" : "text-white bg-white/15 font-semibold"
                    : navbarScrolled ? "text-muted-foreground hover:text-foreground hover:bg-muted/50" : "text-white/90 hover:text-white hover:bg-white/10"
                }`}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}

          {/* Secundarios: aparecen sólo cuando hay espacio (xl/2xl), si no van al hamburguesa */}
          {secondaryNav.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`${visibilityClass(item.showFrom)} items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? navbarScrolled ? "text-primary bg-primary/10" : "text-white bg-white/15 font-semibold"
                    : navbarScrolled ? "text-muted-foreground hover:text-foreground hover:bg-muted/50" : "text-white/90 hover:text-white hover:bg-white/10"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Derecha: SIEMPRE visibles → Carrito + (Ingresar/Registrarse o Perfil) + hamburguesa */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Cart - siempre visible */}
          <button
            onClick={() => setCartOpen(true)}
            aria-label="Carrito de compras"
            className={`relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${navbarScrolled ? "text-foreground hover:bg-muted/50" : "text-white hover:bg-white/15"}`}
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>

          {/* Language Switcher */}
          <div className="relative hidden sm:block">
            <button
              onClick={(e) => { e.stopPropagation(); setLangOpen(!langOpen); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${navbarScrolled ? "text-muted-foreground hover:text-foreground hover:bg-muted/50" : "text-white/70 hover:text-white"}`}
            >
              <Globe className="h-4 w-4" />
              {lang.toUpperCase()}
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-elevated overflow-hidden min-w-[120px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {langs.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => { setLang(l.value); setLangOpen(false); }}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                        lang === l.value ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

           {user ? (
             <>
               <Link
                 to="/mi-perfil"
                 aria-label="Mi perfil"
                 className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${navbarScrolled ? "text-foreground bg-muted/50 hover:bg-muted" : "text-white bg-white/10 hover:bg-white/20"}`}
                 title={user.email?.split("@")[0]}
               >
                 <User className="h-5 w-5" />
               </Link>
               {isAdmin && (
                 <Link
                   to="/admin"
                   aria-label="Panel de administración"
                   className={`hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${navbarScrolled ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-white bg-white/15 hover:bg-white/25"}`}
                   title="Panel de administración"
                 >
                   <ShieldCheck className="h-5 w-5" />
                 </Link>
               )}
               {myLayer && (
                 <Link
                   to={`/admin/capas/${myLayer}`}
                   aria-label="Panel de mi capa"
                   className={`hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${navbarScrolled ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-white bg-white/15 hover:bg-white/25"}`}
                   title="Panel de mi capa"
                 >
                   <ShieldCheck className="h-5 w-5" />
                 </Link>
               )}
               <Button variant="outline" size="sm" onClick={handleSignOut} className="hidden md:inline-flex group text-foreground">
                 <LogOut className="h-4 w-4 mr-1 transition-transform group-hover:-translate-x-0.5" />
                 {t("nav.logout")}
               </Button>
             </>
           ) : (
             <>
               <div className={`hidden sm:block h-6 w-px mx-1 ${navbarScrolled ? "bg-border" : "bg-white/30"}`} aria-hidden="true" />
               <Button
                 size="sm"
                 variant="outline"
                 asChild
                 className={`h-9 px-2.5 sm:px-4 font-semibold ${navbarScrolled
                   ? "border-primary text-primary hover:bg-primary/10"
                   : "border-white/70 bg-white/10 text-white hover:bg-white/20 hover:text-white"}`}
               >
                 <Link to="/ingresar">{t("nav.login")}</Link>
               </Button>
               <Button
                 size="sm"
                 asChild
                 className="h-9 px-2.5 sm:px-4 bg-gradient-hero text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all"
               >
                 <Link to="/registro">{t("nav.register")}</Link>
               </Button>
             </>
           )}

          {/* Hamburguesa: SIEMPRE visible — abre el menú con el resto de secciones */}
          <button
            className={`p-2 rounded-lg transition-colors ${navbarScrolled ? "text-foreground hover:bg-muted/50" : "text-white hover:bg-white/15"}`}
            onClick={() => setOpen(!open)}
            aria-label="Menú"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Menú desplegable (siempre disponible para acceder al resto de secciones / idiomas) */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-border bg-background/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="p-4 space-y-2">
              {allNavItems.map((item, i) => (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === item.to
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              {/* Idiomas dentro del menú */}
              <div className="pt-2 border-t border-border">
                <p className="px-4 py-2 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Idioma</p>
                <div className="flex flex-wrap gap-1 px-2">
                  {langs.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => { setLang(l.value); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        lang === l.value ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span>{l.flag}</span>{l.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                {user ? (
                  <>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link to="/mi-perfil" onClick={() => setOpen(false)}>
                        <User className="h-4 w-4 mr-1" /> Mi Perfil
                      </Link>
                    </Button>
                    {isAdmin && (
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link to="/admin" onClick={() => setOpen(false)}>
                          <ShieldCheck className="h-4 w-4 mr-1" /> Admin
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { handleSignOut(); setOpen(false); }}>
                      <LogOut className="h-4 w-4 mr-1" /> {t("nav.logout")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link to="/registro" onClick={() => setOpen(false)}>{t("nav.register")}</Link>
                    </Button>
                    <Button size="sm" className="flex-1 bg-gradient-hero text-primary-foreground" asChild>
                      <Link to="/ingresar" onClick={() => setOpen(false)}>{t("nav.login")}</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
