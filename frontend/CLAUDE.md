# CLAUDE.md — Frontend (AcademIA)

## Stack
- **Next.js 16.2.4** com App Router (não Pages Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4** (sem `tailwind.config.js` — configuração via CSS)
- **Shadcn/ui** estilo `radix-nova`, componentes em `components/ui/`
- **js-cookie** — auth token em cookies (não localStorage)
- **lucide-react** — ícones

> **ATENÇÃO**: Next.js 16 tem breaking changes em relação ao Next.js 13/14/15. Consulte `node_modules/next/dist/docs/` antes de usar APIs que possam ter mudado.

---

## Estrutura de Arquivos

```
frontend/
├── app/
│   ├── layout.tsx              # Layout raiz: Geist fonts, script anti-flash dark
│   ├── providers.tsx           # ThemeProvider + TooltipProvider (wraps toda a app)
│   ├── globals.css             # Variáveis CSS do tema (navy, orange, backgrounds)
│   ├── page.tsx                # Redirect: /chat se token existe, /login caso contrário
│   ├── chat/page.tsx           # Página principal — sidebar + mensagens + input
│   ├── login/page.tsx          # Formulário de login
│   ├── register/page.tsx       # Formulário de cadastro
│   ├── esqueci-senha/page.tsx  # Solicitar recuperação de senha
│   └── resetar-senha/page.tsx  # Redefinir senha com token (usa Suspense + useSearchParams)
├── components/ui/              # Componentes Shadcn (não editar manualmente)
│   ├── avatar.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── scroll-area.tsx
│   ├── separator.tsx
│   ├── sheet.tsx
│   └── tooltip.tsx
├── lib/
│   ├── api.ts                  # Todas as chamadas HTTP centralizadas
│   └── utils.ts                # cn() = clsx + tailwind-merge
├── components.json             # Config Shadcn (estilo radix-nova, aliases @/components etc.)
├── next.config.ts              # Vazio — sem customizações
├── package.json
└── tsconfig.json
```

---

## Sistema de Cores

Definido em `app/globals.css` como custom properties CSS consumidas pelo Tailwind v4.

### Cores fixas (não mudam com dark/light)
| Token Tailwind | Valor oklch            | Uso                                          |
|---------------|------------------------|----------------------------------------------|
| `navy`        | `oklch(0.28 0.09 245)` | Sidebar, header, balões do usuário (light), textos primários |
| `orange`      | `oklch(0.65 0.18 45)`  | CTAs, ícone bot, links, ring de foco, balões do usuário (dark) |

### Background
| Modo  | Valor                   |
|-------|-------------------------|
| Light | `oklch(0.87 0.04 245)` — azul claro (não branco neutro) |
| Dark  | `oklch(0.14 0.04 250)` — azul escuro profundo |

### Classes mais usadas no código
- `bg-navy`, `text-white` — sidebar e header
- `bg-orange`, `hover:bg-orange/90` — botões primários
- `text-orange` — links e ícone bot
- `bg-orange/10`, `text-orange` — avatar do bot
- `border-navy/20`, `border-white/10` — bordas adaptadas ao tema
- `text-navy/60`, `text-white/50` — textos secundários
- `focus-visible:ring-orange/50 focus-visible:border-orange` — padrão de foco nos inputs
- `dark:bg-[oklch(0.22_0.06_250)]` — inputs no dark mode (valor raw porque não é um token)
- `dark:bg-[oklch(0.26_0.08_250)]` — card de mensagem assistant no dark
- `dark:bg-[oklch(0.19_0.06_250)]` — sidebar e input bar no dark

---

## Autenticação e Sessão

Após login bem-sucedido, 3 cookies são gravados com `js-cookie` (expiram em 1 dia):
- `token` — JWT Bearer
- `nome` — nome do usuário
- `email` — email do usuário

`app/page.tsx` lê o cookie `token` e redireciona. `app/chat/page.tsx` faz o mesmo no `useEffect` inicial — se não há token, empurra para `/login`.

Logout: remove os 3 cookies e redireciona para `/login`.

---

## `lib/api.ts` — Funções Disponíveis

```typescript
login(email, senha)                          // POST /auth/login (form-urlencoded)
register(nome, email, senha)                 // POST /auth/register
pergunta(texto, token, chatId)               // POST /api/pergunta
criarChat(token, titulo?)                    // POST /api/chat
listarChats(token)                           // GET /api/chats
buscarChat(token, chatId)                    // GET /api/chat/{id}
deletarChat(token, chatId)                   // DELETE /api/chat/{id}
atualizarTituloChat(token, chatId, titulo)   // PATCH /api/chat/{id}
```

`API_URL` está hardcoded como `http://localhost:5000`. Para produção, extrair para variável de ambiente.

**Nota**: `esqueci-senha/page.tsx` e `resetar-senha/page.tsx` fazem `fetch` diretamente (sem `lib/api.ts`) porque não têm token e usam URLs de auth não prefixadas com `/api`.

---

## Dark Mode

- Gerenciado por `ThemeProvider` em `app/providers.tsx`
- Usa classe `.dark` no `<html>` (Tailwind variant `dark:`)
- Preferência em `localStorage('theme')`
- Script inline no `<head>` (`layout.tsx`) aplica `.dark` antes da hidratação para evitar flash
- `suppressHydrationWarning` no `<html>` para silenciar aviso do React 19

---

## Página do Chat (`app/chat/page.tsx`)

### Layout
```
<main flex h-screen>
  <aside w-64>        ← Sidebar desktop (md+), bg-navy
  <Sheet side="left"> ← Sidebar mobile, mesmo conteúdo (SidebarInterna)
  <div flex-1>
    <header>          ← bg-navy: logo, nome, ThemeToggle, LogOut
    <div overflow-y-auto> ← área de mensagens, max-w-3xl mx-auto
    <div shrink-0>    ← barra de input + botão Send
  </div>
  <Dialog>            ← confirmação de delete
</main>
```

### Componentes internos
- `SidebarInterna` — recebe props, não tem estado próprio; usada pelo aside desktop e pelo Sheet mobile
- `ThemeToggle` — botão com `Sun`/`Moon`, monta só no cliente (evita hydration mismatch)
- `LoadingDots` — 3 spans com `animate-bounce` e delays escalonados (`[animation-delay:-0.3s]`)

### Lógica de título automático
Na primeira mensagem de um chat (quando `mensagens.length === 0` antes do envio):
```typescript
const titulo = texto.trim().split(/\s+/).slice(0, 5).join(" ")
await atualizarTituloChat(token, chatAtivo, titulo)
```

### Ordenação de chats
Após cada resposta, o array de chats é re-ordenado por `atualizado_em DESC` no estado local — sem refetch.

---

## Padrões de Código

### Inputs (padrão consistente em todas as páginas)
```tsx
className="h-10 rounded-xl bg-background dark:bg-[oklch(0.22_0.06_250)] border-navy/25 dark:border-white/15 text-navy dark:text-white placeholder:text-navy/40 dark:placeholder:text-white/40 focus-visible:ring-orange/50 focus-visible:border-orange"
```

### Botões primários
```tsx
className="w-full h-10 rounded-xl bg-orange text-white hover:bg-orange/90 border-0 shadow-sm disabled:opacity-40"
```

### Cards de autenticação
Todas as páginas de auth (login, register, esqueci-senha, resetar-senha) usam o mesmo padrão:
- `Card` com `max-w-sm shadow-xl border-navy/20`
- `CardHeader` com `bg-navy text-white rounded-t-xl` contendo logo + título
- `CardContent` com formulário

### Error display
```tsx
<div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs px-3 py-2 rounded-xl border border-red-200 dark:border-red-800">
  {erro}
</div>
```

### Skeleton loading
Sidebar usa `animate-pulse` com `bg-white/10`. Mensagens usam divs com `animate-pulse bg-navy/10 dark:bg-white/10`.

### `useSearchParams` e Suspense
`resetar-senha/page.tsx` encapsula o form em `<Suspense>` por ser obrigação do Next.js App Router ao usar `useSearchParams()`.

---

## Comandos

```bash
npm install      # Instalar dependências
npm run dev      # Dev server em :3000
npm run build    # Build de produção
npm run start    # Servidor de produção
npm run lint     # ESLint

# Instalar novo componente Shadcn
npx shadcn add <componente>
```

## Adicionando Componentes Shadcn
Configuração em `components.json`. Sempre usar:
```bash
npx shadcn add <nome>
```
Nunca editar os arquivos em `components/ui/` manualmente — eles são gerados.
