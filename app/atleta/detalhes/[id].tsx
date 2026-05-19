import React, { useState, useEffect } from "react";
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
  Modal,
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: atleta, isLoading } = trpc.atletas.getById.useQuery(
    { id: Number(id) },
    { enabled: Boolean(id) }
  );

  const { data: fotos = [], isLoading: fotosLoading, error: fotosError } = trpc.midias.getByAtleta.useQuery(
    { atletaId: Number(id) },
    { enabled: Boolean(id) }
  );

  // Debug logs
  useEffect(() => {
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
    console.log('[EXCLUIR] Botão clicado');
    console.log('[EXCLUIR] showDeleteModal antes:', showDeleteModal);
    setShowDeleteModal(true);
    console.log('[EXCLUIR] showDeleteModal depois:', showDeleteModal);
  };

  const handleConfirmarDelecao = async () => {
    setShowDeleteModal(false);
    setIsDeleting(true);
    try {
      // Tenta REST API primeiro (funciona na web e no app)
      const url = `${getApiBaseUrl()}/api/atletas/${id}`;
      console.log('[DELETE] URL:', url);
      console.log('[DELETE] ID:', id);
      
      const response = await fetch(url, {
        method: 'DELETE',
      });
      
      console.log('[DELETE] Response status:', response.status);
      console.log('[DELETE] Response ok:', response.ok);
      
      const responseText = await response.text();
      console.log('[DELETE] Response text:', responseText);
      
      if (response.ok) {
        Alert.alert("Sucesso", "Atleta deletado com sucesso!");
        setTimeout(() => router.back(), 500);
      } else {
        throw new Error(`Falha na REST API: ${response.status} - ${responseText}`);
      }
    } catch (error: any) {
      console.error('[DELETE] Erro na REST API:', error);
      // Fallback para tRPC
      try {
        console.log('[DELETE] Tentando tRPC...');
        await deleteAtleta.mutateAsync({ id: Number(id) });
      } catch (trpcError: any) {
        console.error('[DELETE] Erro no tRPC:', trpcError);
        Alert.alert("Erro", `Falha ao deletar atleta: ${trpcError.message}`);
        setIsDeleting(false);
      }
    }
  };

  const handleCancelarDelecao = () => {
    setShowDeleteModal(false);
  };

  const handleAbrirLink = () => {
    if (atleta?.link) {
      Linking.openURL(atleta.link);
    }
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

      {/* Modal de confirmação de exclusão */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelarDelecao}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        }}>
          <View style={{
            backgroundColor: colors.background,
            borderRadius: 12,
            padding: 24,
            width: '100%',
            maxWidth: 400,
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: colors.foreground,
              marginBottom: 12,
            }}>
              Excluir Atleta
            </Text>
            <Text style={{
              fontSize: 14,
              color: colors.muted,
              marginBottom: 24,
              lineHeight: 20,
            }}>
              Tem certeza que deseja excluir {atleta?.nome}? Esta ação não pode ser desfeita.
            </Text>
            <View style={{
              flexDirection: 'row',
              gap: 12,
              justifyContent: 'flex-end',
            }}>
              <TouchableOpacity
                onPress={handleCancelarDelecao}
                disabled={isDeleting}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{
                  color: colors.foreground,
                  fontWeight: '600',
                  fontSize: 14,
                }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmarDelecao}
                disabled={isDeleting}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: colors.error,
                  opacity: isDeleting ? 0.6 : 1,
                }}
              >
                <Text style={{
                  color: 'white',
                  fontWeight: '600',
                  fontSize: 14,
                }}>
                  {isDeleting ? 'Deletando...' : 'Excluir'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
            {atleta.naturalidade && (
              <InfoRow icon="map.fill" label="Naturalidade" value={atleta.naturalidade} colors={colors} />
            )}
            {atleta.dataNascimento && (
              <InfoRow icon="calendar" label="Data de Nascimento" value={new Date(atleta.dataNascimento).toLocaleDateString('pt-BR')} colors={colors} />
            )}
          </SectionCard>

          {/* Card: Características Físicas */}
          {atleta.altura && (
            <SectionCard title="Características Físicas" iconName="figure.walk" iconColor={colors.primary} colors={colors}>
              {atleta.altura && (
                <InfoRow icon="ruler" label="Altura" value={`${atleta.altura} cm`} colors={colors} />
              )}
            </SectionCard>
          )}

          {/* Card: Informações Adicionais */}
          {atleta.link && (
            <SectionCard title="Informações Adicionais" iconName="info.circle.fill" iconColor={colors.primary} colors={colors}>
              {atleta.link && (
                <TouchableOpacity
                  onPress={handleAbrirLink}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <IconSymbol name="link" size={18} color={colors.primary} />
                    <View>
                      <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 2 }}>Link</Text>
                      <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '500' }}>
                        {atleta.link.substring(0, 30)}...
                      </Text>
                    </View>
                  </View>
                  <IconSymbol name="arrow.up.right" size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
            </SectionCard>
          )}

          {/* Card: Galeria de Fotos */}
          {fotos.length > 0 && (
            <SectionCard title={`Galeria (${fotos.length})`} iconName="photo.fill" iconColor={colors.primary} colors={colors}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                {fotos.map((foto: any, index: number) => (
                  <View key={index} style={{ marginRight: 12 }}>
                    <Image
                      source={{ uri: foto.url }}
                      style={{ width: 120, height: 120, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </ScrollView>
            </SectionCard>
          )}

        </View>

      </ScrollView>

    </ScreenContainer>
  );
}

// ==================== COMPONENTES ====================

interface SectionCardProps {
  title: string;
  iconName: any;
  iconColor: string;
  colors: any;
  children: React.ReactNode;
}

function SectionCard({ title, iconName, iconColor, colors, children }: SectionCardProps) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <IconSymbol name={iconName} size={20} color={iconColor} />
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  colors: any;
}

function InfoRow({ icon, label, value, colors }: InfoRowProps) {
  return (
    <View
      style={{
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
        <IconSymbol name={icon} size={18} color={colors.primary} />
        <View>
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 2 }}>
            {label}
          </Text>
          <Text style={{ fontSize: 14, color: colors.foreground, fontWeight: '500' }}>
            {value}
          </Text>
        </View>
      </View>
    </View>
  );
}
