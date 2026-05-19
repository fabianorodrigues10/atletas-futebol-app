import { useState, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Switch,
  FlatList,
  Modal,
  Alert,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

interface FormJogo {
  mandante: string;
  visitante: string;
  competicao: string;
  data: string;
  horario: string;
  local: string;
  arbitro: string;
  assistente1: string;
  assistente2: string;
  placarMandante: string;
  placarVisitante: string;
  visualizadoNoEstadio: boolean;
  observacoes: string;
}

export default function MonitoramentoScreen() {
  const colors = useColors();
  const [tab, setTab] = useState<"novo" | "lista" | "relatorio">("novo");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormJogo>({
    mandante: "Marcílio Dias",
    visitante: "",
    competicao: "",
    data: new Date().toISOString().split("T")[0],
    horario: "",
    local: "",
    arbitro: "",
    assistente1: "",
    assistente2: "",
    placarMandante: "",
    placarVisitante: "",
    visualizadoNoEstadio: false,
    observacoes: "",
  });

  const [dataInicio, setDataInicio] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [dataFim, setDataFim] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Queries
  const { data: jogos, refetch: refetchJogos } =
    trpc.monitoramento.listJogos.useQuery();
  const { data: estatisticas } =
    trpc.monitoramento.getEstatisticasPeriodo.useQuery({
      dataInicio,
      dataFim,
    });

  // Mutations
  const createJogoMutation = trpc.monitoramento.createJogo.useMutation({
    onSuccess: () => {
      Alert.alert("Sucesso", "Jogo registrado com sucesso!");
      setForm({
        mandante: "Marcílio Dias",
        visitante: "",
        competicao: "",
        data: new Date().toISOString().split("T")[0],
        horario: "",
        local: "",
        arbitro: "",
        assistente1: "",
        assistente2: "",
        placarMandante: "",
        placarVisitante: "",
        visualizadoNoEstadio: false,
        observacoes: "",
      });
      setShowForm(false);
      refetchJogos();
    },
    onError: (error) => {
      Alert.alert("Erro", "Falha ao registrar jogo: " + error.message);
    },
  });

  const deleteJogoMutation = trpc.monitoramento.deleteJogo.useMutation({
    onSuccess: () => {
      Alert.alert("Sucesso", "Jogo deletado com sucesso!");
      refetchJogos();
    },
    onError: (error) => {
      Alert.alert("Erro", "Falha ao deletar jogo: " + error.message);
    },
  });

  const handleSubmitJogo = () => {
    if (!form.visitante.trim()) {
      Alert.alert("Erro", "Preencha o campo Visitante");
      return;
    }

    createJogoMutation.mutate({
      mandante: form.mandante,
      visitante: form.visitante,
      competicao: form.competicao || undefined,
      data: form.data,
      horario: form.horario || undefined,
      local: form.local || undefined,
      arbitro: form.arbitro || undefined,
      assistente1: form.assistente1 || undefined,
      assistente2: form.assistente2 || undefined,
      placarMandante: form.placarMandante ? parseInt(form.placarMandante) : undefined,
      placarVisitante: form.placarVisitante ? parseInt(form.placarVisitante) : undefined,
      visualizadoNoEstadio: form.visualizadoNoEstadio,
      observacoes: form.observacoes || undefined,
    });
  };

  const handleDeleteJogo = (jogoId: number) => {
    Alert.alert(
      "Confirmar",
      "Tem certeza que deseja deletar este jogo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Deletar",
          style: "destructive",
          onPress: () => deleteJogoMutation.mutate({ id: jogoId }),
        },
      ]
    );
  };

  const handleGerarPDF = async () => {
    if (!estatisticas || !jogos) {
      Alert.alert("Erro", "Dados não disponíveis");
      return;
    }

    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #0a7ea4; text-align: center; }
              h2 { color: #0a7ea4; margin-top: 20px; border-bottom: 2px solid #0a7ea4; padding-bottom: 10px; }
              .stats { display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap; }
              .stat-box { flex: 1; min-width: 200px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
              .stat-label { font-size: 12px; color: #666; }
              .stat-value { font-size: 32px; font-weight: bold; color: #0a7ea4; }
              .jogos-list { margin-top: 20px; }
              .jogo-item { padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; }
              .jogo-title { font-weight: bold; font-size: 14px; }
              .jogo-info { font-size: 12px; color: #666; margin-top: 5px; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; }
            </style>
          </head>
          <body>
            <h1>Relatório de Monitoramento de Jogos</h1>
            <p style="text-align: center; color: #666;">
              Período: ${dataInicio} a ${dataFim}
            </p>

            <h2>Resumo Geral</h2>
            <div class="stats">
              <div class="stat-box">
                <div class="stat-label">Total de Jogos</div>
                <div class="stat-value">${estatisticas.totalJogos}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Jogos no Estádio</div>
                <div class="stat-value">${estatisticas.jogosEstadio}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Outros Locais</div>
                <div class="stat-value">${estatisticas.jogosOutroLocal}</div>
              </div>
            </div>

            <div class="stats">
              <div class="stat-box">
                <div class="stat-label">Atletas Monitorados</div>
                <div class="stat-value">${estatisticas.totalAtletas}</div>
              </div>
              <div class="stat-box" style="background-color: #f0f8ff;">
                <div class="stat-label">Novos Atletas Descobertos</div>
                <div class="stat-value" style="color: #22c55e;">${estatisticas.atletasNovos}</div>
              </div>
            </div>

            <h2>Detalhes dos Jogos</h2>
            <div class="jogos-list">
              ${jogos
                .filter((j) => {
                  const dataJogo = new Date(j.data).toISOString().split("T")[0];
                  return dataJogo >= dataInicio && dataJogo <= dataFim;
                })
                .map(
                  (jogo) => `
                <div class="jogo-item">
                  <div class="jogo-title">${jogo.mandante} vs ${jogo.visitante}</div>
                  <div class="jogo-info">
                    <strong>Data:</strong> ${new Date(jogo.data).toLocaleDateString("pt-BR")}
                  </div>
                  ${jogo.competicao ? `<div class="jogo-info"><strong>Competição:</strong> ${jogo.competicao}</div>` : ""}
                  ${jogo.placarMandante !== null && jogo.placarVisitante !== null ? `<div class="jogo-info"><strong>Placar:</strong> ${jogo.placarMandante} x ${jogo.placarVisitante}</div>` : ""}
                  ${jogo.local ? `<div class="jogo-info"><strong>Local:</strong> ${jogo.local}</div>` : ""}
                  ${jogo.visualizadoNoEstadio ? `<div class="jogo-info" style="color: #0a7ea4;"><strong>✓ Visto no Estádio</strong></div>` : ""}
                  ${jogo.observacoes ? `<div class="jogo-info"><strong>Observações:</strong> ${jogo.observacoes}</div>` : ""}
                </div>
              `
                )
                .join("")}
            </div>

            <div class="footer">
              <p>Relatório gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
              <p>Marcílio Dias - Sistema de Monitoramento</p>
            </div>
          </body>
        </html>
      `;

      const fileName = `relatorio_monitoramento_${dataInicio}_${dataFim}.html`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, htmlContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: "text/html",
          dialogTitle: "Compartilhar Relatório",
        });
      } else {
        Alert.alert("Sucesso", "Relatório gerado em: " + filePath);
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao gerar relatório: " + String(error));
    }
  };

  const renderTabButton = (tabName: typeof tab, label: string) => (
    <TouchableOpacity
      onPress={() => setTab(tabName)}
      className={cn(
        "flex-1 py-3 px-2 items-center justify-center rounded-lg",
        tab === tabName
          ? "bg-primary"
          : "bg-surface border border-border"
      )}
    >
      <Text
        className={cn(
          "font-semibold text-sm",
          tab === tabName ? "text-background" : "text-foreground"
        )}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">
            Monitoramento
          </Text>
          <Text className="text-sm text-muted">
            Registre os jogos assistidos e gere relatórios
          </Text>
        </View>

        {/* Tab Buttons */}
        <View className="flex-row gap-2 mb-6">
          {renderTabButton("novo", "Novo Jogo")}
          {renderTabButton("lista", "Jogos")}
          {renderTabButton("relatorio", "Relatório")}
        </View>

        {/* TAB: NOVO JOGO */}
        {tab === "novo" && (
          <View className="gap-4">
            <TouchableOpacity
              onPress={() => setShowForm(!showForm)}
              className="bg-primary rounded-lg p-4 items-center"
            >
              <Text className="text-background font-semibold">
                {showForm ? "Fechar Formulário" : "+ Registrar Novo Jogo"}
              </Text>
            </TouchableOpacity>

            {showForm && (
              <View className="bg-surface rounded-lg p-4 gap-3 border border-border">
                {/* Mandante */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-1">
                    Mandante
                  </Text>
                  <TextInput
                    value={form.mandante}
                    onChangeText={(text) =>
                      setForm({ ...form, mandante: text })
                    }
                    placeholder="Ex: Marcílio Dias"
                    className="bg-background border border-border rounded-lg p-3 text-foreground"
                    placeholderTextColor={colors.muted}
                  />
                </View>

                {/* Visitante */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-1">
                    Visitante *
                  </Text>
                  <TextInput
                    value={form.visitante}
                    onChangeText={(text) =>
                      setForm({ ...form, visitante: text })
                    }
                    placeholder="Ex: São Joseense"
                    className="bg-background border border-border rounded-lg p-3 text-foreground"
                    placeholderTextColor={colors.muted}
                  />
                </View>

                {/* Competição */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-1">
                    Competição
                  </Text>
                  <TextInput
                    value={form.competicao}
                    onChangeText={(text) =>
                      setForm({ ...form, competicao: text })
                    }
                    placeholder="Ex: Brasileirão"
                    className="bg-background border border-border rounded-lg p-3 text-foreground"
                    placeholderTextColor={colors.muted}
                  />
                </View>

                {/* Data */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-1">
                    Data
                  </Text>
                  <TextInput
                    value={form.data}
                    onChangeText={(text) => setForm({ ...form, data: text })}
                    placeholder="YYYY-MM-DD"
                    className="bg-background border border-border rounded-lg p-3 text-foreground"
                    placeholderTextColor={colors.muted}
                  />
                </View>

                {/* Horário */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-1">
                    Horário
                  </Text>
                  <TextInput
                    value={form.horario}
                    onChangeText={(text) =>
                      setForm({ ...form, horario: text })
                    }
                    placeholder="Ex: 16:00"
                    className="bg-background border border-border rounded-lg p-3 text-foreground"
                    placeholderTextColor={colors.muted}
                  />
                </View>

                {/* Local */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-1">
                    Local
                  </Text>
                  <TextInput
                    value={form.local}
                    onChangeText={(text) => setForm({ ...form, local: text })}
                    placeholder="Ex: Estádio Municipal"
                    className="bg-background border border-border rounded-lg p-3 text-foreground"
                    placeholderTextColor={colors.muted}
                  />
                </View>

                {/* Placar */}
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground mb-1">
                      Placar Mandante
                    </Text>
                    <TextInput
                      value={form.placarMandante}
                      onChangeText={(text) =>
                        setForm({ ...form, placarMandante: text })
                      }
                      placeholder="0"
                      keyboardType="numeric"
                      className="bg-background border border-border rounded-lg p-3 text-foreground"
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground mb-1">
                      Placar Visitante
                    </Text>
                    <TextInput
                      value={form.placarVisitante}
                      onChangeText={(text) =>
                        setForm({ ...form, placarVisitante: text })
                      }
                      placeholder="0"
                      keyboardType="numeric"
                      className="bg-background border border-border rounded-lg p-3 text-foreground"
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                </View>

                {/* Visualizado no Estádio */}
                <View className="flex-row items-center justify-between bg-background border border-border rounded-lg p-3">
                  <Text className="text-sm font-semibold text-foreground">
                    Visto no Estádio?
                  </Text>
                  <Switch
                    value={form.visualizadoNoEstadio}
                    onValueChange={(value) =>
                      setForm({ ...form, visualizadoNoEstadio: value })
                    }
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.background}
                  />
                </View>

                {/* Observações */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-1">
                    Observações
                  </Text>
                  <TextInput
                    value={form.observacoes}
                    onChangeText={(text) =>
                      setForm({ ...form, observacoes: text })
                    }
                    placeholder="Notas adicionais..."
                    multiline
                    numberOfLines={3}
                    className="bg-background border border-border rounded-lg p-3 text-foreground"
                    placeholderTextColor={colors.muted}
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleSubmitJogo}
                  disabled={createJogoMutation.isPending}
                  className="bg-primary rounded-lg p-4 items-center mt-2"
                >
                  <Text className="text-background font-semibold">
                    {createJogoMutation.isPending ? "Salvando..." : "Salvar Jogo"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* TAB: LISTA DE JOGOS */}
        {tab === "lista" && (
          <View>
            {jogos && jogos.length > 0 ? (
              <FlatList
                data={jogos}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View className="bg-surface border border-border rounded-lg p-4 mb-3">
                    <View className="flex-row justify-between items-start mb-2">
                      <Text className="text-lg font-bold text-foreground flex-1">
                        {item.mandante} vs {item.visitante}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteJogo(item.id)}
                        className="bg-error rounded-lg p-2"
                      >
                        <Text className="text-background text-xs font-semibold">
                          ✕
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text className="text-sm text-muted mb-1">
                      📅 {item.data ? new Date(item.data).toLocaleDateString("pt-BR") : "N/A"}
                    </Text>

                    {item.placarMandante !== null && item.placarVisitante !== null && (
                      <Text className="text-sm text-muted mb-1">
                        ⚽ {item.placarMandante} x {item.placarVisitante}
                      </Text>
                    )}

                    {item.competicao && (
                      <Text className="text-sm text-muted mb-1">
                        🏆 {item.competicao}
                      </Text>
                    )}

                    {item.visualizadoNoEstadio && (
                      <Text className="text-sm text-primary font-semibold">
                        🎫 Visto no Estádio
                      </Text>
                    )}
                  </View>
                )}
              />
            ) : (
              <View className="items-center justify-center py-8">
                <Text className="text-muted text-center">
                  Nenhum jogo registrado ainda
                </Text>
              </View>
            )}
          </View>
        )}

        {/* TAB: RELATÓRIO */}
        {tab === "relatorio" && (
          <View className="gap-4">
            {/* Filtro de Datas */}
            <View className="bg-surface border border-border rounded-lg p-4 gap-3">
              <Text className="text-sm font-semibold text-foreground">
                Período do Relatório
              </Text>

              <View>
                <Text className="text-xs text-muted mb-1">Data Início</Text>
                <TextInput
                  value={dataInicio}
                  onChangeText={setDataInicio}
                  placeholder="YYYY-MM-DD"
                  className="bg-background border border-border rounded-lg p-3 text-foreground"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View>
                <Text className="text-xs text-muted mb-1">Data Fim</Text>
                <TextInput
                  value={dataFim}
                  onChangeText={setDataFim}
                  placeholder="YYYY-MM-DD"
                  className="bg-background border border-border rounded-lg p-3 text-foreground"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>

            {/* Estatísticas */}
            {estatisticas && (
              <View className="gap-3">
                <View className="bg-primary rounded-lg p-4">
                  <Text className="text-background text-xs opacity-80 mb-1">
                    Total de Jogos
                  </Text>
                  <Text className="text-background text-3xl font-bold">
                    {estatisticas.totalJogos}
                  </Text>
                </View>

                <View className="flex-row gap-2">
                  <View className="flex-1 bg-surface border border-border rounded-lg p-4">
                    <Text className="text-foreground text-xs opacity-80 mb-1">
                      No Estádio
                    </Text>
                    <Text className="text-foreground text-2xl font-bold">
                      {estatisticas.jogosEstadio}
                    </Text>
                  </View>
                  <View className="flex-1 bg-surface border border-border rounded-lg p-4">
                    <Text className="text-foreground text-xs opacity-80 mb-1">
                      Outro Local
                    </Text>
                    <Text className="text-foreground text-2xl font-bold">
                      {estatisticas.jogosOutroLocal}
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-2">
                  <View className="flex-1 bg-surface border border-border rounded-lg p-4">
                    <Text className="text-foreground text-xs opacity-80 mb-1">
                      Atletas Monitorados
                    </Text>
                    <Text className="text-foreground text-2xl font-bold">
                      {estatisticas.totalAtletas}
                    </Text>
                  </View>
                  <View className="flex-1 bg-success rounded-lg p-4">
                    <Text className="text-background text-xs opacity-80 mb-1">
                      Novos Atletas
                    </Text>
                    <Text className="text-background text-2xl font-bold">
                      {estatisticas.atletasNovos}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleGerarPDF}
                  className="bg-primary rounded-lg p-4 items-center"
                >
                  <Text className="text-background font-semibold">
                    📄 Gerar Relatório em PDF
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
