# Design do Aplicativo - Gerenciador de Atletas de Futebol

## Visão Geral

Aplicativo móvel para analistas de mercado gerenciarem um banco de dados completo de atletas de futebol brasileiro. O design segue os padrões do **Apple Human Interface Guidelines (HIG)**, priorizando usabilidade em orientação retrato (9:16) e operação com uma mão.

---

## Estrutura de Telas

### 1. **Tela Principal - Lista de Atletas**
- **Conteúdo**: Lista vertical com cards de atletas mostrando informações resumidas
- **Funcionalidade**: 
  - Busca rápida por nome de atleta
  - Botão de filtros avançados (ícone de funil no header)
  - Botão flutuante (+) para adicionar novo atleta
  - Pull-to-refresh para atualizar lista
  - Tap em card abre detalhes do atleta
- **Layout**: 
  - Header fixo com título, busca e botão de filtros
  - Lista scrollável de cards
  - FAB (Floating Action Button) no canto inferior direito

### 2. **Tela de Filtros**
- **Conteúdo**: Formulário com campos de filtro baseados nas colunas configuradas
- **Funcionalidade**:
  - Filtros dinâmicos por: posição, clube, idade (range), altura (range), pé, escala, valência
  - Botão "Limpar Filtros"
  - Botão "Aplicar" que retorna à lista com resultados filtrados
  - Contador de resultados em tempo real
- **Layout**: Modal ou sheet que desliza de baixo para cima

### 3. **Tela de Detalhes do Atleta**
- **Conteúdo**: Visualização completa de todas as informações do atleta
- **Funcionalidade**:
  - Exibição de todos os campos cadastrados
  - Botão "Editar" no header
  - Botão "Excluir" (com confirmação)
  - Link clicável (abre navegador externo)
- **Layout**: 
  - Header com nome do atleta e botão voltar
  - Scroll vertical com seções organizadas por tipo de informação

### 4. **Tela de Cadastro/Edição**
- **Conteúdo**: Formulário com todos os campos configurados
- **Funcionalidade**:
  - Campos de texto: atleta, clube, link
  - Seletores: posição, 2ª posição, pé, escala, valência
  - Date picker: data de nascimento
  - Campos numéricos: idade (calculada automaticamente), altura
  - Validação de campos obrigatórios
  - Botões "Cancelar" e "Salvar"
- **Layout**: 
  - Header com título "Novo Atleta" ou "Editar Atleta"
  - Formulário scrollável
  - Botões fixos no rodapé

### 5. **Tela de Configurações**
- **Conteúdo**: Gerenciamento de colunas/campos do banco de dados
- **Funcionalidade**:
  - Lista de campos atuais com toggle para ativar/desativar
  - Botão para adicionar novo campo customizado
  - Opção de reordenar campos (drag and drop)
  - Campos padrão não podem ser excluídos, apenas ocultados
- **Layout**: 
  - Header com título "Configurações de Campos"
  - Lista de campos com switches
  - FAB para adicionar novo campo

---

## Fluxos de Usuário Principais

### Fluxo 1: Cadastrar Novo Atleta
1. Usuário está na **Tela Principal**
2. Toca no botão flutuante (+)
3. Abre **Tela de Cadastro** vazia
4. Preenche informações do atleta
5. Toca em "Salvar"
6. Sistema valida dados
7. Retorna à **Tela Principal** com novo atleta na lista
8. Feedback visual de sucesso (toast)

### Fluxo 2: Buscar e Filtrar Atletas
1. Usuário está na **Tela Principal**
2. **Opção A - Busca Rápida**:
   - Digita nome na barra de busca
   - Lista filtra em tempo real
3. **Opção B - Filtros Avançados**:
   - Toca no ícone de filtros
   - Abre **Tela de Filtros**
   - Seleciona critérios (ex: posição = "Atacante", clube = "Flamengo")
   - Toca em "Aplicar"
   - Retorna à **Tela Principal** com resultados filtrados
   - Badge no ícone de filtros indica filtros ativos

### Fluxo 3: Visualizar e Editar Atleta
1. Usuário está na **Tela Principal**
2. Toca em um card de atleta
3. Abre **Tela de Detalhes**
4. Revisa informações
5. Toca em "Editar"
6. Abre **Tela de Edição** com dados preenchidos
7. Modifica campos necessários
8. Toca em "Salvar"
9. Retorna à **Tela de Detalhes** atualizada

### Fluxo 4: Gerenciar Campos Customizados
1. Usuário acessa **Tela de Configurações** (via tab ou menu)
2. Visualiza lista de campos atuais
3. **Opção A - Adicionar Campo**:
   - Toca no FAB (+)
   - Modal para definir nome e tipo do campo
   - Confirma criação
   - Campo aparece na lista
4. **Opção B - Ocultar Campo**:
   - Desativa toggle de um campo
   - Campo não aparece mais em cadastro/edição/detalhes
5. Retorna ao app e vê mudanças aplicadas

---

## Paleta de Cores

### Cores Principais
- **Primary (Azul Futebol)**: `#0066CC` - Botões principais, links, elementos interativos
- **Background**: `#FFFFFF` (light) / `#151718` (dark)
- **Surface (Cards)**: `#F5F5F5` (light) / `#1E2022` (dark)
- **Foreground (Texto)**: `#11181C` (light) / `#ECEDEE` (dark)
- **Muted (Texto Secundário)**: `#687076` (light) / `#9BA1A6` (dark)

### Cores de Status
- **Success (Verde)**: `#22C55E` - Confirmações, salvamentos
- **Warning (Amarelo)**: `#F59E0B` - Alertas, campos obrigatórios
- **Error (Vermelho)**: `#EF4444` - Erros, exclusões

### Aplicação
- Botão primário: fundo `primary`, texto branco
- Cards de atletas: fundo `surface`, borda `border`
- Texto principal: `foreground`
- Labels e hints: `muted`

---

## Componentes Principais

### AtletaCard
- Card compacto para lista
- Exibe: nome, posição, clube, idade
- Ícone de posição (atacante, meio-campo, defesa, goleiro)
- Tap abre detalhes

### FilterChip
- Chip removível para filtros ativos
- Exibe: "Posição: Atacante" com X para remover
- Aparece acima da lista quando filtros estão aplicados

### FormField
- Campo de formulário reutilizável
- Label, input, mensagem de erro
- Suporte para diferentes tipos: text, number, date, select

### EmptyState
- Ilustração + mensagem quando lista está vazia
- Botão de ação (ex: "Cadastrar Primeiro Atleta")

---

## Considerações de UX

1. **Operação com Uma Mão**: Botões principais na parte inferior, alcançáveis com o polegar
2. **Feedback Imediato**: Animações sutis em toques, loading states visíveis
3. **Validação em Tempo Real**: Erros de formulário aparecem ao sair do campo
4. **Confirmações Destrutivas**: Modal de confirmação para exclusões
5. **Persistência Local**: Dados salvos automaticamente no dispositivo (AsyncStorage)
6. **Performance**: Lista virtualizada (FlatList) para suportar milhares de atletas
7. **Acessibilidade**: Tamanhos de fonte ajustáveis, contraste adequado, labels descritivos

---

## Decisões Técnicas

- **Armazenamento**: AsyncStorage (local) - dados permanecem no dispositivo do usuário
- **Autenticação**: Não necessária (app single-user)
- **Backend**: Não necessário inicialmente (dados locais)
- **Navegação**: Expo Router com tabs (Lista, Configurações)
- **Estado**: React Context + useReducer para gerenciar lista de atletas e configurações de campos
- **Validação**: Zod schemas para validação de formulários
