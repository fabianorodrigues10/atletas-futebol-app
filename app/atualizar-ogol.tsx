import React, { useState, useRef } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { WebView } from "react-native-webview";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";

interface AtletaSemData {
  id: number;
  nome: string;
  link: string | null;
}

export default function AtualizarOgolScreen() {
  const router = useRouter();
  const [atletas, setAtletas] = useState<AtletaSemData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Carregando atletas...");
  const [processedCount, setProcessedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const webViewRef = useRef<WebView>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Usar tRPC para buscar atletas sem data
  const { data: atletasSemData = [], isLoading: isFetchingAtletas } = trpc.atletas.getSemData.useQuery();
  const updateAtletaMutation = trpc.atletas.update.useMutation();

  React.useEffect(() => {
    if (!isFetchingAtletas && atletasSemData.length > 0) {
      setAtletas(atletasSemData);
      setLoading(false);
      setMessage(`${atletasSemData.length} atletas encontrados. Iniciando atualização...`);
    } else if (!isFetchingAtletas && atletasSemData.length === 0) {
      setLoading(false);
      setMessage("Todos os atletas já têm data de nascimento!");
    }
  }, [atletasSemData, isFetchingAtletas]);

  const extrairDadosDoOgol = () => {
    const script = `
      (function() {
        try {
          // Procurar pela data de nascimento
          const labels = document.querySelectorAll('[class*="card-data__label"]');
          let dataNascimento = null;
          let idade = null;

          for (let label of labels) {
            if (label.textContent.includes('Data de Nascimento')) {
              const valueElement = label.nextElementSibling;
              if (valueElement) {
                const text = valueElement.textContent;
                const match = text.match(/(\\d{4})-(\\d{2})-(\\d{2})\\s*\\((\\d+)\\s*anos?\\)/);
                if (match) {
                  const [, yyyy, mm, dd, age] = match;
                  dataNascimento = dd + '/' + mm + '/' + yyyy.slice(2);
                  idade = parseInt(age);
                  break;
                }
              }
            }
          }

          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'ogol-data',
            dataNascimento,
            idade
          }));
        } catch (error) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            message: error.message
          }));
        }
      })();
    `;

    webViewRef.current?.injectJavaScript(script);
  };

  const handleWebViewMessage = async (event: any) => {
    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === "ogol-data") {
        const atleta = atletas[currentIndex];

        if (data.dataNascimento || data.idade) {
          // Atualizar atleta no banco via tRPC
          try {
            // Chamar endpoint tRPC para atualizar (apenas idade por enquanto)
            await updateAtletaMutation.mutateAsync({
              id: atleta.id,
              idade: data.idade,
            });
            setMessage(
              `✅ ${atleta.nome} atualizado! Idade: ${data.idade}`
            );
            setProcessedCount(processedCount + 1);
          } catch (error) {
            setMessage(`❌ Erro ao atualizar ${atleta.nome}: ${error}`);
            setSkippedCount(skippedCount + 1);
          }
        } else {
          setMessage(`⚠️ Não conseguiu extrair dados de ${atleta.nome}`);
          setSkippedCount(skippedCount + 1);
        }

        // Próximo atleta com delay
        if (currentIndex < atletas.length - 1) {
          timeoutRef.current = setTimeout(() => {
            setCurrentIndex(currentIndex + 1);
          }, 1500);
        } else {
          setMessage(`✅ Atualização concluída! ${processedCount + 1} atualizados, ${skippedCount} pulados.`);
        }
      } else if (data.type === "error") {
        const atleta = atletas[currentIndex];
        setMessage(`⚠️ Pulando ${atleta.nome} (erro na extração)`);
        setSkippedCount(skippedCount + 1);
        // Pular para próximo atleta após erro
        if (currentIndex < atletas.length - 1) {
          timeoutRef.current = setTimeout(() => {
            setCurrentIndex(currentIndex + 1);
          }, 800);
        } else {
          setMessage(`✅ Atualização concluída! ${processedCount} atualizados, ${skippedCount + 1} pulados.`);
        }
      }
    } catch (error) {
      setMessage(`Erro ao processar: ${error}`);
      setSkippedCount(skippedCount + 1);
      // Tentar próximo atleta
      if (currentIndex < atletas.length - 1) {
        timeoutRef.current = setTimeout(() => {
          setCurrentIndex(currentIndex + 1);
        }, 1000);
      }
    }
  };

  // Limpar timeout ao desmontar
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text className="mt-4 text-foreground">{message}</Text>
      </ScreenContainer>
    );
  }

  if (atletas.length === 0) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-lg font-bold text-foreground">{message}</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-6 bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-background font-semibold">Voltar</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  const atleta = atletas[currentIndex];

  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1">
        <View className="p-4">
          <Text className="text-lg font-bold text-foreground mb-2">
            Atualizando dados do Ogol
          </Text>
          <Text className="text-sm text-muted mb-4">
            {currentIndex + 1} de {atletas.length} | ✅ {processedCount} | ⚠️ {skippedCount}
          </Text>

          <View className="bg-surface rounded-lg p-4 mb-4">
            <Text className="font-semibold text-foreground">{atleta.nome}</Text>
            <Text className="text-sm text-muted mt-1">{atleta.link}</Text>
          </View>

          <View className="h-96 bg-surface rounded-lg overflow-hidden mb-4">
            {atleta.link && (
              <WebView
                ref={webViewRef}
                source={{ uri: atleta.link }}
                onLoadEnd={extrairDadosDoOgol}
                onMessage={handleWebViewMessage}
                userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1"
              />
            )}
            {!atleta.link && (
              <View className="flex-1 items-center justify-center">
                <Text className="text-muted">Sem link do Ogol</Text>
              </View>
            )}
          </View>

          <View className="bg-blue-50 rounded-lg p-4 mb-4">
            <Text className="text-sm text-foreground">{message}</Text>
          </View>

          <Pressable
            onPress={() => router.back()}
            className="bg-primary px-6 py-3 rounded-lg items-center"
          >
            <Text className="text-background font-semibold">Cancelar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
