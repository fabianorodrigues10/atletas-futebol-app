import React, { useState } from "react";
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
  StyleSheet,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { getApiBaseUrl } from "@/constants/oauth";

export default function AtletaDetalhesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colors = useColors();
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: atleta, isLoading } = trpc.atletas.getById.useQuery(
    { id: Number(id) },
    { enabled: Boolean(id) }
  );

  const { data: fotos = [], isLoading: fotosLoading, error: fotosError } = trpc.midias.getByAtleta.useQuery(
    { atletaId: Number(id) },
    { enabled: Boolean(id) }
  );

  // Debug logs
  React.useEffect(() => {
    console.log('DEBUG: id =', id);
    console.log('DEBUG: fotos =', fotos);
    console.log('DEBUG: fotosLoading =', fotosLoading);
    console.log('DEBUG: fotosError =', fotosError);
  }, [id, fotos, fotosLoading, fotosError]);

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
            try {
              // Tenta REST API primeiro (funciona na web e no app)
              const response = await fetch(`${getApiBaseUrl()}/api/atletas/${id}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                Alert.alert("Sucesso", "Atleta deletado com sucesso!");
                router.back();
              } else {
                throw new Error('Falha na REST API');
              }
            } catch {
              // Fallback para tRPC
              try {
                await deleteAtleta.mutateAsync({ id: Number(id) });
              } catch {
                Alert.alert("Erro", "Falha ao deletar atleta");
                setIsDeleting(false);
              }
            }
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
      <ScreenContainer style={{ justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!atleta) {
    return (
      <ScreenContainer style={{ justifyContent: "center", alignItems: "center", padding: 24 }}>
        <IconSymbol name="person.crop.circle.badge.exclamationmark" size={64} color={colors.error} />
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, textAlign: "center", marginTop: 16, marginBottom: 8 }}>
          Atleta não encontrado
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginBottom: 24 }}>
          Este atleta pode ter sido deletado
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>Voltar</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={{ padding: 0 }}>

      {/* Header com botões Voltar / Editar / Excluir — FORA do ScrollView para funcionar na web */}
      <View style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 12,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        zIndex: 10,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            padding: 8,
            borderRadius: 20,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <IconSymbol
            name="chevron.right"
            size={20}
            color={colors.foreground}
            style={{ transform: [{ rotate: "180deg" }] }}
          />
        </TouchableOpacity>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={handleEditar}
            style={{
              padding: 8,
              borderRadius: 20,
              backgroundColor: colors.primary,
            }}
          >
            <IconSymbol name="pencil" size={18} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleExcluir}
            disabled={isDeleting}
            style={{
              padding: 8,
              borderRadius: 20,
              backgroundColor: colors.error,
              opacity: isDeleting ? 0.5 : 1,
            }}
          >
            <IconSymbol name="trash" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* Foto e Nome centralizados */}
        <View style={{
          alignItems: "center",
          paddingTop: 24,
          paddingBottom: 24,
          paddingHorizontal: 16,
          backgroundColor: colors.background,
        }}>
          {atleta.fotoUrl ? (
            <Image
              source={{ uri: atleta.fotoUrl }}
              style={{ width: 180, height: 180, borderRadius: 16, marginBottom: 16 }}
              resizeMode="cover"
            />
          ) : (
            <View style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: colors.primary + "30",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 12,
              borderWidth: 2,
              borderColor: colors.primary,
            }}>
              <IconSymbol name="person.fill" size={48} color={colors.primary} />
            </View>
          )}
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground, textAlign: "center" }}>
            {atleta.nome}
          </Text>
          {atleta.posicao && (
            <Text style={{ fontSize: 16, color: colors.primary, fontWeight: "600", marginTop: 4 }}>
              {atleta.posicao}
            </Text>
          )}
        </View>

        {/* Conteúdo Principal */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>

          {/* Card: Informações Básicas */}
          <SectionCard title="Informações Básicas" iconName="person.fill" iconColor={colors.primary} colors={colors}>
            <InfoRow icon="number" label="ID" value={String(atleta.id)} colors={colors} />
            <InfoRow icon="person.fill" label="Nome" value={atleta.nome} colors={colors} />
            {atleta.posicao && (
              <InfoRow icon="target" label="Posição Principal" value={atleta.posicao} colors={colors} />
            )}
            {atleta.segundaPosicao && (
              <InfoRow icon="target" label="Segunda Posição" value={atleta.segundaPosicao} colors={colors} />
            )}
            {atleta.clube && (
              <InfoRow icon="building.2.fill" label="Clube" value={atleta.clube} colors={colors} />
            )}
            <InfoRow icon="map.pin.circle.fill" label="Naturalidade" value={atleta.naturalidade || "Não informado"} colors={colors} isLast />
          </SectionCard>

          {/* Card: Dados Físicos */}
          {(atleta.dataNascimento || atleta.idade || atleta.altura || atleta.pe) && (
            <SectionCard title="Dados Físicos" iconName="heart.fill" iconColor={colors.success} colors={colors}>
              {atleta.dataNascimento != null && (
                <InfoRow
                  icon="calendar"
                  label="Data de Nascimento"
                  value={(() => {
                    const d = new Date(atleta.dataNascimento);
                    const dd = String(d.getDate()).padStart(2, '0');
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const yy = String(d.getFullYear()).slice(-2);
                    return `${dd}/${mm}/${yy}`;
                  })()}
                  colors={colors}
                />
              )}
              {(() => {
                const idadeExibida = (() => {
                  if (atleta.dataNascimento) {
                    const nascimento = new Date(atleta.dataNascimento);
                    if (!isNaN(nascimento.getTime())) {
                      const hoje = new Date();
                      let i = hoje.getFullYear() - nascimento.getFullYear();
                      const mes = hoje.getMonth() - nascimento.getMonth();
                      if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) i--;
                      if (i >= 0 && i <= 80) return i;
                    }
                  }
                  return atleta.idade != null && atleta.idade > 0 ? atleta.idade : null;
                })();
                return idadeExibida != null ? (
                  <InfoRow icon="number" label="Idade" value={`${idadeExibida} anos`} colors={colors} />
                ) : null;
              })()}

              {atleta.altura != null && (
                <InfoRow icon="ruler" label="Altura" value={`${Number(atleta.altura).toFixed(2)} m`} colors={colors} />
              )}
              {atleta.pe && (
                <InfoRow
                  icon="figure.walk"
                  label="Pé Preferencial"
                  value={atleta.pe.charAt(0).toUpperCase() + atleta.pe.slice(1)}
                  colors={colors}
                  isLast
                />
              )}
            </SectionCard>
          )}

          {/* Card: Avaliação/Escala */}
          {atleta.escala && (
            <SectionCard title="Avaliação" iconName="star.fill" iconColor={colors.warning} colors={colors}>
              <InfoRow icon="chart.bar.fill" label="Escala" value={atleta.escala} colors={colors} isLast />
            </SectionCard>
          )}

          {/* Card: Valências */}
          <SectionCard title="Valências" iconName="bolt.fill" iconColor={colors.primary} colors={colors}>
            {atleta.valencia ? (
              <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>
                {atleta.valencia}
              </Text>
            ) : (
              <View style={{
                backgroundColor: colors.background,
                borderRadius: 10,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
                <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center", fontStyle: "italic" }}>
                  Sem descrição de valências. Toque em editar para adicionar.
                </Text>
              </View>
            )}
          </SectionCard>

          {/* Card: Fotos */}
          <SectionCard title={`Fotos ${fotos && fotos.length > 0 ? `(${fotos.length})` : "(0)"}`} iconName="photo.fill" iconColor={colors.primary} colors={colors}
            headerRight={
              <TouchableOpacity
                onPress={handleAdicionarFoto}
                style={{
                  padding: 6,
                  borderRadius: 16,
                  backgroundColor: colors.primary,
                }}
              >
                <IconSymbol name="plus" size={16} color="white" />
              </TouchableOpacity>
            }
          >
            {fotos && fotos.length > 0 ? (
              <View style={{ gap: 8 }}>
                {fotos.map((foto: any, index: number) => (
                  <TouchableOpacity
                    key={foto.id || index}
                    onPress={() => foto.url && Linking.openURL(foto.url)}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 10,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    {foto.url && (
                      <Image
                        source={{ uri: foto.url }}
                        style={{ width: "100%", height: 200, backgroundColor: colors.background }}
                        resizeMode="cover"
                      />
                    )}
                    <View style={{ padding: 12 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                        {foto.nome || `Foto ${index + 1}`}
                      </Text>
                      {foto.descricao && (
                        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                          {foto.descricao}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleAdicionarFoto}
                style={{
                  backgroundColor: colors.primary + "18",
                  borderRadius: 10,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.primary + "50",
                  alignItems: "center",
                }}
              >
                <IconSymbol name="photo.fill" size={32} color={colors.primary} />
                <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "500", marginTop: 8 }}>
                  Adicionar Fotos
                </Text>
              </TouchableOpacity>
            )}
          </SectionCard>

          {/* Card: Vídeos */}
          <SectionCard
            title={`Vídeos ${atleta.videos && atleta.videos.length > 0 ? `(${atleta.videos.length})` : "(0)"}`}
            iconName="play.fill"
            iconColor={colors.primary}
            colors={colors}
          >
            {atleta.videos && atleta.videos.length > 0 ? (
              atleta.videos.map((video: any, index: number) => {
                const videoUrl = typeof video === 'string' ? video : video?.url;
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => videoUrl && Linking.openURL(videoUrl)}
                    style={{
                      backgroundColor: colors.primary + "18",
                      borderRadius: 10,
                      padding: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.primary + "50",
                      marginBottom: index < atleta.videos.length - 1 ? 8 : 0,
                    }}
                  >
                    <IconSymbol name="play.fill" size={16} color={colors.primary} />
                    <Text style={{ flex: 1, color: colors.primary, marginLeft: 8, fontWeight: "500" }} numberOfLines={1}>
                      Vídeo {index + 1}
                    </Text>
                    <IconSymbol name="chevron.right" size={16} color={colors.primary} />
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={{
                backgroundColor: colors.background,
                borderRadius: 10,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
                <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center", fontStyle: "italic" }}>
                  Sem vídeos. Toque em editar para adicionar.
                </Text>
              </View>
            )}
          </SectionCard>

          {/* Card: Link */}
          {atleta.link && (
            <SectionCard title="Link" iconName="link" iconColor={colors.primary} colors={colors}>
              <TouchableOpacity
                onPress={handleAbrirLink}
                style={{
                  backgroundColor: colors.primary + "18",
                  borderRadius: 10,
                  padding: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.primary + "50",
                }}
              >
                <IconSymbol name="link" size={18} color={colors.primary} />
                <Text style={{ flex: 1, color: colors.primary, marginLeft: 8, fontWeight: "500" }} numberOfLines={1}>
                  Abrir Link
                </Text>
                <IconSymbol name="chevron.right" size={16} color={colors.primary} />
              </TouchableOpacity>
            </SectionCard>
          )}

          {/* Card: Campos Customizados */}
          {atleta.camposCustomizados && (
            <SectionCard title="Campos Customizados" iconName="slider.horizontal.3" iconColor={colors.primary} colors={colors}>
              {typeof atleta.camposCustomizados === "string" &&
                (() => {
                  try {
                    const campos = JSON.parse(atleta.camposCustomizados);
                    const entries = Object.entries(campos);
                    return entries.map(([key, value]: any, i) => (
                      <InfoRow
                        key={key}
                        icon="slider.horizontal.3"
                        label={key}
                        value={String(value)}
                        colors={colors}
                        isLast={i === entries.length - 1}
                      />
                    ));
                  } catch {
                    return null;
                  }
                })()}
            </SectionCard>
          )}

        </View>
      </ScrollView>

    </ScreenContainer>
  );
}

// Componente de seção com card
function SectionCard({
  title,
  iconName,
  iconColor,
  colors,
  children,
  headerRight,
}: {
  title: string;
  iconName: string;
  iconColor: string;
  colors: any;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    }}>
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
      }}>
        <View style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: iconColor + "25",
          justifyContent: "center",
          alignItems: "center",
          marginRight: 10,
        }}>
          <IconSymbol name={iconName as any} size={18} color={iconColor} />
        </View>
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, flex: 1 }}>
          {title}
        </Text>
        {headerRight}
      </View>
      {children}
    </View>
  );
}

// Componente de linha de informação
function InfoRow({
  icon,
  label,
  value,
  colors,
  isLast = false,
}: {
  icon: string;
  label: string;
  value: string;
  colors: any;
  isLast?: boolean;
}) {
  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: isLast ? 0 : 0.5,
      borderBottomColor: colors.border,
    }}>
      <View style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
      }}>
        <IconSymbol name={icon as any} size={15} color={colors.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 14, color: colors.foreground, fontWeight: "600" }}>{value}</Text>
      </View>
    </View>
  );
}
