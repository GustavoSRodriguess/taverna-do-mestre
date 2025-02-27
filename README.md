# Torre do Mestre

Um assistente digital completo para mestres de RPG criarem, organizarem e gerenciarem suas campanhas de forma eficiente e criativa.

## 🎲 Sobre o Projeto

A Taverna do Mestre é uma aplicação web completa desenvolvida para auxiliar mestres de jogos de RPG (Role Playing Games) na preparação e gestão de suas sessões de jogo. Através de ferramentas automatizadas para geração de personagens, NPCs e encontros balanceados, o projeto visa reduzir significativamente o tempo de preparação das sessões, permitindo que os mestres foquem na narrativa e na experiência dos jogadores.

Este projeto foi desenvolvido como Trabalho de Conclusão de Curso na área de Ciência da Computação, aplicando conceitos de desenvolvimento full-stack, processamento de linguagem natural e aprendizado de máquina.

## 🔮 Funcionalidades

- **Geração de Personagens**: Crie personagens jogáveis completos com atributos, habilidades, equipamentos e histórico
- **Geração de NPCs**: Desenvolva personagens não-jogáveis com personalidade, motivações e estatísticas de jogo
- **Criação de Encontros**: Gere encontros balanceados baseados no nível e número de jogadores
- **Integração com IA**: Utilize modelos de linguagem para gerar descrições, histórias e detalhes de personagens
- **Dashboard Personalizado**: Acompanhe todas suas criações em um painel intuitivo e organizado
- **Exportação de Conteúdo**: Exporte fichas e informações em diversos formatos (PDF, imagem)

## 🧰 Stack Tecnológica

### Backend
- **Golang**: API RESTful principal, autenticação e gerenciamento de usuários
- **Python (Flask)**: Microserviços para geração de conteúdo e integração com modelos de IA
- **scikit-learn**: Algoritmos de balanceamento e geração procedural de conteúdo
- **LLM (Large Language Models)**: Geração de texto descritivo e elementos narrativos

### Frontend
- **React**: Biblioteca para construção da interface de usuário
- **TypeScript**: Tipagem estática para maior segurança e produtividade
- **Tailwind CSS**: Framework CSS utilitário para estilização consistente
- **Vite**: Build tool para desenvolvimento rápido

### Infraestrutura
- **Docker**: Containerização dos serviços
- **PostgreSQL**: Banco de dados relacional
- **Redis**: Cache e gerenciamento de sessões

## 📋 Pré-requisitos

- Node.js 18+ 
- Go 1.20+
- Python 3.10+
- Docker e Docker Compose
- Git

## 🚀 Instalação e Uso

### Clonando o repositório

```bash
git clone https://github.com/seu-usuario/taverna-do-mestre.git
cd taverna-do-mestre
```

### Configuração do ambiente

1. **Backend Go**
```bash
cd backend
go mod download
cp .env.example .env
# Configure as variáveis de ambiente no arquivo .env
go run main.go
```

2. **Serviços Python**
```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Configure as variáveis de ambiente no arquivo .env
python main.py
```

3. **Frontend React**
```bash
cd frontend
npm install
cp .env.example .env
# Configure as variáveis de ambiente no arquivo .env
npm run dev
```

### Usando Docker (recomendado)

```bash
docker-compose up -d
```

O frontend estará disponível em `http://localhost:3000` e a API em `http://localhost:8080`.

## 💼 Modelo de Negócio

O Taverna do Mestre opera em um modelo de negócio freemium com assinaturas:

### Plano Gratuito
- Acesso limitado à geração de personagens (até 3)
- Geração de NPCs básicos (até 10 por mês)
- Geração de encontros simples (até 5 por mês)

### Plano Mestre (Pago)
- Personagens ilimitados
- NPCs ilimitados com traços de personalidade detalhados
- Encontros ilimitados com narrativas contextuais
- Exportação de fichas em PDF e outros formatos
- Ferramentas avançadas de customização

### Plano Arquimago (Premium)
- Todas as funcionalidades do plano Mestre
- Acesso a integrações com VTTs (Virtual Tabletop Systems)
- Geração de mapas
- API para desenvolvedores
- Suporte prioritário

## 🔖 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE.md](LICENSE.md) para mais detalhes.

## 🔮 Futuras Implementações

- Sistema de campanha compartilhada para múltiplos usuários
- Integração com plataformas de VTT (Roll20, Foundry VTT)
- Geração de mapas de cidades, masmorras e regiões
- Sistema de geração de missões e aventuras completas

## 🙏 Agradecimentos

- [D&D 5e SRD](https://dnd.wizards.com/resources/systems-reference-document) por fornecer material de referência para o sistema
- Comunidade open-source de RPG por compartilhar ferramentas e recursos
- Professores e orientadores envolvidos no desenvolvimento deste projeto

---
