import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Image,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { generateReport, generateExcel } from "@/lib/report";
import { Alert, Modal } from "react-native";
import { FilterDropdown } from "@/components/filter-dropdown";
import { CompletudStatsModal } from "@/components/completude-stats-modal";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
const marcilioDiasShield = require("@/assets/images/marcilio-dias-shield.png") as any;
import { useFocusEffect } from "expo-router";
import { getApiBaseUrl } from "@/constants/oauth";
import { useAuth } from "@/hooks/use-auth";

// Normaliza string removendo acentos, espaços extras e convertendo para minúsculas
function normalizeStr(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Calcula a idade atual a partir da data de nascimento (ISO string)
function calcularIdadeAtual(dataNascimento: string | null | undefined): number | null {
  if (!dataNascimento) return null;
  try {
    const nascimento = new Date(dataNascimento);
    if (isNaN(nascimento.getTime())) return null;
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade >= 0 && idade <= 80 ? idade : null;
  } catch {
    return null;
  }
}

const FAIXAS_IDADE = [
  { label: "Todas", min: 0, max: 99 },
  { label: "Sub-21", min: 1, max: 21 },
  { label: "21-25", min: 21, max: 25 },
  { label: "26-30", min: 26, max: 30 },
  { label: "31+", min: 31, max: 99 },
];

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  // Filtros (multi-seleção)
  const [selectedPosicoes, setSelectedPosicoes] = useState<string[]>([]);
  const [selectedClubes, setSelectedClubes] = useState<string[]>([]);
  const [selectedIdadeFaixas, setSelectedIdadeFaixas] = useState<number[]>([]);
  const [selectedNaturalidades, setSelectedNaturalidades] = useState<string[]>([]);
  const [selectedPes, setSelectedPes] = useState<string[]>([]);
  const [completudeFilterMin, setCompletudeFilterMin] = useState<number | null>(null);
  const [completudeFilterMax, setCompletudeFilterMax] = useState<number | null>(null);
  
  // Seleção de atletas para relatório
  const [selectedAtletasIds, setSelectedAtletasIds] = useState<number[]>([]);

  const [atletas, setAtletas] = useState<any[]>([]);
  const [totalAtletas, setTotalAtletas] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);


  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      let baseUrl = getApiBaseUrl();
      let url = `${baseUrl}/api/atletas`;
      console.log('[DEBUG] Iniciando fetch de atletas...');
      console.log('[DEBUG] URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      console.log('[DEBUG] Status:', response.status, 'URL:', url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('[DEBUG] Erro:', errorText);
        throw new Error(`Erro ao carregar atletas: ${response.status}`);
      }
      const data = await response.json();
      console.log('[DEBUG] Dados recebidos:', data);
      console.log('[DEBUG] Total:', data.total, 'Atletas:', (data.data || data).length);
      setAtletas(data.data || data);
      setTotalAtletas(data.total || (data.data || data).length);
    } catch (error) {
      console.error('[ERROR] Erro ao carregar atletas:', error);
      console.error('[ERROR] Tipo de erro:', error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refetch automático ao voltar para a tela principal
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Carregar atletas na primeira vez
  useEffect(() => {
    refetch();
  }, [refetch]);



  // Função para carregar mais atletas (não faz nada, pois todos são carregados de uma vez)
  const loadMore = useCallback(() => {
    // Todos os atletas são carregados de uma vez, sem paginação
  }, []);

  // Extrair posições e clubes únicos dos dados
  const posicoes = useMemo(() => {
    const set = new Set<string>();
    atletas.forEach((a) => { if (a.posicao) set.add(a.posicao); });
    return Array.from(set).sort();
  }, [atletas]);

  const clubes = useMemo(() => {
    const set = new Set<string>();
    atletas.forEach((a) => { if (a.clube) set.add(a.clube); });
    return Array.from(set).sort();
  }, [atletas]);

  const naturalidades = useMemo(() => {
    const set = new Set<string>();
    atletas.forEach((a) => { if (a.naturalidade) set.add(a.naturalidade); });
    return Array.from(set).sort();
  }, [atletas]);

  const pes = useMemo(() => {
    const set = new Set<string>();
    atletas.forEach((a) => { if (a.pe) set.add(a.pe); });
    return Array.from(set).sort();
  }, [atletas]);

  // Filtragem combinada (multi-seleção)
  const filteredAtletas = useMemo(() => {
    return atletas.filter((atleta) => {
      // Busca por nome (local, nos atletas carregados) - com normalização
      if (searchQuery) {
        const nomeNormalizado = normalizeStr(atleta.nome || "");
        const buscaNormalizada = normalizeStr(searchQuery);
        if (!nomeNormalizado.includes(buscaNormalizada)) {
          return false;
        }
      }
      // Filtro por posição (múltiplas)
      if (selectedPosicoes.length > 0 && !selectedPosicoes.includes(atleta.posicao || "")) {
        return false;
      }
      // Filtro por clube (múltiplos)
      if (selectedClubes.length > 0 && !selectedClubes.includes(atleta.clube || "")) {
        return false;
      }
      // Filtro por faixa de idade (múltiplas)
      if (selectedIdadeFaixas.length > 0) {
        const idade = calcularIdadeAtual(atleta.dataNascimento) ?? atleta.idade ?? 0;
        const matchesFaixa = selectedIdadeFaixas.some((faixaIdx) => {
          const faixa = FAIXAS_IDADE[faixaIdx];
          return idade >= faixa.min && idade <= faixa.max;
        });
        if (!matchesFaixa) {
          return false;
        }
      }
      // Filtro por naturalidade
      if (selectedNaturalidades.length > 0 && !selectedNaturalidades.includes(atleta.naturalidade || "")) {
        return false;
      }
      // Filtro por pé preferencial
      if (selectedPes.length > 0 && !selectedPes.includes(atleta.pe || "")) {
        return false;
      }
      // Filtro por faixa de completude
      if (completudeFilterMin !== null && completudeFilterMax !== null) {
        const completude = atleta.completude || 0;
        if (completude < completudeFilterMin || completude > completudeFilterMax) {
          return false;
        }
      }
      return true;
    });
  }, [atletas, searchQuery, selectedPosicoes, selectedClubes, selectedIdadeFaixas, selectedNaturalidades, selectedPes, completudeFilterMin, completudeFilterMax]);

  const activeFilterCount = selectedPosicoes.length + selectedClubes.length + selectedIdadeFaixas.length + selectedNaturalidades.length + selectedPes.length + (completudeFilterMin !== null ? 1 : 0);

  const clearFilters = () => {
    setSelectedPosicoes([]);
    setSelectedClubes([]);
    setSelectedIdadeFaixas([]);
    setSelectedNaturalidades([]);
    setSelectedPes([]);
    setCompletudeFilterMin(null);
    setCompletudeFilterMax(null);
    setSelectedAtletasIds([]);
  };

  const handleSelectCompletudeBracket = (min: number, max: number, label: string) => {
    setCompletudeFilterMin(min);
    setCompletudeFilterMax(max);
    setShowStatsModal(false);
  };
  
  const toggleAtletaSelection = (id: number) => {
    setSelectedAtletasIds((prev) =>
      prev.includes(id)
        ? prev.filter((aid) => aid !== id)
        : [...prev, id]
    );
  };
  
  const selectAllFiltered = () => {
    setSelectedAtletasIds(filteredAtletas.map((a) => a.id));
  };
  
  const deselectAll = () => {
    setSelectedAtletasIds([]);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().then(() => setRefreshing(false));
  }, [refetch]);

  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [sortBy, setSortBy] = useState<"nome">("nome");
  const [showStatsModal, setShowStatsModal] = useState(false);

  const handleAddAtleta = () => {
    router.push("/atleta/novo" as any);
  };

  const handleReportPress = () => {
    if (selectedAtletasIds.length === 0) {
      Alert.alert("Selecione atletas", "Marque pelo menos um atleta para gerar o relatório.");
      return;
    }
    setShowReportConfirm(true);
  };

  const handleConfirmReport = async () => {
    setShowReportConfirm(false);
    setGeneratingPdf(true);
    try {
      const ids = selectedAtletasIds.length > 0 ? selectedAtletasIds : filteredAtletas.map((a) => a.id);
      const filters = {
        posicao: selectedPosicoes.length > 0 ? selectedPosicoes.join(", ") : "Todas",
        faixaIdade: selectedIdadeFaixas.length > 0 ? selectedIdadeFaixas.map(i => FAIXAS_IDADE[i].label).join(", ") : "Todas",
        clube: selectedClubes.length > 0 ? selectedClubes.join(", ") : "Todos",
        busca: searchQuery || undefined,
      };
      await generateReport(ids, filters);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível gerar o relatório.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleAtletaPress = (id: number) => {
    router.push(`/atleta/detalhes/${id}` as any);
  };

  const handleExcelPress = () => {
    if (selectedAtletasIds.length === 0) {
      Alert.alert("Selecione atletas", "Marque pelo menos um atleta para gerar a planilha.");
      return;
    }
    handleConfirmExcel();
  };

  const handleConfirmExcel = async () => {
    setGeneratingExcel(true);
    try {
      const ids = selectedAtletasIds.length > 0 ? selectedAtletasIds : filteredAtletas.map((a) => a.id);
      const filters = {
        posicao: selectedPosicoes.length > 0 ? selectedPosicoes.join(", ") : "Todas",
        faixaIdade: selectedIdadeFaixas.length > 0 ? selectedIdadeFaixas.map(i => FAIXAS_IDADE[i].label).join(", ") : "Todas",
        clube: selectedClubes.length > 0 ? selectedClubes.join(", ") : "Todos",
        busca: searchQuery || undefined,
      };
      await generateExcel(ids, filters);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível gerar a planilha.");
    } finally {
      setGeneratingExcel(false);
    }
  };

  const sortedAtletas = useMemo(() => {
    const sorted = [...filteredAtletas];
    // Sempre ordenar alfabeticamente por nome
    sorted.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    return sorted;
  }, [filteredAtletas]);

  // Renderizar header da FlatList (SEM o TextInput de busca)
  const renderHeader = useCallback(() => (
    <View>
      {/* Painel de Filtros */}
      {showFilters && (
        <ScrollView className="bg-background border-b border-border" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 12 }} scrollEnabled={true}>
          {/* Filtro de Posições */}
          <FilterDropdown
            title="Posições"
            options={posicoes}
            selectedOptions={selectedPosicoes}
            onToggleOption={(pos) =>
              setSelectedPosicoes((prev) =>
                prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
              )
            }
          />

          {/* Filtro de Faixa de Idade */}
          <FilterDropdown
            title="Faixa de Idade"
            options={FAIXAS_IDADE.map((f) => f.label)}
            selectedOptions={selectedIdadeFaixas.map((idx) => FAIXAS_IDADE[idx].label)}
            onToggleOption={(label) => {
              const idx = FAIXAS_IDADE.findIndex((f) => f.label === label);
              if (idx !== -1) {
                setSelectedIdadeFaixas((prev) =>
                  prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
                );
              }
            }}
          />

          {/* Filtro de Clubes */}
          <FilterDropdown
            title="Clubes"
            options={clubes}
            selectedOptions={selectedClubes}
            onToggleOption={(clube) =>
              setSelectedClubes((prev) =>
                prev.includes(clube) ? prev.filter((c) => c !== clube) : [...prev, clube]
              )
            }
          />

          {/* Filtro de Naturalidade */}
          <FilterDropdown
            title="Naturalidade"
            options={naturalidades}
            selectedOptions={selectedNaturalidades}
            onToggleOption={(nat) =>
              setSelectedNaturalidades((prev) =>
                prev.includes(nat) ? prev.filter((n) => n !== nat) : [...prev, nat]
              )
            }
          />

          {/* Filtro de Pé Preferencial */}
          <FilterDropdown
            title="Pé Preferencial"
            options={pes}
            selectedOptions={selectedPes}
            onToggleOption={(pe) =>
              setSelectedPes((prev) =>
                prev.includes(pe) ? prev.filter((p) => p !== pe) : [...prev, pe]
              )
            }
          />
        </ScrollView>
      )}

      {/* Seção de Exportação */}
      <View className="px-4 py-3 flex-row justify-between items-center border-b border-border">
        <TouchableOpacity
          onPress={handleExcelPress}
          disabled={generatingExcel}
          style={{ marginLeft: 8 }}
        >
          <IconSymbol name="square.and.arrow.down" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  ), [showFilters, posicoes, selectedPosicoes, selectedIdadeFaixas, clubes, selectedClubes, naturalidades, selectedNaturalidades, pes, selectedPes, sortBy, colors, generatingExcel, completudeFilterMin]);

  return (
    <ScreenContainer className="bg-background p-0">
      {/* Header FIXO com Logo e Busca — fora da FlatList */}
      <View className="bg-gradient-to-b from-primary/10 to-background px-4 pt-4 pb-3">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center gap-3 flex-1">
            <Image
              source={marcilioDiasShield}
              style={{ width: 56, height: 56 }}
              resizeMode="contain"
            />
            <View>
              <Text className="text-xs text-muted">Banco de Dados Marcílio Dias</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={handleAddAtleta}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <IconSymbol name="plus" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowStatsModal(true)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primary + '33',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <IconSymbol name="chart.bar.fill" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/relatorio")}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primary + '33',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <IconSymbol name="doc.text" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/settings")}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primary + '33',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <IconSymbol name="gearshape.fill" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Barra de Busca — FIXO, fora da FlatList */}
        <View className="flex-row gap-2">
          <View className="flex-1 bg-surface rounded-full px-4 py-3 border border-border flex-row items-center">
            <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
            <TextInput
              ref={searchInputRef}
              placeholder="Buscar atleta..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-2 text-foreground"
              style={{ color: colors.foreground, outlineStyle: "none" } as any}
              returnKeyType="done"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <IconSymbol name="xmark.circle.fill" size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>

          <Pressable
            onPress={() => setShowFilters(!showFilters)}
            style={{
              backgroundColor: activeFilterCount > 0 ? colors.primary : colors.surface,
              borderWidth: activeFilterCount > 0 ? 0 : 1,
              borderColor: colors.border,
              borderRadius: 24,
              width: 48,
              height: 48,
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
            } as any}
          >
            <IconSymbol
              name="slider.horizontal.3"
              size={20}
              color={activeFilterCount > 0 ? "white" : colors.muted}
            />
            {activeFilterCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: colors.error,
                }}
              >
                <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Contador de Resultados */}
        <View className="flex-row justify-between items-center mt-3">
          <Text className="text-sm text-muted">
            {filteredAtletas.length} atleta{filteredAtletas.length !== 1 ? "s" : ""} encontrado{filteredAtletas.length !== 1 ? "s" : ""}
          </Text>
          {activeFilterCount > 0 && (
            <TouchableOpacity onPress={clearFilters}>
              <Text className="text-sm text-primary font-medium">Limpar filtros</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Lista de Atletas com Filtros e Ordenação no Header */}
      <FlatList
        ListHeaderComponent={renderHeader}
        data={sortedAtletas}
        keyExtractor={(item) => item.id.toString()}

        renderItem={({ item }: { item: any }) => {
          const isSelected = selectedAtletasIds.includes(item.id);
          return (
            <View
              style={{
                marginHorizontal: 16,
                marginBottom: 12,
                backgroundColor: isSelected ? colors.primary + "20" : colors.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: isSelected ? colors.primary : colors.border,
                flexDirection: "row",
                alignItems: "center",
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >

              {(() => {
                const fotoUrl = item.fotoUrl || (item.midias && item.midias.find((m: any) => m.tipo === 'foto')?.url);
                if (fotoUrl) {
                  return (
                    <Image
                      source={{ uri: fotoUrl }}
                      style={{ width: 56, height: 56, borderRadius: 28, marginRight: 16 }}
                      resizeMode="cover"
                      progressiveRenderingEnabled={true}
                    />
                  );
                }
                return (
                  <View style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.primary + "20",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 16,
                  }}>
                    <Text style={{ color: colors.primary, fontWeight: "bold", fontSize: 18 }}>
                      {item.nome?.charAt(0).toUpperCase() || "?"}
                    </Text>
                  </View>
                );
              })()}


              <TouchableOpacity
                onPress={() => handleAtletaPress(item.id)}
                style={{ flex: 1 }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, flex: 1 }} numberOfLines={1}>
                    {item.nome || "Sem nome"}
                  </Text>
                  <View style={{ backgroundColor: item.completude === 100 ? colors.success + "20" : colors.warning + "20", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: item.completude === 100 ? colors.success : colors.warning }}>
                      {item.completude}%
                    </Text>
                  </View>
                </View>
                <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2, marginBottom: 8, overflow: "hidden" }}>
                  <View style={{ height: "100%", width: `${item.completude}%`, backgroundColor: item.completude === 100 ? colors.success : colors.warning, borderRadius: 2 }} />
                </View>
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  {item.posicao && (
                    <View style={{ backgroundColor: colors.primary + "20", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "500" }}>
                        {item.posicao}
                      </Text>
                    </View>
                  )}
                  {item.clube && (
                    <View style={{ backgroundColor: colors.muted + "20", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "500" }} numberOfLines={1}>
                        {item.clube}
                      </Text>
                    </View>
                  )}
                  {(() => {
                    const idadeExibida = calcularIdadeAtual(item.dataNascimento) ?? (item.idade != null && item.idade > 0 ? item.idade : null);
                    return idadeExibida != null ? (
                      <View style={{ backgroundColor: colors.success + "20", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
                        <Text style={{ fontSize: 12, color: colors.success, fontWeight: "500" }}>
                          {idadeExibida} anos
                        </Text>
                      </View>
                    ) : null;
                  })()}
                </View>
              </TouchableOpacity>

              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </View>
          );
        }}
        ListEmptyComponent={
          !isLoading ? (
            <View className="flex-1 justify-center items-center py-12">
              <IconSymbol name="magnifyingglass" size={48} color={colors.muted} />
              <Text className="text-lg font-semibold text-foreground mt-4">
                Nenhum atleta encontrado
              </Text>
              <Text className="text-sm text-muted text-center mt-2 px-6">
                {searchQuery || activeFilterCount > 0
                  ? "Tente ajustar sua busca ou filtros"
                  : "Comece adicionando um novo atleta"}
              </Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{ paddingTop: 0, paddingBottom: 100 }}
        scrollEnabled={true}
      />

      {/* Modal de Confirmação do Relatório */}
      <Modal
        visible={showReportConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReportConfirm(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-surface rounded-2xl p-6 w-full max-w-sm">
            <Text className="text-xl font-bold text-foreground mb-4">Gerar Relatório</Text>
            <Text className="text-sm text-muted mb-6">
              {selectedAtletasIds.length} atleta{selectedAtletasIds.length !== 1 ? "s" : ""} selecionado{selectedAtletasIds.length !== 1 ? "s" : ""}
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowReportConfirm(false)}
                className="flex-1 py-3 rounded-lg border border-border"
              >
                <Text className="text-center text-foreground font-medium">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmReport}
                disabled={generatingPdf}
                className="flex-1 py-3 rounded-lg bg-primary"
              >
                <Text className="text-center text-white font-medium">
                  {generatingPdf ? "Gerando..." : "Gerar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Estatísticas de Completude */}
      {useMemo(() => (
        <CompletudStatsModal
          visible={showStatsModal}
          onClose={() => setShowStatsModal(false)}
          stats={(() => {
            const stats = [
              { min: 100, max: 100, label: "100% Completo", count: 0, percentage: 0 },
              { min: 90, max: 99, label: "90-99%", count: 0, percentage: 0 },
              { min: 80, max: 89, label: "80-89%", count: 0, percentage: 0 },
              { min: 70, max: 79, label: "70-79%", count: 0, percentage: 0 },
              { min: 60, max: 69, label: "60-69%", count: 0, percentage: 0 },
              { min: 50, max: 59, label: "50-59%", count: 0, percentage: 0 },
              { min: 0, max: 49, label: "Menos de 50%", count: 0, percentage: 0 },
            ];
            atletas.forEach((atleta) => {
              const completude = atleta.completude || 0;
              const bracket = stats.find((s) => completude >= s.min && completude <= s.max);
              if (bracket) {
                bracket.count++;
              }
            });
            stats.forEach((stat) => {
              stat.percentage = atletas.length > 0 ? Math.round((stat.count / atletas.length) * 100) : 0;
            });
            return stats;
          })()}
          totalAtletas={atletas.length}
          onSelectBracket={handleSelectCompletudeBracket}
        />
      ), [atletas, showStatsModal, handleSelectCompletudeBracket])}

    </ScreenContainer>
  );
}
