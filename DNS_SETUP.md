# 🌐 Configuração DNS para www.lech.world

## ✅ Status Atual
- **GitHub Pages**: ✅ Configurado e online
- **CNAME no GitHub**: ✅ www.lech.world configurado
- **DNS Namecheap**: ⏳ Precisa configurar

## 🔧 Configuração Necessária no Namecheap

### Opção 1: Via Painel Web (Mais Fácil)

1. **Acesse Namecheap.com**
   - Faça login na sua conta
   - Vá para "Domain List"
   - Clique em "Manage" ao lado de `lech.world`

2. **Vá para "Advanced DNS"**

3. **Delete todos os registros existentes** (se houver)

4. **Adicione os seguintes registros DNS:**

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | @ | 185.199.108.153 | Automatic |
| A Record | @ | 185.199.109.153 | Automatic |
| A Record | @ | 185.199.110.153 | Automatic |
| A Record | @ | 185.199.111.153 | Automatic |
| CNAME Record | www | leolech14.github.io | Automatic |

5. **Clique em "Save All Changes"** ✅

### Opção 2: Via API (Automático)

Se você tem API access habilitado no Namecheap:

1. **Habilite API Access**:
   - Vá para: https://ap.www.namecheap.com/settings/tools/apiaccess/
   - Habilite API Access
   - Adicione seu IP na whitelist
   - Copie sua API Key

2. **Execute o script Python**:
```bash
cd /Users/lech/PROJECTS_a/PROJECT_lechworld/lechworld-next
python3 setup_dns.py
```

3. **Digite suas credenciais quando solicitado**

## 🕐 Tempo de Propagação

- **Primeiros resultados**: 5-30 minutos
- **Propagação completa**: Até 24-48 horas
- **Verificar propagação**: https://dnschecker.org/#A/www.lech.world

## ✨ Após Configurar

Seu site estará acessível em:
- ✅ https://www.lech.world (principal)
- ✅ https://lech.world (redireciona para www)
- ✅ https://leolech14.github.io/lechworld (URL do GitHub)

## 🔍 Como Verificar se Funcionou

```bash
# Verificar DNS
nslookup www.lech.world
# Deve retornar: 185.199.108.153 (ou um dos IPs do GitHub)

# Testar com curl
curl -I https://www.lech.world
# Deve retornar: HTTP/2 200

# Ou simplesmente abra no navegador
open https://www.lech.world
```

## ⚠️ Troubleshooting

Se não funcionar após 1 hora:

1. **Verifique no GitHub**:
   - https://github.com/leolech14/lechworld/settings/pages
   - Deve mostrar: "Your site is published at https://www.lech.world"

2. **Verifique DNS**:
   ```bash
   dig www.lech.world
   dig lech.world
   ```

3. **Limpe cache do navegador**:
   - Cmd+Shift+R (Mac) ou Ctrl+F5 (Windows)
   - Ou teste em modo incógnito

4. **Se ainda não funcionar**:
   - Certifique-se que os registros DNS estão corretos
   - Aguarde mais tempo (até 48h em casos raros)
   - Verifique se o DNSSEC está desabilitado

## 📞 Suporte

- **Namecheap Support**: https://www.namecheap.com/support/
- **GitHub Pages Docs**: https://docs.github.com/en/pages
- **Status do GitHub**: https://www.githubstatus.com/

---

*Última atualização: Janeiro 2025*
*Site: LechWorld - Sistema de Gestão de Milhas Familiares*