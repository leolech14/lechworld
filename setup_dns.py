#!/usr/bin/env python3
"""
Script para configurar DNS do lech.world no Namecheap
Configura os registros necessários para GitHub Pages
"""

import requests
import xml.etree.ElementTree as ET
import sys

# Configuração do domínio
DOMAIN = "lech.world"
SLD = "lech"
TLD = "world"

# GitHub Pages IPs
GITHUB_IPS = [
    "185.199.108.153",
    "185.199.109.153", 
    "185.199.110.153",
    "185.199.111.153"
]

def get_client_ip():
    """Obtém o IP público do cliente"""
    try:
        response = requests.get('https://api.ipify.org')
        return response.text
    except:
        return "8.8.8.8"  # Fallback IP

def setup_dns_records(api_user, api_key):
    """Configura os registros DNS para GitHub Pages"""
    
    client_ip = get_client_ip()
    print(f"🌐 Configurando DNS para {DOMAIN}")
    print(f"📍 Seu IP: {client_ip}")
    
    # Registros DNS a serem configurados
    dns_records = []
    
    # A Records para o domínio apex (lech.world)
    for i, ip in enumerate(GITHUB_IPS, 1):
        dns_records.append({
            'HostName': '@',
            'RecordType': 'A',
            'Address': ip,
            'TTL': '1800'
        })
    
    # CNAME para www
    dns_records.append({
        'HostName': 'www',
        'RecordType': 'CNAME',
        'Address': 'leolech14.github.io',
        'TTL': '1800'
    })
    
    # Construir parâmetros da API
    params = {
        'ApiUser': api_user,
        'ApiKey': api_key,
        'UserName': api_user,
        'Command': 'namecheap.domains.dns.setHosts',
        'ClientIp': client_ip,
        'SLD': SLD,
        'TLD': TLD
    }
    
    # Adicionar cada registro DNS aos parâmetros
    for i, record in enumerate(dns_records, 1):
        params[f'HostName{i}'] = record['HostName']
        params[f'RecordType{i}'] = record['RecordType']
        params[f'Address{i}'] = record['Address']
        params[f'TTL{i}'] = record['TTL']
    
    print("\n📝 Configurando os seguintes registros:")
    print("-" * 50)
    for record in dns_records:
        print(f"  {record['RecordType']:5} {record['HostName']:10} → {record['Address']}")
    print("-" * 50)
    
    # Fazer a requisição para a API
    print("\n🚀 Enviando configuração para Namecheap...")
    
    try:
        response = requests.post(
            'https://api.namecheap.com/xml.response',
            data=params,
            timeout=30
        )
        
        # Parse XML response
        root = ET.fromstring(response.text)
        
        # Verificar se foi bem-sucedido
        status = root.get('Status')
        
        if status == 'OK':
            print("✅ DNS configurado com sucesso!")
            print("\n🎉 Configuração concluída! Aguarde alguns minutos para propagação.")
            print(f"\n🌐 Seu site estará disponível em:")
            print(f"   • https://www.lech.world")
            print(f"   • https://lech.world")
            print("\n⏱️  Pode levar até 24 horas para propagação completa do DNS.")
            return True
        else:
            # Buscar mensagem de erro
            errors = root.findall('.//Error')
            if errors:
                print("❌ Erro ao configurar DNS:")
                for error in errors:
                    print(f"   {error.text}")
            else:
                print("❌ Erro desconhecido ao configurar DNS")
                print(f"Response: {response.text[:500]}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro de conexão: {e}")
        return False
    except ET.ParseError as e:
        print(f"❌ Erro ao processar resposta: {e}")
        return False

def main():
    print("=" * 60)
    print("   CONFIGURAÇÃO DNS PARA GITHUB PAGES - LECH.WORLD")
    print("=" * 60)
    
    # Solicitar credenciais
    print("\n⚠️  Você precisa das credenciais da API do Namecheap")
    print("   Obtenha em: https://ap.www.namecheap.com/settings/tools/apiaccess/")
    print()
    
    api_user = input("Digite seu API User (geralmente seu username): ").strip()
    if not api_user:
        print("❌ API User é obrigatório!")
        sys.exit(1)
    
    api_key = input("Digite sua API Key: ").strip()
    if not api_key:
        print("❌ API Key é obrigatória!")
        sys.exit(1)
    
    # Configurar DNS
    success = setup_dns_records(api_user, api_key)
    
    if success:
        print("\n✨ Próximos passos:")
        print("1. Aguarde 5-10 minutos para o DNS propagar")
        print("2. Acesse https://www.lech.world")
        print("3. Se não funcionar imediatamente, aguarde até 24h")
        print("\n💡 Dica: Use 'nslookup www.lech.world' para verificar a propagação")
    else:
        print("\n😔 A configuração falhou. Verifique suas credenciais e tente novamente.")
        print("\n💡 Configuração manual:")
        print("1. Acesse Namecheap.com → Domain List → lech.world → Advanced DNS")
        print("2. Adicione os seguintes registros:")
        print("   • 4 A Records com @ apontando para os IPs do GitHub")
        print("   • 1 CNAME Record com www apontando para leolech14.github.io")

if __name__ == "__main__":
    main()