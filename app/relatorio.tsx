import { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { FilterDropdown } from "@/components/filter-dropdown";
import { useColors } from "@/hooks/use-colors";
import { generateReport, generateExcel } from "@/lib/report";
import { getApiBaseUrl } from "@/constants/oauth";

// Faixas de idade padrão
const FAIXAS_IDADE = [
  { label: "Sub-17", min: 0, max: 16 },
  { label: "Sub-20", min: 17, max: 19 },
  { label: "Sub-23", min: 20, max: 22 },
  { label: "21-25", min: 21, max: 25 },
  { label: "26+", min: 26, max: 100 },
];

// Opções de escala
const ESCALAS = ["A", "B", "B-", "B+", "C", "C-", "C+", "D", "D-", "D+"];

export default function RelatorioScreen() {
  const router = useRouter();
  const colors = useColors();

  // Carregar atletas via REST API (igual à tela principal)
  const [atletas, setAtletas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAtletas = useCallback(async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/atletas`);
      if (!response.ok) throw new Error(`Erro: ${response.status}`);
      const data = await response.json();
      setAtletas(data.data || data);
    } catch (error) {
      console.error("[Relatório] Erro ao carregar atletas:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAtletas();
  }, [loadAtletas]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAtletas();
  }, [loadAtletas]);

  // Estados de filtro
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosicoes, setSelectedPosicoes] = useState<string[]>([]);
  const [selectedClubes, setSelectedClubes] = useState<string[]>([]);
  const [selectedIdadeFaixas, setSelectedIdadeFaixas] = useState<number[]>([]);
  const [selectedEscalas, setSelectedEscalas] = useState<string[]>([]);
  const [selectedPesPreferencial, setSelectedPesPreferencial] = useState<string[]>([]);
  const [selectedAtletasIds, setSelectedAtletasIds] = useState<number[]>([]);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);

  // Obter posições e clubes únicos
  const posicoes = useMemo(() => {
    const set = new Set<string>();
    atletas.forEach((a: any) => { if (a.posicao) set.add(a.posicao); });
    return Array.from(set).sort();
  }, [atletas]);

  const clubes = useMemo(() => {
    const set = new Set<string>();
    atletas.forEach((a: any) => { if (a.clube) set.add(a.clube); });
    return Array.from(set).sort();
  }, [atletas]);

  const pesPreferencial = useMemo(() => {
    const set = new Set<string>();
    atletas.forEach((a: any) => { if (a.pe) set.add(a.pe); });
    return Array.from(set).sort();
  }, [atletas]);

  // Filtrar atletas
  const filteredAtletas = useMemo(() => {
    return atletas.filter((atleta: any) => {
      if (searchQuery && !atleta.nome?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedPosicoes.length > 0 && !selectedPosicoes.includes(atleta.posicao || "")) return false;
      if (selectedClubes.length > 0 && !selectedClubes.includes(atleta.clube || "")) return false;
      if (selectedEscalas.length > 0 && !selectedEscalas.includes(atleta.escala || "")) return false;
      if (selectedPesPreferencial.length > 0 && !selectedPesPreferencial.includes(atleta.pe || "")) return false;
      if (selectedIdadeFaixas.length > 0) {
        const idade = atleta.idade ?? 0;
        const matchesFaixa = selectedIdadeFaixas.some((faixaIdx) => {
          const faixa = FAIXAS_IDADE[faixaIdx];
          return idade >= faixa.min && idade <= faixa.max;
        });
        if (!matchesFaixa) return false;
      }
      return true;
    });
  }, [atletas, searchQuery, selectedPosicoes, selectedClubes, selectedIdadeFaixas, selectedEscalas, selectedPesPreferencial]);

  const toggleAtletaSelection = useCallback((atletaId: number) => {
    setSelectedAtletasIds((prev) =>
      prev.includes(atletaId) ? prev.filter((id) => id !== atletaId) : [...prev, atletaId]
    );
  }, []);

  const selectAllFiltered = useCallback(() => {
    setSelectedAtletasIds(filteredAtletas.map((a: any) => a.id));
  }, [filteredAtletas]);

  const deselectAll = useCallback(() => {
    setSelectedAtletasIds([]);
  }, []);

  const handleGenerateReport = async () => {
    if (selectedAtletasIds.length === 0) {
      Alert.alert("Atenção", "Selecione pelo menos um atleta");
      return;
    }
    setGeneratingPdf(true);
    try {
      const filters = {
        posicao: selectedPosicoes.length > 0 ? selectedPosicoes.join(", ") : "Todas",
        faixaIdade: selectedIdadeFaixas.length > 0 ? selectedIdadeFaixas.map(i => FAIXAS_IDADE[i].label).join(", ") : "Todas",
        clube: selectedClubes.length > 0 ? selectedClubes.join(", ") : "Todos",
        pe: selectedPesPreferencial.length > 0 ? selectedPesPreferencial.join(", ") : "Todos",
        busca: searchQuery || undefined,
      };
      await generateReport(selectedAtletasIds, filters);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível gerar o relatório.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleGenerateExcel = async () => {
    if (selectedAtletasIds.length === 0) {
      Alert.alert("Atenção", "Selecione pelo menos um atleta");
      return;
    }
    setGeneratingExcel(true);
    try {
      const filters = {
        posicao: selectedPosicoes.length > 0 ? selectedPosicoes.join(", ") : "Todas",
        faixaIdade: selectedIdadeFaixas.length > 0 ? selectedIdadeFaixas.map(i => FAIXAS_IDADE[i].label).join(", ") : "Todas",
        clube: selectedClubes.length > 0 ? selectedClubes.join(", ") : "Todos",
        pe: selectedPesPreferencial.length > 0 ? selectedPesPreferencial.join(", ") : "Todos",
        busca: searchQuery || undefined,
      };
      await generateExcel(selectedAtletasIds, filters);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível exportar a planilha.");
    } finally {
      setGeneratingExcel(false);
    }
  };

  const renderFilters = () => (
    <View style={{ padding: 16, gap: 12 }}>
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
      <FilterDropdown
        title="Escala"
        options={ESCALAS}
        selectedOptions={selectedEscalas}
        onToggleOption={(escala) =>
          setSelectedEscalas((prev) =>
            prev.includes(escala) ? prev.filter((e) => e !== escala) : [...prev, escala]
          )
        }
      />
      <FilterDropdown
        title="Pé Preferencial"
        options={pesPreferencial}
        selectedOptions={selectedPesPreferencial}
        onToggleOption={(pe) =>
          setSelectedPesPreferencial((prev) =>
            prev.includes(pe) ? prev.filter((p) => p !== pe) : [...prev, pe]
          )
        }
      />

      {/* Botões de Seleção */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TouchableOpacity
          onPress={selectAllFiltered}
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 8,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ textAlign: "center", color: colors.foreground, fontWeight: "600", fontSize: 12 }}>
            Selecionar Todos ({selectedAtletasIds.length}/{filteredAtletas.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={deselectAll}
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 8,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ textAlign: "center", color: colors.foreground, fontWeight: "600", fontSize: 12 }}>
            Desselecionar
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
        Atletas ({filteredAtletas.length})
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.muted }}>Carregando atletas...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={{ backgroundColor: colors.background, padding: 0 }}>
      {/* Header */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: 12,
        backgroundColor: colors.background,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingVertical: 6,
            paddingHorizontal: 8,
            borderRadius: 6,
            backgroundColor: colors.surface,
          }}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>Voltar</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: "700", color: colors.foreground }}>
          Gerar Relatório
        </Text>
      </View>

      {/* Busca */}
      <View style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
      }}>
        <TextInput
          placeholder="Buscar atleta..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
            color: colors.foreground,
            backgroundColor: colors.surface,
          }}
          placeholderTextColor={colors.muted}
          returnKeyType="done"
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      {/* Lista */}
      <FlatList
        ListHeaderComponent={renderFilters}
        data={filteredAtletas}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => {
          const isSelected = selectedAtletasIds.includes(item.id);
          return (
            <TouchableOpacity
              onPress={() => toggleAtletaSelection(item.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                backgroundColor: isSelected ? colors.primary + "15" : colors.background,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected ? colors.primary : "transparent",
                  marginRight: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isSelected && (
                  <Text style={{ color: "white", fontWeight: "bold", fontSize: 13 }}>✓</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "600", color: colors.foreground }}>{item.nome}</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  {[item.posicao, item.clube, item.idade ? `${item.idade} anos` : null].filter(Boolean).join(" • ")}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={
          <View style={{ padding: 16, gap: 10, marginBottom: 40 }}>
            <TouchableOpacity
              onPress={handleGenerateReport}
              disabled={generatingPdf || selectedAtletasIds.length === 0}
              style={{
                backgroundColor: selectedAtletasIds.length > 0 ? colors.primary : colors.border,
                borderRadius: 10,
                paddingVertical: 14,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {generatingPdf ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <IconSymbol name="doc.fill" size={18} color="white" />
              )}
              <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
                {generatingPdf ? "Gerando PDF..." : `Gerar PDF (${selectedAtletasIds.length} atletas)`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleGenerateExcel}
              disabled={generatingExcel || selectedAtletasIds.length === 0}
              style={{
                backgroundColor: selectedAtletasIds.length > 0 ? colors.primary : colors.border,
                borderRadius: 10,
                paddingVertical: 14,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {generatingExcel ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <IconSymbol name="square.and.arrow.down" size={18} color="white" />
              )}
              <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
                {generatingExcel ? "Exportando..." : `Exportar Excel (${selectedAtletasIds.length} atletas)`}
              </Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 0 }}
      />
    </ScreenContainer>
  );
}
