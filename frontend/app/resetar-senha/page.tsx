"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Bot, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

function ResetarSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleResetar() {
    setErro("");

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem");
      return;
    }
    if (novaSenha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setCarregando(true);
    try {
      const res = await fetch("http://localhost:5000/auth/resetar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nova_senha: novaSenha }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Token inválido ou expirado");
      }

      setSucesso(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao resetar senha");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <CardContent className="px-5 py-6 flex flex-col gap-4">
      {sucesso ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="flex items-center justify-center size-14 rounded-2xl bg-orange/10">
            <CheckCircle className="size-7 text-orange" />
          </div>
          <p className="text-sm font-medium text-navy dark:text-white">
            Senha alterada com sucesso!
          </p>
          <p className="text-xs text-navy/60 dark:text-white/50">
            Redirecionando para o login...
          </p>
        </div>
      ) : (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-navy dark:text-white">
              Resetar senha
            </p>
            <p className="text-xs text-navy/60 dark:text-white/50 mt-1">
              Digite o token recebido e sua nova senha
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="token" className="text-xs text-navy/70 dark:text-white/70">
                Token de recuperação
              </Label>
              <Input
                id="token"
                placeholder="Cole o token aqui"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="h-10 rounded-xl bg-background dark:bg-[oklch(0.22_0.06_250)] border-navy/25 dark:border-white/15 text-navy dark:text-white placeholder:text-navy/40 dark:placeholder:text-white/40 focus-visible:ring-orange/50 focus-visible:border-orange"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="novaSenha" className="text-xs text-navy/70 dark:text-white/70">
                Nova senha
              </Label>
              <div className="relative">
                <Input
                  id="novaSenha"
                  placeholder="••••••••"
                  type={mostrarSenha ? "text" : "password"}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="h-10 rounded-xl bg-background dark:bg-[oklch(0.22_0.06_250)] border-navy/25 dark:border-white/15 text-navy dark:text-white placeholder:text-navy/40 dark:placeholder:text-white/40 focus-visible:ring-orange/50 focus-visible:border-orange pr-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/40 dark:text-white/40 hover:text-navy dark:hover:text-white"
                >
                  {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmar" className="text-xs text-navy/70 dark:text-white/70">
                Confirmar nova senha
              </Label>
              <Input
                id="confirmar"
                placeholder="••••••••"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleResetar()}
                className="h-10 rounded-xl bg-background dark:bg-[oklch(0.22_0.06_250)] border-navy/25 dark:border-white/15 text-navy dark:text-white placeholder:text-navy/40 dark:placeholder:text-white/40 focus-visible:ring-orange/50 focus-visible:border-orange"
              />
            </div>
          </div>

          {erro && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs px-3 py-2 rounded-xl border border-red-200 dark:border-red-800">
              {erro}
            </div>
          )}

          <Button
            onClick={handleResetar}
            disabled={carregando || !token || !novaSenha || !confirmarSenha}
            className="w-full h-10 rounded-xl bg-orange text-white hover:bg-orange/90 border-0 shadow-sm disabled:opacity-40"
          >
            {carregando ? "Alterando..." : "Alterar senha"}
          </Button>
        </>
      )}

      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-xs text-navy/60 dark:text-white/50 hover:text-navy dark:hover:text-white"
      >
        <ArrowLeft className="size-3" />
        Voltar para o login
      </Link>
    </CardContent>
  );
}

export default function ResetarSenha() {
  return (
    <main className="flex h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-xl border-navy/20 dark:border-white/10">
        <CardHeader className="bg-navy text-white rounded-t-xl px-5 py-4">
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
        </CardHeader>
        <Suspense fallback={<div className="p-6 text-center text-sm text-navy/60">Carregando...</div>}>
          <ResetarSenhaForm />
        </Suspense>
      </Card>
    </main>
  );
}