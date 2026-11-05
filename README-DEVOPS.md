# 🚀 DevOps, CI/CD & DevSecOps — Shopping das Academias

Este documento descreve a arquitetura de entrega contínua, automação de testes, segurança (DevSecOps) e deploys do projeto **Cronograma de Entregas**.

---

## 📋 Sumário
1. [Visão Geral da Arquitetura](#-visão-geral-da-arquitetura)
2. [Estrutura de Testes Automatizados](#-estrutura-de-testes-automatizados)
3. [Segurança e DevSecOps](#-segurança-e-devsecops)
4. [Pipelines de CI/CD (GitHub Actions)](#-pipelines-de-cicd-github-actions)
5. [Configuração de Ambientes e Secrets](#-configuração-de-ambientes-e-secrets)
6. [Guia de Execução Local](#-guia-de-execução-local)
7. [Políticas de Bloqueio e Resolução de Falhas](#-políticas-de-bloqueio-e-resolução-de-falhas)
8. [Deploy e Rollback](#-deploy-e-rollback)

---

## 🏗 Visão Geral da Arquitetura

O projeto consiste em uma SPA (Single Page Application) estática de alta performance consumindo o backend **Supabase** (PostgreSQL, Auth, RLS e Edge Functions em Deno/TypeScript).

```
[Desenvolvedor] ➔ [Git Push / PR]
       │
       ▼
[GitHub Actions CI/CD]
   ├── Lint & Análise Estática (ESLint 9 + eslint-plugin-security)
   ├── Testes Unitários & Integração (Vitest + JSDOM)
   ├── Testes End-to-End (Playwright)
   ├── Auditoria de Segurança & Dependências (npm audit + CycloneDX SBOM)
   ├── SAST (GitHub CodeQL + Semgrep)
   ├── Detecção de Segredos (Gitleaks)
   └── DAST (OWASP ZAP Baseline)
       │
       ▼ (Aprovação / Merge main)
[Deploy Automatizado]
   ├── Supabase Edge Functions (jarvis) via Supabase CLI
   └── Validação de Health Check
```

---

## 🧪 Estrutura de Testes Automatizados

A suíte de testes é dividida em três níveis:

### 1. Testes Unitários (`tests/unit/`)
- **`formatters.test.js`**: Validação de datas (`fmtDate`), moedas (`fmtCurrency`), badges de status e iniciais.
- **`security-esc.test.js`**: Sanitização rigorosa contra XSS (`escHtml`) em caracteres especiais (`<`, `>`, `&`, `"`, `'`).
- **`auth-roles.test.js`**: Regras de controle de acesso (RBAC: `isAdmin`, `isEditor`, `viewer`), alternância de temas e manipulação de modais.
- **`filter-engine.test.js`**: Lógica de filtragem por texto, status, abas e intervalos de data.
- **`cronograma-helpers.test.js`**: Regras de negócio de frete, status rápido e validação de payloads.
- **`cronograma-dom.test.js` & `admin-dom.test.js`**: Renderização no DOM e isolamento de estado.
- **`jarvis-helpers.test.js`**: Parsing e formatação de comandos do assistente virtual.

### 2. Testes de Integração (`tests/integration/`)
- **`auth-guards.test.js`**: Proteção de rotas e verificação de sessão com Supabase Auth mockado.
- **`permissions-dom.test.js`**: Exibição/ocultação condicional de botões e ações administrativas baseado em perfil.
- **`crud-mock.test.js`**: Fluxos completos de Create, Read, Update e Delete contra camada de dados isolada.

### 3. Testes End-to-End (`tests/e2e/`) com Playwright
- **`login.spec.js`**: Validação de interface de login, inputs e feedback visual.
- **`navigation.spec.js`**: Redirecionamento de usuários não autenticados e rotas protegidas.
- **`app-interactions.spec.js`**: Interações no painel operacional (filtros, abas, pesquisa).

---

## 🛡 Segurança e DevSecOps

O projeto adota o princípio de **Shift-Left Security**:

| Camada | Ferramenta | O que valida |
|---|---|---|
| **SAST** | GitHub CodeQL | Injeções de código, manipulação insegura de DOM, fluxo de dados sensíveis. |
| **SAST** | Semgrep (`.semgrep.yml`) | Regras customizadas para `innerHTML`, `eval()`, chamadas inseguras. |
| **Secrets** | Gitleaks (`.gitleaks.toml`) | Busca de chaves de API, senhas e tokens expostos em commits. |
| **SCA** | npm audit | Auditoria de vulnerabilidades conhecidas (CVEs) em bibliotecas. |
| **SBOM** | CycloneDX | Software Bill of Materials gerado em formato JSON padrão internacional. |
| **DAST** | OWASP ZAP | Scan dinâmico de cabeçalhos de segurança, vulnerabilidades web e superfícies expostas. |
| **Dependências** | Dependabot | Atualizações semanais automáticas de pacotes com PRs gerenciados. |

---

## 🔄 Pipelines de CI/CD (GitHub Actions)

### 1. `ci.yml` — Integração Contínua
- **Gatilhos**: Push em `main`, `develop`, branches `feature/**` e `fix/**`; Pull Requests para `main` e `develop`.
- **Jobs**:
  1. `lint`: Análise estática com ESLint.
  2. `unit-tests`: Executa Vitest e gera relatório de cobertura.
  3. `e2e-tests`: Executa Playwright com navegador headless.
  4. `build`: Gera artefato em `dist/` e valida `health.json`.
  5. `security-audit`: Valida dependências com `npm audit` e cria `sbom.json`.

### 2. `security.yml` — Varredura Avançada de Segurança
- **Gatilhos**: Push e PR em `main`, agendamento semanal (domingo às 02h UTC) e trigger manual.
- **Jobs**: CodeQL SAST, Gitleaks, Semgrep OWASP Top 10, Dependency Review e OWASP ZAP Baseline.

### 3. `deploy.yml` — Deploy Contínuo
- **Gatilhos**: Push na branch `main` alterando arquivos em `supabase/functions/**`.
- **Ações**:
  1. Executa suite de testes e checagens prévias.
  2. Publica as Edge Functions no Supabase via CLI autenticado.
  3. Realiza verificação de fumaça (Smoke Test / Health check) no endpoint publicado.

---

## 🔑 Configuração de Ambientes e Secrets

Para o funcionamento completo das Actions no GitHub, configure em **Settings > Secrets and variables > Actions**:

| Secret | Finalidade |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Token pessoal do Supabase (obtido em *Account Settings > Access Tokens*). |
| `SUPABASE_PROJECT_REF` | Identificador do projeto Supabase (`mpyakbkgqraryjypsuki`). |
| `SUPABASE_URL` | URL base do Supabase (`https://mpyakbkgqraryjypsuki.supabase.co`). |
| `SUPABASE_ANON_KEY` | Chave anônima pública (utilizada no health check do deploy). |
| `SEMGREP_APP_TOKEN` | *(Opcional)* Token do Semgrep Cloud para dashboards centralizados. |

---

## 💻 Guia de Execução Local

```bash
# Instalar dependências
npm install

# Executar linter
npm run lint

# Executar testes unitários e de integração
npm test

# Executar testes com relatório de cobertura (Coverage)
npm run test:coverage

# Executar testes End-to-End (Headless)
npm run test:e2e

# Executar testes End-to-End com interface visual
npm run test:e2e:headed

# Executar auditoria de segurança de dependências
npm run security:audit

# Gerar SBOM
npm run security:sbom

# Construir pacote de distribuição
npm run build
```

---

## 🛑 Políticas de Bloqueio e Resolução de Falhas

O pipeline falhará e **bloqueará o merge/deploy** se:
1. Qualquer teste unitário, integração ou E2E falhar.
2. O linter reportar erros sintáticos ou de boas práticas.
3. A cobertura de testes ficar abaixo da meta estabelecida.
4. O `npm audit` identificar vulnerabilidades com severidade **High** ou **Critical**.
5. O `gitleaks` detectar tokens ou chaves privadas comitadas no repositório.
6. O arquivo de saúde `dist/health.json` não for gerado no build.

**Como resolver falhas:**
- Se o linter falhar: execute `npm run lint:fix`.
- Se o Gitleaks acusar falso-positivo: revise a regra em `.gitleaks.toml`.
- Se o teste E2E falhar: verifique os traces gerados em `playwright-report/`.

---

## 🚀 Deploy e Rollback

1. **Deploy de Frontend:**
   - O projeto possui arquitetura estática servida via GitHub Pages ou servidor HTTP nativo.
   - Qualquer commit na branch principal reflete a versão de produção.
2. **Deploy de Backend / Edge Functions:**
   - Disparado automaticamente pelo workflow `deploy.yml` ao modificar `supabase/functions/`.
3. **Rollback:**
   - Para reverter um deploy defeituoso, utilize `git revert <commit-hash>` e faça push para a `main`.
   - O pipeline reexecutará todos os testes e publicará a versão estável imediatamente.
