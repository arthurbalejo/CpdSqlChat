"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Bot, Eye, EyeOff } from "lucide-react";
import { login } from "@/lib/api";
import Cookies from "js-cookie";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleLogin() {
    setErro("");
    setCarregando(true);
    try {
      const data = await login(email, senha);
      Cookies.set("token", data.access_token, { expires: 1 });
      Cookies.set("nome", data.nome, { expires: 1 });
      Cookies.set("email", data.email, { expires: 1 });
      router.push("/chat");
    } catch {
      setErro("Email ou senha incorretos");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="flex h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-xl border-navy/20 dark:border-white/10">

        {/* Header igual ao chat */}
        <CardHeader className="bg-navy text-white rounded-t-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-xl bg-white/15 shadow-inner">
              <Bot className="size-5" />
            </div>
            <div>
              <h1 className="font-semibold text-base leading-tight">AcademIA</h1>
              <p className="text-xs text-white/70 leading-tight">
                Assistente de Evasão — UFSM
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-5 py-6 flex flex-col gap-4">
          <div className="text-center">
            <p className="text-sm font-medium text-navy dark:text-white">
              Bem-vindo de volta
            </p>
            <p className="text-xs text-navy/60 dark:text-white/50 mt-1">
              Entre com sua conta para continuar
            </p>
          </div>

          <div className="flex flex-col gap-3">
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
                className="h-10 rounded-xl bg-background dark:bg-[oklch(0.22_0.06_250)] border-navy/25 dark:border-white/15 text-navy dark:text-white placeholder:text-navy/40 dark:placeholder:text-white/40 focus-visible:ring-orange/50 focus-visible:border-orange"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="senha" className="text-xs text-navy/70 dark:text-white/70">
                  Senha
                </Label>
                <Link
                  href="/esqueci-senha"
                  className="text-xs text-orange hover:underline"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="senha"
                  placeholder="••••••••"
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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
          </div>

          {erro && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs px-3 py-2 rounded-xl border border-red-200 dark:border-red-800">
              {erro}
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={carregando || !email || !senha}
            className="w-full h-10 rounded-xl bg-orange text-white hover:bg-orange/90 border-0 shadow-sm disabled:opacity-40"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-navy/15 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-2 text-xs text-navy/40 dark:text-white/40">
                ou
              </span>
            </div>
          </div>

          <p className="text-xs text-center text-navy/60 dark:text-white/50">
            Não tem conta?{" "}
            <Link href="/register" className="text-orange font-medium hover:underline">
              Cadastre-se
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}