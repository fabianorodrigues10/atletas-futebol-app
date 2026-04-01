
import { View, Text, ScrollView, Dimensions, TouchableOpacity, Modal, TextInput, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { BarChart, PieChart } from "react-native-chart-kit";
import { useMemo, useState } from "react";

interface Filtros {
  posicoes: string[];
  escalas: string[];
  clubes: string[];
  idades: number[];
  naturalidades: string[];
}

export default function StatsScreen() {
  const colors = useColors();
  const screenWidth = Dimensions.get("window").width;

  const [filtros, setFiltros] = useState<Filtros>({
    posicoes: [],
    escalas: [],
    clubes: [],
    idades: [],
    naturalidades: [],
  });
  const [atletasSelecionados, setAtletasSelecionados] = useState<number[]>([]);
  const [showFiltros, setShowFiltros] = useState(false);
  const [showTabela, setShowTabela] = useState(false);
  const [abaFiltros, setAbaFiltros] = useState<"posicao" | "idade" | "clube" | "escala" | "naturalidade">("posicao");
  const [buscaAtleta, setBuscaAtleta] = useState("");
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);

  const { data: atletas = [] } = trpc.atletas.list.useQuery();

  const atletasFiltrados = useMemo(() => {
    return atletas.filter((atleta: any) => {
      if (filtros.posicoes.length > 0 && !filtros.posicoes.includes(atleta.posicao)) return false;
      if (filtros.escalas.length > 0 && !filtros.escalas.includes(atleta.escala)) return false;
      if (filtros.clubes.length > 0 && !filtros.clubes.includes(atleta.clube)) return false;
      if (filtros.naturalidades.length > 0 && !filtros.naturalidades.includes(atleta.naturalidade)) return false;
      if (filtros.idades.length > 0 && atleta.idade) {
        const faixa = Math.floor(atleta.idade / 5) * 5;
        if (!filtros.idades.includes(faixa)) return false;
      }
      return true;
    });
  }, [atletas, filtros]);

  // Atletas filtrados e com busca por nome aplicada
  const atletasVisiveis = useMemo(() => {
    if (!buscaAtleta.trim()) return atletasFiltrados;
    const termo = buscaAtleta.toLowerCase().trim();
    return atletasFiltrados.filter((a: any) => a.nome?.toLowerCase().includes(termo));
  }, [atletasFiltrados, buscaAtleta]);

  // Atletas efetivamente usados para estatísticas e relatório
  const atletasParaAnalise = useMemo(() => {
    if (atletasSelecionados.length > 0) {
      return atletasFiltrados.filter((a: any) => atletasSelecionados.includes(a.id));
    }
    return atletasFiltrados;
  }, [atletasFiltrados, atletasSelecionados]);

  const stats = useMemo(() => {
    if (atletasParaAnalise.length === 0) {
      return {
        totalAtletas: 0, posicoes: {}, idades: {}, escalas: {}, clubes: {},
        idadeMedia: 0, idadeMediana: 0, alturaMedia: 0, alturaMediana: 0,
        idadeMin: 0, idadeMax: 0, alturaMin: 0, alturaMax: 0,
      };
    }

    const posicoes: Record<string, number> = {};
    const idades: Record<string, number> = {};
    const escalas: Record<string, number> = {};
    const clubes: Record<string, number> = {};
    const idadesArray: number[] = [];
    const alturasArray: number[] = [];

    atletasParaAnalise.forEach((atleta: any) => {
      if (atleta.posicao) posicoes[atleta.posicao] = (posicoes[atleta.posicao] || 0) + 1;
      if (atleta.escala) escalas[atleta.escala] = (escalas[atleta.escala] || 0) + 1;
      if (atleta.clube) clubes[atleta.clube] = (clubes[atleta.clube] || 0) + 1;
      if (atleta.idade) {
        idadesArray.push(atleta.idade);
        const faixa = Math.floor(atleta.idade / 5) * 5;
        idades[`${faixa}-${faixa + 4}`] = (idades[`${faixa}-${faixa + 4}`] || 0) + 1;
      }
      if (atleta.altura) {
        const h = parseFloat(atleta.altura);
        if (!isNaN(h)) alturasArray.push(h);
      }
    });

    const mediana = (arr: number[]) => {
      if (!arr.length) return 0;
      const s = [...arr].sort((a, b) => a - b);
      const m = Math.floor(s.length / 2);
      return s.length % 2 !== 0 ? s[m] : (s[m - 1] + s[m]) / 2;
    };

    return {
      totalAtletas: atletasParaAnalise.length,
      posicoes, idades, escalas, clubes,
      idadeMedia: idadesArray.length ? Math.round(idadesArray.reduce((a, b) => a + b, 0) / idadesArray.length * 10) / 10 : 0,
      idadeMediana: mediana(idadesArray),
      alturaMedia: alturasArray.length ? (alturasArray.reduce((a, b) => a + b, 0) / alturasArray.length).toFixed(2) : "0",
      alturaMediana: mediana(alturasArray).toFixed(2),
      idadeMin: idadesArray.length ? Math.min(...idadesArray) : 0,
      idadeMax: idadesArray.length ? Math.max(...idadesArray) : 0,
      alturaMin: alturasArray.length ? Math.min(...alturasArray).toFixed(2) : "0",
      alturaMax: alturasArray.length ? Math.max(...alturasArray).toFixed(2) : "0",
    };
  }, [atletasParaAnalise]);

  const posicoes = useMemo(() => [...new Set(atletas.map((a: any) => a.posicao).filter(Boolean))].sort() as string[], [atletas]);
  const clubesList = useMemo(() => [...new Set(atletas.map((a: any) => a.clube).filter(Boolean))].sort() as string[], [atletas]);
  const escalas = useMemo(() => [...new Set(atletas.map((a: any) => a.escala).filter(Boolean))].sort() as string[], [atletas]);
  const naturalidades = useMemo(() => [...new Set(atletas.map((a: any) => a.naturalidade).filter(Boolean))].sort() as string[], [atletas]);

  const posicoesPorcentagem = useMemo(() =>
    Object.entries(stats.posicoes).map(([name, value]) => ({
      name, population: value, color: colors.primary, legendFontColor: colors.foreground,
    })), [stats.posicoes, colors]);

  const idadesPorcentagem = useMemo(() =>
    Object.entries(stats.idades).map(([name, value]) => ({ name, population: value })),
    [stats.idades]);

  const chartConfig = {
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    color: () => colors.primary,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };

  // IDs dos atletas para buscar estatísticas (selecionados ou todos os filtrados)
  const idsParaEstatisticas = atletasSelecionados.length > 0
    ? atletasSelecionados
    : atletasFiltrados.map((a: any) => a.id);

  const { data: estatisticasTemporada = [] } = trpc.estatisticas.getByAtletaIds.useQuery(
    { atletaIds: idsParaEstatisticas },
    { enabled: idsParaEstatisticas.length > 0 }
  );

  // Resumo dinâmico calculado a partir dos atletas para análise + estatísticas
  const resumoDinamico = useMemo(() => {
    const base = atletasParaAnalise;
    const totalAtletas = base.length;

    const idades = base.map((a: any) => a.idade).filter(Boolean) as number[];
    const mediaIdade = idades.length
      ? Math.round(idades.reduce((s, v) => s + v, 0) / idades.length * 10) / 10
      : null;

    const alturas = base.map((a: any) => parseFloat(a.altura)).filter(v => !isNaN(v)) as number[];
    const mediaAltura = alturas.length
      ? (alturas.reduce((s, v) => s + v, 0) / alturas.length).toFixed(2)
      : null;

    const statsMap = new Map((estatisticasTemporada as any[]).map(s => [s.atletaId, s]));
    const totalGols = base.reduce((sum: number, a: any) => {
      const s = statsMap.get(a.id);
      return sum + (s?.gols || 0);
    }, 0);

    return { totalAtletas, mediaIdade, mediaAltura, totalGols };
  }, [atletasParaAnalise, estatisticasTemporada]);

  const gerarPDFMutation = trpc.relatorios.gerarPDF.useMutation();

  const handleGerarRelatorio = async () => {
    if (atletasParaAnalise.length === 0) return;
    setGerandoRelatorio(true);
    try {
      const resultado = await gerarPDFMutation.mutateAsync({
        titulo: `Relatório Comparativo — ${new Date().toLocaleDateString("pt-BR")}`,
        posicoes: filtros.posicoes,
        idades: filtros.idades,
        clubes: filtros.clubes,
        atletaIds: atletasParaAnalise.map((a: any) => a.id),
      });

      if (resultado.success && resultado.pdfBase64) {
        const binaryString = atob(resultado.pdfBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Relatorio_Comparativo_${new Date().toISOString().split("T")[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Erro ao gerar relatório:", e);
    } finally {
      setGerandoRelatorio(false);
    }
  };

  const handleLimparFiltros = () => {
    setFiltros({ posicoes: [], escalas: [], clubes: [], idades: [], naturalidades: [] });
    setAtletasSelecionados([]);
    setBuscaAtleta("");
  };

  const toggleAtleta = (id: number) => {
    setAtletasSelecionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selecionarTodos = () => {
    setAtletasSelecionados(atletasVisiveis.map((a: any) => a.id));
  };

  const limparSelecao = () => setAtletasSelecionados([]);

  const temFiltroAtivo = filtros.posicoes.length > 0 || filtros.idades.length > 0 ||
    filtros.clubes.length > 0 || filtros.escalas.length > 0 || filtros.naturalidades.length > 0;

  return (
    <ScreenContainer className="bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-4">
          <View>
            <Text className="text-2xl font-bold text-foreground">Análise de Elenco</Text>
            <Text className="text-xs text-muted mt-0.5">
              {atletasSelecionados.length > 0
                ? `${atletasSelecionados.length} selecionado(s) de ${atletasFiltrados.length}`
                : `${atletasFiltrados.length} atleta(s) filtrado(s)`}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowFiltros(true)}
            style={{ backgroundColor: temFiltroAtivo ? colors.primary : colors.surface, borderWidth: 1, borderColor: temFiltroAtivo ? colors.primary : colors.border, borderRadius: 20, padding: 10 }}
          >
            <IconSymbol name="line.horizontal.3" size={22} color={temFiltroAtivo ? colors.background : colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Tags de filtros ativos */}
        {temFiltroAtivo && (
          <View className="px-4 mb-3">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {filtros.posicoes.map(p => (
                <TouchableOpacity key={p} onPress={() => setFiltros({ ...filtros, posicoes: filtros.posicoes.filter(x => x !== p) })}
                  style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.primary + "22", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4 }}>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600" }}>{p}</Text>
                  <Text style={{ color: colors.primary, fontSize: 10 }}>✕</Text>
                </TouchableOpacity>
              ))}
              {filtros.idades.map(i => (
                <TouchableOpacity key={i} onPress={() => setFiltros({ ...filtros, idades: filtros.idades.filter(x => x !== i) })}
                  style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.primary + "22", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4 }}>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600" }}>{i}–{i + 4} anos</Text>
                  <Text style={{ color: colors.primary, fontSize: 10 }}>✕</Text>
                </TouchableOpacity>
              ))}
              {filtros.clubes.map(c => (
                <TouchableOpacity key={c} onPress={() => setFiltros({ ...filtros, clubes: filtros.clubes.filter(x => x !== c) })}
                  style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.primary + "22", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4 }}>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600" }}>{c}</Text>
                  <Text style={{ color: colors.primary, fontSize: 10 }}>✕</Text>
                </TouchableOpacity>
              ))}
              {filtros.escalas.map(e => (
                <TouchableOpacity key={e} onPress={() => setFiltros({ ...filtros, escalas: filtros.escalas.filter(x => x !== e) })}
                  style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.primary + "22", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4 }}>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600" }}>{e}</Text>
                  <Text style={{ color: colors.primary, fontSize: 10 }}>✕</Text>
                </TouchableOpacity>
              ))}
              {filtros.naturalidades.map(n => (
                <TouchableOpacity key={n} onPress={() => setFiltros({ ...filtros, naturalidades: filtros.naturalidades.filter(x => x !== n) })}
                  style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.primary + "22", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4 }}>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600" }}>{n}</Text>
                  <Text style={{ color: colors.primary, fontSize: 10 }}>✕</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={handleLimparFiltros}
                style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.error + "22", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: colors.error, fontSize: 12, fontWeight: "600" }}>Limpar tudo</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* ─── PAINEL DE RESUMO DINÂMICO ─── */}
        {atletasParaAnalise.length > 0 && (
          <View className="mx-4 mb-4">
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[
                { label: "Atletas", value: String(resumoDinamico.totalAtletas), icon: "👤" },
                { label: "Méd. Idade", value: resumoDinamico.mediaIdade != null ? `${resumoDinamico.mediaIdade}a` : "—", icon: "📅" },
                { label: "Méd. Altura", value: resumoDinamico.mediaAltura != null ? `${resumoDinamico.mediaAltura}m` : "—", icon: "📏" },
                { label: "Gols", value: String(resumoDinamico.totalGols), icon: "⚽" },
              ].map(({ label, value, icon }) => (
                <View key={label} style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingVertical: 10,
                  paddingHorizontal: 6,
                  alignItems: "center",
                  gap: 2,
                }}>
                  <Text style={{ fontSize: 18 }}>{icon}</Text>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: colors.primary }}>{value}</Text>
                  <Text style={{ fontSize: 10, color: colors.muted, textAlign: "center" }}>{label}</Text>
                </View>
              ))}
            </View>
            {atletasSelecionados.length > 0 && (
              <Text style={{ fontSize: 11, color: colors.muted, textAlign: "center", marginTop: 6 }}>
                Dados referentes aos {atletasSelecionados.length} atleta(s) selecionado(s)
              </Text>
            )}
          </View>
        )}

        {/* ─── SEÇÃO DE SELEÇÃO DE ATLETAS ─── */}
        <View className="mx-4 mb-4 bg-surface rounded-2xl overflow-hidden" style={{ borderWidth: 1, borderColor: colors.border }}>
          {/* Cabeçalho da seção */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Text className="text-sm font-bold text-foreground">
              Selecionar Atletas para Relatório
            </Text>
            <View className="flex-row gap-2">
              <TouchableOpacity onPress={selecionarTodos}
                style={{ backgroundColor: colors.primary + "22", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "700" }}>Todos</Text>
              </TouchableOpacity>
              {atletasSelecionados.length > 0 && (
                <TouchableOpacity onPress={limparSelecao}
                  style={{ backgroundColor: colors.error + "22", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: colors.error, fontSize: 11, fontWeight: "700" }}>Limpar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Campo de busca por nome */}
          <View className="px-3 py-2 border-b border-border">
            <TextInput
              value={buscaAtleta}
              onChangeText={setBuscaAtleta}
              placeholder="Buscar por nome..."
              placeholderTextColor={colors.muted}
              style={{
                backgroundColor: colors.background,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 7,
                fontSize: 13,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
          </View>

          {/* Lista de chips com nomes */}
          <View className="px-3 py-3" style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {atletasVisiveis.length === 0 ? (
              <Text className="text-muted text-sm px-1 py-2">
                {temFiltroAtivo ? "Nenhum atleta encontrado com esses filtros." : "Aplique filtros para ver os atletas."}
              </Text>
            ) : (
              atletasVisiveis.map((atleta: any) => {
                const selecionado = atletasSelecionados.includes(atleta.id);
                return (
                  <TouchableOpacity
                    key={atleta.id}
                    onPress={() => toggleAtleta(atleta.id)}
                    style={{
                      backgroundColor: selecionado ? colors.primary : colors.background,
                      borderWidth: 1.5,
                      borderColor: selecionado ? colors.primary : colors.border,
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                  >
                    <Text style={{
                      color: selecionado ? colors.background : colors.foreground,
                      fontSize: 13,
                      fontWeight: selecionado ? "700" : "400",
                    }}>
                      {atleta.nome}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* Rodapé com contador e botão de relatório */}
          <View className="flex-row items-center justify-between px-4 py-3 border-t border-border">
            <Text className="text-xs text-muted">
              {atletasSelecionados.length > 0
                ? `${atletasSelecionados.length} atleta(s) selecionado(s)`
                : `${atletasVisiveis.length} atleta(s) disponíveis`}
            </Text>
            <TouchableOpacity
              onPress={handleGerarRelatorio}
              disabled={atletasParaAnalise.length === 0 || gerandoRelatorio}
              style={{
                backgroundColor: atletasParaAnalise.length > 0 ? colors.primary : colors.border,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 8,
                opacity: gerandoRelatorio ? 0.7 : 1,
              }}
            >
              <Text style={{ color: atletasParaAnalise.length > 0 ? colors.background : colors.muted, fontSize: 13, fontWeight: "700" }}>
                {gerandoRelatorio ? "Gerando..." : atletasSelecionados.length > 0 ? `📄 Relatório (${atletasSelecionados.length})` : "📄 Relatório (todos)"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── ESTATÍSTICAS ─── */}
        {stats.totalAtletas > 0 && (
          <>
            {/* Botão Tabela Comparativa */}
            <TouchableOpacity
              onPress={() => setShowTabela(true)}
              className="mx-4 mb-4 bg-surface border border-border rounded-xl py-3 items-center"
            >
              <Text className="text-foreground font-semibold text-sm">📊 Ver Tabela Comparativa ({stats.totalAtletas} atletas)</Text>
            </TouchableOpacity>

            <View className="px-4 py-2">
              <Text className="text-base font-bold text-foreground mb-3">Estatísticas de Idade</Text>
              <View className="bg-surface rounded-xl overflow-hidden">
                {[
                  ["Média", `${stats.idadeMedia} anos`],
                  ["Mediana", `${stats.idadeMediana} anos`],
                  ["Mínima", `${stats.idadeMin} anos`],
                  ["Máxima", `${stats.idadeMax} anos`],
                ].map(([label, value], i, arr) => (
                  <View key={label} className={`flex-row justify-between items-center px-4 py-3 ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
                    <Text className="text-foreground font-medium">{label}</Text>
                    <Text className="text-primary font-bold">{value}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="px-4 py-4">
              <Text className="text-base font-bold text-foreground mb-3">Estatísticas de Altura</Text>
              <View className="bg-surface rounded-xl overflow-hidden">
                {[
                  ["Média", `${stats.alturaMedia} m`],
                  ["Mediana", `${stats.alturaMediana} m`],
                  ["Mínima", `${stats.alturaMin} m`],
                  ["Máxima", `${stats.alturaMax} m`],
                ].map(([label, value], i, arr) => (
                  <View key={label} className={`flex-row justify-between items-center px-4 py-3 ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
                    <Text className="text-foreground font-medium">{label}</Text>
                    <Text className="text-primary font-bold">{value}</Text>
                  </View>
                ))}
              </View>
            </View>

            {posicoesPorcentagem.length > 0 && (
              <View className="px-4 py-2">
                <Text className="text-base font-bold text-foreground mb-3">Distribuição de Posições</Text>
                <View className="bg-surface rounded-xl p-3 items-center overflow-hidden">
                  <PieChart
                    data={posicoesPorcentagem}
                    width={screenWidth - 60}
                    height={220}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                  />
                </View>
              </View>
            )}

            {idadesPorcentagem.length > 0 && (
              <View className="px-4 py-4">
                <Text className="text-base font-bold text-foreground mb-3">Distribuição de Idades</Text>
                <View className="bg-surface rounded-xl p-3 overflow-hidden">
                  <BarChart
                    data={{
                      labels: idadesPorcentagem.map(item => item.name),
                      datasets: [{ data: idadesPorcentagem.map(item => item.population) }],
                    }}
                    width={screenWidth - 60}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={chartConfig}
                    verticalLabelRotation={45}
                  />
                </View>
              </View>
            )}
          </>
        )}

        <View className="h-8" />
      </ScrollView>

      {/* ─── MODAL DE FILTROS ─── */}
      <Modal visible={showFiltros} animationType="slide" transparent>
        <View className="flex-1 bg-black/50">
          <View className="flex-1 bg-background mt-12 rounded-t-3xl">
            <View className="flex-row justify-between items-center px-4 py-4 border-b border-border">
              <Text className="text-xl font-bold text-foreground">Filtros Avançados</Text>
              <TouchableOpacity onPress={() => setShowFiltros(false)}>
                <IconSymbol name="xmark" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Abas */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="border-b border-border" contentContainerStyle={{ paddingHorizontal: 8 }}>
              {(["posicao", "idade", "clube", "escala", "naturalidade"] as const).map((aba) => {
                const labels = { posicao: "Posição", idade: "Idade", clube: "Clube", escala: "Escala", naturalidade: "Naturalidade" };
                const counts = {
                  posicao: filtros.posicoes.length,
                  idade: filtros.idades.length,
                  clube: filtros.clubes.length,
                  escala: filtros.escalas.length,
                  naturalidade: filtros.naturalidades.length,
                };
                return (
                  <TouchableOpacity
                    key={aba}
                    onPress={() => setAbaFiltros(aba)}
                    style={{ paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: abaFiltros === aba ? colors.primary : "transparent", flexDirection: "row", alignItems: "center", gap: 4 }}
                  >
                    <Text style={{ fontWeight: "600", color: abaFiltros === aba ? colors.primary : colors.muted, fontSize: 13 }}>
                      {labels[aba]}
                    </Text>
                    {counts[aba] > 0 && (
                      <View style={{ backgroundColor: colors.primary, borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}>
                        <Text style={{ color: colors.background, fontSize: 10, fontWeight: "700" }}>{counts[aba]}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Conteúdo das abas */}
            <ScrollView className="flex-1 px-4 py-4">
              {abaFiltros === "posicao" && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {posicoes.map((pos) => {
                    const ativo = filtros.posicoes.includes(pos);
                    return (
                      <TouchableOpacity key={pos}
                        onPress={() => setFiltros({ ...filtros, posicoes: ativo ? filtros.posicoes.filter(p => p !== pos) : [...filtros.posicoes, pos] })}
                        style={{ backgroundColor: ativo ? colors.primary : colors.surface, borderWidth: 1.5, borderColor: ativo ? colors.primary : colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}>
                        <Text style={{ color: ativo ? colors.background : colors.foreground, fontWeight: ativo ? "700" : "400", fontSize: 14 }}>{pos}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {abaFiltros === "idade" && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {[15, 20, 25, 30, 35, 40].map((idade) => {
                    const ativo = filtros.idades.includes(idade);
                    return (
                      <TouchableOpacity key={idade}
                        onPress={() => setFiltros({ ...filtros, idades: ativo ? filtros.idades.filter(i => i !== idade) : [...filtros.idades, idade] })}
                        style={{ backgroundColor: ativo ? colors.primary : colors.surface, borderWidth: 1.5, borderColor: ativo ? colors.primary : colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}>
                        <Text style={{ color: ativo ? colors.background : colors.foreground, fontWeight: ativo ? "700" : "400", fontSize: 14 }}>{idade}–{idade + 4} anos</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {abaFiltros === "clube" && (
                <View style={{ gap: 6 }}>
                  {clubesList.map((clube) => {
                    const ativo = filtros.clubes.includes(clube);
                    return (
                      <TouchableOpacity key={clube}
                        onPress={() => setFiltros({ ...filtros, clubes: ativo ? filtros.clubes.filter(c => c !== clube) : [...filtros.clubes, clube] })}
                        style={{ flexDirection: "row", alignItems: "center", backgroundColor: ativo ? colors.primary + "18" : colors.surface, borderWidth: 1.5, borderColor: ativo ? colors.primary : colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 8 }}>
                        {ativo && <Text style={{ color: colors.primary, fontSize: 14 }}>✓</Text>}
                        <Text style={{ color: ativo ? colors.primary : colors.foreground, fontWeight: ativo ? "700" : "400", fontSize: 14 }}>{clube}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {abaFiltros === "escala" && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {escalas.map((escala) => {
                    const ativo = filtros.escalas.includes(escala);
                    return (
                      <TouchableOpacity key={escala}
                        onPress={() => setFiltros({ ...filtros, escalas: ativo ? filtros.escalas.filter(e => e !== escala) : [...filtros.escalas, escala] })}
                        style={{ backgroundColor: ativo ? colors.primary : colors.surface, borderWidth: 1.5, borderColor: ativo ? colors.primary : colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}>
                        <Text style={{ color: ativo ? colors.background : colors.foreground, fontWeight: ativo ? "700" : "400", fontSize: 14 }}>{escala}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {abaFiltros === "naturalidade" && (
                <View style={{ gap: 6 }}>
                  {naturalidades.map((nat) => {
                    const ativo = filtros.naturalidades.includes(nat);
                    return (
                      <TouchableOpacity key={nat}
                        onPress={() => setFiltros({ ...filtros, naturalidades: ativo ? filtros.naturalidades.filter(n => n !== nat) : [...filtros.naturalidades, nat] })}
                        style={{ flexDirection: "row", alignItems: "center", backgroundColor: ativo ? colors.primary + "18" : colors.surface, borderWidth: 1.5, borderColor: ativo ? colors.primary : colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 8 }}>
                        {ativo && <Text style={{ color: colors.primary, fontSize: 14 }}>✓</Text>}
                        <Text style={{ color: ativo ? colors.primary : colors.foreground, fontWeight: ativo ? "700" : "400", fontSize: 14 }}>{nat}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {/* Rodapé do modal */}
            <View className="flex-row gap-3 px-4 py-4 border-t border-border">
              <TouchableOpacity onPress={handleLimparFiltros}
                className="flex-1 bg-surface border border-border rounded-lg py-3 items-center">
                <Text className="text-foreground font-semibold">Limpar Tudo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowFiltros(false)}
                className="flex-1 bg-primary rounded-lg py-3 items-center">
                <Text className="text-background font-semibold">Aplicar Filtros</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL DE TABELA COMPARATIVA ─── */}
      <Modal visible={showTabela} animationType="slide" transparent>
        <View className="flex-1 bg-black/50">
          <View className="flex-1 bg-background mt-12 rounded-t-3xl">
            <View className="flex-row justify-between items-center px-4 py-4 border-b border-border">
              <View>
                <Text className="text-xl font-bold text-foreground">Tabela Comparativa</Text>
                <Text className="text-xs text-muted">{atletasParaAnalise.length} atleta(s)</Text>
              </View>
              <TouchableOpacity onPress={() => setShowTabela(false)}>
                <IconSymbol name="xmark" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1">
              {atletasParaAnalise.map((item: any) => (
                <View key={item.id} className="px-4 py-3 border-b border-border">
                  <Text className="text-foreground font-semibold">{item.nome}</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                    {item.posicao && (
                      <View style={{ backgroundColor: colors.primary + "18", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "600" }}>{item.posicao}</Text>
                      </View>
                    )}
                    {item.idade && (
                      <View style={{ backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: colors.muted, fontSize: 11 }}>{item.idade} anos</Text>
                      </View>
                    )}
                    {item.altura && (
                      <View style={{ backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: colors.muted, fontSize: 11 }}>{item.altura} m</Text>
                      </View>
                    )}
                    {item.clube && (
                      <View style={{ backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: colors.muted, fontSize: 11 }}>{item.clube}</Text>
                      </View>
                    )}
                    {item.segundaPosicao && (
                      <View style={{ backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: colors.muted, fontSize: 11 }}>2ª: {item.segundaPosicao}</Text>
                      </View>
                    )}
                  </View>
                  {item.valencia && (
                    <Text className="text-muted text-xs mt-2 italic">{item.valencia}</Text>
                  )}
                </View>
              ))}
            </ScrollView>

            <View className="flex-row gap-3 px-4 py-4 border-t border-border">
              <TouchableOpacity onPress={handleGerarRelatorio} disabled={gerandoRelatorio}
                style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: "center", opacity: gerandoRelatorio ? 0.7 : 1 }}>
                <Text style={{ color: colors.background, fontWeight: "700" }}>
                  {gerandoRelatorio ? "Gerando..." : "📄 Gerar Relatório PDF"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowTabela(false)}
                className="flex-1 bg-surface border border-border rounded-xl py-3 items-center">
                <Text className="text-foreground font-semibold">Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
