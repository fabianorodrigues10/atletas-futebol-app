# Guia de Uso - Atletas Futebol

## Visão Geral

O **Atletas Futebol** é um aplicativo móvel completo para analistas de mercado gerenciarem informações sobre atletas de futebol brasileiro. O aplicativo oferece funcionalidades robustas de cadastro, edição, busca, filtros avançados e gerenciamento dinâmico de campos de dados.

---

## Primeiros Passos

### 1. Fazer Login

Ao abrir o aplicativo pela primeira vez, você verá a mensagem "Faça login para gerenciar seus atletas". Clique no botão de login para autenticar-se usando sua conta Manus.

### 2. Navegação Principal

O aplicativo possui duas abas principais:

- **Atletas**: Tela principal com a lista de atletas cadastrados
- **Configurações**: Gerenciamento de campos e configurações da conta

---

## Funcionalidades Principais

### Cadastrar Novo Atleta

1. Na tela **Atletas**, toque no botão flutuante **+** (canto inferior direito)
2. Preencha as informações do atleta:
   - **Nome** (obrigatório)
   - **Posição Principal**
   - **Segunda Posição**
   - **Clube**
   - **Data de Nascimento** (formato: AAAA-MM-DD)
   - **Idade** (calculada automaticamente a partir da data de nascimento)
   - **Altura** (em centímetros)
   - **Pé Preferencial** (direito, esquerdo ou ambidestro)
   - **Link** (URL de vídeo ou perfil)
   - **Escala** (classificação personalizada)
   - **Valência** (características técnicas)
3. Toque em **Salvar** para cadastrar o atleta

### Buscar Atletas

Na tela principal, utilize a **barra de busca** no topo para filtrar atletas por nome em tempo real. Digite o nome do atleta e a lista será atualizada automaticamente.

### Filtros Avançados

1. Toque no ícone de **filtro** (ao lado da barra de busca)
2. Configure os filtros desejados:
   - **Posição**: Filtra por posição principal ou secundária
   - **Clube**: Busca atletas de um clube específico
   - **Idade**: Define intervalo mínimo e máximo
   - **Altura**: Define intervalo mínimo e máximo (em cm)
   - **Pé Preferencial**
   - **Escala**
   - **Valência**
3. Toque em **Aplicar Filtros** para visualizar os resultados
4. Use **Limpar** para remover todos os filtros

### Visualizar Detalhes

1. Na lista de atletas, toque em qualquer **card de atleta**
2. Visualize todas as informações cadastradas
3. Toque no ícone de **lápis** para editar
4. Links podem ser abertos diretamente tocando sobre eles

### Editar Atleta

1. Acesse os detalhes do atleta
2. Toque no ícone de **edição** (lápis) no topo
3. Modifique os campos desejados
4. Toque em **Salvar** para confirmar as alterações

### Excluir Atleta

1. Acesse a tela de edição do atleta
2. Toque no ícone de **lixeira** no topo
3. Confirme a exclusão na mensagem que aparecerá

---

## Gerenciamento de Campos Customizados

### Criar Campos Personalizados

1. Acesse a aba **Configurações**
2. Toque em **Campos Customizados**
3. Toque no botão **+** (canto inferior direito)
4. Preencha:
   - **Nome do Campo**: Ex: "Nacionalidade", "Empresário", "Contrato"
   - **Tipo do Campo**: text, number, select ou date
5. Toque em **Criar**

### Gerenciar Campos

- **Ativar/Desativar**: Toque no badge de status do campo
- **Excluir**: Toque no ícone de lixeira ao lado do campo
- Campos inativos não aparecem nos formulários de cadastro/edição

---

## Dicas de Uso

### Cálculo Automático de Idade

Ao preencher a **Data de Nascimento** no formato correto (AAAA-MM-DD), a idade é calculada automaticamente. Você pode editar manualmente a idade apenas se não informar a data de nascimento.

### Pull-to-Refresh

Na tela principal, arraste a lista para baixo para atualizar os dados do servidor.

### Contador de Resultados

Abaixo da barra de busca, você verá o número total de atletas exibidos, facilitando o acompanhamento dos resultados filtrados.

---

## Campos Padrão Disponíveis

O aplicativo vem com os seguintes campos padrão:

| Campo | Descrição | Tipo |
|-------|-----------|------|
| Nome | Nome completo do atleta | Texto (obrigatório) |
| Posição | Posição principal | Texto |
| 2ª Posição | Posição secundária | Texto |
| Clube | Clube atual | Texto |
| Data de Nascimento | Data de nascimento | Data (AAAA-MM-DD) |
| Idade | Idade do atleta | Número |
| Altura | Altura em centímetros | Número |
| Pé | Pé preferencial | Seleção (direito/esquerdo/ambidestro) |
| Link | URL de vídeo ou perfil | Texto (URL) |
| Escala | Classificação personalizada | Texto |
| Valência | Características técnicas | Texto |

---

## Acesso ao Banco de Dados

Todos os dados são armazenados de forma segura no banco de dados MySQL na nuvem. Cada usuário tem acesso apenas aos seus próprios atletas cadastrados, garantindo privacidade e segurança das informações.

Para acessar o banco de dados diretamente:

1. Abra o painel de gerenciamento do projeto
2. Acesse a aba **Database**
3. Utilize a interface CRUD para visualizar e gerenciar dados
4. As credenciais de conexão estão disponíveis nas configurações (canto inferior esquerdo)

---

## Suporte e Contato

Para dúvidas, sugestões ou problemas técnicos, entre em contato através do site oficial da Manus em [https://help.manus.im](https://help.manus.im).

---

**Versão**: 1.0.0  
**Última Atualização**: Fevereiro 2026
