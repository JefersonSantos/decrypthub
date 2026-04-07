# 🔐 DecryptHub

Plataforma SaaS para gerenciamento e descriptografia automática de webhooks ClickBank.

## Funcionalidades

- ✅ Recebe webhooks criptografados do ClickBank
- ✅ Descriptografia automática via AES-256-CBC + SHA1
- ✅ Repasse para URL de destino configurada
- ✅ Logs de execução com payload completo
- ✅ Autenticação via Supabase (email/senha + Google)
- ✅ Billing com Stripe (4 planos + trial)
- ✅ Interface bilíngue PT/EN

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React + Vite + TailwindCSS |
| Backend | Node.js + Express |
| Banco | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Pagamentos | Stripe |

---

## Instalação

### 1. Clone e instale dependências

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **SQL Editor** e execute o conteúdo de `supabase/migration.sql`
3. Em **Authentication → Providers**, habilite **Google** se desejar
4. Copie a **URL** e as **chaves** do projeto

### 3. Configure o Stripe

1. Crie uma conta em [stripe.com](https://stripe.com)
2. Crie 3 produtos com preços recorrentes (Starter $19, Pro $49, Enterprise $199)
3. Copie os `price_id` de cada produto
4. Configure o webhook do Stripe apontando para `https://sua-api.com/stripe/webhook`
   - Eventos: `customer.subscription.*`, `invoice.payment_*`

### 4. Configure as variáveis de ambiente

**Backend:**
```bash
cd backend
cp .env.example .env
# Edite o .env com suas chaves
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
# Edite o .env com suas chaves
```

### 5. Execute localmente

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Acesse: http://localhost:5173

---

## Deploy no VPS (Docker Swarm)

### Backend

```dockerfile
# backend/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### Frontend

```bash
cd frontend
npm run build
# Servir o dist/ via Nginx
```

### Stack Docker Swarm

```yaml
version: "3.7"
services:
  decrypthub_api:
    image: sua-registry/decrypthub-api:latest
    environment:
      - PORT=3000
      - SUPABASE_URL=...
      - SUPABASE_SERVICE_KEY=...
      - STRIPE_SECRET_KEY=...
      - STRIPE_WEBHOOK_SECRET=...
      - STRIPE_PRICE_STARTER=...
      - STRIPE_PRICE_PRO=...
      - STRIPE_PRICE_ENTERPRISE=...
      - ENCRYPTION_KEY=...
      - FRONTEND_URL=https://decrypthub.seudominio.com
    networks:
      - MaiverNet
    deploy:
      labels:
        - traefik.enable=true
        - traefik.http.routers.decrypthub_api.rule=Host(`api.decrypthub.seudominio.com`)
        - traefik.http.routers.decrypthub_api.entrypoints=websecure
        - traefik.http.routers.decrypthub_api.tls.certresolver=letsencryptresolver
        - traefik.http.services.decrypthub_api.loadbalancer.server.port=3000

networks:
  MaiverNet:
    external: true
```

---

## Como funciona a descriptografia

O ClickBank envia o payload em dois campos:
- `notification` — payload criptografado em base64
- `iv` — vetor de inicialização em base64

O algoritmo usado é:

```
SHA1(secretKey) → hexdigest → primeiros 32 chars → Buffer UTF-8 → chave AES-256-CBC
```

Em Node.js:
```javascript
const sha1hex = crypto.createHash('sha1').update(secretKey).digest('hex');
const key = Buffer.from(sha1hex.slice(0, 32), 'utf8');
const decipher = crypto.createDecipheriv('aes-256-cbc', key, ivBuffer);
```

---

## Configurar webhook no ClickBank

1. **ClickBank → Accounts → [sua conta] → Settings → My Site**
2. Em **Instant Notification URL**, coloque: `https://api.seudominio.com/webhook/[slug]`
3. O slug é gerado automaticamente ao criar o webhook no DecryptHub
4. A **Secret Key** configurada aqui deve ser a mesma cadastrada no DecryptHub

---

## Planos

| Plano | Preço | Webhooks | Requisições/mês | Logs |
|-------|-------|----------|-----------------|------|
| Free | $0 | 1 | 500 | 24h |
| Starter | $19 | 5 | 10.000 | 7 dias |
| Pro | $49 | 20 | 100.000 | 30 dias |
| Enterprise | $199 | ∞ | ∞ | 90 dias |
