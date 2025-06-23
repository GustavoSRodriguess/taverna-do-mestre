# API D&D - Documentação das Rotas

Esta documentação descreve as rotas disponíveis para acessar os dados oficiais do D&D que foram importados para o banco de dados.

## Autenticação

Todas as rotas requerem autenticação via token JWT no header `Authorization: Bearer <token>`.

## Base URL

Todas as rotas D&D têm o prefixo: `/api/dnd`

---

## 🧙‍♂️ Raças (Races)

### Listar Raças
```
GET /api/dnd/races
```

**Query Parameters:**
- `limit` (opcional): Número máximo de resultados (padrão: 50)
- `offset` (opcional): Número de resultados para pular (padrão: 0)
- `search` (opcional): Buscar por nome da raça

**Exemplo:**
```
GET /api/dnd/races?limit=10&search=elf
```

### Obter Raça Específica
```
GET /api/dnd/races/{index}
```

**Exemplo:**
```
GET /api/dnd/races/elf
```

---

## ⚔️ Classes

### Listar Classes
```
GET /api/dnd/classes
```

**Query Parameters:**
- `limit` (opcional): Número máximo de resultados (padrão: 50)
- `offset` (opcional): Número de resultados para pular (padrão: 0)
- `search` (opcional): Buscar por nome da classe

### Obter Classe Específica
```
GET /api/dnd/classes/{index}
```

**Exemplo:**
```
GET /api/dnd/classes/wizard
```

---

## ✨ Magias (Spells)

### Listar Magias
```
GET /api/dnd/spells
```

**Query Parameters:**
- `limit` (opcional): Número máximo de resultados (padrão: 50)
- `offset` (opcional): Número de resultados para pular (padrão: 0)
- `search` (opcional): Buscar por nome da magia
- `level` (opcional): Filtrar por nível da magia (0-9)
- `school` (opcional): Filtrar por escola de magia
- `class` (opcional): Filtrar por classe que pode usar a magia

**Exemplos:**
```
GET /api/dnd/spells?level=3&school=evocation
GET /api/dnd/spells?class=wizard&level=1
GET /api/dnd/spells?search=fireball
```

### Obter Magia Específica
```
GET /api/dnd/spells/{index}
```

**Exemplo:**
```
GET /api/dnd/spells/fireball
```

---

## 🛡️ Equipamentos (Equipment)

### Listar Equipamentos
```
GET /api/dnd/equipment
```

**Query Parameters:**
- `limit` (opcional): Número máximo de resultados (padrão: 50)
- `offset` (opcional): Número de resultados para pular (padrão: 0)
- `search` (opcional): Buscar por nome do equipamento
- `category` (opcional): Filtrar por categoria de equipamento

**Exemplos:**
```
GET /api/dnd/equipment?category=weapon
GET /api/dnd/equipment?search=sword
```

### Obter Equipamento Específico
```
GET /api/dnd/equipment/{index}
```

**Exemplo:**
```
GET /api/dnd/equipment/longsword
```

---

## 👹 Monstros (Monsters)

### Listar Monstros
```
GET /api/dnd/monsters
```

**Query Parameters:**
- `limit` (opcional): Número máximo de resultados (padrão: 50)
- `offset` (opcional): Número de resultados para pular (padrão: 0)
- `search` (opcional): Buscar por nome do monstro
- `challenge_rating` (opcional): Filtrar por CR (ex: 0.5, 1, 2, etc.)
- `type` (opcional): Filtrar por tipo de monstro

**Exemplos:**
```
GET /api/dnd/monsters?challenge_rating=1
GET /api/dnd/monsters?type=dragon
GET /api/dnd/monsters?search=goblin
```

### Obter Monstro Específico
```
GET /api/dnd/monsters/{index}
```

**Exemplo:**
```
GET /api/dnd/monsters/adult-red-dragon
```

---

## 📜 Backgrounds

### Listar Backgrounds
```
GET /api/dnd/backgrounds
```

**Query Parameters:**
- `limit` (opcional): Número máximo de resultados (padrão: 50)
- `offset` (opcional): Número de resultados para pular (padrão: 0)
- `search` (opcional): Buscar por nome do background

### Obter Background Específico
```
GET /api/dnd/backgrounds/{index}
```

**Exemplo:**
```
GET /api/dnd/backgrounds/acolyte
```

---

## 🎯 Habilidades (Skills)

### Listar Habilidades
```
GET /api/dnd/skills
```

**Query Parameters:**
- `limit` (opcional): Número máximo de resultados (padrão: 50)
- `offset` (opcional): Número de resultados para pular (padrão: 0)

### Obter Habilidade Específica
```
GET /api/dnd/skills/{index}
```

**Exemplo:**
```
GET /api/dnd/skills/stealth
```

---

## ⭐ Features/Traits

### Listar Features
```
GET /api/dnd/features
```

**Query Parameters:**
- `limit` (opcional): Número máximo de resultados (padrão: 50)
- `offset` (opcional): Número de resultados para pular (padrão: 0)
- `class` (opcional): Filtrar por classe
- `level` (opcional): Filtrar por nível

**Exemplos:**
```
GET /api/dnd/features?class=fighter&level=1
GET /api/dnd/features?level=5
```

### Obter Feature Específica
```
GET /api/dnd/features/{index}
```

**Exemplo:**
```
GET /api/dnd/features/action-surge
```

---

## Formato de Resposta

Todas as rotas de listagem retornam o seguinte formato:

```json
{
  "results": [...],
  "limit": 50,
  "offset": 0
}
```

As rotas individuais retornam diretamente o objeto solicitado.

## Códigos de Status

- `200 OK`: Sucesso
- `400 Bad Request`: Parâmetros inválidos
- `401 Unauthorized`: Token de autenticação inválido ou ausente
- `404 Not Found`: Recurso não encontrado
- `500 Internal Server Error`: Erro interno do servidor

## Observações

1. Todos os dados JSONB contêm as informações estruturadas da API oficial do D&D
2. Os índices (index) são únicos e seguem o padrão da API oficial (ex: "longsword", "fireball")
3. Use os filtros para otimizar suas consultas e reduzir o volume de dados
4. Para listas grandes, use paginação com `limit` e `offset`