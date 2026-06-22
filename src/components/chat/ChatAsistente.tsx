import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sprout, RotateCcw, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Mode = "general" | "onboarding" | "map";

const MODES: { key: Mode; labelKey: string; emptyKey: string }[] = [
  { key: "general", labelKey: "chat.mode.general", emptyKey: "chat.empty.general" },
  { key: "onboarding", labelKey: "chat.mode.onboarding", emptyKey: "chat.empty.onboarding" },
  { key: "map", labelKey: "chat.mode.map", emptyKey: "chat.empty.map" },
];

const ChatAsistente = () => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("general");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { messages, append, reset } = useChatHistory(mode);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Autoscroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus input when opened or mode changes
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, mode]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    append({ role: "user", content: text });
    setLoading(true);

    const history = [...messages, { role: "user" as const, content: text }].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const { data, error } = await supabase.functions.invoke("chat-asistente", {
        body: { messages: history, mode },
      });

      if (error) {
        const status = (error as { context?: { status?: number } }).context?.status;
        if (status === 429) toast.error(t("chat.rate_limit"));
        else if (status === 402) toast.error(t("chat.credits"));
        else toast.error(t("chat.error"));
        append({ role: "assistant", content: "⚠️ " + t("chat.error") });
      } else {
        const reply = (data as { text?: string })?.text ?? "";
        const toolsUsed = (data as { tools_used?: string[] })?.tools_used ?? [];
        const footer =
          toolsUsed.length > 0
            ? `\n\n<small>🔧 _Herramientas usadas: ${toolsUsed.join(", ")}_</small>`
            : "";
        append({ role: "assistant", content: (reply || "…") + footer });
      }
    } catch (err) {
      console.error("[chat] send error", err);
      toast.error(t("chat.error"));
      append({ role: "assistant", content: "⚠️ " + t("chat.error") });
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Floating button — assistant avatar + visible "Asistente" label */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
        onClick={() => setOpen((v) => !v)}
        aria-label={t("chat.title")}
        className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 pl-2 pr-4 py-2 rounded-full bg-gradient-hero text-primary-foreground shadow-elevated hover:scale-105 transition-transform"
      >
        <span className="relative flex items-center justify-center h-10 w-10 rounded-full bg-white/95 text-primary shadow-inner">
          {open ? <X className="h-5 w-5" /> : <Sprout className="h-5 w-5" />}
          {!open && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white" />
          )}
        </span>
        {!open && (
          <span className="flex flex-col items-start leading-tight">
            <span className="text-[10px] uppercase tracking-wider opacity-80">Asistente</span>
            <span className="text-sm font-display font-semibold">Sembra</span>
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="fixed bottom-24 right-5 z-[60] w-[min(380px,calc(100vw-2.5rem))] h-[min(560px,calc(100vh-8rem))] bg-card border border-border rounded-2xl shadow-elevated flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-br from-primary/10 to-wheat/10">
              <div className="flex items-center gap-2.5">
                <div className="relative h-10 w-10 rounded-full bg-gradient-hero flex items-center justify-center ring-2 ring-white">
                  <Sprout className="h-5 w-5 text-primary-foreground" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white" />
                </div>
                <div>
                  <h3 className="font-display text-sm leading-tight">{t("chat.title")}</h3>
                  <p className="text-[11px] text-muted-foreground">{t("chat.subtitle")}</p>
                </div>
              </div>
              <button
                onClick={reset}
                title={t("chat.new")}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            {/* Mode tabs */}
            <div className="flex gap-1 px-2 pt-2 border-b border-border bg-muted/30">
              {MODES.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`flex-1 text-[11px] font-medium px-2 py-1.5 rounded-t-md transition-colors ${
                    mode === m.key
                      ? "bg-card text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(m.labelKey)}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-sm text-foreground/80 bg-muted/40 rounded-xl px-4 py-3 leading-relaxed prose prose-sm max-w-none">
                  <ReactMarkdown>
                    {t(MODES.find((m) => m.key === mode)?.emptyKey ?? "chat.empty.general")}
                  </ReactMarkdown>
                </div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "user" ? (
                    <div className="max-w-[85%] bg-primary text-primary-foreground rounded-2xl rounded-br-md px-3.5 py-2 text-sm whitespace-pre-wrap break-words">
                      {m.content}
                    </div>
                  ) : (
                    <div className="max-w-[90%] text-sm text-foreground leading-relaxed prose prose-sm max-w-none prose-a:text-primary prose-a:underline prose-p:my-2 prose-ul:my-2">
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => (
                            <a href={href ?? "#"} target="_blank" rel="noopener noreferrer">
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="text-sm text-muted-foreground italic animate-pulse">
                  {t("chat.thinking")}
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-border p-2 bg-card">
              <div className="flex items-end gap-2">
                <Textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={t("chat.placeholder")}
                  className="resize-none min-h-[40px] max-h-[120px] text-sm"
                  disabled={loading}
                />
                <Button
                  size="icon"
                  onClick={send}
                  disabled={loading || !input.trim()}
                  aria-label="Send"
                  className="shrink-0 h-10 w-10"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatAsistente;