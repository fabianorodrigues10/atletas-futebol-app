import React, { useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable, Image, Alert, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";

export default function TestarFotoScreen() {
  const router = useRouter();
  const [atletaId, setAtletaId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState<string>("");

  const { data: atleta } = trpc.atletas.getById.useQuery(
    { id: Number(atletaId) },
    { enabled: Boolean(atletaId) && atletaId !== "" }
  );

  const handleTestar = async () => {
    if (!atleta || !atleta.link) {
      Alert.alert("Erro", "Atleta não encontrado ou sem link do Ogol");
      return;
    }

    setLoading(true);
    setErro("");
    setResultado(null);

    try {
      const response = await fetch("http://localhost:3000/api/ogol/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: atleta.link }),
      });

      const data = await response.json();

      if (data.success) {
        setResultado(data.data);
      } else {
        setErro(data.error || "Erro ao extrair dados");
      }
    } catch (err: any) {
      setErro(err.message || "Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1 p-4">
        <Text className="text-2xl font-bold text-foreground mb-4">
          Teste de Extração de Foto
        </Text>

        {/* Input de ID */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">
            ID do Atleta
          </Text>
          <TextInput
            placeholder="Digite o ID (ex: 1, 2, 3...)"
            value={atletaId}
            onChangeText={setAtletaId}
            keyboardType="number-pad"
            className="border border-border rounded-lg px-3 py-2 text-foreground"
          />
        </View>

        {/* Info do Atleta */}
        {atleta && (
          <View className="bg-surface rounded-lg p-4 mb-4">
            <Text className="font-semibold text-foreground">{atleta.nome}</Text>
            <Text className="text-sm text-muted mt-1">{atleta.posicao}</Text>
            <Text className="text-xs text-muted mt-1">{atleta.link}</Text>
          </View>
        )}

        {/* Botão Testar */}
        <Pressable
          onPress={handleTestar}
          disabled={!atleta || loading}
          style={{ opacity: !atleta || loading ? 0.5 : 1 }}
          className="bg-primary px-6 py-3 rounded-lg items-center mb-4"
        >
          <Text className="text-background font-semibold">
            {loading ? "Extraindo..." : "Testar Extração"}
          </Text>
        </Pressable>

        {loading && (
          <View className="items-center py-8">
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text className="text-muted mt-4">Extraindo dados do Ogol...</Text>
          </View>
        )}

        {/* Resultado */}
        {resultado && (
          <View className="bg-green-50 rounded-lg p-4 mb-4">
            <Text className="font-bold text-green-900 mb-3">✅ Dados Extraídos:</Text>

            {resultado.nome && (
              <View className="mb-2">
                <Text className="text-xs text-muted">Nome:</Text>
                <Text className="text-foreground">{resultado.nome}</Text>
              </View>
            )}

            {resultado.posicao && (
              <View className="mb-2">
                <Text className="text-xs text-muted">Posição:</Text>
                <Text className="text-foreground">{resultado.posicao}</Text>
              </View>
            )}

            {resultado.idade && (
              <View className="mb-2">
                <Text className="text-xs text-muted">Idade:</Text>
                <Text className="text-foreground">{resultado.idade} anos</Text>
              </View>
            )}

            {resultado.dataNascimento && (
              <View className="mb-2">
                <Text className="text-xs text-muted">Data de Nascimento:</Text>
                <Text className="text-foreground">{resultado.dataNascimento}</Text>
              </View>
            )}

            {resultado.altura && (
              <View className="mb-2">
                <Text className="text-xs text-muted">Altura:</Text>
                <Text className="text-foreground">{resultado.altura}m</Text>
              </View>
            )}

            {resultado.pe && (
              <View className="mb-2">
                <Text className="text-xs text-muted">Pé Preferencial:</Text>
                <Text className="text-foreground">{resultado.pe}</Text>
              </View>
            )}

            {resultado.fotoUrl && (
              <View className="mt-4">
                <Text className="text-xs text-muted mb-2">Foto:</Text>
                <Image
                  source={{ uri: resultado.fotoUrl }}
                  style={{ width: "100%", height: 200, borderRadius: 8 }}
                  resizeMode="cover"
                />
                <Text className="text-xs text-muted mt-2 break-words">
                  {resultado.fotoUrl}
                </Text>
              </View>
            )}

            {!resultado.fotoUrl && (
              <View className="mt-4 bg-yellow-50 rounded p-2">
                <Text className="text-sm text-yellow-900">
                  ⚠️ Foto não encontrada na página
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Erro */}
        {erro && (
          <View className="bg-red-50 rounded-lg p-4 mb-4">
            <Text className="font-bold text-red-900 mb-2">❌ Erro:</Text>
            <Text className="text-red-800">{erro}</Text>
          </View>
        )}

        {/* Botão Voltar */}
        <Pressable
          onPress={() => router.back()}
          className="bg-border px-6 py-3 rounded-lg items-center mt-4"
        >
          <Text className="text-foreground font-semibold">Voltar</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
