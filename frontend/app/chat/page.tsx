"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Moon, Sun, Send, Bot, User, LogOut } from "lucide-react";
import { pergunta as enviarPergunta } from "@/lib/api";

type Mensagem = {
  role: "user" | "assistant";
  content: string;
};

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="size-8" />;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
      aria-label="Alternar modo escuro"
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-start gap-2 self-start max-w-[80%]">
      <div className="flex items-center justify-center size-7 rounded-full bg-orange/10 shrink-0 mt-0.5">
        <Bot className="size-4 text-orange" />
      </div>
      <div className="bg-white dark:bg-[oklch(0.26_0.08_250)] border border-navy/20 dark:border-white/10 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
        <div className="flex gap-1 items-center h-4">
          <span className="size-2 rounded-full bg-navy/40 dark:bg-white/40 animate-bounce [animation-delay:-0.3s]" />
          <span className="size-2 rounded-full bg-navy/40 dark:bg-white/40 animate-bounce [animation-delay:-0.15s]" />
          <span className="size-2 rounded-full bg-navy/40 dark:bg-white/40 animate-bounce" />
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const router = useRouter();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [pergunta, setPergunta] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [nome, setNome] = useState("");        // ← vira estado
  const [token, setToken] = useState("");      // ← vira estado
  const bottomRef = useRef<HTMLDivElement>(null);

  // Lê os cookies só no cliente
  useEffect(() => {
    const t = Cookies.get("token");
    const n = Cookies.get("nome") || "";
    if (!t) {
      router.push("/login");
    } else {
      setToken(t);
      setNome(n);
    }
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, carregando]);

  function handleLogout() {
    Cookies.remove("token");
    Cookies.remove("nome");
    Cookies.remove("email");
    router.push("/login");
  }
  
  async function enviar() {
    if (!pergunta.trim() || carregando || !token) return;

    const novaMensagem: Mensagem = { role: "user", content: pergunta };
    setMensagens((prev) => [...prev, novaMensagem]);
    setPergunta("");
    setCarregando(true);

    try {
      const data = await enviarPergunta(pergunta, token);
      setMensagens((prev) => [
        ...prev,
        { role: "assistant", content: data.resposta },
      ]);
    } catch {
      setMensagens((prev) => [
        ...prev,
        { role: "assistant", content: "Erro ao conectar com o servidor." },
      ]);
    } finally {
      setCarregando(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) enviar();
  }

  return (
    <main className="flex h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl flex flex-col shadow-xl border-navy/20 dark:border-white/10" style={{ height: "90vh" }}>

        <CardHeader className="bg-navy text-white rounded-t-xl shrink-0 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-9 rounded-xl bg-white/15 shadow-inner">
                <Bot className="size-5" />
              </div>
              <div>
                <h1 className="font-semibold text-base leading-tight">BEE IA</h1>
                <p className="text-xs text-white/70 leading-tight">
                  Assistente de Evasão — UFSM
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-white/70">{nome.split(" ")[0]}</span>
              <span className="flex items-center gap-1.5 text-xs text-white/60">
                <span className="size-1.5 rounded-full bg-orange animate-pulse" />
                Online
              </span>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-white/70 hover:bg-white/10 hover:text-white"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col flex-1 overflow-hidden p-0">
          <div className="flex-1 overflow-y-auto px-4 py-4 bg-background dark:bg-background">
            <div className="flex flex-col gap-3">
              {mensagens.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 mt-12 text-center px-4">
                  <div className="flex items-center justify-center size-14 rounded-2xl bg-navy/10 dark:bg-navy/30">
                    <Bot className="size-7 text-navy dark:text-orange" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-navy dark:text-white">
                      Olá, {nome.split(" ")[0]}! Como posso te ajudar?
                    </p>
                    <p className="text-xs text-navy/60 dark:text-white/50 mt-1">
                      Faça uma pergunta sobre evasão universitária na UFSM.
                    </p>
                  </div>
                </div>
              )}

              {mensagens.map((msg, i) =>
                msg.role === "user" ? (
                  <div key={i} className="flex items-end justify-end gap-2 self-end max-w-[82%]">
                    <div className="bg-navy dark:bg-orange text-white px-4 py-2.5 rounded-2xl rounded-br-sm text-sm whitespace-pre-wrap shadow-sm">
                      {msg.content}
                    </div>
                    <div className="flex items-center justify-center size-7 rounded-full bg-navy/15 dark:bg-orange/20 shrink-0">
                      <User className="size-3.5 text-navy dark:text-orange" />
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex items-start gap-2 self-start max-w-[82%]">
                    <div className="flex items-center justify-center size-7 rounded-full bg-orange/10 shrink-0 mt-0.5">
                      <Bot className="size-4 text-orange" />
                    </div>
                    <div className="bg-white text-navy border border-navy/20 dark:bg-[oklch(0.26_0.08_250)] dark:text-white dark:border-white/10 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm whitespace-pre-wrap shadow-sm">
                      {msg.content}
                    </div>
                  </div>
                )
              )}

              {carregando && <LoadingDots />}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="shrink-0 border-t border-navy/20 dark:border-white/10 bg-white dark:bg-[oklch(0.19_0.06_250)] px-4 py-3">
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Digite sua pergunta..."
                value={pergunta}
                onChange={(e) => setPergunta(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={carregando}
                className="h-10 flex-1 rounded-xl bg-background dark:bg-[oklch(0.22_0.06_250)] border-navy/25 dark:border-white/15 text-navy dark:text-white placeholder:text-navy/40 dark:placeholder:text-white/40 focus-visible:ring-orange/50 focus-visible:border-orange"
              />
              <Button
                onClick={enviar}
                disabled={carregando || !pergunta.trim()}
                size="icon"
                className="size-10 rounded-xl shrink-0 bg-orange text-white hover:bg-orange/90 border-0 shadow-sm disabled:opacity-40"
              >
                <Send className="size-4" />
              </Button>
            </div>
            <p className="text-[10px] text-navy/50 dark:text-white/40 text-center mt-2">
              Pressione Enter para enviar
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}