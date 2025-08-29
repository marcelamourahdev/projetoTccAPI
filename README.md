# Projeto: Governança e Estruturação de APIs REST em Plataformas Conversacionais
# API de Pesquisas e Cadastro de Clientes - TCC MBA USP

API REST completa para gerenciamento de pesquisas acadêmicas e cadastro de clientes para amostra didática, desenvolvida seguindo as melhores práticas de arquitetura REST e padrões de mercado.

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Configuração](#️-configuração)
- [Autenticação](#-autenticação)
- [Endpoints](#-endpoints)
- [Documentação](#-documentação)
- [Testes](#-testes)
- [Exemplos de Uso](#-exemplos-de-uso)
- [Estrutura do Banco de Dados](#️-estrutura-do-banco-de-dados)
- [Segurança](#-segurança)
- [Tecnologias](#-tecnologias)

## 🎯 Visão Geral

API REST profissional que demonstra implementação completa de conceitos de Engenharia de Software, incluindo:

- ✅ **Arquitetura REST** completa com HATEOAS
- ✅ **Autenticação** e autorização por API Key
- ✅ **Rate Limiting** para controle de tráfego
- ✅ **CORS** para integração cross-origin
- ✅ **Filtering, Sorting e Paginação**
- ✅ **Documentação** Swagger/OpenAPI 3.0
- ✅ **Testes Unitários** automatizados
- ✅ **Múltiplos bancos** PostgreSQL
- ✅ **Versionamento** de API (/api/v1/)
- ✅ **Estrutura de responses** padronizada

### Funcionalidades Principais
- **Gerenciamento de Pesquisas:** Consulta de dados acadêmicos com filtering/sorting
- **CRUD Clientes:** Cadastro, consulta, atualização e exclusão
- **Segurança:** Autenticação, rate limiting, validação de dados
- **Monitoramento:** Logs estruturados e tratamento de erros

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│     Cliente     │────│       API        │────│   PostgreSQL    │
│   (Frontend)    │    │   (Node.js +     │    │   (2 Bancos)    │
│                 │    │    Express)      │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                    ┌─────────┼─────────┐
                    │         │         │
            ┌───────▼───┐ ┌───▼───┐ ┌───▼─────┐
            │  Auth     │ │ CORS  │ │  Rate   │
            │Middleware │ │       │ │Limiting │
            └───────────┘ └───────┘ └─────────┘
```

**Características Arquiteturais:**
- **Stateless:** Cada requisição é independente
- **Resource-Based:** URLs representam recursos
- **HTTP Methods:** GET, POST, PUT, DELETE
- **Status Codes:** Códigos HTTP apropriados
- **Content Negotiation:** JSON como formato padrão

## ⚙️ Configuração

### Pré-requisitos
- Node.js 18+
- PostgreSQL (Render Cloud)
- Git

### Instalação

1. **Clone e instale dependências:**
```bash
git clone <repositorio>
cd projetoTcc
npm install
```

2. **Configure variáveis de ambiente:**
```bash
cp env.example .env
```

3. **Configure o arquivo `.env`:**
```env
# Autenticação
API_KEY=17e393bbdd78b1cb14d30c0a6cf3669b18b5cb385eafe0d170157d41253718ba

# Bancos de dados
DB_PESQUISAS_URL=postgresql://bd_projeto_tcc_user:senha@host/bd_projeto_tcc
DB_CLIENTES_URL=postgresql://cadastro_clientes_wa08_user:senha@host/cadastro_clientes_wa08

# Servidor
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

4. **Execute a aplicação:**
```bash
# Produção
npm start

# Desenvolvimento
npm run dev

# Testes
npm test

# Testes com cobertura
npm run test:coverage
```

## 🔐 Autenticação

**Tipo:** API Key Authentication
**Header:** `x-api-key` ou `authorization`
**Valor:** `17e393bbdd78b1cb14d30c0a6cf3669b18b5cb385eafe0d170157d41253718ba`

**⚠️ Todos os endpoints protegidos requerem autenticação**

### Rate Limiting
- **Limite:** 100 requisições por IP
- **Janela:** 15 minutos
- **Headers:** `X-RateLimit-*` incluídos nas respostas

## 📡 Endpoints

### 🏠 Sistema
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| `GET` | `/` | Informações da API | ❌ |
| `GET` | `/api/v1/test` | Teste da API | ✅ |
| `GET` | `/api/v1/docs` | Documentação Swagger | ❌ |

### 📊 Pesquisas
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| `GET` | `/api/v1/pesquisas` | Listar pesquisas | ✅ |

**Query Parameters:**
- `sort`: Campo para ordenação (`id`, `titulo`, `data_criacao`)
- `order`: Direção (`asc`, `desc`)
- `limit`: Limite de resultados (1-100)
- `offset`: Paginação

### 👥 Clientes
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| `GET` | `/api/v1/clientes/:cpf` | Consultar cliente | ✅ |
| `POST` | `/api/v1/clientes` | Cadastrar cliente | ✅ |
| `PUT` | `/api/v1/clientes/:cpf` | Atualizar cliente | ✅ |
| `DELETE` | `/api/v1/clientes/:cpf` | Deletar cliente | ✅ |

## 📚 Documentação

**Swagger UI:** http://localhost:3000/api/v1/docs

A documentação interativa:
- ✅ Especificação OpenAPI 3.0 completa
- ✅ Teste interativo de endpoints
- ✅ Schemas de dados
- ✅ Exemplos de requests/responses
- ✅ Configuração de autenticação

## 🧪 Testes

### Execução
```bash
# Todos os testes
npm test

# Modo watch (desenvolvimento)
npm run test:watch

# Cobertura de código
npm run test:coverage
```

### Coverage Report
- **Arquivo:** `coverage/lcov-report/index.html`
- **Formatos:** HTML, LCOV, Text

### Testes Implementados
- ✅ Autenticação por API Key
- ✅ Validação de endpoints
- ✅ Estrutura de responses
- ✅ Códigos de status HTTP
- ✅ Tratamento de erros
- ✅ Headers de requisição

## 💡 Exemplos de Uso

### 1. Consultar Cliente
```bash
curl -H "x-api-key: 17e393bbdd78b1cb14d30c0a6cf3669b18b5cb385eafe0d170157d41253718ba" \
     http://localhost:3000/api/v1/clientes/12345678901
```

### 2. Cadastrar Cliente
```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -H "x-api-key: 17e393bbdd78b1cb14d30c0a6cf3669b18b5cb385eafe0d170157d41253718ba" \
     -d '{"nome":"João Silva","cpf":"12345678901","telefone":"11999999999","estado":"SP"}' \
     http://localhost:3000/api/v1/clientes
```

### 3. Listar Pesquisas com Paginação
```bash
curl -H "x-api-key: 17e393bbdd78b1cb14d30c0a6cf3669b18b5cb385eafe0d170157d41253718ba" \
     "http://localhost:3000/api/v1/pesquisas?limit=10&offset=0&sort=id&order=asc"
```

## 🗄️ Estrutura do Banco de Dados

### Banco 1: Pesquisas (`bd_projeto_tcc`)
```sql
-- Tabela: bd_pesquisa
-- Campos: id, pergunta, resposta, fonte, data_criacao
```

### Banco 2: Clientes (`cadastro_clientes_wa08`)
```sql
CREATE TABLE cadastro_clientes (
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(11) PRIMARY KEY,
    telefone VARCHAR(11),
    estado VARCHAR(11)
);
```

## 🔒 Segurança

### Medidas Implementadas
- ✅ **API Key Authentication**
- ✅ **Rate Limiting** (100 req/15min)
- ✅ **CORS** configurado
- ✅ **SQL Injection Prevention** (Prepared Statements)
- ✅ **Environment Variables** para credenciais
- ✅ **Input Validation**
- ✅ **Error Handling** sem exposição de dados sensíveis

### Headers de Segurança
```javascript
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
```

## 🛠️ Tecnologias

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados relacional
- **dotenv** - Gerenciamento de variáveis

### Documentação
- **Swagger/OpenAPI** - Documentação interativa
- **swagger-jsdoc** - Geração de specs
- **swagger-ui-express** - Interface web

### Testes
- **Jest** - Framework de testes
- **Supertest** - Testes de API HTTP
- **Coverage Reports** - Relatórios de cobertura

### Produção
- **express-rate-limit** - Rate limiting
- **CORS** - Cross-Origin Resource Sharing
- **Winston** - Logging estruturado

## 📊 Padrões REST Implementados

### ✅ Princípios REST
- **Stateless**: Sem estado entre requisições
- **Resource-Based**: URLs representam recursos
- **HTTP Methods**: Uso de GET, POST, PUT, DELETE
- **Status Codes**: Códigos HTTP apropriados
- **HATEOAS**: Links relacionados nas responses

### ✅ Convenções
- **Versionamento**: `/api/v1/`
- **Pluralização**: `/clientes`, `/pesquisas`
- **Hierarquia**: `/api/v1/clientes/:cpf`
- **Query Parameters**: Para filtering/sorting

### ✅ Response Structure
```json
{
  "success": true,
  "message": "Operação realizada com sucesso",
  "data": { /* dados */ },
  "meta": { /* metadados de paginação */ },
  "links": { /* links HATEOAS */ }
}
```

---
