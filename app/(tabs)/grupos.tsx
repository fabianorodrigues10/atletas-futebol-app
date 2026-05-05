import { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import {
  View, Text, FlatList, TouchableOpacity, TextInput, Modal,
  ScrollView, Alert, ActivityIndicator, Platform,
} from "react-native";

import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { getApiBaseUrl } from "@/constants/oauth";

// ── Posições fixas do futebol ──────────────────────────────────────────────
const POSICOES_RADAR = [
  { nome: "Goleiro",          abrev: "GOL", cor: "#F59E0B" },
  { nome: "Lateral Direito",  abrev: "LD",  cor: "#3B82F6" },
  { nome: "Zagueiro Destro",  abrev: "ZD",  cor: "#1D4ED8" },
  { nome: "Zagueiro Canhoto", abrev: "ZC",  cor: "#2563EB" },
  { nome: "Lateral Esquerdo", abrev: "LE",  cor: "#0EA5E9" },
  { nome: "Volante Marcação", abrev: "VM",  cor: "#6366F1" },
  { nome: "Volante Armação",  abrev: "VA",  cor: "#8B5CF6" },
  { nome: "Meia",             abrev: "MEI", cor: "#A855F7" },
  { nome: "Extremo Destro",   abrev: "ED",  cor: "#EC4899" },
  { nome: "Centroavante",     abrev: "CA",  cor: "#EF4444" },
  { nome: "Extremo Canhoto",  abrev: "EC",  cor: "#DC2626" },
];

const LIMITE_POR_POSICAO = 10;

interface Grupo {
  id: number;
  nome: string;
  descricao?: string | null;
  cor: string;
}

export default function RadarScreen() {
  const colors = useColors();
  const router = useRouter();

  // Estado: posição selecionada (abre o painel lateral)
  const [posicaoSelecionada, setPosicaoSelecionada] = useState<typeof POSICOES_RADAR[0] | null>(null);
  // Estado: grupo (do banco) correspondente à posição selecionada
  const [grupoAtual, setGrupoAtual] = useState<Grupo | null>(null);
  // Modal de busca de atleta
  const [modalBuscaVisible, setModalBuscaVisible] = useState(false);
  const [buscaNome, setBuscaNome] = useState("");
  // Geração de relatório (posição única)
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  // Modal de relatório multi-posição
  const [modalMultiPdfVisible, setModalMultiPdfVisible] = useState(false);
  const [posicoesSelPdf, setPosicoesSelPdf] = useState<Set<string>>(new Set());
  const [gerandoMultiPdf, setGerandoMultiPdf] = useState(false);

  // ── Queries ────────────────────────────────────────────────────────────────
  const gruposQuery = trpc.grupos.list.useQuery();

  // Mapeia nome da posição → grupo do banco
  const gruposPorPosicao = useMemo(() => {
    const map = new Map<string, Grupo>();
    (gruposQuery.data ?? []).forEach((g: any) => map.set(g.nome, g));
    return map;
  }, [gruposQuery.data]);

  const atletasDoGrupoQuery = trpc.grupos.getAtletas.useQuery(
    { grupoId: grupoAtual?.id ?? 0 },
    { enabled: !!grupoAtual }
  );

  const buscaAtletasQuery = trpc.atletas.search.useQuery(
    { nome: buscaNome },
    { enabled: modalBuscaVisible && buscaNome.length >= 2 }
  );

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = trpc.grupos.create.useMutation({
    onSuccess: (data) => {
      if (posicaoSelecionada) {
        setGrupoAtual({ id: data.id, nome: posicaoSelecionada.nome, cor: posicaoSelecionada.cor });
      }
      gruposQuery.refetch();
    },
  });

  const addAtletaMutation = trpc.grupos.addAtleta.useMutation({
    onSuccess: () => atletasDoGrupoQuery.refetch(),
    onError: (err) => Alert.alert("Erro", err.message),
  });

  const removeAtletaMutation = trpc.grupos.removeAtleta.useMutation({
    onSuccess: () => atletasDoGrupoQuery.refetch(),
  });

  const reordenarMutation = trpc.grupos.reordenar.useMutation({
    onSuccess: () => atletasDoGrupoQuery.refetch(),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSelecionarPosicao = async (pos: typeof POSICOES_RADAR[0]) => {
    if (posicaoSelecionada?.nome === pos.nome) {
      setPosicaoSelecionada(null);
      setGrupoAtual(null);
      return;
    }
    setPosicaoSelecionada(pos);
    const grupoExistente = gruposPorPosicao.get(pos.nome);
    if (grupoExistente) {
      setGrupoAtual(grupoExistente as Grupo);
    } else {
      createMutation.mutate({ nome: pos.nome, cor: pos.cor });
      setGrupoAtual(null);
    }
  };

  const handleAddAtleta = (atletaId: number) => {
    if (!grupoAtual) return;
    const qtd = (atletasDoGrupoQuery.data ?? []).length;
    if (qtd >= LIMITE_POR_POSICAO) {
      Alert.alert("Limite atingido", `Máximo de ${LIMITE_POR_POSICAO} atletas por posição.`);
      return;
    }
    const jaEsta = (atletasDoGrupoQuery.data ?? []).some((a: any) => a.atletaId === atletaId);
    if (jaEsta) return;
    addAtletaMutation.mutate({ atletaId, grupoId: grupoAtual.id });
  };

  const handleRemoveAtleta = (atletaId: number) => {
    if (!grupoAtual) return;
    removeAtletaMutation.mutate({ atletaId, grupoId: grupoAtual.id });
  };

  const handleMoverAtleta = (index: number, direcao: "cima" | "baixo") => {
    if (!grupoAtual) return;
    const lista = [...(atletasDoGrupoQuery.data as any[] ?? [])];
    const novoIndex = direcao === "cima" ? index - 1 : index + 1;
    if (novoIndex < 0 || novoIndex >= lista.length) return;
    [lista[index], lista[novoIndex]] = [lista[novoIndex], lista[index]];
    const atletaIds = lista.map((a: any) => a.atletaId);
    reordenarMutation.mutate({ grupoId: grupoAtual.id, atletaIds });
  };

  // Gera PDF de uma única posição (botão no painel lateral)
  const handleGerarRelatorio = async () => {
    if (!grupoAtual) return;
    const atletas = atletasDoGrupoQuery.data ?? [];
    if (atletas.length === 0) {
      Alert.alert("Sem atletas", "Adicione atletas a esta posição antes de gerar o relatório.");
      return;
    }
    setGerandoRelatorio(true);
    try {
      const ids = (atletas as any[]).map((a) => a.atletaId);
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/report/pdf-executivo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, temporada: "2025", posicaoNome: posicaoSelecionada?.nome }),
      });
      if (!response.ok) throw new Error("Erro ao gerar relatório");
      const blob = await response.blob();
      await abrirPdfBlob(blob, `Radar_${(posicaoSelecionada?.nome ?? "Radar").replace(/\s+/g, "_")}_2025.pdf`);
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Não foi possível gerar o relatório.");
    } finally {
      setGerandoRelatorio(false);
    }
  };

  // Gera PDF multi-posição
  const handleGerarMultiPdf = async () => {
    const posicoesSelecionadas = POSICOES_RADAR.filter((p) => posicoesSelPdf.has(p.nome));
    if (posicoesSelecionadas.length === 0) {
      Alert.alert("Selecione posições", "Marque ao menos uma posição para incluir no relatório.");
      return;
    }

    // Monta o payload com os atletas de cada posição
    const posicoes: Array<{ nome: string; ids: number[] }> = [];
    for (const pos of posicoesSelecionadas) {
      const grupo = gruposPorPosicao.get(pos.nome);
      if (!grupo) continue; // posição sem grupo = sem atletas
      // Buscar atletas do grupo via query cache (já carregados) ou via fetch direto
      // Usamos a API diretamente para garantir os dados mais recentes
      posicoes.push({ nome: pos.nome, ids: [] }); // preenchido abaixo
    }

    setGerandoMultiPdf(true);
    try {
      const baseUrl = getApiBaseUrl();

      // Buscar atletas de cada posição selecionada
      const posicoesComAtletas: Array<{ nome: string; ids: number[] }> = [];
      for (const pos of posicoesSelecionadas) {
        const grupo = gruposPorPosicao.get(pos.nome);
        if (!grupo) continue;
        const res = await fetch(
          `${baseUrl}/api/trpc/grupos.getAtletas?input=${encodeURIComponent(JSON.stringify({ grupoId: grupo.id }))}`,
          { headers: { "Content-Type": "application/json" } }
        );
        if (!res.ok) continue;
        const json = await res.json();
        const atletas: any[] = json?.result?.data ?? [];
        if (atletas.length === 0) continue;
        posicoesComAtletas.push({ nome: pos.nome, ids: atletas.map((a: any) => a.atletaId) });
      }

      if (posicoesComAtletas.length === 0) {
        Alert.alert("Sem atletas", "As posições selecionadas não têm atletas cadastrados.");
        setGerandoMultiPdf(false);
        return;
      }

      const response = await fetch(`${baseUrl}/api/report/pdf-executivo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posicoes: posicoesComAtletas, temporada: "2025" }),
      });
      if (!response.ok) throw new Error("Erro ao gerar relatório");
      const blob = await response.blob();
      await abrirPdfBlob(blob, `Radar_Multiplas_Posicoes_2025.pdf`);
      setModalMultiPdfVisible(false);
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Não foi possível gerar o relatório.");
    } finally {
      setGerandoMultiPdf(false);
    }
  };

  // Utilitário: abre/compartilha PDF
  const abrirPdfBlob = async (blob: Blob, filename: string) => {
    if (Platform.OS === "web") {
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } else {
      const FileSystem = await import("expo-file-system/legacy");
      const Sharing = await import("expo-sharing");
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory || "";
        const path = dir + filename;
        await FileSystem.writeAsStringAsync(path, base64, { encoding: FileSystem.EncodingType.Base64 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(path, { mimeType: "application/pdf" });
        } else {
          Alert.alert("Sucesso", `PDF salvo em:\n${path}`);
        }
      };
    }
  };

  // IDs já no grupo
  const idsNoGrupo = new Set((atletasDoGrupoQuery.data ?? []).map((a: any) => a.atletaId));
  const qtdNoGrupo = (atletasDoGrupoQuery.data ?? []).length;

  // Toggle posição no seletor de PDF
  const togglePosicaoPdf = (nome: string) => {
    setPosicoesSelPdf((prev) => {
      const next = new Set(prev);
      if (next.has(nome)) next.delete(nome);
      else next.add(nome);
      return next;
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={{
        paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: colors.border,
        backgroundColor: colors.background,
        flexDirection: "row", alignItems: "center",
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground, letterSpacing: 0.5 }}>
            Radar
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
            Atletas no radar para contratação · Máx. {LIMITE_POR_POSICAO} por posição
          </Text>
        </View>
        {/* Botão de relatório multi-posição */}
        <TouchableOpacity
          onPress={() => {
            setPosicoesSelPdf(new Set());
            setModalMultiPdfVisible(true);
          }}
          style={{
            flexDirection: "row", alignItems: "center",
            backgroundColor: "#1D4ED8", borderRadius: 8,
            paddingHorizontal: 12, paddingVertical: 8,
          }}
        >
          <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>📋 Relatório</Text>
        </TouchableOpacity>
      </View>

      {/* ── Conteúdo principal ──────────────────────────────────────────────── */}
      <View style={{ flex: 1, flexDirection: "row" }}>

        {/* Lista de posições */}
        <ScrollView
          style={{ flex: posicaoSelecionada ? 0.42 : 1, borderRightWidth: posicaoSelecionada ? 1 : 0, borderRightColor: colors.border }}
          contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        >
          {POSICOES_RADAR.map((pos) => {
            const grupo = gruposPorPosicao.get(pos.nome);
            const isSelected = posicaoSelecionada?.nome === pos.nome;

            return (
              <TouchableOpacity
                key={pos.nome}
                onPress={() => handleSelecionarPosicao(pos)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isSelected ? pos.cor + "22" : colors.surface,
                  borderRadius: 10,
                  marginBottom: 8,
                  padding: 10,
                  borderWidth: isSelected ? 1.5 : 1,
                  borderColor: isSelected ? pos.cor : colors.border,
                }}
              >
                {/* Badge abreviação */}
                <View style={{
                  width: 36, height: 36, borderRadius: 8,
                  backgroundColor: pos.cor,
                  justifyContent: "center", alignItems: "center",
                  marginRight: 10,
                }}>
                  <Text style={{ color: "white", fontSize: 10, fontWeight: "800" }}>{pos.abrev}</Text>
                </View>

                {/* Nome + contagem */}
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 13, fontWeight: isSelected ? "700" : "600",
                    color: isSelected ? pos.cor : colors.foreground,
                  }}>
                    {pos.nome}
                  </Text>
                  {grupo ? (
                    <Text style={{ fontSize: 11, color: colors.muted }}>
                      {isSelected && grupoAtual
                        ? `${qtdNoGrupo}/${LIMITE_POR_POSICAO} atletas`
                        : "Toque para ver"}
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 11, color: colors.muted, fontStyle: "italic" }}>Vazio</Text>
                  )}
                </View>

                {/* Indicador de seleção */}
                <Text style={{ color: isSelected ? pos.cor : colors.muted, fontSize: 16 }}>
                  {isSelected ? "◀" : "▶"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Painel de atletas da posição selecionada */}
        {posicaoSelecionada && (
          <View style={{ flex: 1, maxWidth: "58%", backgroundColor: colors.background, flexDirection: "column", minHeight: 0 }}>
            {/* Cabeçalho do painel */}
            <View style={{
              padding: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              backgroundColor: posicaoSelecionada.cor + "15",
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <View style={{
                  backgroundColor: posicaoSelecionada.cor,
                  paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
                  marginRight: 8,
                }}>
                  <Text style={{ color: "white", fontSize: 11, fontWeight: "800" }}>
                    {posicaoSelecionada.abrev}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, flex: 1 }}>
                  {posicaoSelecionada.nome}
                </Text>
              </View>

              {/* Barra de progresso */}
              <View style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, color: colors.muted }}>
                    {qtdNoGrupo}/{LIMITE_POR_POSICAO} atletas
                  </Text>
                  <Text style={{ fontSize: 11, color: qtdNoGrupo >= LIMITE_POR_POSICAO ? "#EF4444" : colors.muted }}>
                    {LIMITE_POR_POSICAO - qtdNoGrupo} vagas
                  </Text>
                </View>
                <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2 }}>
                  <View style={{
                    height: 4,
                    width: `${(qtdNoGrupo / LIMITE_POR_POSICAO) * 100}%`,
                    backgroundColor: qtdNoGrupo >= LIMITE_POR_POSICAO ? "#EF4444" : posicaoSelecionada.cor,
                    borderRadius: 2,
                  }} />
                </View>
              </View>

              {/* Botões de ação */}
              <View style={{ flexDirection: "row" }}>
                <TouchableOpacity
                  onPress={() => {
                    setBuscaNome("");
                    setModalBuscaVisible(true);
                  }}
                  disabled={qtdNoGrupo >= LIMITE_POR_POSICAO || createMutation.isPending}
                  style={{
                    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
                    backgroundColor: qtdNoGrupo >= LIMITE_POR_POSICAO ? colors.border : posicaoSelecionada.cor,
                    paddingVertical: 7, borderRadius: 8, marginRight: 6,
                    opacity: createMutation.isPending ? 0.6 : 1,
                  }}
                >
                  {createMutation.isPending
                    ? <ActivityIndicator size="small" color="white" />
                    : <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>+ Atleta</Text>
                  }
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleGerarRelatorio}
                  disabled={qtdNoGrupo === 0 || gerandoRelatorio}
                  style={{
                    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
                    backgroundColor: qtdNoGrupo === 0 ? colors.border : "#1D4ED8",
                    paddingVertical: 7, borderRadius: 8,
                  }}
                >
                  {gerandoRelatorio
                    ? <ActivityIndicator size="small" color="white" />
                    : <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>📋 PDF</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>

            {/* Lista de atletas */}
            {atletasDoGrupoQuery.isLoading || createMutation.isPending ? (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator color={posicaoSelecionada.cor} />
              </View>
            ) : (atletasDoGrupoQuery.data ?? []).length === 0 ? (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
                <Text style={{ fontSize: 28, marginBottom: 8 }}>🔍</Text>
                <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center" }}>
                  Nenhum atleta nesta posição.{"\n"}Toque em "+ Atleta" para adicionar.
                </Text>
              </View>
            ) : (
              <FlatList
                data={atletasDoGrupoQuery.data as any[]}
                keyExtractor={(item) => (item?.atletaId || item?.id || Math.random()).toString()}
                style={{ flex: 1, minHeight: 0 }}
                contentContainerStyle={{ padding: 10, paddingBottom: 80, flexGrow: 1 }}
                renderItem={({ item, index }) => {
                  const lista = atletasDoGrupoQuery.data as any[];
                  return (
                    <View style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: colors.surface,
                      borderRadius: 8,
                      marginBottom: 6,
                      padding: 10,
                      borderLeftWidth: 3,
                      borderLeftColor: posicaoSelecionada.cor,
                    }}>
                      {/* Número */}
                      <View style={{
                        width: 24, height: 24, borderRadius: 12,
                        backgroundColor: posicaoSelecionada.cor + "30",
                        justifyContent: "center", alignItems: "center",
                        marginRight: 8,
                      }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: posicaoSelecionada.cor }}>
                          {index + 1}
                        </Text>
                      </View>

                      {/* Nome e posição */}
                      <View style={{ flex: 1 }}>
                        <TouchableOpacity
                          onPress={() => router.push(`/atleta/detalhes/${item.atletaId}` as any)}
                          style={{ alignSelf: "flex-start" }}
                        >
                          <Text style={{
                            fontSize: 13,
                            fontWeight: "700",
                            color: posicaoSelecionada.cor,
                            textDecorationLine: "underline",
                          }} numberOfLines={1}>
                            {item.atletaNome || `Atleta #${item.atletaId}`}
                          </Text>
                        </TouchableOpacity>
                        {item.posicao ? (
                          <Text style={{ fontSize: 11, color: colors.muted }}>{item.posicao}</Text>
                        ) : null}
                      </View>

                      {/* Botões de reordenação */}
                      <View style={{ flexDirection: "column", marginRight: 4 }}>
                        <TouchableOpacity
                          onPress={() => handleMoverAtleta(index, "cima")}
                          disabled={index === 0 || reordenarMutation.isPending}
                          style={{ padding: 3, opacity: index === 0 ? 0.3 : 1 }}
                        >
                          <Text style={{ color: posicaoSelecionada.cor, fontSize: 12, lineHeight: 14 }}>▲</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleMoverAtleta(index, "baixo")}
                          disabled={index === lista.length - 1 || reordenarMutation.isPending}
                          style={{ padding: 3, opacity: index === lista.length - 1 ? 0.3 : 1 }}
                        >
                          <Text style={{ color: posicaoSelecionada.cor, fontSize: 12, lineHeight: 14 }}>▼</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Remover */}
                      <TouchableOpacity
                        onPress={() => handleRemoveAtleta(item.atletaId)}
                        style={{ padding: 6 }}
                      >
                        <Text style={{ color: colors.error, fontSize: 16 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />
            )}
          </View>
        )}
      </View>

      {/* ── Modal: Buscar e Adicionar Atleta ──────────────────────────────────── */}
      <Modal
        visible={modalBuscaVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalBuscaVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}>
          <View style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            paddingBottom: 36,
            height: 560,
            minHeight: 400,
          }}>
            {/* Cabeçalho do modal */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
              <View style={{
                backgroundColor: posicaoSelecionada?.cor ?? colors.primary,
                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
                marginRight: 8,
              }}>
                <Text style={{ color: "white", fontSize: 11, fontWeight: "800" }}>
                  {posicaoSelecionada?.abrev}
                </Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, flex: 1 }}>
                Adicionar ao Radar
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                {qtdNoGrupo}/{LIMITE_POR_POSICAO}
              </Text>
            </View>

            {/* Campo de busca */}
            <TextInput
              style={{
                borderWidth: 1, borderColor: colors.border, borderRadius: 10,
                padding: 12, marginBottom: 12, color: colors.foreground,
                backgroundColor: colors.surface, fontSize: 14,
              }}
              placeholder="Buscar atleta pelo nome..."
              placeholderTextColor={colors.muted}
              value={buscaNome}
              onChangeText={setBuscaNome}
              autoFocus
            />

            {/* Resultados */}
            {buscaNome.length < 2 ? (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  Digite ao menos 2 letras para buscar
                </Text>
              </View>
            ) : buscaAtletasQuery.isLoading ? (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator color={posicaoSelecionada?.cor ?? colors.primary} />
              </View>
            ) : (buscaAtletasQuery.data ?? []).length === 0 ? (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: colors.muted, fontSize: 13 }}>Nenhum atleta encontrado</Text>
              </View>
            ) : (
              <FlatList
                data={buscaAtletasQuery.data as any[]}
                keyExtractor={(item) => item.id.toString()}
                style={{ flex: 1, minHeight: 0 }}
                windowSize={5}
                maxToRenderPerBatch={20}
                initialNumToRender={15}
                removeClippedSubviews={false}
                renderItem={({ item }) => {
                  const jaEsta = idsNoGrupo.has(item.id);
                  return (
                    <TouchableOpacity
                      onPress={() => !jaEsta && handleAddAtleta(item.id)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 10,
                        paddingHorizontal: 4,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                        opacity: jaEsta ? 0.45 : 1,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                          {item.nome}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.muted }}>
                          {[item.posicao, item.clube].filter(Boolean).join(" · ")}
                        </Text>
                      </View>
                      {jaEsta ? (
                        <Text style={{ fontSize: 11, color: colors.muted }}>✓ Adicionado</Text>
                      ) : (
                        <View style={{
                          backgroundColor: posicaoSelecionada?.cor ?? colors.primary,
                          borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
                        }}>
                          <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>+ Add</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            <TouchableOpacity
              onPress={() => setModalBuscaVisible(false)}
              style={{
                marginTop: 12, paddingVertical: 12, borderRadius: 10,
                borderWidth: 1, borderColor: colors.border, alignItems: "center",
              }}
            >
              <Text style={{ color: colors.foreground, fontWeight: "600" }}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Relatório Multi-posição ────────────────────────────────────── */}
      <Modal
        visible={modalMultiPdfVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalMultiPdfVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center" }}>
          <View style={{
            backgroundColor: colors.background,
            borderRadius: 20,
            padding: 24,
            width: "90%",
            maxWidth: 480,
            maxHeight: "85%",
          }}>
            {/* Cabeçalho */}
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground, marginBottom: 4 }}>
              Relatório Multi-posição
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 16 }}>
              Selecione as posições que deseja incluir no PDF. Cada posição terá sua própria página.
            </Text>

            {/* Botões Selecionar Todos / Limpar */}
            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              <TouchableOpacity
                onPress={() => setPosicoesSelPdf(new Set(POSICOES_RADAR.map((p) => p.nome)))}
                style={{
                  flex: 1, paddingVertical: 6, borderRadius: 8, marginRight: 6,
                  backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 12, color: colors.foreground, fontWeight: "600" }}>Selecionar todas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPosicoesSelPdf(new Set())}
                style={{
                  flex: 1, paddingVertical: 6, borderRadius: 8,
                  backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 12, color: colors.foreground, fontWeight: "600" }}>Limpar</Text>
              </TouchableOpacity>
            </View>

            {/* Lista de posições com checkbox */}
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {POSICOES_RADAR.map((pos) => {
                const grupo = gruposPorPosicao.get(pos.nome);
                const isChecked = posicoesSelPdf.has(pos.nome);
                const semAtletas = !grupo;

                return (
                  <TouchableOpacity
                    key={pos.nome}
                    onPress={() => !semAtletas && togglePosicaoPdf(pos.nome)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 10,
                      paddingHorizontal: 4,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                      opacity: semAtletas ? 0.4 : 1,
                    }}
                  >
                    {/* Checkbox */}
                    <View style={{
                      width: 22, height: 22, borderRadius: 6,
                      borderWidth: 2,
                      borderColor: isChecked ? pos.cor : colors.border,
                      backgroundColor: isChecked ? pos.cor : "transparent",
                      justifyContent: "center", alignItems: "center",
                      marginRight: 12,
                    }}>
                      {isChecked && <Text style={{ color: "white", fontSize: 13, fontWeight: "800" }}>✓</Text>}
                    </View>

                    {/* Badge abreviação */}
                    <View style={{
                      width: 32, height: 32, borderRadius: 6,
                      backgroundColor: pos.cor,
                      justifyContent: "center", alignItems: "center",
                      marginRight: 10,
                    }}>
                      <Text style={{ color: "white", fontSize: 9, fontWeight: "800" }}>{pos.abrev}</Text>
                    </View>

                    {/* Nome */}
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                      {pos.nome}
                    </Text>

                    {/* Status */}
                    <Text style={{ fontSize: 11, color: semAtletas ? colors.muted : colors.success }}>
                      {semAtletas ? "Vazio" : "Com atletas"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Rodapé com contagem e botões */}
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center", marginBottom: 12 }}>
                {posicoesSelPdf.size} posição(ões) selecionada(s)
              </Text>
              <TouchableOpacity
                onPress={handleGerarMultiPdf}
                disabled={posicoesSelPdf.size === 0 || gerandoMultiPdf}
                style={{
                  paddingVertical: 14, borderRadius: 10, alignItems: "center",
                  backgroundColor: posicoesSelPdf.size === 0 ? colors.border : "#1D4ED8",
                  marginBottom: 8,
                }}
              >
                {gerandoMultiPdf
                  ? <ActivityIndicator color="white" />
                  : <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>
                      📋 Gerar PDF ({posicoesSelPdf.size} posição{posicoesSelPdf.size !== 1 ? "ões" : ""})
                    </Text>
                }
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalMultiPdfVisible(false)}
                style={{
                  paddingVertical: 12, borderRadius: 10, alignItems: "center",
                  borderWidth: 1, borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
