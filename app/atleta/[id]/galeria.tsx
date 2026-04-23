import { useState, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function GaleriaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colors = useColors();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const utils = trpc.useUtils();

  const { data: atleta, isLoading: atletaLoading } = trpc.atletas.getById.useQuery(
    { id: Number(id) },
    { enabled: Boolean(id) }
  );

  const { data: midias, isLoading: midiasLoading } = trpc.midias.getByAtleta.useQuery(
    { atletaId: Number(id) },
    { enabled: Boolean(id) }
  );

  const uploadFoto = trpc.midias.uploadFoto.useMutation({
    onSuccess: () => {
      utils.midias.getByAtleta.invalidate({ atletaId: Number(id) });
      utils.atletas.getById.invalidate({ id: Number(id) });
      Alert.alert("Sucesso", "Foto adicionada com sucesso!");
    },
    onError: (err) => {
      Alert.alert("Erro", err.message || "Falha ao fazer upload da foto");
    },
  });

  const deleteMidia = trpc.midias.delete.useMutation({
    onSuccess: () => {
      utils.midias.getByAtleta.invalidate({ atletaId: Number(id) });
      utils.atletas.getById.invalidate({ id: Number(id) });
      Alert.alert("Sucesso", "Foto deletada com sucesso!");
    },
    onError: () => {
      Alert.alert("Erro", "Falha ao deletar foto");
    },
  });

  // Converte URI para base64 (funciona em web e celular)
  const uriToBase64 = async (uri: string): Promise<string> => {
    if (Platform.OS === "web") {
      // Na web, o URI já é um data URL ou blob URL
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      // No celular, usa FileSystem
      const FileSystem = await import("expo-file-system/legacy");
      const result = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return result;
    }
  };

  const handleUpload = async (uri: string, fileName: string, mimeType: string) => {
    try {
      setUploading(true);
      const base64Data = await uriToBase64(uri);
      await uploadFoto.mutateAsync({
        atletaId: Number(id),
        fileName,
        mimeType,
        base64Data,
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      Alert.alert("Erro", "Falha ao processar a imagem. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const handleAdicionarFoto = async () => {
    if (Platform.OS === "web") {
      // Na web, usa input file hidden
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } else {
      // No celular, usa ImagePicker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `foto_${Date.now()}.jpg`;
        const mimeType = asset.mimeType || "image/jpeg";
        await handleUpload(asset.uri, fileName, mimeType);
      }
    }
  };

  // Handler para input file na web
  const handleFileInputChange = async (event: any) => {
    const file = event.target?.files?.[0];
    if (!file) return;

    const uri = URL.createObjectURL(file);
    await handleUpload(uri, file.name, file.type || "image/jpeg");
    URL.revokeObjectURL(uri);
    // Reset input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeletarFoto = (midiaId: number) => {
    Alert.alert(
      "Deletar Foto",
      "Tem certeza que deseja deletar esta foto?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Deletar",
          style: "destructive",
          onPress: async () => {
            await deleteMidia.mutateAsync({ id: midiaId });
          },
        },
      ]
    );
  };

  if (atletaLoading || midiasLoading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!atleta) {
    return (
      <ScreenContainer className="justify-center items-center p-6">
        <IconSymbol name="person.crop.circle.badge.exclamationmark" size={64} color={colors.error} />
        <Text className="text-lg font-bold text-foreground text-center mt-4 mb-2">
          Atleta não encontrado
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary rounded-lg px-6 py-3 mt-4"
        >
          <Text className="text-white font-semibold">Voltar</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const fotos = midias?.filter((m) => m.tipo === "foto") || [];

  return (
    <ScreenContainer>
      {/* Input file oculto para web */}
      {Platform.OS === "web" && (
        <input
          ref={fileInputRef as any}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileInputChange}
        />
      )}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="pt-4 pb-6 px-4">
          <View className="flex-row justify-between items-start mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-surface rounded-full p-2 border border-border"
            >
              <IconSymbol
                name="chevron.right"
                size={20}
                color={colors.foreground}
                style={{ transform: [{ rotate: "180deg" }] }}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAdicionarFoto}
              disabled={uploading}
              className="bg-primary rounded-full p-2"
              style={uploading ? { opacity: 0.5 } : undefined}
            >
              {uploading ? (
                <ActivityIndicator size={18} color="white" />
              ) : (
                <IconSymbol name="plus" size={18} color="white" />
              )}
            </TouchableOpacity>
          </View>

          <Text className="text-2xl font-bold text-foreground text-center">
            Galeria de {atleta.nome}
          </Text>
          <Text className="text-sm text-muted text-center mt-2">
            {fotos.length} foto{fotos.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Upload em andamento */}
        {uploading && (
          <View className="mx-4 mb-4 bg-primary/10 rounded-xl p-4 border border-primary/30 flex-row items-center">
            <ActivityIndicator size="small" color={colors.primary} />
            <Text className="text-sm text-primary font-medium ml-3">
              Enviando foto...
            </Text>
          </View>
        )}

        {/* Conteúdo */}
        <View className="px-4 pb-8">
          {fotos.length === 0 && !uploading ? (
            <View className="bg-surface rounded-2xl p-8 border border-border items-center justify-center mt-8">
              <IconSymbol name="photo.fill" size={48} color={colors.muted} />
              <Text className="text-lg font-semibold text-foreground mt-4 text-center">
                Nenhuma foto adicionada
              </Text>
              <Text className="text-sm text-muted text-center mt-2 mb-6">
                Clique no botão + para adicionar fotos do atleta
              </Text>
              <TouchableOpacity
                onPress={handleAdicionarFoto}
                disabled={uploading}
                className="bg-primary rounded-lg px-6 py-3"
              >
                <Text className="text-white font-semibold">Adicionar Foto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-4 mt-4">
              {fotos.map((foto) => (
                <View
                  key={foto.id}
                  className="bg-surface rounded-2xl overflow-hidden border border-border shadow-sm"
                >
                  {/* Imagem */}
                  {foto.url && (
                    <Image
                      source={{ uri: foto.url }}
                      style={{ width: "100%", height: 250 }}
                      resizeMode="cover"
                    />
                  )}

                  {/* Informações */}
                  <View className="p-4">
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground">
                          {foto.nome}
                        </Text>
                        {foto.descricao && (
                          <Text className="text-sm text-muted mt-1">
                            {foto.descricao}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeletarFoto(foto.id)}
                        className="bg-error/10 rounded-full p-2"
                      >
                        <IconSymbol name="trash" size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>

                    {/* Data */}
                    <Text className="text-xs text-muted">
                      {new Date(foto.createdAt).toLocaleDateString("pt-BR")}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
