# 🚨 CONFIGURAÇÃO DNS FINAL - www.lech.world

## ⚡ AÇÃO NECESSÁRIA AGORA

Seu DNS ainda está apontando para Vercel (projeto antigo). Precisa ser atualizado para GitHub Pages.

## 📋 INSTRUÇÕES PASSO A PASSO

### 1️⃣ ACESSE O NAMECHEAP
```
https://www.namecheap.com
```
- Faça login com suas credenciais

### 2️⃣ VÁ PARA SEU DOMÍNIO
- Dashboard → Domain List
- Encontre `lech.world`
- Clique em **MANAGE**

### 3️⃣ CLIQUE EM "Advanced DNS"

### 4️⃣ DELETE TODOS OS REGISTROS EXISTENTES
⚠️ **IMPORTANTE**: Delete TODOS os registros, especialmente:
- CNAME www → cname.vercel-dns.com ❌ DELETE
- A Record → 76.76.21.21 ❌ DELETE
- Qualquer outro registro ❌ DELETE TODOS

### 5️⃣ ADICIONE ESTES 5 NOVOS REGISTROS

Clique em **"ADD NEW RECORD"** e adicione EXATAMENTE:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| **A Record** | **@** | **185.199.108.153** | Automatic |
| **A Record** | **@** | **185.199.109.153** | Automatic |
| **A Record** | **@** | **185.199.110.153** | Automatic |
| **A Record** | **@** | **185.199.111.153** | Automatic |
| **CNAME Record** | **www** | **leolech14.github.io** | Automatic |

⚠️ **NOTAS IMPORTANTES**:
- O símbolo **@** significa o domínio raiz (lech.world)
- Digite **EXATAMENTE** como mostrado acima
- Use **Automatic** para TTL

### 6️⃣ SALVE AS MUDANÇAS
- Clique no botão **"SAVE ALL CHANGES"** ✅ (botão verde com checkmark)

## ⏱️ TEMPO DE ESPERA

- **5-10 minutos**: Primeiros resultados
- **30-60 minutos**: Maioria dos locais
- **Até 24 horas**: Propagação global completa

## ✅ COMO VERIFICAR SE FUNCIONOU

### Teste 1: Terminal (5-10 minutos depois)
```bash
nslookup www.lech.world
```
Deve mostrar: `www.lech.world canonical name = leolech14.github.io`

### Teste 2: Navegador
Acesse: https://www.lech.world

**Você DEVE ver**:
- Logo LechWorld
- Tela de login
- "Sistema Premium de Gestão de Milhas Familiares"

**NÃO deve ver**:
- "Monorepo 5"
- Conteúdo do Vercel

## 🆘 SE NÃO FUNCIONAR

1. **Limpe o cache DNS**:
```bash
# Mac:
sudo dscacheutil -flushcache

# Windows:
ipconfig /flushdns
```

2. **Teste em modo incógnito**

3. **Verifique propagação global**:
https://dnschecker.org/#CNAME/www.lech.world

4. **Verifique GitHub Pages**:
https://github.com/leolech14/lechworld/settings/pages
(Deve mostrar: ✅ Your site is published)

## 🔧 OPÇÃO ALTERNATIVA: VIA API

Se você tem acesso à API do Namecheap:

1. **Habilite API Access**:
   - https://ap.www.namecheap.com/settings/tools/apiaccess/
   - Whitelist seu IP
   - Copie API Key

2. **Execute**:
```bash
cd /Users/lech/PROJECTS_a/PROJECT_lechworld/lechworld-next
python3 namecheap_dns_update.py
```

## 📞 SUPORTE

- **Namecheap Chat**: Disponível 24/7 no site
- **GitHub Status**: https://www.githubstatus.com/

---

**🚨 FAÇA ISSO AGORA PARA SEU SITE FICAR ONLINE!**