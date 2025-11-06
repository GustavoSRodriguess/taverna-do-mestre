#!/usr/bin/env node
// render-build.js
// Script de build customizado para o Render

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Iniciando build para Render...');

// Instalar dependências
console.log('📦 Instalando dependências...');
execSync('npm ci', { stdio: 'inherit' });

// Criar arquivo .env com variáveis do Render
console.log('⚙️ Configurando variáveis de ambiente...');
const envContent = `
VITE_API_URL=${process.env.VITE_API_URL || 'https://taverna-backend.onrender.com'}
VITE_AI_SERVICE_URL=${process.env.VITE_AI_SERVICE_URL || 'https://taverna-ai-service.onrender.com'}
`;

fs.writeFileSync('.env.production', envContent);

// Build do projeto
console.log('🔨 Construindo aplicação...');
execSync('npm run build', { stdio: 'inherit' });

console.log('✅ Build concluído com sucesso!');
