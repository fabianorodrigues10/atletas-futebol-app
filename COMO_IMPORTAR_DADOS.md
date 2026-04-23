# Como Importar os Dados dos Atletas

Seus 1.424 atletas estão prontos para serem importados! Siga este passo a passo simples:

## Passo a Passo

### 1. Abrir o Painel Database

- No lado direito da tela (painel de gerenciamento), clique no ícone de **Database** (banco de dados)
- Você verá a interface de gerenciamento do banco de dados

### 2. Executar os Arquivos SQL

Você precisa executar **8 arquivos SQL** na ordem. Cada arquivo contém aproximadamente 180 atletas.

**Execute os arquivos nesta ordem:**

1. `import_part_aa`
2. `import_part_ab`
3. `import_part_ac`
4. `import_part_ad`
5. `import_part_ae`
6. `import_part_af`
7. `import_part_ag`
8. `import_part_ah`

### 3. Como Executar Cada Arquivo

Para cada arquivo:

1. **Abra o arquivo** no painel de código (Code) à direita
2. **Copie todo o conteúdo** do arquivo (Ctrl+A, Ctrl+C)
3. **Volte para o painel Database**
4. **Cole o conteúdo** na área de query SQL
5. **Clique em "Execute"** ou pressione o botão de executar
6. **Aguarde** a confirmação de sucesso
7. **Repita** para o próximo arquivo

### 4. Verificar a Importação

Após executar todos os 8 arquivos, você pode verificar se deu certo:

1. No painel Database, execute esta query:

```sql
SELECT COUNT(*) as total FROM atletas WHERE userId = 1;
```

2. O resultado deve mostrar aproximadamente **1.424 atletas**

### 5. Usar o Aplicativo

Depois da importação:

1. **Abra o aplicativo** no seu celular (Expo Go)
2. **Faça login** com sua conta Manus
3. **Pronto!** Todos os seus atletas estarão disponíveis

Você poderá:
- ✅ Buscar atletas por nome
- ✅ Filtrar por posição, clube, idade, altura, etc.
- ✅ Ver detalhes completos de cada atleta
- ✅ Editar informações
- ✅ Adicionar novos atletas
- ✅ Excluir atletas

---

## Observações Importantes

- **Tempo estimado**: A importação completa leva cerca de 5-10 minutos
- **Não feche a página** enquanto estiver executando os comandos SQL
- **Se der erro**: Anote qual arquivo deu erro e me avise para eu ajudar
- **Dados já importados**: Se você executar o mesmo arquivo duas vezes, os atletas serão duplicados. Nesse caso, podemos limpar e recomeçar

## Precisa de Ajuda?

Se tiver qualquer dúvida ou problema durante a importação, me avise que eu te ajudo!
