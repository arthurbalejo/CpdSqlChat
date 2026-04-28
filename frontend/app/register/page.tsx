"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Bot, Eye, EyeOff } from "lucide-react";
import { register } from "@/lib/api";
import Link from "next/link";

export default function Register() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleRegister() {
    setErro("");

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem");
      return;
    }
    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setCarregando(true);
    try {
      await register(nome, email, senha);
      router.push("/login");
    } catch {
      setErro("Erro ao criar conta. Tente outro email.");
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
              Criar conta
            </p>
            <p className="text-xs text-navy/60 dark:text-white/50 mt-1">
              Preencha os dados para se cadastrar
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nome" className="text-xs text-navy/70 dark:text-white/70">
                Nome completo
              </Label>
              <Input
                id="nome"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="h-10 rounded-xl bg-background dark:bg-[oklch(0.22_0.06_250)] border-navy/25 dark:border-white/15 text-navy dark:text-white placeholder:text-navy/40 dark:placeholder:text-white/40 focus-visible:ring-orange/50 focus-visible:border-orange"
              />
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
                className="h-10 rounded-xl bg-background dark:bg-[oklch(0.22_0.06_250)] border-navy/25 dark:border-white/15 text-navy dark:text-white placeholder:text-navy/40 dark:placeholder:text-white/40 focus-visible:ring-orange/50 focus-visible:border-orange"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="senha" className="text-xs text-navy/70 dark:text-white/70">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="senha"
                  placeholder="••••••••"
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
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
                Confirmar senha
              </Label>
              <Input
                id="confirmar"
                placeholder="••••••••"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
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
            onClick={handleRegister}
            disabled={carregando || !nome || !email || !senha || !confirmarSenha}
            className="w-full h-10 rounded-xl bg-orange text-white hover:bg-orange/90 border-0 shadow-sm disabled:opacity-40"
          >
            {carregando ? "Criando conta..." : "Criar conta"}
          </Button>

          <p className="text-xs text-center text-navy/60 dark:text-white/50">
            Já tem conta?{" "}
            <Link href="/login" className="text-orange font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}