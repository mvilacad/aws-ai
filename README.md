# AWS AI - Sistema de Análise de Violações com IA

Sistema completo de análise de violações de liberdade condicional usando AWS Bedrock, construído com arquitetura moderna de monorepo, TypeScript e Infrastructure as Code.

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+
- pnpm 8+
- AWS CLI configurado
- Conta AWS com acesso ao Bedrock

### Instalação

```bash
# Clone o projeto
git clone <repository-url>
cd aws-ai

# Execute o setup automático
chmod +x scripts/setup.sh
./scripts/setup.sh

# Configure as variáveis de ambiente
cp .env.example .env
cp .env.local.example .env.local
# Edite os arquivos com suas configurações
```

### Desenvolvimento

```bash
# Instalar dependências
pnpm install

# Build de todos os pacotes
pnpm run build

# Executar testes
pnpm run test

# Fazer deploy para desenvolvimento
pnpm run deploy:dev

# Semear dados de exemplo
pnpm run seed-data
```

## 📋 Status do Projeto

✅ **Implementado:**

- Configuração completa do monorepo com pnpm + Turborepo
- Packages/shared com tipos TypeScript e utilitários
- Packages/database com schemas DynamoDB e OpenSearch
- Packages/functions com handlers Lambda (Chat, Analysis, RAG, Ingest)
- Packages/infrastructure com CDK stacks completos
- GitHub workflows para CI/CD
- Scripts de setup e seeding de dados
- Documentação de contribuição

⚠️ **Pendente (para implementação posterior):**

- Frontend Next.js (apps/web)
- Stacks CDK restantes (compute, monitoring, frontend)
- Testes unitários completos
- Documentação da API

## 🏗️ Arquitetura

### Stack Tecnológico

- **Backend**: AWS Lambda + TypeScript
- **AI/ML**: Amazon Bedrock (Claude 3 Sonnet, Titan Embeddings)
- **Infrastructure**: AWS CDK v2 com TypeScript
- **Database**: DynamoDB + OpenSearch Serverless (Vector DB)
- **Storage**: Amazon S3
- **Monorepo**: pnpm + Turborepo

### Estrutura do Projeto

```
aws-ai/
├── packages/
│   ├── shared/          # Tipos, utilitários e constantes compartilhadas
│   ├── database/        # Schemas DynamoDB/OpenSearch e seeders
│   ├── functions/       # Lambda functions
│   │   ├── src/
│   │   │   ├── chat/        # Handler de chat com IA
│   │   │   ├── analysis/    # Análise de violações
│   │   │   ├── rag/         # Retrieval Augmented Generation
│   │   │   ├── ingest/      # Processamento de documentos
│   │   │   └── shared/      # Clientes AWS e utilitários
│   │   └── layers/      # Lambda layers
│   └── infrastructure/ # CDK stacks e constructs
│       ├── lib/
│       │   ├── stacks/      # CDK stacks
│       │   ├── constructs/  # Constructs reutilizáveis
│       │   └── environments/ # Configurações por ambiente
│       └── bin/         # Entry point do CDK
├── apps/
│   └── web/            # [Futuro] Frontend Next.js
├── scripts/            # Scripts utilitários
├── docs/               # Documentação
└── .github/           # CI/CD workflows
```

## 🔧 Funcionalidades Implementadas

### Packages/Shared

- Tipos TypeScript completos para domínio
- Utilitários para datas, strings, crypto
- Constantes de API e códigos de erro
- Schemas de validação com Zod

### Packages/Database

- Definições completas de tabelas DynamoDB
- Mapeamentos de índices OpenSearch para busca vetorial
- Dados de exemplo (usuários, casos de violação, documentos)
- Seeders automatizados

### Packages/Functions

- **Chat Service**: Sistema completo de chat com IA e RAG
- **Analysis Service**: Análise de violações usando Bedrock
- **Clientes AWS**: DynamoDB, OpenSearch, Bedrock com abstrações
- **Utilitários**: Logging estruturado, validação, tratamento de erros

### Packages/Infrastructure

- Configurações por ambiente (dev, staging, prod)
- Stack de dados (DynamoDB, S3, OpenSearch)
- Configurações de IAM e segurança
- Entry point CDK com dependências de stacks

### CI/CD & DevOps

- **CI Workflow**: Lint, testes, build, security scanning
- **Deploy Workflows**: Separados para dev e produção
- **Security Scanning**: CodeQL, Trivy, Checkov, TruffleHog
- **Scripts**: Setup automatizado e seeding de dados

## 🗄️ Banco de Dados

### DynamoDB Tables

- **users**: Usuários do sistema
- **chat-sessions**: Sessões de chat
- **chat-messages**: Mensagens com histórico
- **documents**: Metadados de documentos
- **violation-cases**: Casos de violação
- **monitoring-subjects**: Indivíduos monitorados
- **events**: Event sourcing

### OpenSearch Indexes

- **documents**: Busca full-text em documentos
- **violations**: Busca vetorial em violações
- **chat-context**: Contexto para RAG
- **knowledge-base**: Base de conhecimento jurídica

## 🤖 Funcionalidades de IA

### Bedrock Integration

- **Claude 3 Sonnet**: Análise de violações e chat
- **Titan Embeddings**: Embeddings para busca vetorial
- **RAG System**: Recuperação de contexto relevante
- **Violation Analysis**: Detecção automática de violações

### Capacidades Implementadas

- Chat contextual com histórico
- Análise automática de textos para violações
- Busca semântica em documentos
- Recomendações baseadas em casos similares
- Classificação de risco automatizada

## 📚 Dados de Exemplo

O sistema inclui dados realistas para desenvolvimento:

- 3 indivíduos monitorados com perfis completos
- 3 casos de violação com diferentes severidades
- 5 documentos de políticas e procedimentos
- Base de conhecimento com regulamentações

## 🔐 Segurança

### Implementações de Segurança

- Validação rigorosa de inputs com Zod
- Tratamento seguro de erros
- Logging estruturado para auditoria
- IAM roles com menor privilégio
- Criptografia em trânsito e repouso

### Scans Automatizados

- Vulnerabilidades de dependências (Trivy)
- Análise de código estática (CodeQL)
- Detecção de secrets (TruffleHog)
- Configuração de infraestrutura (Checkov)

## 🚀 Deployment

### Ambientes

- **Development**: Recursos mínimos, dados de teste
- **Staging**: Configuração próxima à produção
- **Production**: Alta disponibilidade, monitoramento completo

### Comandos de Deploy

```bash
# Desenvolvimento
pnpm run deploy:dev

# Produção (com aprovação)
pnpm run deploy:prod

# Ver diferenças antes do deploy
cd packages/infrastructure
cdk diff --context stage=development
```

## 📖 Documentação

- [Contributing Guide](docs/contributing.md) - Como contribuir
- [Architecture Overview](docs/architecture/overview.md) - Visão arquitetural
- [API Documentation](docs/api/) - Documentação das APIs
- [Deployment Guide](docs/deployment/) - Guias de deployment

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'feat: add amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

Veja [CONTRIBUTING.md](docs/contributing.md) para detalhes completos.

## 📄 Licença

Este projeto está sob a licença ISC. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- 📧 Email: support@aws-ai-project.com
- 💬 Issues: [GitHub Issues](https://github.com/your-repo/aws-ai/issues)
- 📖 Docs: [Documentação Completa](docs/)

---

**Status**: ✅ Backend e infraestrutura implementados | ⚠️ Frontend pendente

Construído com ❤️ usando AWS, TypeScript e as melhores práticas de desenvolvimento.
