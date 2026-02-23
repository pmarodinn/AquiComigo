# Backend AquiComigo - Mini E-commerce

API simples para checkout de produtos usando Mercado Pago.

## Setup

1. Entre na pasta: `cd backend`
2. Instale dependências: `npm install`
3. Copie o arquivo de variáveis: `cp .env.example .env`
4. Configure sua chave do Mercado Pago no `.env`:
   - `MP_ACCESS_TOKEN`: Sua chave de acesso de produção ou teste.

## Rodando

- Desenvolvimento: `npm run dev`
- Produção: `npm start`

O servidor rodará em `http://localhost:3000`.

## Endpoints

- `GET /api/products`: Lista produtos
- `POST /api/create_preference`: Cria checkout. Body: `{ "productId": "kit-essencial" }`
- `POST /api/webhook`: Recebe notificações do Mercado Pago.

## Banco de Dados

Usa SQLite (`aquicomigo.db`). O arquivo será criado automaticamente na primeira execução.

## Testando Webhook Localmente

Use o **Stripe CLI** ou **Ngrok** para expor sua porta 3000 e configure a URL no Mercado Pago:
`https://sua-url-ngrok.io/api/webhook`
