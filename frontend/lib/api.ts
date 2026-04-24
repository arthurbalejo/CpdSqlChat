const API_URL = "http://localhost:5000"

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

export async function pergunta(texto: string, token: string) {
  const res = await fetch(`${API_URL}/api/pergunta`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ pergunta: texto }),
  })
  if (!res.ok) throw new Error("Erro ao enviar pergunta")
  return res.json()
}