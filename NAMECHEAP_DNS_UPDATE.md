# 🚨 ATUALIZAÇÃO DNS URGENTE - www.lech.world

## ⚠️ Situação Atual
- **DNS Atual**: Apontando para Vercel (projeto antigo)
- **Necessário**: Apontar para GitHub Pages (novo projeto LechWorld)

## 🔧 INSTRUÇÕES PARA ATUALIZAR NO NAMECHEAP

### 📍 Passo a Passo:

1. **Acesse Namecheap.com**
   ```
   https://www.namecheap.com
   ```
   - Faça login com suas credenciais

2. **Vá para seus domínios**
   - Dashboard → Domain List
   - Encontre `lech.world`
   - Clique em **"MANAGE"**

3. **Acesse "Advanced DNS"**
   - No menu superior, clique em **"Advanced DNS"**

4. **⚠️ DELETE os registros atuais**
   - Você verá registros apontando para Vercel
   - Delete TODOS os registros existentes:
     - CNAME www → cname.vercel-dns.com (DELETE)
     - A Record → 76.76.21.21 (DELETE)
     - Qualquer outro registro (DELETE)

5. **➕ ADICIONE os novos registros** (EXATAMENTE como abaixo):

### 📝 Registros DNS Necessários:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| **A Record** | @ | `185.199.108.153` | Automatic |
| **A Record** | @ | `185.199.109.153` | Automatic |
| **A Record** | @ | `185.199.110.153` | Automatic |
| **A Record** | @ | `185.199.111.153` | Automatic |
| **CNAME Record** | www | `leolech14.github.io` | Automatic |

### ⚠️ IMPORTANTE:
- O símbolo **@** significa o domínio raiz (lech.world)
- Digite **exatamente** como mostrado acima
- Use **Automatic** para TTL

6. **💾 SALVE as mudanças**
   - Clique no botão **"SAVE ALL CHANGES"** (botão verde com checkmark ✓)

## ✅ Como Verificar se Funcionou

### Após 5-10 minutos:
```bash
# No terminal, digite:
nslookup www.lech.world

# Deve mostrar:
# www.lech.world canonical name = leolech14.github.io
```

### Teste no navegador:
- Abra: https://www.lech.world
- Deve mostrar: **LechWorld - Sistema Premium de Gestão de Milhas**
- NÃO deve mostrar: "Monorepo 5"

## 🕐 Tempo Estimado

- **Mudança inicial**: 5-30 minutos
- **Propagação total**: Até 24 horas
- **Se usar Cloudflare/Proxy**: Desative temporariamente

## 🆘 Se Não Funcionar

1. **Limpe o cache DNS local**:
   ```bash
   # Mac:
   sudo dscacheutil -flushcache
   
   # Windows:
   ipconfig /flushdns
   ```

2. **Teste em modo incógnito** ou outro navegador

3. **Verifique propagação**:
   - https://dnschecker.org/#CNAME/www.lech.world
   - Deve mostrar: leolech14.github.io

4. **Verifique no GitHub**:
   - https://github.com/leolech14/lechworld/settings/pages
   - Status deve ser: ✅ Your site is published

## 📱 Resultado Final Esperado

Quando acessar https://www.lech.world você verá:
- **Título**: LechWorld
- **Tela de Login**: Com logo da LechWorld
- **Texto**: "Sistema Premium de Gestão de Milhas Familiares"
- **Usuários**: Leonardo, Osvandré, Marilise, Graciela

## ❌ NÃO deve mostrar:
- "Monorepo 5 - Web App"
- Conteúdo do Vercel/projeto antigo

---

**URGENTE**: Faça essa mudança o quanto antes para o site correto ficar online!

Se precisar de ajuda, o suporte do Namecheap está disponível 24/7 via chat.