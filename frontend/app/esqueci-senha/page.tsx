"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Bot, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleEnviar() {
    setErro("");
    setCarregando(true);
    try {
      await fetch(`http://localhost:5000/auth/esqueci-senha?email=${encodeURIComponent(email)}`, {
        method: "POST",
      });
      setEnviado(true);
    } catch {
      setErro("Erro ao processar solicitação. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

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

        <CardContent className="px-5 py-6 flex flex-col gap-4">
          {enviado ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex items-center justify-center size-14 rounded-2xl bg-orange/10">
                <CheckCircle className="size-7 text-orange" />
              </div>
              <p className="text-sm font-medium text-navy dark:text-white">
                Solicitação enviada!
              </p>
              <p className="text-xs text-navy/60 dark:text-white/50">
                Se o email existir, as instruções foram enviadas.
                Verifique o terminal do servidor para obter o token.
              </p>
              <Link
                href="/resetar-senha"
                className="text-xs text-orange font-medium hover:underline mt-2"
              >
                Já tenho o token → Resetar senha
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center">
                <p className="text-sm font-medium text-navy dark:text-white">
                  Recuperar senha
                </p>
                <p className="text-xs text-navy/60 dark:text-white/50 mt-1">
                  Digite seu email para receber as instruções
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-xs text-navy/70 dark:text-white/70">
                  Email
                </Label>
                <Input
                  id="email"
                  placeholder="seu@email.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEnviar()}
                  className="h-10 rounded-xl bg-background dark:bg-[oklch(0.22_0.06_250)] border-navy/25 dark:border-white/15 text-navy dark:text-white placeholder:text-navy/40 dark:placeholder:text-white/40 focus-visible:ring-orange/50 focus-visible:border-orange"
                />
              </div>

              {erro && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs px-3 py-2 rounded-xl border border-red-200 dark:border-red-800">
                  {erro}
                </div>
              )}

              <Button
                onClick={handleEnviar}
                disabled={carregando || !email}
                className="w-full h-10 rounded-xl bg-orange text-white hover:bg-orange/90 border-0 shadow-sm disabled:opacity-40"
              >
                {carregando ? "Enviando..." : "Enviar instruções"}
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
      </Card>
    </main>
  );
}