# TODO - Gerenciador de Atletas de Futebol

## Configuração Inicial
- [x] Gerar logo customizado do aplicativo
- [x] Atualizar configurações de branding no app.config.ts
- [x] Configurar tema de cores personalizado

## Backend e Modelo de Dados
- [x] Definir schema do banco de dados para atletas
- [x] Definir schema para configurações de campos customizados
- [x] Criar migrations do banco de dados
- [x] Implementar funções de query no server/db.ts
- [x] Criar rotas tRPC para CRUD de atletas
- [x] Criar rotas tRPC para gerenciamento de campos

## Interface - Tela Principal
- [x] Criar componente AtletaCard para lista
- [x] Implementar tela principal com FlatList
- [x] Adicionar barra de busca funcional
- [x] Implementar pull-to-refresh
- [x] Adicionar FAB para novo atleta
- [x] Criar empty state quando lista vazia
- [ ] Adicionar indicador de filtros ativos

## Interface - Filtros
- [x] Criar tela de filtros como modal/sheet
- [x] Implementar filtros por posição
- [x] Implementar filtros por clube
- [x] Implementar filtros por idade (range)
- [x] Implementar filtros por altura (range)
- [x] Implementar filtros por pé
- [x] Implementar filtros por escala
- [x] Implementar filtros por valência
- [x] Adicionar contador de resultados
- [x] Implementar botão limpar filtros
- [ ] Implementar aplicação de filtros na lista

## Interface - Detalhes do Atleta
- [x] Criar tela de detalhes com todas informações
- [x] Adicionar botão editar no header
- [x] Adicionar botão excluir com confirmação
- [x] Tornar campo link clicável
- [x] Implementar navegação para edição

## Interface - Cadastro e Edição
- [x] Criar formulário de cadastro/edição
- [x] Implementar campo de texto para nome do atleta
- [x] Implementar seletor de posição principal
- [x] Implementar seletor de segunda posição
- [x] Implementar campo de texto para clube
- [x] Implementar date picker para data de nascimento
- [x] Implementar cálculo automático de idade
- [x] Implementar campo numérico para altura
- [x] Implementar seletor de pé preferencial
- [x] Implementar campo de texto para link
- [x] Implementar seletor de escala
- [x] Implementar seletor de valência
- [x] Adicionar validação de campos obrigatórios
- [x] Implementar botões cancelar e salvar
- [x] Adicionar feedback de sucesso/erro

## Gerenciamento de Colunas
- [x] Criar tela de configurações de campos
- [ ] Listar campos padrão com toggles
- [ ] Implementar ativação/desativação de campos
- [x] Criar modal para adicionar campo customizado
- [x] Implementar criação de campos customizados
- [ ] Atualizar formulários dinamicamente baseado em campos ativos
- [ ] Persistir configurações de campos

## Estado e Persistência
- [ ] Criar context para gerenciar lista de atletas
- [ ] Criar context para configurações de campos
- [ ] Implementar persistência com AsyncStorage
- [ ] Implementar carregamento inicial de dados
- [ ] Adicionar loading states

## Navegação
- [x] Configurar tabs (Lista, Configurações)
- [x] Adicionar ícones aos tabs
- [x] Configurar navegação entre telas
- [x] Implementar navegação com parâmetros

## Testes e Validação
- [ ] Testar cadastro de atletas
- [ ] Testar edição de atletas
- [ ] Testar exclusão de atletas
- [ ] Testar filtros combinados
- [ ] Testar busca por nome
- [ ] Testar adição de campos customizados
- [ ] Testar persistência de dados
- [x] Validar performance com muitos registros (1.503 atletas carregando corretamente)

## Finalização
- [x] Criar checkpoint final
- [ ] Preparar documentação de uso

## Atualização de Status
- Backend e modelo de dados implementados
- API tRPC criada e funcional
- Próximo passo: desenvolver interface mobile


## Importação de Dados
- [x] Analisar estrutura do CSV do usuário
- [x] Criar script de importação de dados
- [x] Mapear campos do CSV para campos do banco
- [x] Executar importação dos atletas (1.503 atletas importados com sucesso)
- [x] Validar dados importados (15 testes passando)

## Correções de UI
- [ ] Adicionar botão de login visível na tela principal quando usuário não está autenticado

## Correções de Autenticação
- [ ] Corrigir rota de login para funcionar no mobile

## Correções Urgentes - Autenticação Web
- [ ] Corrigir callback OAuth para funcionar na versão web
- [ ] Implementar autenticação funcional para acesso aos dados


## Melhorias de UI/UX - Dashboard
- [x] Corrigir tela de detalhes para mostrar todas as informações do atleta (data nascimento, idade, altura)
- [x] Redesenhar dashboard com interface sofisticada e moderna
- [x] Adicionar cards com informações destacadas
- [x] Melhorar visual da tela de detalhes com layout mais profissional
- [x] Adicionar ícones e cores para melhor visualização

## Valências - Melhorias
- [x] Exibir campo "Valências" na tela de detalhes do atleta (sempre visível, mesmo vazio, com placeholder "Sem descrição")
- [x] Garantir campo de texto multilinha no formulário de edição para Valências (até 500+ caracteres)
- [x] Remover limite de 100 caracteres no router tRPC para o campo valencia (agora 1000)

## Correção Data de Nascimento
- [x] Alterar campo de data de nascimento no formulário para aceitar formato dd/mm/aa
- [x] Alterar exibição da data de nascimento na tela de detalhes para formato dd/mm/aa
- [x] Converter entre formato dd/mm/aa (UI) e ISO (banco) corretamente

## Filtros na Página Inicial
- [x] Adicionar filtro por posição na lista de atletas
- [x] Adicionar filtro por clube na lista de atletas
- [x] Adicionar filtro por faixa de idade na lista de atletas
- [x] Interface de filtros com botões/chips expansíveis

## Relatório PDF
- [x] Criar endpoint no servidor para gerar PDF com dados de atletas
- [x] Adicionar botão "Gerar Relatório" na tela principal
- [x] Gerar PDF com os atletas filtrados (respeitar filtros de posição, clube, idade e busca)
- [x] Incluir resumo, tabela e fichas individuais no PDF
- [x] Permitir compartilhar/baixar o PDF gerado

## Auto-preenchimento via Ogol
- [x] Criar endpoint no servidor para extrair dados de atleta do Ogol (scraping)
- [x] Mapear campos do Ogol para campos do app (nome, posição, data nasc., altura, pé, clube)
- [x] Adicionar botão "Preencher do Ogol" no formulário de cadastro/edição
- [x] Preencher automaticamente os campos disponíveis e deixar vazios os que não existem
- [x] Testar com múltiplos atletas para garantir consistência (19 testes passando)

## Confirmação antes de Gerar Relatório
- [x] Adicionar modal de confirmação antes de gerar o PDF
- [x] Mostrar resumo dos filtros aplicados no modal
- [x] Mostrar quantidade de atletas que serão incluídos no relatório
- [x] Botões "Cancelar" e "Gerar Relatório" no modal

## Bug: Auto-preenchimento Ogol não funciona
- [x] Investigar falha no scraping do Ogol (proteção Cloudflare bloqueia fetch direto)
- [x] Implementar solução alternativa que funcione no celular (WebView oculta)
- [x] Testar com links reais de atletas do Ogol (19 testes passando)


## Ogol Web - Fallback para Web
- [x] Implementar fallback para web: abre Ogol em nova aba
- [x] Manter WebView no celular (funciona perfeitamente)
- [x] Testar na web e celular

## Bug: Extração Ogol não captura posição, clube e naturalidade
- [x] Investigar por que regex não captura posição, clube e naturalidade no WebView
- [x] Analisar HTML real renderizado no WebView vs fetch direto
- [x] Corrigir padrões de extração para funcionar com HTML renderizado

## Foto de Atleta na Web
- [x] Verificar se upload de foto está implementado
- [x] Implementar upload de foto funcional na web (input file) e celular (ImagePicker)
- [x] Criar rota uploadFoto no servidor com base64 + S3 storage
- [x] Invalidar cache após upload para atualizar galeria e foto do atleta

## Bug: Campo busca perde foco após cada letra
- [x] Investigar causa raiz (TextInput dentro de ListHeaderComponent da FlatList causa remount)
- [x] Corrigir: mover header com logo e busca para fora da FlatList como elemento fixo

## Bug: Campo "Clube Atual" não está sendo salvo
- [x] Investigar por que clube atual não persiste após edição
- [x] Corrigir: passar clubeFormatado para executarCadastro em vez de usar estado clube

## Feature: Substituir Naturalidade por Escala na página de Relatório
- [x] Remover filtro de Naturalidade da página relatorio.tsx
- [x] Adicionar filtro de Escala com opções: A, B, B-, B+, C, C-, C+, D, D-, D+

## Bug: Campo busca na página relatorio perde foco após cada letra
- [x] Corrigir TextInput na página relatorio.tsx para manter foco durante digitação

## Feature: Adicionar botão de voltar na página de relatório
- [x] Adicionar botão de voltar à página inicial no topo da página relatorio.tsx

## Feature: Adicionar upload de foto no cadastro de novo atleta
- [x] Adicionar campo de upload de foto na página de cadastro
- [x] Permitir capturar/selecionar foto durante o cadastro (ImagePicker no celular, input file na web)
- [x] Salvar foto junto com os dados do atleta

## Bug: Upload de foto no cadastro não está funcionando
- [x] Investigar por que a foto não está sendo carregada
- [x] Corrigir função uploadarFoto para usar sintaxe correta do tRPC

## Bug: Foto não é salva ao cadastrar novo atleta
- [x] Investigar por que foto aparece no preview mas não é salva
- [x] Corrigir para fazer upload da foto junto com o cadastro do atleta

## Bug: Fotos não aparecem em nenhuma página após upload
- [x] Investigar por que fotos não são exibidas
- [x] Verificar se URLs do S3 estão sendo retornadas corretamente
- [x] Refatorar função uploadarFoto para armazenar base64 completo para novo atleta

## Feature: Adicionar espaço para vídeos do YouTube
- [x] Adicionar campo de vídeos na página de edição do atleta
- [ ] Exibir vídeos na página individual do atleta
- [ ] Incluir vídeos no relatório gerado

## Bug: Links de vídeos do YouTube não aparecem no relatório
- [x] Investigar por que vídeos não são incluídos no relatório gerado
- [x] Corrigir função de geração de relatório para incluir vídeos
- [x] Corrigir erro de prompt() que não funciona no React Native
- [x] Implementar modal para adicionar vídeos
- [x] Adicionar links de vídeos no PDF relatório
- [x] Adicionar logs de debug para rastrear salvamento de vídeos


## Feature: Indicador de Completude de Atletas
- [x] Limpar todos os valores '1' do campo 'escala' do banco de dados
- [x] Criar função para calcular % de completude do atleta
- [x] Adicionar indicador visual (barra de progresso ou badge) na lista de atletas
- [ ] Adicionar filtro para mostrar apenas atletas incompletos
- [x] Testar e validar o sistema de completude

## Feature: Visualizar vídeos na página de detalhes
- [x] Adicionar ícone pequeno de vídeo/play na página de detalhes do atleta quando há vídeos salvos


## Feature: Estatísticas de Completude
- [x] Criar modal/tela com gráfico de distribuição de completude (100%, 90-99%, 80-89%, etc)
- [x] Adicionar botão na tela principal para abrir estatísticas
- [x] Mostrar quantidade de atletas em cada faixa de completude


## Feature: Prévia de PDF antes de Baixar
- [x] Implementar visualizador de PDF no app
- [x] Modificar fluxo de relatório para mostrar prévia antes de baixar
- [x] Adicionar botões "Cancelar" e "Baixar" na prévia


## Feature: Atualização Automática de Dados
- [x] Implementar refetch automático ao voltar para tela principal
- [x] Garantir que mudanças feitas em detalhes/edição apareçam imediatamente

## Feature: Scroll Infinito para Carregar Todos os Atletas
- [x] Implementar paginação no endpoint /api/atletas (50 atletas por página)
- [x] Adicionar estado de página atual e indicador de carregamento
- [x] Implementar função loadMore() para carregar próxima página ao rolar
- [x] Adicionar ListFooterComponent com spinner enquanto carrega mais
- [x] Testar carregamento incremental de todos os 1716 atletas

## Feature: Busca em Tempo Real em Todos os Atletas (REMOVIDA - Preferência do usuário)
- [x] Criar endpoint GET /api/atletas/search/:query no servidor
- [x] Implementar busca por nome no banco de dados (case-insensitive)
- [x] Implementar busca com paginação para resultados grandes
- [x] Atualizar cliente para usar novo endpoint ao digitar na busca
- [x] Adicionar debounce para evitar muitas requisições
- [x] Testar busca com nomes como "Edinho" em todos os 1716 atletas
- [x] Remover busca em tempo real - usuário prefere todos os 1716 em ordem alfabética

## Bug: Upload e Exibição de Fotos
- [x] Investigar fluxo de upload de fotos
- [x] Verificar se a foto é salva no banco de dados
- [x] Verificar se a URL da foto é retornada corretamente
- [x] Corrigir exibição de fotos anexadas - convertendo s3Key para URL completa
- [x] Testar upload e exibição de fotos

## Bug: Cadastro de Novo Atleta Não Funciona
- [x] Investigar por que o botão salvar não funciona
- [x] Verificar validação do formulário
- [x] Verificar se há erro no console
- [x] Corrigir bug de cadastro - uploadMutation não existia, agora usa fetch direto
- [x] Testar cadastro de novo atleta


## Bug: tRPC Middleware Destruindo Mecanismo Nativo
- [x] Identificar que middlewares de conversão estavam destruindo o mecanismo do tRPC
- [x] Remover middlewares que reescreviam req.url e req.body
- [x] Testar cadastro no Expo Go - FUNCIONANDO
- [x] Testar cadastro na web - FUNCIONANDO
- [x] Testar upload de foto no cadastro - FUNCIONANDO


## Bug: Alinhamento de Ícones no Header
- [ ] Corrigir alinhamento dos ícones (gráfico, documento, engrenagem, busca) no header
- [ ] Ícones devem estar alinhados horizontalmente em uma linha

## Feature: Link no Nome do Atleta no Radar
- [x] Tornar o nome do atleta na lista do Radar clicável, abrindo o perfil completo do atleta

## Bug: Goleiros sumiram do Radar
- [x] Investigar por que os atletas da posição Goleiro desapareceram da lista do Radar
- [x] Corrigir e restaurar os goleiros (migrado grupo duplicado id=2 → id=60001; adicionada verificação anti-duplicata na criação de grupos)

## Bug Crítico: Estatísticas não salvam no Elenco
- [x] Investigar por que as alterações nos números dos atletas (estatísticas) não persistem
- [x] Corrigir: campos internos (id, createdAt, updatedAt) eram enviados no payload causando erro no Drizzle ORM ao fazer UPDATE. Servidor agora remove esses campos antes de salvar.

## Feature: Escudo do Marcílio Dias no Elenco
- [x] Substituir a bolinha placeholder pelo escudo oficial do Marcílio Dias na página do Elenco

## Bug Crítico: Estatísticas do Elenco ainda não persistem
- [x] Diagnosticar por que os dados preenchidos (ex: Davi Torres, Matheus Roldan) somem após salvar
- [x] Corrigido: payload agora remove campos internos (id, createdAt, updatedAt) antes de enviar; após salvar, busca os dados confirmados do servidor para atualizar o estado local

## Bug: Relatório individual do atleta não funciona no Expo Go
- [x] Diagnosticar por que o relatório individual do atleta falha no Expo Go (getApiBaseUrl() retornava string vazia no nativo)
- [x] Corrigido: app.config.ts agora injeta apiBaseUrl via extra; getApiBaseUrl() usa Constants.expoConfig.extra.apiBaseUrl no nativo

## Feature: Remover avaliação ao lado da altura no Elenco
- [x] Remover a avaliação (badge escala) exibida ao lado da altura na página de Análise do Elenco

## Feature: Reorganizar seções de estatísticas no modal do Elenco
- [x] Remover a seção "Passe" do modal de estatísticas
- [x] Mover "Passes" e "Passes Certos" para a seção "Ofensivo"

## Feature: Novos campos aéreos na seção Defensivo
- [x] Adicionar campo "Jogos Aéreos" na seção Defensivo do modal de estatísticas
- [x] Adicionar campo "Duelo Aéreo Perdido" na seção Defensivo do modal de estatísticas
- [x] Adicionar os campos no tipo, estado inicial e schema do banco (colunas jogosAereos e duelosAereosPerdidos criadas via ALTER TABLE)

## Feature: Módulo Scout por Jogo
- [ ] Criar tabela `jogos` no banco (jogo, competição, data, horário, local, árbitro, assistentes, renda, público, gols, placar, userId)
- [ ] Criar tabela `scoutJogo` no banco (jogoId, atletaId, userId + todos os campos de estatísticas + notas)
- [ ] Criar rotas no servidor para CRUD de jogos e scout
- [ ] Criar tela de listagem de jogos dentro da seção Elenco
- [ ] Criar tela de cadastro/edição do jogo (cabeçalho com todos os campos)
- [ ] Criar tela de scout do jogo: seleção de atletas do elenco + preenchimento de estatísticas por atleta
- [ ] Implementar soma automática: ao salvar scout, recalcular e atualizar estatísticas da temporada do atleta
- [ ] Implementar geração de relatório PDF do jogo no servidor
- [ ] Botão "Gerar Relatório" na tela do jogo

## Feature: Módulo Scout por Jogo (Série D)
- [x] Criar tabelas no banco (jogos e scoutJogo)
- [x] Criar rotas CRUD de jogos no servidor
- [x] Criar rota POST /api/jogos/:id/scouts com soma automática nas fichas individuais
- [x] Criar aba "Jogos" dentro da tela Elenco
- [x] Modal de cadastro/edição de jogo com todos os campos do cabeçalho (placar, competição, data, horário, local, árbitro, assistentes, renda, público, gols)
- [x] Modal de scout por jogo com seleção de atletas e planilha de estatísticas
- [x] Geração de relatório PDF do jogo com cabeçalho, tabela de scouts e avaliações individuais

## Feature: Máscara DD/MM/AAAA no campo de data do jogo
- [x] Campo de data do jogo no formato DD/MM/AAAA com barras automáticas ao digitar
- [x] Converter DD/MM/AAAA para AAAA-MM-DD ao salvar no banco
- [x] Exibir data no formato DD/MM/AAAA ao editar jogo existente

## Bug: Botão Salvar do modal de jogo não funciona na web
- [x] Diagnosticar por que clicar em Salvar no modal de jogo não faz nada na web (servidor falhava silenciosamente: campo dataExibicao não existe na tabela + publico como string vazia causava erro no banco)
- [x] Corrigido: servidor agora remove dataExibicao e converte strings vazias para null antes de salvar

## Feature: Ficha compacta de scout por atleta no modal de jogos
- [x] Redesenhar o modal de scout para versão compacta: uma linha por atleta com campos essenciais em grade pequena
- [x] Manter todos os campos disponíveis mas de forma condensada

## Feature: Simplificar notas no scout do jogo
- [x] Remover Atitudinal e Potencial das notas no scout do jogo, manter apenas Técnica, Física e Tática

## Bug: Emojis corrompidos no PDF do jogo
- [x] Remover emojis (📍 e outros) do gerador de PDF do jogo que aparecem como Ø=ÜÍ (substituido por texto: Local: ... e CA/CV para cartões)

## Feature: Ajustes no relatório PDF do jogo
- [x] Remover público e renda das informações da partida no PDF
- [x] Corrigir emojis corrompidos (📍 → "Local:", 🟨🟥 → "CA"/"CV")

## Feature: Simplificar relatório PDF do jogo
- [x] Remover seção "Informações da Partida" (árbitro, assistentes, gols) do PDF, manter apenas o cabeçalho

## Bug: Data do jogo no formato errado
- [x] Corrigir data no cabeçalho da página de jogos de MM/DD/AAAA para DD/MM/AAAA

## Bug Crítico: Scout dos atletas nos jogos não salva
- [x] Diagnosticar por que os dados dos atletas no scout do jogo não persistem (servidor falhava: notaAtitudinal e notaPotencial como string vazia causavam erro no banco)
- [x] Corrigido: servidor converte strings vazias em null antes de salvar o scout

## Feature: Edição do scout de jogo já preenchido
- [x] Ao abrir o scout de um jogo já preenchido, carregar os dados salvos nos campos
- [x] Permitir editar e salvar as alterações normalmente
- [x] Indicador de carregamento enquanto busca dados do servidor
- [x] Banner de sucesso/erro após salvar (compatível com web)
- [x] Atletas ordenados por posição no scout (Goleiro → Defensor → Meio → Atacante)
- [x] Notas decimais (ex: 7.5) exibidas corretamente nos campos de edição

## Bug: Minutagem dos atletas no scout sempre aparece como 90
- [x] Corrigir placeholder do campo minutosJogados de "90" para "-" (o placeholder era confundido com valor real)
- [x] Melhorar lógica de edição dos campos numéricos para permitir apagar e redigitar sem travar

## Bug: Atletas removidos da relação voltam a aparecer após salvar o scout
- [x] Corrigir servidor para deletar scouts de atletas removidos da relação ao salvar
- [x] Recalcular estatísticas dos atletas removidos após a deletão
