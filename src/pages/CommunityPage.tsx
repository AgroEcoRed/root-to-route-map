import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare, BookOpen, CalendarDays, Search, ThumbsUp,
  Clock, User, Tag, ChevronRight, ChevronLeft, Sprout, Droplets, Bug, Leaf,
  MapPin, Users, Send, Sparkles, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUpcomingEvents } from "@/hooks/useUpcomingEvents";
import { EventFormDialog } from "@/components/events/EventFormDialog";

interface ForumPost {
  id: number;
  title: string;
  author: string;
  date: string;
  category: string;
  replies: number;
  likes: number;
  excerpt: string;
  mockReplies?: { author: string; text: string; date: string; likes: number }[];
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

// Real content only. Forum and wiki are now empty placeholders until the community publishes.
const forumPosts: ForumPost[] = [];
const wikiArticles: WikiArticle[] = [];

const forumCategoryIcons: Record<string, typeof Sprout> = {
  plagas: Bug,
  técnicas: Sprout,
  suelo: Droplets,
  semillas: Leaf,
  certificación: Users,
};

const eventTypeColors: Record<string, string> = {
  feria: "bg-[#E94560]/15 text-[#E94560]",
  intercambio: "bg-primary/10 text-primary",
  formacion: "bg-[#3B82F6]/15 text-[#3B82F6]",
  otro: "bg-wheat/20 text-wheat-foreground",
};

const CommunityPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [forumSearch, setForumSearch] = useState("");
  const [wikiSearch, setWikiSearch] = useState("");
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [replyText, setReplyText] = useState("");
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const { events: dbEvents, loading: eventsLoading } = useUpcomingEvents();

  const filteredPosts = forumPosts.filter((p) =>
    !forumSearch || p.title.toLowerCase().includes(forumSearch.toLowerCase()) || p.excerpt.toLowerCase().includes(forumSearch.toLowerCase())
  );

  const filteredArticles = wikiArticles.filter((a) =>
    !wikiSearch || a.title.toLowerCase().includes(wikiSearch.toLowerCase())
  );

  const handleNewPost = () => {
    if (!user) {
      toast("Necesitás ingresar para crear un tema", { action: { label: "Ingresar", onClick: () => navigate("/ingresar") } });
      return;
    }
    setShowNewPost(true);
  };

  const submitNewPost = () => {
    if (!newPostTitle.trim()) return;
    toast.success("¡Tema creado! Aparecerá cuando sea aprobado por la comunidad.");
    setShowNewPost(false);
    setNewPostTitle("");
    setNewPostContent("");
  };

  const submitReply = () => {
    if (!user) {
      toast("Necesitás ingresar para responder", { action: { label: "Ingresar", onClick: () => navigate("/ingresar") } });
      return;
    }
    if (!replyText.trim()) return;
    toast.success("¡Respuesta enviada!");
    setReplyText("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="bg-gradient-earth py-12">
          <div className="container">
            <h1 className="text-3xl sm:text-4xl font-display text-white mb-2">{t("community.title")}</h1>
            <p className="text-white/70 max-w-xl">{t("community.subtitle")}</p>
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
              <AnimatePresence mode="wait">
                {selectedPost ? (
                  /* Thread detail view */
                  <motion.div key="thread" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <button onClick={() => setSelectedPost(null)}
                      className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 mb-6 transition-colors">
                      <ChevronLeft className="h-4 w-4" /> Volver al foro
                    </button>

                    {/* Original post */}
                    <div className="rounded-xl border border-border bg-card p-6 mb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-card-foreground text-sm">{selectedPost.author}</p>
                          <p className="text-xs text-muted-foreground">{new Date(selectedPost.date).toLocaleDateString()}</p>
                        </div>
                        <Badge variant="secondary" className="text-[10px] ml-auto">{t(`community.cat.${selectedPost.category}`)}</Badge>
                      </div>
                      <h2 className="font-display text-xl text-card-foreground mb-3">{selectedPost.title}</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">{selectedPost.excerpt}</p>
                      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{selectedPost.likes}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{selectedPost.replies} respuestas</span>
                      </div>
                    </div>

                    {/* Replies */}
                    <div className="space-y-4 mb-6">
                      {(selectedPost.mockReplies || []).map((reply, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                          className="rounded-xl border border-border bg-card p-5 ml-6">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-card-foreground text-sm">{reply.author}</p>
                              <p className="text-xs text-muted-foreground">{new Date(reply.date).toLocaleDateString()}</p>
                            </div>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                              <ThumbsUp className="h-3 w-3" />{reply.likes}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{reply.text}</p>
                        </motion.div>
                      ))}
                      {(!selectedPost.mockReplies || selectedPost.mockReplies.length === 0) && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Aún no hay respuestas. ¡Sé el primero en responder!
                        </div>
                      )}
                    </div>

                    {/* Reply input */}
                    <div className="rounded-xl border border-border bg-card p-5">
                      <Textarea
                        placeholder={user ? "Escribí tu respuesta..." : "Ingresá para responder"}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={3}
                        disabled={!user}
                        className="mb-3"
                      />
                      <div className="flex justify-end">
                        <Button size="sm" className="bg-gradient-hero text-primary-foreground gap-2" onClick={submitReply} disabled={!replyText.trim()}>
                          <Send className="h-3.5 w-3.5" /> Responder
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ) : showNewPost ? (
                  /* New post form */
                  <motion.div key="newpost" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <button onClick={() => setShowNewPost(false)}
                      className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 mb-6 transition-colors">
                      <ChevronLeft className="h-4 w-4" /> Volver al foro
                    </button>
                    <div className="max-w-2xl mx-auto rounded-xl border border-border bg-card p-6">
                      <h2 className="font-display text-xl text-card-foreground mb-4">Nuevo tema</h2>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-card-foreground">Título</label>
                          <Input value={newPostTitle} onChange={(e) => setNewPostTitle(e.target.value)} placeholder="Ej: Experiencia con cobertura vegetal" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-card-foreground">Contenido</label>
                          <Textarea value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder="Compartí tu experiencia, pregunta o reflexión..." rows={6} className="mt-1" />
                        </div>
                        <div className="flex gap-3 justify-end">
                          <Button variant="outline" onClick={() => setShowNewPost(false)}>Cancelar</Button>
                          <Button className="bg-gradient-hero text-primary-foreground" onClick={submitNewPost} disabled={!newPostTitle.trim()}>
                            Publicar tema
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* Forum list */
                  <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder={t("community.search_forum")} value={forumSearch} onChange={(e) => setForumSearch(e.target.value)} className="pl-9" />
                      </div>
                      <Button className="bg-gradient-hero text-primary-foreground" onClick={handleNewPost}>{t("community.new_post")}</Button>
                    </div>

                    <div className="space-y-4">
                      {filteredPosts.map((post, i) => {
                        const CatIcon = forumCategoryIcons[post.category] || MessageSquare;
                        return (
                          <motion.div key={post.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            onClick={() => setSelectedPost(post)}
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
                  </motion.div>
                )}
              </AnimatePresence>
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
              <div className="flex justify-end mb-4">
                <Button
                  className="gap-2 bg-gradient-to-r from-[#E94560] via-[#F5C518] to-[#3B82F6] text-white"
                  onClick={() => {
                    if (!user) {
                      toast("Necesitás ingresar para publicar una actividad", { action: { label: "Ingresar", onClick: () => navigate("/ingresar") } });
                      return;
                    }
                    setEventDialogOpen(true);
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                  Publicar actividad
                </Button>
              </div>

              {eventsLoading ? (
                <p className="text-sm text-muted-foreground text-center py-12">Cargando actividades…</p>
              ) : dbEvents.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-xl">
                  <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Aún no hay actividades futuras publicadas.</p>
                  <p className="text-xs text-muted-foreground mt-1">Sé la primera persona en publicar una feria, intercambio o formación.</p>
                </div>
              ) : (
              <div className="space-y-4">
                {dbEvents.map((event, i) => (
                  <motion.div key={event.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                    className="rounded-xl border border-border bg-card p-6 hover:shadow-elevated transition-all duration-300">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-shrink-0 w-20 text-center">
                        <div className="text-3xl font-display text-primary">{new Date(event.starts_at).getDate()}</div>
                        <div className="text-xs text-muted-foreground uppercase">
                          {new Date(event.starts_at).toLocaleDateString("es", { month: "short", year: "numeric" })}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-display text-lg text-card-foreground">{event.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${eventTypeColors[event.event_type] || eventTypeColors.otro}`}>
                            {event.event_type}
                          </span>
                        </div>
                        {event.description && <p className="text-sm text-muted-foreground mb-3">{event.description}</p>}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {event.location_name && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location_name}</span>}
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(event.starts_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {event.link ? (
                          <a href={event.link} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="text-xs gap-1">
                              <ExternalLink className="h-3 w-3" /> Más info
                            </Button>
                          </a>
                        ) : event.contact ? (
                          <span className="text-xs text-muted-foreground">📞 {event.contact}</span>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
      <EventFormDialog open={eventDialogOpen} onOpenChange={setEventDialogOpen} />
    </div>
  );
};

export default CommunityPage;