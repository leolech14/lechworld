#\!/bin/bash

# Script para executar migração no banco de dados de produção

echo "Executando migração para adicionar campos de perfil..."

# Compilar o arquivo TypeScript
npx tsx server/migrations/add-profile-fields.ts

echo "Migração concluída\!"
