import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

export default function CamposCustomizadosScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [nomeCampo, setNomeCampo] = useState("");
  const [tipoCampo, setTipoCampo] = useState<"text" | "number" | "select" | "date">("text");
  
  const { data: campos, isLoading, refetch } = trpc.campos.listCustomizados.useQuery(
    undefined,
    { enabled: Boolean(isAuthenticated) }
  );
  
  const createMutation = trpc.campos.createCustomizado.useMutation();
  const updateMutation = trpc.campos.updateCustomizado.useMutation();
  const deleteMutation = trpc.campos.deleteCustomizado.useMutation();
  
  const handleNovoCampo = () => {
    setNomeCampo("");
    setTipoCampo("text");
    setModalVisible(true);
  };
  
  const handleSalvarCampo = async () => {
    if (!nomeCampo.trim()) {
      Alert.alert("Erro", "O nome do campo é obrigatório");
      return;
    }
    
    try {
      const ordem = campos ? campos.length : 0;
      await createMutation.mutateAsync({
        nomeCampo: nomeCampo.trim(),
        tipoCampo,
        ativo: true,
        ordem,
      });
      
      setModalVisible(false);
      refetch();
      Alert.alert("Sucesso", "Campo criado com sucesso");
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao criar campo");
    }
  };
  
  const handleToggleAtivo = async (id: number, ativo: boolean) => {
    try {
      await updateMutation.mutateAsync({
        id,
        ativo: !ativo,
      });
      refetch();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao atualizar campo");
    }
  };
  
  const handleExcluir = (id: number, nome: string) => {
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir o campo "${nome}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync({ id });
              refetch();
              Alert.alert("Sucesso", "Campo excluído com sucesso");
            } catch (error: any) {
              Alert.alert("Erro", error.message || "Erro ao excluir campo");
            }
          },
        },
      ]
    );
  };
  
  if (!isAuthenticated) {
    return (
      <ScreenContainer className="justify-center items-center p-6">
        <Text className="text-lg text-foreground text-center mb-4">
          Faça login para gerenciar campos
        </Text>
      </ScreenContainer>
    );
  }
  
  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-3 bg-background border-b border-border flex-row justify-between items-center">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <IconSymbol
                name="chevron.right"
                size={24}
                color={colors.foreground}
                style={{ transform: [{ rotate: "180deg" }] }}
              />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-foreground">
              Campos Customizados
            </Text>
          </View>
        </View>
        
        {/* Lista de campos */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={campos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View className="bg-surface rounded-xl p-4 mx-4 mb-3 border border-border">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground mb-1">
                      {item.nomeCampo}
                    </Text>
                    <Text className="text-sm text-muted">
                      Tipo: {item.tipoCampo}
                    </Text>
                  </View>
                  
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => handleToggleAtivo(item.id, item.ativo)}
                      className={`px-3 py-1 rounded ${
                        item.ativo ? "bg-success/20" : "bg-muted/20"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          item.ativo ? "text-success" : "text-muted"
                        }`}
                      >
                        {item.ativo ? "Ativo" : "Inativo"}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => handleExcluir(item.id, item.nomeCampo)}
                    >
                      <IconSymbol name="trash" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            contentContainerStyle={{
              padding: 16,
              paddingBottom: 100,
            }}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center py-12">
                <Text className="text-lg text-muted text-center mb-2">
                  Nenhum campo customizado
                </Text>
                <Text className="text-sm text-muted text-center">
                  Toque no botão + para criar um novo campo
                </Text>
              </View>
            }
          />
        )}
        
        {/* FAB */}
        <TouchableOpacity
          onPress={handleNovoCampo}
          className="absolute bottom-6 right-6 bg-primary rounded-full w-14 h-14 justify-center items-center shadow-lg"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <IconSymbol name="plus" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        
        {/* Modal de criação */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center p-6">
            <View className="bg-background rounded-xl p-6 w-full max-w-md">
              <Text className="text-xl font-bold text-foreground mb-4">
                Novo Campo
              </Text>
              
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">
                  Nome do Campo
                </Text>
                <TextInput
                  className="bg-surface rounded-lg px-4 py-3 text-foreground border border-border"
                  placeholder="Ex: Nacionalidade"
                  placeholderTextColor={colors.muted}
                  value={nomeCampo}
                  onChangeText={setNomeCampo}
                />
              </View>
              
              <View className="mb-6">
                <Text className="text-sm font-medium text-foreground mb-2">
                  Tipo do Campo
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {(["text", "number", "select", "date"] as const).map((tipo) => (
                    <TouchableOpacity
                      key={tipo}
                      onPress={() => setTipoCampo(tipo)}
                      className={`px-4 py-2 rounded-lg border ${
                        tipoCampo === tipo
                          ? "bg-primary border-primary"
                          : "bg-surface border-border"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          tipoCampo === tipo ? "text-white" : "text-foreground"
                        }`}
                      >
                        {tipo}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  className="flex-1 bg-surface rounded-lg py-3 border border-border"
                >
                  <Text className="text-center font-semibold text-foreground">
                    Cancelar
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleSalvarCampo}
                  disabled={createMutation.isPending}
                  className="flex-1 bg-primary rounded-lg py-3"
                  style={{ opacity: createMutation.isPending ? 0.6 : 1 }}
                >
                  {createMutation.isPending ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-center font-semibold text-white">
                      Criar
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenContainer>
  );
}
