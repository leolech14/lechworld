#!/bin/bash

echo "Executando migração no banco de dados de produção via Fly.io..."

# Conectar ao banco de produção
flyctl postgres connect -a lechworld-db