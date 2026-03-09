import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare, BookOpen, CalendarDays, Search, ThumbsUp,
  Clock, User, Tag, ChevronRight, Sprout, Droplets, Bug, Leaf,
  MapPin, Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface ForumPost {
  id: number;
  title: string;
  author: string;
  date: string;
  category: string;
  replies: number;
  likes: number;
  excerpt: string;
}

interface WikiArticle {
  id: number;
  title: string;
  category: string;
  icon: typeof Sprout;
  excerpt: string;
  readTime: string;
}

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  type: "workshop" | "field_day" | "course" | "meeting";
  attendees: number;
  description: string;
}

const forumPosts: ForumPost[] = [
  { id: 1, title: "Control biológico de pulgones en tomate", author: "María G.", date: "2026-03-05", category: "plagas", replies: 12, likes: 34, excerpt: "Compartí mi experiencia con mariquitas y crisopas para el control del pulgón verde en cultivo de tomate bajo invernadero." },
  { id: 2, title: "Rotación de cultivos en huerta familiar", author: "Pedro L.", date: "2026-03-04", category: "técnicas", replies: 8, likes: 21, excerpt: "¿Cómo organizan la rotación en parcelas pequeñas? Tengo 2000m² y me cuesta no repetir familias botánicas." },
  { id: 3, title: "Experiencia con bokashi para mejorar suelos arcillosos", author: "Ana R.", date: "2026-03-03", category: "suelo", replies: 15, likes: 45, excerpt: "Después de 6 meses aplicando bokashi, los resultados en estructura y retención de agua son impresionantes." },
  { id: 4, title: "Semillas criollas de zapallo: variedades y conservación", author: "Jorge M.", date: "2026-03-02", category: "semillas", replies: 6, likes: 18, excerpt: "Estoy armando un banco de semillas de zapallos criollos. Tengo 8 variedades, busco intercambiar." },
  { id: 5, title: "Problemas con mosca blanca en invernadero", author: "Lucía S.", date: "2026-03-01", category: "plagas", replies: 20, likes: 28, excerpt: "Probé con trampas amarillas y encarsia formosa pero sigo teniendo problemas. ¿Sugerencias?" },
  { id: 6, title: "Certificación participativa: ¿cómo empezar?", author: "Carlos D.", date: "2026-02-28", category: "certificación", replies: 9, likes: 32, excerpt: "Quiero iniciar el proceso de SPG en mi zona. ¿Quiénes han pasado por el proceso? ¿Qué necesito saber?" },
];

const wikiArticles: WikiArticle[] = [
  { id: 1, title: "Preparación de bioinsumos", category: "técnicas", icon: Sprout, excerpt: "Guía completa para elaborar purines, caldos minerales y preparados biodinámicos.", readTime: "12 min" },
  { id: 2, title: "Manejo integrado de plagas (MIP)", category: "plagas", icon: Bug, excerpt: "Estrategias para controlar plagas sin agroquímicos: control biológico, cultural y físico.", readTime: "15 min" },
  { id: 3, title: "Análisis de suelo: interpretación de resultados", category: "suelo", icon: Droplets, excerpt: "Cómo leer un análisis de suelo, qué indicadores mirar y cómo mejorar la fertilidad.", readTime: "10 min" },
  { id: 4, title: "Cosecha y postcosecha de hortalizas", category: "técnicas", icon: Leaf, excerpt: "Técnicas para maximizar la vida útil de verduras y frutas después de la cosecha.", readTime: "8 min" },
  { id: 5, title: "Compostaje: del residuo al abono", category: "suelo", icon: Sprout, excerpt: "Tipos de compostaje, materiales, tiempos y cómo saber cuándo está listo.", readTime: "11 min" },
  { id: 6, title: "Sistemas Participativos de Garantía (SPG)", category: "certificación", icon: Users, excerpt: "Qué son, cómo funcionan y por qué son una alternativa a la certificación de tercera parte.", readTime: "14 min" },
];

const events: Event[] = [
  { id: 1, title: "Taller de bioinsumos caseros", date: "2026-03-15", location: "La Plata", type: "workshop", attendees: 25, description: "Aprendé a preparar purín de ortiga, caldo bordelés y supermagro con insumos locales." },
  { id: 2, title: "Jornada de campo: Finca La Esperanza", date: "2026-03-22", location: "La Plata", type: "field_day", attendees: 40, description: "Visita a la finca con demostración de rotación de cultivos y manejo de plagas." },
  { id: 3, title: "Curso de análisis de suelo participativo", date: "2026-04-05", location: "Online", type: "course", attendees: 60, description: "4 clases sobre cómo hacer y entender análisis de suelo sin laboratorio." },
  { id: 4, title: "Encuentro de intercambio de semillas", date: "2026-04-12", location: "Florencio Varela", type: "meeting", attendees: 80, description: "Traé tus semillas y llevate nuevas variedades. Charlas sobre conservación de biodiversidad." },
  { id: 5, title: "Formación en SPG para nuevos evaluadores", date: "2026-04-20", location: "CABA", type: "course", attendees: 30, description: "Capacitación para quienes quieran ser evaluadores pares en Sistemas Participativos de Garantía." },
];

const forumCategoryIcons: Record<string, typeof Sprout> = {
  plagas: Bug,
  técnicas: Sprout,
  suelo: Droplets,
  semillas: Leaf,
  certificación: Users,
};

const eventTypeColors: Record<string, string> = {
  workshop: "bg-primary/10 text-primary",
  field_day: "bg-wheat/20 text-wheat-foreground",
  course: "bg-secondary/10 text-secondary",
  meeting: "bg-earth/10 text-earth",
};

const CommunityPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [forumSearch, setForumSearch] = useState("");
  const [wikiSearch, setWikiSearch] = useState("");
  const [wikiSearch, setWikiSearch] = useState("");

  const filteredPosts = forumPosts.filter((p) =>
    !forumSearch || p.title.toLowerCase().includes(forumSearch.toLowerCase()) || p.excerpt.toLowerCase().includes(forumSearch.toLowerCase())
  );

  const filteredArticles = wikiArticles.filter((a) =>
    !wikiSearch || a.title.toLowerCase().includes(wikiSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="bg-gradient-earth py-12">
          <div className="container">
            <h1 className="text-3xl sm:text-4xl font-display text-earth-foreground mb-2">{t("community.title")}</h1>
            <p className="text-earth-foreground/70 max-w-xl">{t("community.subtitle")}</p>
          </div>
        </div>

        <div className="container py-8">
          <Tabs defaultValue="forum" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="forum" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />{t("community.forum")}
              </TabsTrigger>
              <TabsTrigger value="wiki" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />{t("community.wiki")}
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />{t("community.events")}
              </TabsTrigger>
            </TabsList>

            {/* FORUM */}
            <TabsContent value="forum">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={t("community.search_forum")} value={forumSearch} onChange={(e) => setForumSearch(e.target.value)} className="pl-9" />
                </div>
                <Button className="bg-gradient-hero text-primary-foreground">{t("community.new_post")}</Button>
              </div>

              <div className="space-y-4">
                {filteredPosts.map((post, i) => {
                  const CatIcon = forumCategoryIcons[post.category] || MessageSquare;
                  return (
                    <motion.div key={post.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="rounded-xl border border-border bg-card p-5 hover:shadow-elevated hover:border-primary/20 transition-all duration-300 cursor-pointer group">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <CatIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display text-base text-card-foreground group-hover:text-primary transition-colors">{post.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><User className="h-3 w-3" />{post.author}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(post.date).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{post.replies}</span>
                            <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{post.likes}</span>
                            <Badge variant="secondary" className="text-[10px]">{t(`community.cat.${post.category}`)}</Badge>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-2" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </TabsContent>

            {/* WIKI */}
            <TabsContent value="wiki">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={t("community.search_wiki")} value={wikiSearch} onChange={(e) => setWikiSearch(e.target.value)} className="pl-9" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article, i) => (
                  <motion.div key={article.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="rounded-xl border border-border bg-card p-6 hover:shadow-elevated hover:border-primary/20 transition-all duration-300 cursor-pointer group">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <article.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-display text-lg text-card-foreground mb-2 group-hover:text-primary transition-colors">{article.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{article.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-[10px]">{t(`community.cat.${article.category}`)}</Badge>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{article.readTime}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* EVENTS */}
            <TabsContent value="events">
              <div className="space-y-4">
                {events.map((event, i) => (
                  <motion.div key={event.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                    className="rounded-xl border border-border bg-card p-6 hover:shadow-elevated transition-all duration-300">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-shrink-0 w-20 text-center">
                        <div className="text-3xl font-display text-primary">{new Date(event.date).getDate()}</div>
                        <div className="text-xs text-muted-foreground uppercase">
                          {new Date(event.date).toLocaleDateString("es", { month: "short", year: "numeric" })}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-display text-lg text-card-foreground">{event.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${eventTypeColors[event.type]}`}>
                            {t(`community.event_type.${event.type}`)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{event.attendees} {t("community.attendees")}</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Button size="sm" variant="outline" className="text-xs">{t("community.register_event")}</Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CommunityPage;
