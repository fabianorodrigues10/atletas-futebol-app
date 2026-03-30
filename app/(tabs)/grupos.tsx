import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

interface Grupo {
  id: number;
  nome: string;
  descricao?: string | null;
  cor: string;
  createdAt: Date;
}

const CORES = ["#FF6B35", "#FF1744", "#00BCD4", "#4CAF50", "#9C27B0", "#FFC107"];

export default function GruposScreen() {
  const colors = useColors();
  const [modalVisible, setModalVisible] = useState(false);
  const [novoGrupo, setNovoGrupo] = useState({ nome: "", descricao: "", cor: "#FF6B35" });
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null);

  // Queries tRPC
  const { data: grupos = [], isLoading, refetch } = trpc.grupos.list.useQuery();
  const { data: atletasDoGrupo = [], refetch: refetchAtletas } = trpc.grupos.getAtletas.useQuery(
    { grupoId: selectedGrupo?.id ?? 0 },
    { enabled: !!selectedGrupo }
  );

  // Mutations tRPC
  const createMutation = trpc.grupos.create.useMutation({
    onSuccess: () => {
      setNovoGrupo({ nome: "", descricao: "", cor: "#FF6B35" });
      setModalVisible(false);
      refetch();
    },
    onError: (err) => {
      Alert.alert("Erro", err.message || "Não foi possível criar o grupo.");
    },
  });

  const deleteMutation = trpc.grupos.delete.useMutation({
    onSuccess: () => {
      if (selectedGrupo) setSelectedGrupo(null);
      refetch();
    },
    onError: (err) => {
      Alert.alert("Erro", err.message || "Não foi possível excluir o grupo.");
    },
  });

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
    Alert.alert("Excluir grupo", "Tem certeza que deseja excluir este grupo?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => deleteMutation.mutate({ id }) },
    ]);
  };

  const renderGrupo = ({ item }: { item: Grupo }) => (
    <TouchableOpacity
      onPress={() => setSelectedGrupo(item)}
      style={{
        backgroundColor: selectedGrupo?.id === item.id ? colors.surface : colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: item.cor,
        borderWidth: selectedGrupo?.id === item.id ? 1.5 : 0,
        borderColor: selectedGrupo?.id === item.id ? item.cor : "transparent",
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
            {item.nome}
          </Text>
          {item.descricao ? (
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
              {item.descricao}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteGrupo(item.id)}
          style={{ padding: 8 }}
        >
          <Text style={{ color: colors.error, fontSize: 18 }}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomColor: colors.border, borderBottomWidth: 1 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground }}>Grupos</Text>
        <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
          Organize atletas em listas personalizadas
        </Text>
      </View>

      {/* Conteúdo */}
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={{ flex: 1, padding: 16 }}>
          {grupos.length === 0 ? (
            <View style={{ alignItems: "center", justifyContent: "center", marginTop: 60 }}>
              <Text style={{ color: colors.muted, fontSize: 14, textAlign: "center" }}>
                Nenhum grupo criado ainda.{"\n"}Toque em + para criar o primeiro grupo.
              </Text>
            </View>
          ) : (
            <FlatList
              data={grupos as Grupo[]}
              renderItem={renderGrupo}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          )}

          {/* Painel de atletas do grupo selecionado */}
          {selectedGrupo && (
            <View style={{
              marginTop: 8,
              padding: 16,
              backgroundColor: colors.surface,
              borderRadius: 12,
              borderLeftWidth: 4,
              borderLeftColor: selectedGrupo.cor,
            }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
                Atletas em "{selectedGrupo.nome}"
              </Text>
              {atletasDoGrupo.length === 0 ? (
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  Nenhum atleta neste grupo ainda.
                </Text>
              ) : (
                atletasDoGrupo.map((a: any) => (
                  <Text key={a.atletaId} style={{ color: colors.foreground, fontSize: 13, paddingVertical: 4 }}>
                    • Atleta #{a.atletaId}
                  </Text>
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
          setModalVisible(true);
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

      {/* Modal para criar grupo */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              paddingBottom: 40,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground, marginBottom: 16 }}>
              Novo Grupo
            </Text>

            {/* Campo Nome */}
            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600", marginBottom: 4 }}>
              Nome do Grupo *
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                color: colors.foreground,
                backgroundColor: colors.surface,
              }}
              placeholder="Ex: Titulares, Reservas, Monitorados"
              placeholderTextColor={colors.muted}
              value={novoGrupo.nome}
              onChangeText={(text) => setNovoGrupo({ ...novoGrupo, nome: text })}
              returnKeyType="next"
            />

            {/* Campo Descrição */}
            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600", marginBottom: 4 }}>
              Descrição (opcional)
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                color: colors.foreground,
                backgroundColor: colors.surface,
                height: 72,
              }}
              placeholder="Descrição do grupo"
              placeholderTextColor={colors.muted}
              value={novoGrupo.descricao}
              onChangeText={(text) => setNovoGrupo({ ...novoGrupo, descricao: text })}
              multiline
            />

            {/* Seletor de Cor */}
            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>
              Cor
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
              {CORES.map((cor) => (
                <TouchableOpacity
                  key={cor}
                  onPress={() => setNovoGrupo({ ...novoGrupo, cor })}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: cor,
                    borderWidth: novoGrupo.cor === cor ? 3 : 1,
                    borderColor: novoGrupo.cor === cor ? colors.foreground : "transparent",
                  }}
                />
              ))}
            </View>

            {/* Botões */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateGrupo}
                disabled={createMutation.isPending}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  opacity: createMutation.isPending ? 0.7 : 1,
                }}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={{ color: "white", fontWeight: "600" }}>Criar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
