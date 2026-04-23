# Configuração DNS - marciliodias.app.br

## Status do Domínio

- ✅ Domínio adicionado ao Vercel
- ⏳ Aguardando configuração DNS no registro.br

## Registros DNS Necessários

Para conectar seu domínio `marciliodias.app.br` ao Vercel, adicione o seguinte registro no painel de controle do registro.br:

### Registro CNAME

| Campo | Valor |
|-------|-------|
| **Tipo** | CNAME |
| **Nome/Host** | `www` |
| **Valor/Destino** | `a2a8966a7e0e3867.vercel-dns-017.com.` |

## Instruções Passo a Passo

1. Acesse o painel de controle do registro.br (https://registro.br)
2. Faça login com suas credenciais
3. Procure pela seção de "Gerenciar DNS" ou "Zona DNS"
4. Procure pelo domínio `marciliodias.app.br`
5. Adicione um novo registro CNAME:
   - **Subdomain/Host**: `www`
   - **Type**: CNAME
   - **Target/Value**: `a2a8966a7e0e3867.vercel-dns-017.com.`
6. Salve as alterações

## Redirecionamento

- `marciliodias.app.br` → redireciona para `www.marciliodias.app.br` (307 Temporary Redirect)
- `www.marciliodias.app.br` → conectado ao Vercel (Production)

## Tempo de Propagação

Após adicionar o registro CNAME, pode levar de **15 minutos a 48 horas** para a propagação DNS ser concluída. Durante este período, o domínio pode não estar acessível.

## Verificação

Após a propagação DNS, você poderá acessar o app em:
- https://marciliodias.app.br
- https://www.marciliodias.app.br

## Suporte

Se tiver dúvidas sobre a configuração DNS no registro.br, consulte:
- https://www.registro.br/ajuda/

Se tiver dúvidas sobre a configuração no Vercel, consulte:
- https://vercel.com/docs/concepts/projects/domains
