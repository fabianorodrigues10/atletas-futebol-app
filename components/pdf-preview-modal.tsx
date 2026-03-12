import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert, Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useState, useEffect } from "react";

interface PDFPreviewModalProps {
  visible: boolean;
  pdfBlob: Blob | null;
  onClose: () => void;
  onDownload: () => Promise<void>;
  fileName?: string;
}

export function PDFPreviewModal({
  visible,
  pdfBlob,
  onClose,
  onDownload,
  fileName = "Relatorio_BDMD.pdf",
}: PDFPreviewModalProps) {
  const colors = useColors();
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (visible && pdfBlob && Platform.OS === "web") {
      const url = URL.createObjectURL(pdfBlob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [visible, pdfBlob]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownload();
      Alert.alert("Sucesso", "Relatório baixado com sucesso!");
      onClose();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao baixar relatório");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!pdfBlob) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-4 border-b border-border bg-surface">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 rounded-full justify-center items-center mr-3"
            >
              <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground">Prévia do Relatório</Text>
              <Text className="text-xs text-muted mt-0.5">{fileName}</Text>
            </View>
          </View>
        </View>

        {/* PDF Preview Area */}
        <View className="flex-1 bg-background justify-center items-center p-4">
          {Platform.OS === "web" && previewUrl ? (
            <iframe
              src={previewUrl}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                borderRadius: 12,
              }}
              title="PDF Preview"
            />
          ) : (
            <View className="items-center gap-4">
              <IconSymbol name="doc.fill" size={64} color={colors.primary} />
              <Text className="text-lg font-semibold text-foreground text-center">
                Prévia do PDF
              </Text>
              <Text className="text-sm text-muted text-center max-w-xs">
                {Platform.OS === "web"
                  ? "Visualize o relatório acima antes de fazer download"
                  : "Relatório pronto para download"}
              </Text>
            </View>
          )}
        </View>

        {/* Footer with Actions */}
        <View className="flex-row gap-3 px-4 py-4 border-t border-border bg-surface">
          <TouchableOpacity
            onPress={onClose}
            disabled={isDownloading}
            className="flex-1 py-3 rounded-lg border border-border justify-center items-center"
          >
            <Text className="text-foreground font-semibold">Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDownload}
            disabled={isDownloading}
            className="flex-1 py-3 rounded-lg bg-primary justify-center items-center flex-row gap-2"
          >
            {isDownloading ? (
              <>
                <ActivityIndicator size="small" color="white" />
                <Text className="text-white font-semibold">Baixando...</Text>
              </>
            ) : (
              <>
                <IconSymbol name="arrow.down.circle" size={18} color="white" />
                <Text className="text-white font-semibold">Baixar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
