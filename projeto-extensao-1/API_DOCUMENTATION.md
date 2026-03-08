# API de Agendamento — Barbearia

Documentação completa da API REST construída com **Next.js 16 (App Router)**, **MongoDB** (via Mongoose) e autenticação via **JWT**.

---

## Sumário

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Configuração e Variáveis de Ambiente](#2-configuração-e-variáveis-de-ambiente)
3. [Correções no docker-compose](#3-correções-no-docker-compose)
4. [Modelos de Dados (Schemas MongoDB)](#4-modelos-de-dados-schemas-mongodb)
5. [Autenticação JWT](#5-autenticação-jwt)
6. [Rotas Públicas — Área do Cliente](#6-rotas-públicas--área-do-cliente)
7. [Rota de Login — Área do Barbeiro](#7-rota-de-login--área-do-barbeiro)
8. [Rotas Protegidas — Área do Barbeiro](#8-rotas-protegidas--área-do-barbeiro)
9. [Rota de Seed (Dados Iniciais)](#9-rota-de-seed-dados-iniciais)
10. [Fluxo Completo de Uso](#10-fluxo-completo-de-uso)
11. [Códigos de Status HTTP](#11-códigos-de-status-http)
12. [Estrutura de Arquivos Criados](#12-estrutura-de-arquivos-criados)

---

## 1. Visão Geral da Arquitetura

O sistema é dividido em dois contextos:

| Contexto | Necessita Login | Função |
|---|---|---|
| **Cliente** | ❌ Não | Consultar serviços, barbeiros, disponibilidade e criar agendamentos |
| **Barbeiro** | ✅ Sim (JWT) | Gerenciar agendamentos, serviços e próprio perfil |

### Diagrama de Fluxo

```
Cliente
  │
  ├─ GET /api/services           → Lista serviços disponíveis
  ├─ GET /api/barbers            → Lista barbeiros ativos
  ├─ GET /api/availability       → Consulta horários livres
  └─ POST /api/appointments      → Cria um agendamento
  
Barbeiro
  │
  ├─ POST /api/auth/login              → Autentica e recebe token JWT
  │
  └─ (com token JWT no header)
       ├─ GET    /api/barber/profile            → Visualiza perfil
       ├─ PUT    /api/barber/profile            → Atualiza perfil/senha
       ├─ GET    /api/barber/appointments       → Lista seus agendamentos
       ├─ GET    /api/barber/appointments/:id   → Detalha um agendamento
       ├─ PATCH  /api/barber/appointments/:id   → Atualiza status
       ├─ POST   /api/barber/services           → Cria um serviço
       ├─ PUT    /api/barber/services/:id       → Atualiza um serviço
       └─ DELETE /api/barber/services/:id       → Desativa um serviço
```

---

## 2. Configuração e Variáveis de Ambiente

Crie o arquivo `.env.local` na raiz do projeto (já criado pelo setup):

```env
# URI de conexão com o MongoDB
MONGODB_URI=mongodb://admin:admin@localhost:27018/barbearia?authSource=admin

# Chave secreta para assinar tokens JWT (use uma string longa em produção)
JWT_SECRET=barbearia_super_secret_jwt_key_2026

# Duração do token JWT (8h = 8 horas, 1d = 1 dia, 7d = 1 semana)
JWT_EXPIRES_IN=8h

# Horário de funcionamento da barbearia
WORKING_HOURS_START=09:00
WORKING_HOURS_END=18:00

# Intervalo entre slots de horário em minutos
SLOT_INTERVAL_MINUTES=30

# (Opcional) Segredo para o endpoint de registro de barbeiro
REGISTER_SECRET=segredo_de_registro

# (Opcional) Segredo para o endpoint de seed
SEED_SECRET=segredo_do_seed
```

---

## 3. Correções no docker-compose

Foram corrigidos dois problemas de configuração no `docker-compose.yml` original:

| Problema | Original | Corrigido |
|---|---|---|
| Porta MongoDB | `27018:27018` (container:27018 inválido) | `27018:27017` (host:27018 → container:27017) |
| Porta Mongo-Express | `8082:8082` (container:8082 inválido) | `8082:8081` (host:8082 → container:8081) |
| URL interna Mongo-Express | `mongodb:27018` (porta errada) | `mongodb:27017` (porta padrão do MongoDB) |

> O MongoDB escuta na porta **27017** dentro do container por padrão. O Mongo-Express escuta na porta **8081** por padrão.

Para reiniciar os containers com as configurações corrigidas:

```bash
docker compose down && docker compose up -d
```

Acesse o Mongo-Express em: **http://localhost:8082**

---

## 4. Modelos de Dados (Schemas MongoDB)

### 4.1 Barber (Barbeiro)

Coleção: `barbers`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `_id` | ObjectId | Auto | Identificador único |
| `name` | String | ✅ | Nome completo (máx. 100 chars) |
| `email` | String | ✅ | E-mail único (usado no login) |
| `password` | String | ✅ | Senha hash bcrypt (nunca retornada na API) |
| `phone` | String | ✅ | Telefone de contato |
| `bio` | String | ❌ | Breve descrição (máx. 500 chars) |
| `avatarUrl` | String | ❌ | URL da foto de perfil |
| `isActive` | Boolean | — | Ativo? (padrão: `true`) |
| `createdAt` | Date | Auto | Data de criação |
| `updatedAt` | Date | Auto | Data da última atualização |

### 4.2 Service (Serviço)

Coleção: `services`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `_id` | ObjectId | Auto | Identificador único |
| `name` | String | ✅ | Nome do serviço (máx. 100 chars) |
| `description` | String | ❌ | Descrição detalhada (máx. 300 chars) |
| `durationMinutes` | Number | ✅ | Duração em minutos (10–480) |
| `price` | Number | ✅ | Preço em reais (≥ 0) |
| `isActive` | Boolean | — | Ativo? (padrão: `true`) |
| `createdAt` | Date | Auto | Data de criação |
| `updatedAt` | Date | Auto | Data da última atualização |

### 4.3 Appointment (Agendamento)

Coleção: `appointments`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `_id` | ObjectId | Auto | Identificador único |
| `clientName` | String | ✅ | Nome do cliente (máx. 100 chars) |
| `clientPhone` | String | ✅ | Telefone do cliente |
| `clientEmail` | String | ❌ | E-mail do cliente |
| `clientNotes` | String | ❌ | Observações (máx. 300 chars) |
| `barberId` | ObjectId | ✅ | Referência ao Barbeiro |
| `serviceId` | ObjectId | ✅ | Referência ao Serviço |
| `date` | String | ✅ | Data no formato `YYYY-MM-DD` |
| `timeSlot` | String | ✅ | Horário de início no formato `HH:MM` |
| `endTime` | String | ✅ | Horário de término (calculado) `HH:MM` |
| `status` | Enum | — | `pending` \| `confirmed` \| `cancelled` \| `completed` (padrão: `pending`) |
| `cancelReason` | String | ❌ | Motivo do cancelamento (obrigatório se status = `cancelled`) |
| `createdAt` | Date | Auto | Data de criação |
| `updatedAt` | Date | Auto | Data da última atualização |

> **Índice único:** `(barberId, date, timeSlot)` com filtro parcial para status `pending` ou `confirmed` — garante que não existam dois agendamentos ativos no mesmo horário para o mesmo barbeiro.

#### Ciclo de vida do status:

```
pending ──► confirmed ──► completed
   │               │
   └───────────────┴──► cancelled
   
(completed e cancelled são estados finais — não podem ser alterados)
```

---

## 5. Autenticação JWT

As rotas protegidas exigem um token JWT no header de cada requisição:

```
Authorization: Bearer <token>
```

O token é obtido via `POST /api/auth/login`. Ele contém:
- `barberId` — ID do barbeiro no banco
- `email` — e-mail do barbeiro
- `name` — nome do barbeiro
- `exp` — data de expiração (configurada por `JWT_EXPIRES_IN`)

---

## 6. Rotas Públicas — Área do Cliente

### 6.1 Listar Serviços

```
GET /api/services
```

Retorna todos os serviços com `isActive: true`.

**Resposta de sucesso (200):**
```json
{
  "data": [
    {
      "_id": "665abc...",
      "name": "Corte Simples",
      "description": "Corte tradicional na tesoura ou máquina.",
      "durationMinutes": 30,
      "price": 35,
      "isActive": true,
      "createdAt": "2026-03-08T10:00:00.000Z"
    }
  ]
}
```

---

### 6.2 Listar Barbeiros

```
GET /api/barbers
```

Retorna todos os barbeiros com `isActive: true`. A senha **nunca** é retornada.

**Resposta de sucesso (200):**
```json
{
  "data": [
    {
      "_id": "665def...",
      "name": "João da Navalha",
      "phone": "(11) 99999-0001",
      "bio": "Barbeiro há 10 anos.",
      "avatarUrl": null,
      "isActive": true
    }
  ]
}
```

---

### 6.3 Consultar Disponibilidade

```
GET /api/availability?barberId=&serviceId=&date=
```

Retorna os horários disponíveis para um barbeiro em uma data, considerando a duração do serviço escolhido e os agendamentos já existentes.

**Query Params:**

| Parâmetro | Tipo | Obrigatório | Exemplo |
|---|---|---|---|
| `barberId` | string | ✅ | `665def...` |
| `serviceId` | string | ✅ | `665abc...` |
| `date` | string (YYYY-MM-DD) | ✅ | `2026-03-15` |

**Resposta de sucesso (200):**
```json
{
  "data": {
    "barber": { "_id": "665def...", "name": "João da Navalha" },
    "service": { "_id": "665abc...", "name": "Corte Simples", "durationMinutes": 30 },
    "date": "2026-03-15",
    "availableSlots": ["09:00", "09:30", "10:00", "10:30", "14:00", "14:30"]
  }
}
```

> Os slots são gerados a cada `SLOT_INTERVAL_MINUTES` (padrão: 30 min), do horário de abertura até o horário de fechamento, descontando os slots já ocupados por agendamentos `pending` ou `confirmed`.

---

### 6.4 Criar Agendamento

```
POST /api/appointments
Content-Type: application/json
```

Cria um novo agendamento. A disponibilidade do horário é **validada novamente** no momento da criação para evitar condições de corrida.

**Body:**
```json
{
  "clientName": "Carlos Silva",
  "clientPhone": "(11) 91234-5678",
  "clientEmail": "carlos@email.com",
  "clientNotes": "Prefiro degradê baixo.",
  "barberId": "665def...",
  "serviceId": "665abc...",
  "date": "2026-03-15",
  "timeSlot": "10:00"
}
```

| Campo | Tipo | Obrigatório |
|---|---|---|
| `clientName` | string | ✅ |
| `clientPhone` | string | ✅ |
| `clientEmail` | string | ❌ |
| `clientNotes` | string | ❌ |
| `barberId` | string | ✅ |
| `serviceId` | string | ✅ |
| `date` | string (YYYY-MM-DD) | ✅ |
| `timeSlot` | string (HH:MM) | ✅ |

**Resposta de sucesso (201):**
```json
{
  "message": "Agendamento criado com sucesso!",
  "data": {
    "_id": "665ghi...",
    "clientName": "Carlos Silva",
    "clientPhone": "(11) 91234-5678",
    "barberId": { "_id": "665def...", "name": "João da Navalha", "phone": "(11) 99999-0001" },
    "serviceId": { "_id": "665abc...", "name": "Corte Simples", "durationMinutes": 30, "price": 35 },
    "date": "2026-03-15",
    "timeSlot": "10:00",
    "endTime": "10:30",
    "status": "pending",
    "createdAt": "2026-03-08T12:00:00.000Z"
  }
}
```

**Erros possíveis:**

| Status | Situação |
|---|---|
| 400 | Campos obrigatórios ausentes ou formato inválido |
| 400 | Data/horário no passado |
| 404 | Barbeiro ou serviço não encontrado |
| 409 | Horário indisponível (já reservado) |

---

## 7. Rota de Login — Área do Barbeiro

### 7.1 Login

```
POST /api/auth/login
Content-Type: application/json
```

**Body:**
```json
{
  "email": "joao@barbearia.com",
  "password": "senha123"
}
```

**Resposta de sucesso (200):**
```json
{
  "message": "Login realizado com sucesso.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "barber": {
    "_id": "665def...",
    "name": "João da Navalha",
    "email": "joao@barbearia.com",
    "phone": "(11) 99999-0001",
    "bio": "Barbeiro há 10 anos."
  }
}
```

> Guarde o `token` retornado e envie-o em todas as requisições protegidas no header: `Authorization: Bearer <token>`

---

## 8. Rotas Protegidas — Área do Barbeiro

Todas as rotas abaixo exigem:
```
Authorization: Bearer <token_jwt>
```

---

### 8.1 Visualizar Perfil

```
GET /api/barber/profile
```

**Resposta de sucesso (200):**
```json
{
  "data": {
    "_id": "665def...",
    "name": "João da Navalha",
    "email": "joao@barbearia.com",
    "phone": "(11) 99999-0001",
    "bio": "Barbeiro há 10 anos.",
    "isActive": true
  }
}
```

---

### 8.2 Atualizar Perfil

```
PUT /api/barber/profile
Content-Type: application/json
```

Todos os campos são opcionais. Apenas os campos enviados serão atualizados.

```json
{
  "name": "João Navalha Silva",
  "phone": "(11) 99999-0002",
  "bio": "Especialista em barba e degradê.",
  "avatarUrl": "https://exemplo.com/foto.jpg",
  "password": "novasenha456"
}
```

---

### 8.3 Listar Agendamentos do Barbeiro

```
GET /api/barber/appointments
```

Lista apenas os agendamentos do barbeiro autenticado.

**Query Params (todos opcionais):**

| Parâmetro | Tipo | Exemplo | Descrição |
|---|---|---|---|
| `date` | string | `2026-03-15` | Filtra por data específica |
| `status` | string | `pending` | Filtra por status |
| `page` | number | `1` | Página (padrão: 1) |
| `limit` | number | `20` | Itens por página (padrão: 20, máx: 100) |

**Resposta de sucesso (200):**
```json
{
  "data": [
    {
      "_id": "665ghi...",
      "clientName": "Carlos Silva",
      "clientPhone": "(11) 91234-5678",
      "serviceId": { "name": "Corte Simples", "durationMinutes": 30, "price": 35 },
      "date": "2026-03-15",
      "timeSlot": "10:00",
      "endTime": "10:30",
      "status": "pending"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

### 8.4 Detalhes de um Agendamento

```
GET /api/barber/appointments/:id
```

Retorna os detalhes completos de um agendamento. O barbeiro só pode ver seus próprios agendamentos.

---

### 8.5 Atualizar Status de Agendamento

```
PATCH /api/barber/appointments/:id
Content-Type: application/json
```

**Body:**
```json
{
  "status": "confirmed"
}
```

Para cancelamento, o motivo é **obrigatório**:
```json
{
  "status": "cancelled",
  "cancelReason": "Cliente não compareceu."
}
```

**Transições de status permitidas:**

| Status Atual | Pode mudar para |
|---|---|
| `pending` | `confirmed`, `cancelled`, `completed` |
| `confirmed` | `cancelled`, `completed` |
| `cancelled` | ❌ (estado final) |
| `completed` | ❌ (estado final) |

---

### 8.6 Criar Serviço

```
POST /api/barber/services
Content-Type: application/json
```

```json
{
  "name": "Progressiva",
  "description": "Alisamento capilar duradouro.",
  "durationMinutes": 120,
  "price": 150
}
```

---

### 8.7 Atualizar Serviço

```
PUT /api/barber/services/:id
Content-Type: application/json
```

Todos os campos são opcionais:
```json
{
  "price": 160,
  "isActive": false
}
```

---

### 8.8 Desativar Serviço

```
DELETE /api/barber/services/:id
```

O serviço não é excluído fisicamente — apenas marcado como `isActive: false` para preservar o histórico dos agendamentos.

---

### 8.9 Registrar Novo Barbeiro

```
POST /api/barber/register
Content-Type: application/json
```

> **Segurança:** Se a variável `REGISTER_SECRET` estiver definida no `.env.local`, envie-a no header `X-Register-Secret` para validação.

```json
{
  "name": "Pedro Tesoura",
  "email": "pedro@barbearia.com",
  "password": "senha456",
  "phone": "(11) 88888-0002",
  "bio": "Especialista em coloração.",
  "avatarUrl": "https://exemplo.com/pedro.jpg"
}
```

---

## 9. Rota de Seed (Dados Iniciais)

```
POST /api/seed
Content-Type: application/json
```

> ⚠️ **Apenas para desenvolvimento.** Bloqueada automaticamente em `NODE_ENV=production`.

Popula o banco com:
- 6 serviços pré-definidos (Corte Simples, Corte + Barba, Barba Completa, Degradê, Sobrancelha, Pacote Completo)
- 1 barbeiro demo

```json
{
  "secret": "segredo_do_seed"
}
```

**Credenciais do barbeiro demo:**
```
Email: joao@barbearia.com
Senha: senha123
```

**Como usar:**
```bash
# 1. Suba os containers
docker compose up -d

# 2. Inicie o servidor Next.js
npm run dev

# 3. Execute o seed
curl -X POST http://localhost:3000/api/seed \
  -H "Content-Type: application/json" \
  -d '{"secret": "segredo_do_seed"}'
```

---

## 10. Fluxo Completo de Uso

### Fluxo do Cliente (sem login):

```
1. GET /api/services
   → Exibe os serviços disponíveis para o cliente escolher

2. GET /api/barbers
   → Exibe os barbeiros para o cliente escolher

3. GET /api/availability?barberId=X&serviceId=Y&date=YYYY-MM-DD
   → Exibe os horários livres no dia escolhido

4. POST /api/appointments
   → Cliente confirma o agendamento com nome, telefone e horário
   → Sistema retorna os dados do agendamento criado
```

### Fluxo do Barbeiro (com login):

```
1. POST /api/auth/login
   → Autentica com e-mail e senha
   → Recebe token JWT (válido por 8h por padrão)

2. (Guarda o token e utiliza em todas as próximas requisições)

3. GET /api/barber/appointments?date=2026-03-15
   → Vê todos os agendamentos do dia

4. PATCH /api/barber/appointments/<id>
   { "status": "confirmed" }
   → Confirma o atendimento

5. PATCH /api/barber/appointments/<id>
   { "status": "completed" }
   → Marca como concluído após o atendimento
```

---

## 11. Códigos de Status HTTP

| Código | Significado |
|---|---|
| **200** | Sucesso |
| **201** | Criado com sucesso |
| **400** | Requisição inválida (campos ausentes, formato errado) |
| **401** | Não autenticado (token ausente ou inválido) |
| **403** | Proibido (conta inativa ou rota restrita) |
| **404** | Recurso não encontrado |
| **409** | Conflito (horário já reservado, e-mail duplicado) |
| **500** | Erro interno do servidor |

---

## 12. Estrutura de Arquivos Criados

```
projeto-extensao-1/
├── .env.local                          # Variáveis de ambiente
├── docker-compose.yml                  # Corrigido (portas MongoDB e Mongo-Express)
│
├── lib/
│   ├── db.ts                           # Conexão singleton com MongoDB
│   ├── auth.ts                         # Utilitários JWT (sign, verify, requireAuth)
│   ├── availability.ts                 # Lógica de cálculo de horários disponíveis
│   └── models/
│       ├── Barber.ts                   # Schema/Model do Barbeiro
│       ├── Service.ts                  # Schema/Model do Serviço
│       └── Appointment.ts             # Schema/Model do Agendamento
│
└── app/
    └── api/
        ├── services/
        │   └── route.ts               # GET /api/services
        ├── barbers/
        │   └── route.ts               # GET /api/barbers
        ├── availability/
        │   └── route.ts               # GET /api/availability
        ├── appointments/
        │   └── route.ts               # POST /api/appointments
        ├── auth/
        │   └── login/
        │       └── route.ts           # POST /api/auth/login
        ├── barber/
        │   ├── register/
        │   │   └── route.ts           # POST /api/barber/register
        │   ├── profile/
        │   │   └── route.ts           # GET, PUT /api/barber/profile
        │   ├── appointments/
        │   │   ├── route.ts           # GET /api/barber/appointments
        │   │   └── [id]/
        │   │       └── route.ts       # GET, PATCH /api/barber/appointments/:id
        │   └── services/
        │       ├── route.ts           # POST /api/barber/services
        │       └── [id]/
        │           └── route.ts       # PUT, DELETE /api/barber/services/:id
        └── seed/
            └── route.ts               # POST /api/seed (dev only)
```

---

## Dependências Adicionadas

```json
{
  "dependencies": {
    "mongoose": "^8.x",
    "jsonwebtoken": "^9.x",
    "bcryptjs": "^2.x"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^9.x",
    "@types/bcryptjs": "^2.x"
  }
}
```
