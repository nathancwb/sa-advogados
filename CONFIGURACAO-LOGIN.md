# Configuração do login do painel (responsável técnico)

O painel (`/admin`) usa o **Sveltia CMS** salvando o conteúdo no próprio
repositório Git. O login foi trocado de "OAuth do GitHub" para
**e-mail + senha**, para que a dona do site não precise de conta no GitHub
nem de permissões no repositório.

Toda a configuração fica em **variáveis de ambiente da Vercel** — nada de
serviço externo, nada de Supabase, nada centralizado. Cada site cliente é
independente: basta repetir esses passos no projeto dele.

> **Esta configuração é feita UMA vez.** Depois, a dona do site só usa
> e-mail e senha.

---

## Passo 1 — Criar a chave do repositório (GitHub Token)

O CMS precisa de uma chave para gravar o conteúdo no repositório.

1. Acesse: GitHub → **Settings** → **Developer settings** →
   **Personal access tokens** → **Fine-grained tokens** →
   **Generate new token**.
2. Configure:
   - **Resource owner:** `nathancwb`
   - **Repository access:** *Only select repositories* → **`sa-advogados`**
   - **Permissions → Repository permissions → Contents:** *Read and write*
     (o "Metadata: Read-only" é exigido automaticamente — pode deixar)
   - **Expiration:** escolha o prazo (ex.: 1 ano). ⚠️ Quando expirar, é
     preciso gerar outro e atualizar a variável `GITHUB_TOKEN`.
3. Clique em **Generate token** e **copie** o valor (começa com `github_pat_…`).

---

## Passo 2 — Gerar o hash da senha

No seu computador, dentro da pasta do projeto:

```bash
node scripts/gerar-senha.js "a-senha-escolhida-para-a-dona"
```

Copie a linha `ADMIN_PASSWORD_HASH=...` que aparecer. A senha em si nunca é
salva — só o hash.

---

## Passo 3 — Definir as variáveis na Vercel

No painel da Vercel: projeto **sa-advogados** → **Settings** →
**Environment Variables**. Adicione (ambiente **Production**):

| Variável | Valor |
|---|---|
| `GITHUB_TOKEN` | o token do Passo 1 (`github_pat_…`) |
| `ADMIN_EMAIL` | o e-mail de login da dona do site |
| `ADMIN_PASSWORD_HASH` | o valor gerado no Passo 2 (`saltHex:hashHex`) |

Variáveis antigas que **podem ser removidas** (não são mais usadas):
`GH_CLIENT_ID`, `GH_CLIENT_SECRET`.

---

## Passo 4 — Publicar

Faça um **Redeploy** na Vercel (ou um novo push) para as variáveis valerem.
Pronto: acesse `https://www.saadvogados.com/admin` e teste o login com o
e-mail e a senha definidos.

---

## Trocar a senha depois

Rode o `scripts/gerar-senha.js` com a nova senha e atualize o valor de
`ADMIN_PASSWORD_HASH` na Vercel + Redeploy.

---

## Observação de segurança

Por ser um CMS baseado em Git, o `GITHUB_TOKEN` é entregue ao navegador de
quem faz login (é assim que o Sveltia grava no repositório). Por isso o token
é **fine-grained, limitado a este único repositório e só a Contents** — o
estrago possível, no pior caso, se resume a editar o conteúdo deste site, e o
token é revogável a qualquer momento no GitHub.

Se no futuro quiser **zero exposição do token** (commits feitos só no
servidor), dá para evoluir para um painel próprio com API de gravação
server-side — é um trabalho maior, mas possível.
