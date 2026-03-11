import { useState, useCallback, useMemo } from "react";
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
import { FilterDropdown } from "@/components/filter-dropdown";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { generateReport, generateExcel } from "@/lib/report";
import { generateReportWithPreview, downloadPdf } from "@/lib/report-preview";
import { PDFPreviewModal } from "@/components/pdf-preview-modal";

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

  // Query de atletas
  const { data: atletas = [], isLoading, refetch } = trpc.atletas.list.useQuery();

  // Estados de filtro
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosicoes, setSelectedPosicoes] = useState<string[]>([]);
  const [selectedClubes, setSelectedClubes] = useState<string[]>([]);
  const [selectedIdadeFaixas, setSelectedIdadeFaixas] = useState<number[]>([]);
  const [selectedEscalas, setSelectedEscalas] = useState<string[]>([]);
  const [selectedPesPreferencial, setSelectedPesPreferencial] = useState<string[]>([]);
  const [selectedAtletasIds, setSelectedAtletasIds] = useState<number[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [currentFilters, setCurrentFilters] = useState<any>(null);

  // Obter posições e clubes únicos
  const posicoes = useMemo(() => {
    const set = new Set<string>();
    atletas.forEach((a: any) => {
      if (a.posicao) set.add(a.posicao);
    });
    return Array.from(set).sort();
  }, [atletas]);

  const clubes = useMemo(() => {
    const set = new Set<string>();
    atletas.forEach((a: any) => {
      if (a.clube) set.add(a.clube);
    });
    return Array.from(set).sort();
  }, [atletas]);

  const pesPreferencial = useMemo(() => {
    const set = new Set<string>();
    atletas.forEach((a: any) => {
      if (a.pe) set.add(a.pe);
    });
    return Array.from(set).sort();
  }, [atletas]);

  // Filtrar atletas
  const filteredAtletas = useMemo(() => {
    return atletas.filter((atleta: any) => {
      if (searchQuery && !atleta.nome.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedPosicoes.length > 0 && !selectedPosicoes.includes(atleta.posicao || "")) {
        return false;
      }
      if (selectedClubes.length > 0 && !selectedClubes.includes(atleta.clube || "")) {
        return false;
      }
      if (selectedEscalas.length > 0 && !selectedEscalas.includes(atleta.escala || "")) {
        return false;
      }
      if (selectedPesPreferencial.length > 0 && !selectedPesPreferencial.includes(atleta.pe || "")) {
        return false;
      }
      if (selectedIdadeFaixas.length > 0) {
        const idade = atleta.idade ?? 0;
        const matchesFaixa = selectedIdadeFaixas.some((faixaIdx) => {
          const faixa = FAIXAS_IDADE[faixaIdx];
          return idade >= faixa.min && idade <= faixa.max;
        });
        if (!matchesFaixa) {
          return false;
        }
      }
      return true;
    });
  }, [atletas, searchQuery, selectedPosicoes, selectedClubes, selectedIdadeFaixas, selectedEscalas, selectedPesPreferencial]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

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
      const blob = await generateReportWithPreview(selectedAtletasIds, filters);
      setPdfBlob(blob);
      setCurrentFilters(filters);
      setShowPdfPreview(true);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível gerar o relatório.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!pdfBlob) return;
    await downloadPdf(pdfBlob, "Relatorio_BDMD.pdf");
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
      Alert.alert("Sucesso", "Planilha exportada com sucesso!");
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível exportar a planilha.");
    } finally {
      setGeneratingExcel(false);
    }
  };

  // Renderizar apenas os filtros (sem TextInput)
  const renderFilters = () => (
    <View style={{ padding: 16, gap: 12 }}>
      {/* Filtro de Posição */}
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

      {/* Filtro de Clube */}
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

      {/* Filtro de Idade */}
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

      {/* Filtro de Escala */}
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

      {/* Filtro de Pé Preferencial */}
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

      {/* Botoes de Selecao */}
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

  return (
    <ScreenContainer className="bg-background p-0">
      {/* Header fixo com voltar */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6, backgroundColor: colors.surface }}>
          <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>Voltar</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: "600", color: colors.foreground }}>
          Gerar Relatório
        </Text>
      </View>

      {/* TextInput fixo fora da FlatList */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
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
      </View>

      {/* Lista de Atletas com Filtros no Header */}
      <FlatList
        ListHeaderComponent={renderFilters}
        data={filteredAtletas}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
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
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isSelected && <Text style={{ color: "white", fontWeight: "bold" }}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "600", color: colors.foreground }}>{item.nome}</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  {item.posicao} • {item.clube} • {item.idade} anos
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={
          <View style={{ padding: 16, gap: 8, marginBottom: 100 }}>
            <TouchableOpacity
              onPress={handleGenerateReport}
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
        }
        contentContainerStyle={{ paddingTop: 0, paddingBottom: 0 }}
        scrollEnabled={true}
      />

      {/* Modal de Prévia de PDF */}
      <PDFPreviewModal
        visible={showPdfPreview}
        pdfBlob={pdfBlob}
        onClose={() => setShowPdfPreview(false)}
        onDownload={handleDownloadPdf}
        fileName="Relatorio_BDMD.pdf"
      />
    </ScreenContainer>
  );
}
