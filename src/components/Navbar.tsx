import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, MapPin, ShoppingBasket, Leaf, LogOut, User, Globe, BookOpen, ShoppingCart, Sprout, Activity, ShieldCheck, BarChart3 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, Lang } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedLogo from "@/components/AnimatedLogo";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t, lang, setLang, langs } = useLanguage();
  const { totalItems, setIsOpen: setCartOpen } = useCart();

  const navItems = [
    { to: "/", label: t("nav.home"), icon: Leaf },
    { to: "/mapa", label: t("nav.map"), icon: MapPin },
    { to: "/mercado", label: t("nav.market"), icon: ShoppingBasket },
    { to: "/garantias", label: t("nav.spg"), icon: ShieldCheck },
    { to: "/comunidad", label: t("nav.community"), icon: BookOpen },
    { to: "/recursos", label: t("nav.services"), icon: Sprout },
    { to: "/observatorio", label: t("nav.observatory"), icon: BarChart3 },
  ];

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
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="transition-transform group-hover:scale-110">
            <AnimatedLogo size={36} />
          </div>
          <span className={`font-display text-xl ${navbarScrolled ? "text-foreground" : "text-white"}`}>
            AgroEco<span className="text-wheat">.Red</span>
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                location.pathname === item.to
                  ? navbarScrolled ? "text-primary" : "text-white font-semibold"
                  : navbarScrolled ? "text-muted-foreground hover:text-foreground" : "text-white/90 hover:text-white"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {location.pathname === item.to && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 rounded-lg bg-primary/10 -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {/* Cart */}
          <button
            onClick={() => setCartOpen(true)}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${navbarScrolled ? "text-muted-foreground hover:text-foreground hover:bg-muted/50" : "text-white/70 hover:text-white"}`}
          >
            <ShoppingCart className="h-4 w-4" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
          {/* Language Switcher */}
          <div className="relative">
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
                 className={`text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${navbarScrolled ? "text-muted-foreground bg-muted/50 hover:text-foreground" : "text-white/80 bg-white/10 hover:text-white"}`}
               >
                 <User className="h-4 w-4" />
                 {user.email?.split("@")[0]}
               </Link>
               <Button variant="outline" size="sm" onClick={handleSignOut} className="group text-foreground">
                 <LogOut className="h-4 w-4 mr-1 transition-transform group-hover:-translate-x-0.5" />
                 {t("nav.logout")}
               </Button>
             </>
           ) : (
             <>
               <Button variant="ghost" size="sm" asChild>
                 <Link to="/registro">{t("nav.register")}</Link>
               </Button>
               <Button size="sm" className="bg-gradient-hero text-primary-foreground" asChild>
                 <Link to="/ingresar">{t("nav.login")}</Link>
               </Button>
             </>
           )}
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Mobile cart */}
          <button onClick={() => setCartOpen(true)} className="relative p-2">
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
          {/* Mobile auth quick action */}
          {!user ? (
            <Button size="sm" className="h-8 px-2.5 text-xs bg-gradient-hero text-primary-foreground" asChild>
              <Link to="/ingresar">{t("nav.login")}</Link>
            </Button>
          ) : (
            <button
              onClick={handleSignOut}
              className={`p-2 rounded-md ${navbarScrolled ? "text-foreground hover:bg-muted/50" : "text-white hover:bg-white/10"}`}
              aria-label={t("nav.logout")}
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
          {/* Mobile lang switcher */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setLangOpen(!langOpen); }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-muted-foreground"
            >
              <Globe className="h-3.5 w-3.5" />
              {lang.toUpperCase()}
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-elevated overflow-hidden min-w-[100px] z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  {langs.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => { setLang(l.value); setLangOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs ${
                        lang === l.value ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted/50"
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
          <button className="p-2" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="p-4 space-y-2">
              {navItems.map((item, i) => (
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
              <div className="flex gap-2 pt-2">
                {user ? (
                  <>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link to="/mi-perfil" onClick={() => setOpen(false)}>
                        <User className="h-4 w-4 mr-1" /> Mi Perfil
                      </Link>
                    </Button>
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
