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
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { FilterCheckbox } from "@/components/filter-checkbox";
import { FilterDropdown } from "@/components/filter-dropdown";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { generateReport, generateExcel } from "@/lib/report";
import { useState, useMemo } from "react";

const FAIXAS_IDADE = [
  { label: "Sub-17", min: 0, max: 16 },
  { label: "Sub-20", min: 17, max: 19 },
  { label: "Sub-23", min: 20, max: 22 },
  { label: "21-25", min: 21, max: 25 },
  { label: "26+", min: 26, max: 100 },
];

export default function FiltrosScreen() {
  const router = useRouter();
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);

  // Filtros
  const [selectedPosicoes, setSelectedPosicoes] = useState<string[]>([]);
  const [selectedClubes, setSelectedClubes] = useState<string[]>([]);
  const [selectedIdadeFaixas, setSelectedIdadeFaixas] = useState<number[]>([]);
  const [selectedNaturalidades, setSelectedNaturalidades] = useState<string[]>([]);
  
  // Seleção de atletas
  const [selectedAtletasIds, setSelectedAtletasIds] = useState<number[]>([]);

  // Query de atletas
  const { data: atletas = [], isLoading, refetch } = trpc.atletas.list.useQuery();

  // Extrair posições e clubes únicos
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

  // Filtrar atletas
  const filteredAtletas = useMemo(() => {
    return atletas.filter((atleta) => {
      if (searchQuery && !atleta.nome.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedPosicoes.length > 0 && !selectedPosicoes.includes(atleta.posicao || "")) {
        return false;
      }
      if (selectedClubes.length > 0 && !selectedClubes.includes(atleta.clube || "")) {
        return false;
      }
      if (selectedIdadeFaixas.length > 0) {
        const idade = atleta.idade ?? 0;
        const matchesFaixa = selectedIdadeFaixas.some((faixaIdx) => {
          const faixa = FAIXAS_IDADE[faixaIdx];
          return idade >= faixa.min && idade <= faixa.max;
        });
        if (!matchesFaixa) return false;
      }
      if (selectedNaturalidades.length > 0 && !selectedNaturalidades.includes(atleta.naturalidade || "")) {
        return false;
      }
      return true;
    });
  }, [atletas, searchQuery, selectedPosicoes, selectedClubes, selectedIdadeFaixas, selectedNaturalidades]);


  const toggleAtletaSelection = (id: number) => {
    setSelectedAtletasIds((prev) =>
      prev.includes(id) ? prev.filter((aid) => aid !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    setSelectedAtletasIds(filteredAtletas.map((a) => a.id));
  };

  const deselectAll = () => {
    setSelectedAtletasIds([]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleGeneratePdf = async () => {
    if (selectedAtletasIds.length === 0) {
      Alert.alert("Aviso", "Selecione pelo menos um atleta");
      return;
    }
    setGeneratingPdf(true);
    try {
      const filters = {
        posicoes: selectedPosicoes.length > 0 ? selectedPosicoes.join(", ") : "Todas",
        idade: selectedIdadeFaixas.length > 0 ? selectedIdadeFaixas.map((idx) => FAIXAS_IDADE[idx].label).join(", ") : "Todas",
        clube: selectedClubes.length > 0 ? selectedClubes.join(", ") : "Todos",
        busca: searchQuery || undefined,
      };
      await generateReport(selectedAtletasIds, filters);
      Alert.alert("Sucesso", "Relatório gerado com sucesso!");
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível gerar o relatório.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleGenerateExcel = async () => {
    if (selectedAtletasIds.length === 0) {
      Alert.alert("Aviso", "Selecione pelo menos um atleta");
      return;
    }
    setGeneratingExcel(true);
    try {
      const filters = {
        posicoes: selectedPosicoes.length > 0 ? selectedPosicoes.join(", ") : "Todas",
        idade: selectedIdadeFaixas.length > 0 ? selectedIdadeFaixas.map((idx) => FAIXAS_IDADE[idx].label).join(", ") : "Todas",
        clube: selectedClubes.length > 0 ? selectedClubes.join(", ") : "Todos",
        busca: searchQuery || undefined,
      };
      await generateExcel(selectedAtletasIds, filters);
      Alert.alert("Sucesso", "Excel exportado com sucesso!");
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível exportar o Excel.");
    } finally {
      setGeneratingExcel(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: "600", color: colors.foreground, marginLeft: 12 }}>
          Gerar Relatório
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} scrollEnabled={true}>
        <View style={{ padding: 16, gap: 12 }}>
          {/* Busca */}
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
            }}
            placeholderTextColor={colors.muted}
          />

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

          {/* Botões de Seleção */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
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

          {/* Lista de Atletas */}
          {filteredAtletas.map((item) => {
            const isSelected = selectedAtletasIds.includes(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => toggleAtletaSelection(item.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  backgroundColor: isSelected ? colors.surface : colors.background,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    borderWidth: 2,
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected ? colors.primary : "transparent",
                    marginRight: 12,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {isSelected && <IconSymbol name="checkmark" size={14} color="white" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                    {item.nome}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                    {item.posicao} • {item.clube}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Botões de Ação */}
          <View style={{ gap: 12, marginTop: 16 }}>
            <TouchableOpacity
              onPress={handleGeneratePdf}
              disabled={generatingPdf || selectedAtletasIds.length === 0}
              style={{
                backgroundColor: selectedAtletasIds.length > 0 ? colors.primary : colors.border,
                borderRadius: 8,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
                {generatingPdf ? "Gerando..." : "Gerar Relatório PDF"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleGenerateExcel}
              disabled={generatingExcel || selectedAtletasIds.length === 0}
              style={{
                backgroundColor: selectedAtletasIds.length > 0 ? colors.primary : colors.border,
                borderRadius: 8,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
                {generatingExcel ? "Exportando..." : "Exportar Excel"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
