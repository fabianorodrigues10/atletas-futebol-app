import { useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, TextInput, Modal,
  ScrollView, Alert, ActivityIndicator, Platform,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

interface Grupo {
  id: number;
  nome: string;
  descricao?: string | null;
  cor: string;
  createdAt: Date;
}

interface AtletaEmGrupo {
  atletaId: number;
  atletaNome?: string;
}

const CORES = ["#FF6B35", "#FF1744", "#00BCD4", "#4CAF50", "#9C27B0", "#FFC107"];

export default function GruposScreen() {
  const colors = useColors();

  // Estados do modal de criar grupo
  const [modalCriarVisible, setModalCriarVisible] = useState(false);
  const [novoGrupo, setNovoGrupo] = useState({ nome: "", descricao: "", cor: "#FF6B35" });

  // Estados do painel de atletas
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null);
  const [modalAdicionarVisible, setModalAdicionarVisible] = useState(false);
  const [buscaNome, setBuscaNome] = useState("");

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: grupos = [], isLoading: loadingGrupos, refetch: refetchGrupos } =
    trpc.atletas.list?.useQuery?.() ?? trpc.grupos.list.useQuery();

  // Usar a query correta para grupos
  const gruposQuery = trpc.grupos.list.useQuery();
  const atletasDoGrupoQuery = trpc.grupos.getAtletas.useQuery(
    { grupoId: selectedGrupo?.id ?? 0 },
    { enabled: !!selectedGrupo }
  );

  // Busca de atletas para adicionar ao grupo
  const buscaAtletasQuery = trpc.atletas.search.useQuery(
    { nome: buscaNome },
    { enabled: modalAdicionarVisible && buscaNome.length >= 2 }
  );

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = trpc.grupos.create.useMutation({
    onSuccess: () => {
      setNovoGrupo({ nome: "", descricao: "", cor: "#FF6B35" });
      setModalCriarVisible(false);
      gruposQuery.refetch();
    },
    onError: (err) => Alert.alert("Erro", err.message || "Não foi possível criar o grupo."),
  });

  const deleteMutation = trpc.grupos.delete.useMutation({
    onSuccess: () => {
      if (selectedGrupo) setSelectedGrupo(null);
      gruposQuery.refetch();
    },
    onError: (err) => Alert.alert("Erro", err.message || "Não foi possível excluir o grupo."),
  });

  const addAtletaMutation = trpc.grupos.addAtleta.useMutation({
    onSuccess: () => atletasDoGrupoQuery.refetch(),
    onError: (err) => Alert.alert("Erro", err.message || "Não foi possível adicionar o atleta."),
  });

  const removeAtletaMutation = trpc.grupos.removeAtleta.useMutation({
    onSuccess: () => atletasDoGrupoQuery.refetch(),
    onError: (err) => Alert.alert("Erro", err.message || "Não foi possível remover o atleta."),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCreateGrupo = () => {
    if (!novoGrupo.nome.trim()) {
      Alert.alert("Atenção", "O nome do grupo é obrigatório.");
      return;
    }
    createMutation.mutate({
      nome: novoGrupo.nome.trim(),
      descricao: novoGrupo.descricao.trim() || undefined,
      cor: novoGrupo.cor,
    });
  };

  const handleDeleteGrupo = (id: number) => {
    if (Platform.OS === "web") {
      if (!confirm("Tem certeza que deseja excluir este grupo?")) return;
      deleteMutation.mutate({ id });
    } else {
      Alert.alert("Excluir grupo", "Tem certeza que deseja excluir este grupo?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: () => deleteMutation.mutate({ id }) },
      ]);
    }
  };

  const handleAddAtleta = (atletaId: number) => {
    if (!selectedGrupo) return;
    const jaEsta = (atletasDoGrupoQuery.data ?? []).some((a: any) => a.atletaId === atletaId);
    if (jaEsta) {
      Alert.alert("Atenção", "Este atleta já está no grupo.");
      return;
    }
    addAtletaMutation.mutate({ atletaId, grupoId: selectedGrupo.id });
  };

  const handleRemoveAtleta = (atletaId: number) => {
    if (!selectedGrupo) return;
    removeAtletaMutation.mutate({ atletaId, grupoId: selectedGrupo.id });
  };

  // IDs dos atletas já no grupo para marcar na busca
  const idsNoGrupo = new Set((atletasDoGrupoQuery.data ?? []).map((a: any) => a.atletaId));

  // ── Render ─────────────────────────────────────────────────────────────────
  const renderGrupo = ({ item }: { item: Grupo }) => {
    const isSelected = selectedGrupo?.id === item.id;
    return (
      <TouchableOpacity
        onPress={() => setSelectedGrupo(isSelected ? null : item)}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          marginBottom: 10,
          borderLeftWidth: 4,
          borderLeftColor: item.cor,
          borderWidth: isSelected ? 1.5 : 0,
          borderColor: isSelected ? item.cor : "transparent",
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>
              {item.nome}
            </Text>
            {item.descricao ? (
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{item.descricao}</Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={() => handleDeleteGrupo(item.id)} style={{ padding: 8 }}>
            <Text style={{ color: colors.error, fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomColor: colors.border, borderBottomWidth: 1,
      }}>
        <Text style={{ fontSize: 22, fontWeight: "bold", color: colors.foreground }}>Grupos</Text>
        <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
          Organize atletas em listas personalizadas
        </Text>
      </View>

      {/* Conteúdo */}
      {gruposQuery.isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 100 }}>
          {(gruposQuery.data ?? []).length === 0 ? (
            <View style={{ alignItems: "center", marginTop: 60 }}>
              <Text style={{ color: colors.muted, fontSize: 14, textAlign: "center" }}>
                Nenhum grupo criado ainda.{"\n"}Toque em + para criar o primeiro grupo.
              </Text>
            </View>
          ) : (
            <FlatList
              data={gruposQuery.data as Grupo[]}
              renderItem={renderGrupo}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          )}

          {/* Painel de atletas do grupo selecionado */}
          {selectedGrupo && (
            <View style={{
              marginTop: 4,
              padding: 14,
              backgroundColor: colors.surface,
              borderRadius: 12,
              borderLeftWidth: 4,
              borderLeftColor: selectedGrupo.cor,
            }}>
              {/* Cabeçalho do painel */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                  Atletas em "{selectedGrupo.nome}"
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setBuscaNome("");
                    setModalAdicionarVisible(true);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: selectedGrupo.cor,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    gap: 4,
                  }}
                >
                  <Text style={{ color: "white", fontSize: 13, fontWeight: "600" }}>+ Adicionar</Text>
                </TouchableOpacity>
              </View>

              {/* Lista de atletas no grupo */}
              {atletasDoGrupoQuery.isLoading ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (atletasDoGrupoQuery.data ?? []).length === 0 ? (
                <Text style={{ color: colors.muted, fontSize: 13, fontStyle: "italic" }}>
                  Nenhum atleta neste grupo ainda.
                </Text>
              ) : (
                (atletasDoGrupoQuery.data as any[]).map((a) => (
                  <View key={a.atletaId} style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}>
                    <Text style={{ color: colors.foreground, fontSize: 14, flex: 1 }}>
                      {a.atletaNome || `Atleta #${a.atletaId}`}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveAtleta(a.atletaId)}
                      style={{ padding: 6 }}
                    >
                      <Text style={{ color: colors.error, fontSize: 16 }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Botão flutuante para criar grupo */}
      <TouchableOpacity
        onPress={() => {
          setNovoGrupo({ nome: "", descricao: "", cor: "#FF6B35" });
          setModalCriarVisible(true);
        }}
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <Text style={{ fontSize: 28, color: "white", lineHeight: 32 }}>+</Text>
      </TouchableOpacity>

      {/* ── Modal: Criar Grupo ─────────────────────────────────────────────── */}
      <Modal
        visible={modalCriarVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalCriarVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            paddingBottom: 40,
          }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground, marginBottom: 16 }}>
              Novo Grupo
            </Text>

            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600", marginBottom: 4 }}>
              Nome do Grupo *
            </Text>
            <TextInput
              style={{
                borderWidth: 1, borderColor: colors.border, borderRadius: 8,
                padding: 12, marginBottom: 16, color: colors.foreground,
                backgroundColor: colors.surface,
              }}
              placeholder="Ex: Titulares, Reservas, Monitorados"
              placeholderTextColor={colors.muted}
              value={novoGrupo.nome}
              onChangeText={(text) => setNovoGrupo({ ...novoGrupo, nome: text })}
              returnKeyType="next"
            />

            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600", marginBottom: 4 }}>
              Descrição (opcional)
            </Text>
            <TextInput
              style={{
                borderWidth: 1, borderColor: colors.border, borderRadius: 8,
                padding: 12, marginBottom: 16, color: colors.foreground,
                backgroundColor: colors.surface, height: 72,
              }}
              placeholder="Descrição do grupo"
              placeholderTextColor={colors.muted}
              value={novoGrupo.descricao}
              onChangeText={(text) => setNovoGrupo({ ...novoGrupo, descricao: text })}
              multiline
            />

            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>
              Cor
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
              {CORES.map((cor) => (
                <TouchableOpacity
                  key={cor}
                  onPress={() => setNovoGrupo({ ...novoGrupo, cor })}
                  style={{
                    width: 36, height: 36, borderRadius: 8, backgroundColor: cor,
                    borderWidth: novoGrupo.cor === cor ? 3 : 1,
                    borderColor: novoGrupo.cor === cor ? colors.foreground : "transparent",
                  }}
                />
              ))}
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setModalCriarVisible(false)}
                style={{
                  flex: 1, paddingVertical: 12, borderRadius: 8,
                  borderWidth: 1, borderColor: colors.border, alignItems: "center",
                }}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateGrupo}
                disabled={createMutation.isPending}
                style={{
                  flex: 1, paddingVertical: 12, borderRadius: 8,
                  backgroundColor: colors.primary, alignItems: "center",
                  opacity: createMutation.isPending ? 0.7 : 1,
                }}
              >
                {createMutation.isPending
                  ? <ActivityIndicator color="white" size="small" />
                  : <Text style={{ color: "white", fontWeight: "600" }}>Criar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Adicionar Atleta ao Grupo ──────────────────────────────── */}
      <Modal
        visible={modalAdicionarVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalAdicionarVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            paddingBottom: 40,
            maxHeight: "80%",
          }}>
            <Text style={{ fontSize: 17, fontWeight: "bold", color: colors.foreground, marginBottom: 12 }}>
              Adicionar atleta a "{selectedGrupo?.nome}"
            </Text>

            {/* Campo de busca */}
            <TextInput
              style={{
                borderWidth: 1, borderColor: colors.border, borderRadius: 8,
                padding: 12, marginBottom: 12, color: colors.foreground,
                backgroundColor: colors.surface,
              }}
              placeholder="Buscar atleta pelo nome..."
              placeholderTextColor={colors.muted}
              value={buscaNome}
              onChangeText={setBuscaNome}
              autoFocus
            />

            {/* Resultados */}
            {buscaNome.length < 2 ? (
              <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center", marginTop: 8 }}>
                Digite ao menos 2 letras para buscar
              </Text>
            ) : buscaAtletasQuery.isLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
            ) : (buscaAtletasQuery.data ?? []).length === 0 ? (
              <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center", marginTop: 8 }}>
                Nenhum atleta encontrado
              </Text>
            ) : (
              <FlatList
                data={buscaAtletasQuery.data as any[]}
                keyExtractor={(item) => item.id.toString()}
                style={{ maxHeight: 320 }}
                renderItem={({ item }) => {
                  const jaEsta = idsNoGrupo.has(item.id);
                  return (
                    <TouchableOpacity
                      onPress={() => !jaEsta && handleAddAtleta(item.id)}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingVertical: 12,
                        paddingHorizontal: 4,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                        opacity: jaEsta ? 0.5 : 1,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                          {item.nome}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.muted }}>
                          {[item.posicao, item.clube].filter(Boolean).join(" • ")}
                        </Text>
                      </View>
                      {jaEsta ? (
                        <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 8 }}>Já adicionado</Text>
                      ) : addAtletaMutation.isPending ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <View style={{
                          backgroundColor: selectedGrupo?.cor ?? colors.primary,
                          borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8,
                        }}>
                          <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>+ Adicionar</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            <TouchableOpacity
              onPress={() => setModalAdicionarVisible(false)}
              style={{
                marginTop: 16, paddingVertical: 12, borderRadius: 8,
                borderWidth: 1, borderColor: colors.border, alignItems: "center",
              }}
            >
              <Text style={{ color: colors.foreground, fontWeight: "600" }}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
