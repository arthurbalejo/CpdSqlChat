"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useTheme } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Moon,
  Sun,
  Send,
  Bot,
  User,
  LogOut,
  Plus,
  Trash2,
  Menu,
} from "lucide-react";
import {
  pergunta as enviarPergunta,
  criarChat,
  listarChats,
  buscarChat,
  deletarChat,
  atualizarTituloChat,
} from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type ChatItem = {
  id: number;
  titulo: string;
  criado_em: string;
  atualizado_em: string;
};

type MensagemAPI = {
  id: number;
  role: "user" | "assistant";
  conteudo: string;
  criado_em: string;
};

type Mensagem = {
  role: "user" | "assistant";
  content: string;
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatarData(iso: string): string {
  const d = new Date(iso);
  const hoje = new Date();
  if (d.toDateString() === hoje.toDateString()) return "Hoje";
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);
  if (d.toDateString() === ontem.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
      className="text-white/70 hover:bg-white/10 hover:text-white"
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

// ─── Sidebar ──────────────────────────────────────────────────────────────────

type SidebarProps = {
  chats: ChatItem[];
  chatAtivo: number | null;
  carregando: boolean;
  onNovoChat: () => void;
  onSelecionarChat: (id: number) => void;
  onDeletarChat: (id: number) => void;
  onFechar?: () => void;
};

function SidebarInterna({
  chats,
  chatAtivo,
  carregando,
  onNovoChat,
  onSelecionarChat,
  onDeletarChat,
  onFechar,
}: SidebarProps) {
  return (
    <div className="flex flex-col h-full text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-8 rounded-lg bg-orange/20 shrink-0">
            <Bot className="size-4 text-white" />
          </div>
          <span className="font-semibold text-sm">AcademIA</span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={onNovoChat}
              className="size-8 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Novo chat"
            >
              <Plus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Novo Chat</TooltipContent>
        </Tooltip>
      </div>

      <Separator className="bg-white/10 shrink-0" />

      {/* Chat list */}
      <ScrollArea className="flex-1 px-2 py-2">
        {carregando ? (
          <div className="flex flex-col gap-1.5 px-1 mt-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-11 rounded-lg bg-white/10 animate-pulse" />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <p className="text-white/50 text-xs text-center mt-8 px-4">
            Nenhuma conversa ainda
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {chats.map((chat) => (
              <div key={chat.id} className="group relative">
                <button
                  onClick={() => {
                    onSelecionarChat(chat.id);
                    onFechar?.();
                  }}
                  className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
                    chat.id === chatAtivo ? "bg-white/15" : "hover:bg-white/10"
                  }`}
                >
                  <p className="text-sm truncate pr-6 text-white leading-tight">
                    {chat.titulo}
                  </p>
                  <p className="text-[10px] text-white/50 mt-0.5 leading-tight">
                    {formatarData(chat.atualizado_em)}
                  </p>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletarChat(chat.id);
                  }}
                  aria-label="Deletar conversa"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20 text-white/60 hover:text-white"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Chat() {
  const router = useRouter();

  const [token, setToken] = useState("");
  const [nome, setNome] = useState("");
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [chatAtivo, setChatAtivo] = useState<number | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [perguntaInput, setPerguntaInput] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [carregandoChats, setCarregandoChats] = useState(true);
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [dialogDeletar, setDialogDeletar] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, carregando]);

  // ── Init: read cookies and load chats ──
  useEffect(() => {
    const t = Cookies.get("token");
    const n = Cookies.get("nome") || "";
    if (!t) { router.push("/login"); return; }
    setToken(t);
    setNome(n);

    async function selecionar(id: number) {
      setChatAtivo(id);
      setCarregandoMensagens(true);
      try {
        const data = await buscarChat(t!, id);
        setMensagens(
          (data.mensagens as MensagemAPI[]).map((m) => ({
            role: m.role,
            content: m.conteudo,
          }))
        );
      } catch {
        setMensagens([]);
      } finally {
        setCarregandoMensagens(false);
      }
    }

    (async () => {
      setCarregandoChats(true);
      try {
        const lista: ChatItem[] = await listarChats(t);
        setChats(lista);
        if (lista.length === 0) {
          const novo = await criarChat(t);
          const chatNovo: ChatItem = { ...novo, atualizado_em: novo.criado_em };
          setChats([chatNovo]);
          await selecionar(novo.id);
        } else {
          await selecionar(lista[0].id);
        }
      } catch {
        // mantém estado vazio
      } finally {
        setCarregandoChats(false);
      }
    })();
  }, [router]);

  // ── Handlers ──

  function handleLogout() {
    Cookies.remove("token");
    Cookies.remove("nome");
    Cookies.remove("email");
    router.push("/login");
  }

  async function selecionarChat(id: number) {
    if (!token) return;
    setChatAtivo(id);
    setCarregandoMensagens(true);
    try {
      const data = await buscarChat(token, id);
      setMensagens(
        (data.mensagens as MensagemAPI[]).map((m) => ({
          role: m.role,
          content: m.conteudo,
        }))
      );
    } catch {
      setMensagens([]);
    } finally {
      setCarregandoMensagens(false);
    }
  }

  async function novoChat() {
    if (!token) return;
    try {
      const novo = await criarChat(token);
      const chatNovo: ChatItem = { ...novo, atualizado_em: novo.criado_em };
      setChats((prev) => [chatNovo, ...prev]);
      await selecionarChat(novo.id);
    } catch {
      // silencioso
    }
  }

  async function enviar() {
    if (!perguntaInput.trim() || carregando || !token || !chatAtivo) return;

    const isFirstMessage = mensagens.length === 0;
    const texto = perguntaInput;

    setMensagens((prev) => [...prev, { role: "user", content: texto }]);
    setPerguntaInput("");
    setCarregando(true);

    try {
      const data = await enviarPergunta(texto, token, chatAtivo);
      setMensagens((prev) => [
        ...prev,
        { role: "assistant", content: data.resposta },
      ]);

      if (isFirstMessage) {
        const titulo = texto.trim().split(/\s+/).slice(0, 5).join(" ");
        await atualizarTituloChat(token, chatAtivo, titulo);
        setChats((prev) =>
          prev.map((c) =>
            c.id === chatAtivo
              ? { ...c, titulo, atualizado_em: new Date().toISOString() }
              : c
          )
        );
      } else {
        const agora = new Date().toISOString();
        setChats((prev) =>
          [...prev.map((c) =>
            c.id === chatAtivo ? { ...c, atualizado_em: agora } : c
          )].sort(
            (a, b) =>
              new Date(b.atualizado_em).getTime() -
              new Date(a.atualizado_em).getTime()
          )
        );
      }
    } catch {
      setMensagens((prev) => [
        ...prev,
        { role: "assistant", content: "Erro ao conectar com o servidor." },
      ]);
    } finally {
      setCarregando(false);
    }
  }

  async function confirmarDeletar(id: number) {
    setDialogDeletar(null);
    try {
      await deletarChat(token, id);
      const restantes = chats.filter((c) => c.id !== id);
      setChats(restantes);

      if (chatAtivo === id) {
        if (restantes.length > 0) {
          await selecionarChat(restantes[0].id);
        } else {
          const novo = await criarChat(token);
          const chatNovo: ChatItem = { ...novo, atualizado_em: novo.criado_em };
          setChats([chatNovo]);
          await selecionarChat(novo.id);
        }
      }
    } catch {
      // silencioso
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) enviar();
  }

  const sidebarProps: SidebarProps = {
    chats,
    chatAtivo,
    carregando: carregandoChats,
    onNovoChat: novoChat,
    onSelecionarChat: selecionarChat,
    onDeletarChat: (id) => setDialogDeletar(id),
  };

  // ── Render ──

  return (
    <main className="flex h-screen overflow-hidden">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-navy dark:bg-[oklch(0.19_0.06_250)]">
        <SidebarInterna {...sidebarProps} />
      </aside>

      {/* ── Mobile sheet ── */}
      <Sheet open={sidebarAberta} onOpenChange={setSidebarAberta}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="p-0 w-64 border-0 bg-navy dark:bg-[oklch(0.19_0.06_250)]"
        >
          <SheetTitle className="sr-only">Menu de conversas</SheetTitle>
          <SidebarInterna
            {...sidebarProps}
            onFechar={() => setSidebarAberta(false)}
          />
        </SheetContent>
      </Sheet>

      {/* ── Chat area ── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Header */}
        <header className="shrink-0 bg-navy text-white px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarAberta(true)}
              className="md:hidden text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Abrir menu"
            >
              <Menu className="size-5" />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center size-8 rounded-lg bg-white/15 shrink-0">
                <Bot className="size-4" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-semibold text-sm leading-tight">AcademIA</h1>
                <p className="text-[10px] text-white/60 leading-tight">
                  Assistente de Evasão — UFSM
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1.5 text-xs text-white/60 mr-1">
              <span className="size-1.5 rounded-full bg-orange animate-pulse" />
              <span className="hidden sm:inline">Online</span>
            </span>
            <span className="text-xs text-white/70 hidden sm:inline mr-1">
              {nome.split(" ")[0]}
            </span>
            <ThemeToggle />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-white/70 hover:bg-white/10 hover:text-white"
                  aria-label="Sair"
                >
                  <LogOut className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sair</TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-background dark:bg-background">
          <div className="flex flex-col gap-3 max-w-3xl mx-auto">
            {carregandoMensagens ? (
              <div className="flex flex-col gap-3 mt-6">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex gap-2 ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`h-10 rounded-2xl animate-pulse bg-navy/10 dark:bg-white/10 ${
                        i % 2 === 0 ? "w-2/3" : "w-1/2"
                      }`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {mensagens.length === 0 && !carregando && (
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
                    <div
                      key={i}
                      className="flex items-end justify-end gap-2 self-end max-w-[82%]"
                    >
                      <div className="bg-navy dark:bg-orange text-white px-4 py-2.5 rounded-2xl rounded-br-sm text-sm whitespace-pre-wrap shadow-sm">
                        {msg.content}
                      </div>
                      <div className="flex items-center justify-center size-7 rounded-full bg-navy/15 dark:bg-orange/20 shrink-0">
                        <User className="size-3.5 text-navy dark:text-orange" />
                      </div>
                    </div>
                  ) : (
                    <div
                      key={i}
                      className="flex items-start gap-2 self-start max-w-[82%]"
                    >
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
              </>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-navy/20 dark:border-white/10 bg-white dark:bg-[oklch(0.19_0.06_250)] px-4 py-3">
          <div className="flex gap-2 items-center max-w-3xl mx-auto">
            <Input
              placeholder="Digite sua pergunta..."
              value={perguntaInput}
              onChange={(e) => setPerguntaInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={carregando || !chatAtivo}
              className="h-10 flex-1 rounded-xl bg-background dark:bg-[oklch(0.22_0.06_250)] border-navy/25 dark:border-white/15 text-navy dark:text-white placeholder:text-navy/40 dark:placeholder:text-white/40 focus-visible:ring-orange/50 focus-visible:border-orange"
            />
            <Button
              onClick={enviar}
              disabled={carregando || !perguntaInput.trim() || !chatAtivo}
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
      </div>

      {/* ── Delete confirmation dialog ── */}
      <Dialog
        open={dialogDeletar !== null}
        onOpenChange={(open) => !open && setDialogDeletar(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar conversa?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Todas as mensagens serão perdidas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogDeletar(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                dialogDeletar !== null && confirmarDeletar(dialogDeletar)
              }
            >
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
