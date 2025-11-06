#!/bin/bash
# Script para inicializar o banco de dados no Render

set -e

echo "Iniciando setup do banco de dados..."

# Conectar ao banco e executar os scripts SQL
psql $DATABASE_URL << EOF

-- Executar init.sql primeiro
$(cat ./db/init.sql)

-- Executar dnd_tables.sql depois
$(cat ./db/dnd_tables.sql)

EOF

echo "Setup do banco de dados concluído!"
