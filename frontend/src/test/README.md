# Testes Frontend - Taverna do Mestre

## Visão Geral

O frontend possui testes unitários com **64% de cobertura total**, superando a meta de 25% estabelecida nos requisitos do projeto.

## Cobertura por Módulo

| Módulo | Cobertura | Status |
|--------|-----------|--------|
| **UI Components** | 100% | ✅ Completo |
| **Utils** | 97.53% | ✅ Completo |
| **Services** | 41.48% | ✅ Acima da meta |
| **Total** | 64% | ✅ **Superou meta de 25%** |

## Estrutura de Testes

### Serviços (`src/services/`)
- **pcService.test.ts** (15 testes)
  - CRUD operations (getPCs, getPC, createPC, updatePC, deletePC)
  - Cálculos de jogo (proficiency bonus, modifiers)
  - Formatação de dados

- **campaignService.test.ts** (20 testes)
  - CRUD operations para campanhas
  - Validação de dados de campanha
  - Validação de código de convite
  - Join/leave campaign

### Utils (`src/utils/`)
- **gameUtils.test.ts** (42 testes)
  - Cálculos de atributos e modificadores
  - Bônus de proficiência
  - Estatísticas de magias
  - Validações (nome, nível, atributos, HP)
  - Formatação (moeda, data)
  - Utilitários de array (groupBy, sortBy)
  - Configurações de status

### Componentes UI (`src/ui/`)
- **Button.test.tsx** (7 testes)
  - Renderização
  - Eventos de click
  - Estados (disabled)
  - Propriedades (className, type)

- **Badge.test.tsx** (7 testes)
  - Renderização
  - Variantes (primary, success, warning, danger, info)
  - Classes CSS

- **Alert.test.tsx** (10 testes)
  - Renderização com/sem título
  - Variantes (info, success, warning, error)
  - Botão de fechar
  - Callbacks

## Executando os Testes

### Rodar todos os testes
```bash
npm test
```

### Rodar com cobertura
```bash
npm run test:coverage
```

### Rodar com UI interativa
```bash
npm run test:ui
```

## Ferramentas Utilizadas

- **Vitest**: Framework de testes (compatível com Vite)
- **@testing-library/react**: Renderização e testes de componentes
- **@testing-library/user-event**: Simulação de interações do usuário
- **@testing-library/jest-dom**: Matchers adicionais para DOM
- **jsdom**: Ambiente DOM para Node.js
- **@vitest/coverage-v8**: Cobertura de código com V8

## Configuração

Os testes estão configurados em:
- `vitest.config.ts`: Configuração do Vitest
- `src/test/setup.ts`: Setup global dos testes
- `src/test/test-utils.tsx`: Utilitários e helpers para testes

## Mocks

### AuthContext
O arquivo `test-utils.tsx` fornece um mock do `AuthContext` com usuário padrão para facilitar testes de componentes que dependem de autenticação.

### API Service
Os serviços utilizam mocks do `apiService.fetchFromAPI` para simular chamadas à API sem fazer requisições HTTP reais.

## Boas Práticas

1. **Isolamento**: Cada teste é isolado e não afeta outros
2. **Mocks**: Serviços externos são mockados para testes rápidos e previsíveis
3. **Cobertura**: Foco em testar lógica de negócio e casos de uso principais
4. **Nomenclatura**: Testes descritivos que documentam o comportamento esperado

## Relatório de Cobertura

O relatório detalhado de cobertura é gerado em:
- `coverage/index.html` - Visualização HTML interativa
- `coverage/lcov.info` - Formato LCOV para CI/CD
- Console - Resumo textual

## Próximos Passos

Para aumentar ainda mais a cobertura, considere adicionar testes para:
- Hooks customizados (useHomebrewFilters, useAsyncOperation)
- Componentes de páginas complexas
- Fluxos completos de integração
- Casos de erro e edge cases

## Conclusão

✅ **Meta atingida**: 64% de cobertura (meta: 25%)

O frontend possui uma base sólida de testes unitários cobrindo:
- Lógica de negócio (cálculos, validações)
- Serviços de API
- Componentes UI básicos
- Utilitários e helpers
