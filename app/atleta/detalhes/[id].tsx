import { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Image,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function AtletaDetalhesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colors = useColors();
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: atleta, isLoading } = trpc.atletas.getById.useQuery(
    { id: Number(id) },
    { enabled: Boolean(id) }
  );

  const deleteAtleta = trpc.atletas.delete.useMutation({
    onSuccess: () => {
      Alert.alert("Sucesso", "Atleta deletado com sucesso!");
      router.back();
    },
    onError: () => {
      Alert.alert("Erro", "Falha ao deletar atleta");
      setIsDeleting(false);
    },
  });

  const handleEditar = () => {
    router.push(`/atleta/${id}` as any);
  };

  const handleExcluir = () => {
    Alert.alert(
      "Excluir Atleta",
      `Tem certeza que deseja excluir ${atleta?.nome}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            await deleteAtleta.mutateAsync({ id: Number(id) });
          },
        },
      ]
    );
  };

  const handleAbrirLink = () => {
    if (atleta?.link) {
      Linking.openURL(atleta.link);
    }
  };

  const handleAdicionarFoto = () => {
    router.push(`/atleta/${id}/galeria` as any);
  };

  if (isLoading) {
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
        <Text className="text-sm text-muted text-center mb-6">
          Este atleta pode ter sido deletado
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary rounded-lg px-6 py-3"
        >
          <Text className="text-white font-semibold">Voltar</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header com Foto e Nome */}
        <View className="bg-gradient-to-b from-primary/20 to-background pt-4 pb-6 px-4">
          <View className="flex-row justify-between items-start mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-background rounded-full p-2 border border-border"
            >
              <IconSymbol
                name="chevron.right"
                size={20}
                color={colors.foreground}
                style={{ transform: [{ rotate: "180deg" }] }}
              />
            </TouchableOpacity>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={handleEditar}
                className="bg-primary rounded-full p-2"
              >
                <IconSymbol name="pencil" size={18} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleExcluir}
                disabled={isDeleting}
                className="bg-error rounded-full p-2"
              >
                <IconSymbol name="trash" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Foto ou Avatar */}
          <View className="items-center mb-4">
            {atleta.fotoUrl ? (
              <Image
                source={{ uri: atleta.fotoUrl }}
                style={{ width: 200, height: 200, borderRadius: 20, marginBottom: 16 }}
                resizeMode="cover"
                defaultSource={require("@/assets/images/fabiano-scout-logo.png")}
                progressiveRenderingEnabled={true}
              />
            ) : (
              <View className="w-24 h-24 rounded-full bg-primary/30 justify-center items-center mb-3 border-2 border-primary">
                <IconSymbol name="person.fill" size={48} color={colors.primary} />
              </View>
            )}
            <Text className="text-2xl font-bold text-foreground text-center">
              {atleta.nome}
            </Text>
            {atleta.posicao && (
              <Text className="text-base text-primary font-semibold mt-1">
                {atleta.posicao}
              </Text>
            )}
          </View>
        </View>

        {/* Conteúdo Principal */}
        <View className="px-4 pb-8">
          {/* Card: ID e Informações Básicas */}
          <View className="bg-surface rounded-2xl p-4 mb-4 border border-border shadow-sm">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full bg-primary/20 justify-center items-center mr-3">
                <IconSymbol name="person.fill" size={20} color={colors.primary} />
              </View>
              <Text className="text-lg font-bold text-foreground">
                Informações Básicas
              </Text>
            </View>

            <InfoCard icon="number" label="ID" value={String(atleta.id)} />
            <InfoCard icon="person.fill" label="Nome" value={atleta.nome} />
            {atleta.posicao && (
              <InfoCard icon="target" label="Posição Principal" value={atleta.posicao} />
            )}
            {atleta.segundaPosicao && (
              <InfoCard icon="target" label="Segunda Posição" value={atleta.segundaPosicao} />
            )}
            {atleta.clube && (
              <InfoCard icon="building.2.fill" label="Clube" value={atleta.clube} />
            )}
            <InfoCard icon="map.pin.circle.fill" label="Naturalidade" value={atleta.naturalidade || "Não informado"} />
          </View>

          {/* Card: Dados Físicos */}
          {(atleta.dataNascimento || atleta.idade || atleta.altura || atleta.pe) && (
            <View className="bg-surface rounded-2xl p-4 mb-4 border border-border shadow-sm">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 rounded-full bg-success/20 justify-center items-center mr-3">
                  <IconSymbol name="heart.fill" size={20} color={colors.success} />
                </View>
                <Text className="text-lg font-bold text-foreground">
                  Dados Físicos
                </Text>
              </View>

              {atleta.dataNascimento != null && (
                <InfoCard
                  icon="calendar"
                  label="Data de Nascimento"
                  value={(() => {
                    const d = new Date(atleta.dataNascimento);
                    const dd = String(d.getDate()).padStart(2, '0');
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const yy = String(d.getFullYear()).slice(-2);
                    return `${dd}/${mm}/${yy}`;
                  })()}
                />
              )}
              {atleta.idade != null && atleta.idade > 0 && (
                <InfoCard
                  icon="number"
                  label="Idade"
                  value={`${atleta.idade} anos`}
                />
              )}
              {atleta.altura != null && (
                <InfoCard
                  icon="ruler"
                  label="Altura"
                  value={`${Number(atleta.altura).toFixed(2)} m`}
                />
              )}
              {atleta.pe && (
                <InfoCard
                  icon="figure.walk"
                  label="Pé Preferencial"
                  value={atleta.pe.charAt(0).toUpperCase() + atleta.pe.slice(1)}
                />
              )}
            </View>
          )}

          {/* Card: Escala */}
          {atleta.escala && (
            <View className="bg-surface rounded-2xl p-4 mb-4 border border-border shadow-sm">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 rounded-full bg-warning/20 justify-center items-center mr-3">
                  <IconSymbol name="star.fill" size={20} color={colors.warning} />
                </View>
                <Text className="text-lg font-bold text-foreground">
                  Avaliação
                </Text>
              </View>
              <InfoCard
                icon="chart.bar.fill"
                label="Escala"
                value={atleta.escala}
              />
            </View>
          )}

          {/* Card: Valências - sempre visível */}
          <View className="bg-surface rounded-2xl p-4 mb-4 border border-border shadow-sm">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full bg-primary/20 justify-center items-center mr-3">
                <IconSymbol name="bolt.fill" size={20} color={colors.primary} />
              </View>
              <Text className="text-lg font-bold text-foreground">
                Valências
              </Text>
            </View>
            {atleta.valencia ? (
              <Text className="text-sm text-foreground leading-relaxed">
                {atleta.valencia}
              </Text>
            ) : (
              <View className="bg-background rounded-xl p-4 border border-border/50">
                <Text className="text-sm text-muted text-center italic">
                  Sem descrição de valências. Toque em editar para adicionar.
                </Text>
              </View>
            )}
          </View>

          {/* Card: Galeria de Fotos */}
          <View className="bg-surface rounded-2xl p-4 mb-4 border border-border shadow-sm">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full bg-primary/20 justify-center items-center mr-3">
                <IconSymbol name="photo.fill" size={20} color={colors.primary} />
              </View>
              <Text className="text-lg font-bold text-foreground flex-1">
                Fotos
              </Text>
              <TouchableOpacity
                onPress={handleAdicionarFoto}
                className="bg-primary rounded-full p-2"
              >
                <IconSymbol name="plus" size={16} color="white" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={handleAdicionarFoto}
              className="bg-primary/10 rounded-xl p-4 border border-primary/30 items-center"
            >
              <IconSymbol name="photo.fill" size={32} color={colors.primary} />
              <Text className="text-sm text-primary font-medium mt-2">
                Adicionar Fotos
              </Text>
            </TouchableOpacity>
          </View>

          {/* Card: Vídeos do YouTube - SEMPRE VISÍVEL */}
          <View className="bg-surface rounded-2xl p-4 mb-4 border border-border shadow-sm">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full bg-primary/20 justify-center items-center mr-3">
                <IconSymbol name="play.fill" size={20} color={colors.primary} />
              </View>
              <Text className="text-lg font-bold text-foreground">
                Vídeos {atleta.videos && atleta.videos.length > 0 ? `(${atleta.videos.length})` : "(0)"}
              </Text>
            </View>
            {atleta.videos && atleta.videos.length > 0 ? (
              atleta.videos.map((video: any, index: number) => {
                // video pode ser string (URL) ou objeto com propriedade url
                const videoUrl = typeof video === 'string' ? video : video?.url;
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => videoUrl && Linking.openURL(videoUrl)}
                    className="bg-primary/10 rounded-xl p-3 flex-row items-center border border-primary/30 mb-2 last:mb-0"
                  >
                    <IconSymbol name="play.fill" size={16} color={colors.primary} />
                    <Text className="flex-1 text-primary ml-2 font-medium" numberOfLines={1}>
                      Vídeo {index + 1}
                    </Text>
                    <IconSymbol name="chevron.right" size={16} color={colors.primary} />
                  </TouchableOpacity>
                );
              })
            ) : (
              <View className="bg-background rounded-xl p-4 border border-border/50">
                <Text className="text-sm text-muted text-center italic">
                  Sem vídeos. Toque em editar para adicionar.
                </Text>
              </View>
            )}
          </View>

          {/* Card: Link */}
          {atleta.link && (
            <View className="bg-surface rounded-2xl p-4 mb-4 border border-border shadow-sm">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 rounded-full bg-primary/20 justify-center items-center mr-3">
                  <IconSymbol name="link" size={20} color={colors.primary} />
                </View>
                <Text className="text-lg font-bold text-foreground">
                  Link
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleAbrirLink}
                className="bg-primary/10 rounded-xl p-3 flex-row items-center border border-primary/30"
              >
                <IconSymbol name="link" size={18} color={colors.primary} />
                <Text className="flex-1 text-primary ml-2 font-medium" numberOfLines={1}>
                  Abrir Link
                </Text>
                <IconSymbol name="chevron.right" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Card: Campos Customizados */}
          {atleta.camposCustomizados && (
            <View className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 rounded-full bg-primary/20 justify-center items-center mr-3">
                  <IconSymbol name="slider.horizontal.3" size={20} color={colors.primary} />
                </View>
                <Text className="text-lg font-bold text-foreground">
                  Campos Customizados
                </Text>
              </View>

              {typeof atleta.camposCustomizados === "string" &&
                (() => {
                  try {
                    const campos = JSON.parse(atleta.camposCustomizados);
                    return Object.entries(campos).map(([key, value]: any) => (
                      <InfoCard
                        key={key}
                        icon="slider.horizontal.3"
                        label={key}
                        value={String(value)}
                      />
                    ));
                  } catch {
                    return null;
                  }
                })()}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  const colors = useColors();

  return (
    <View className="py-3 border-b border-border/50 last:border-b-0">
      <View className="flex-row items-start gap-3">
        <View className="w-5 pt-0.5">
          <IconSymbol name={icon as any} size={16} color={colors.muted} />
        </View>
        <View className="flex-1">
          <Text className="text-xs text-muted mb-1">{label}</Text>
          <Text className="text-sm text-foreground font-semibold">
            {value}
          </Text>
        </View>
      </View>
    </View>
  );
}
