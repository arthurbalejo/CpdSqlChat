const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"

function authHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }
}

export async function login(email: string, senha: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: email, password: senha }),
  })
  if (!res.ok) throw new Error("Email ou senha incorretos")
  return res.json()
}

export async function register(nome: string, email: string, senha: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, email, senha }),
  })
  if (!res.ok) throw new Error("Erro ao criar conta")
  return res.json()
}

export async function pergunta(texto: string, token: string, chatId: number) {
  const res = await fetch(`${API_URL}/api/pergunta`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ pergunta: texto, chat_id: chatId }),
  })
  if (!res.ok) throw new Error("Erro ao enviar pergunta")
  return res.json()
}

export async function criarChat(token: string, titulo = "Novo Chat") {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ titulo }),
  })
  if (!res.ok) throw new Error("Erro ao criar chat")
  return res.json()
}

export async function listarChats(token: string) {
  const res = await fetch(`${API_URL}/api/chats`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error("Erro ao listar chats")
  return res.json()
}

export async function buscarChat(token: string, chatId: number) {
  const res = await fetch(`${API_URL}/api/chat/${chatId}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error("Erro ao buscar chat")
  return res.json()
}

export async function deletarChat(token: string, chatId: number) {
  const res = await fetch(`${API_URL}/api/chat/${chatId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error("Erro ao deletar chat")
  return res.json()
}

export async function atualizarTituloChat(token: string, chatId: number, titulo: string) {
  const res = await fetch(`${API_URL}/api/chat/${chatId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ titulo }),
  })
  if (!res.ok) throw new Error("Erro ao atualizar chat")
  return res.json()
}
