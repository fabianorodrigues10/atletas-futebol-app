/**
 * Módulo de geração de relatório PDF e Excel.
 * Envia os IDs dos atletas filtrados para o servidor e recebe o arquivo.
 */
import { Platform, Alert } from "react-native";
import { getApiBaseUrl } from "@/constants/oauth";

interface ReportFilters {
  posicao?: string | null;
  faixaIdade?: string | null;
  clube?: string | null;
  pe?: string | null;
  busca?: string | null;
}

async function fetchPdf(atletaIds: number[], filters: ReportFilters): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/report/pdf`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: atletaIds, filters }),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Erro ao gerar relatório: ${response.status}`);
  }

  return response;
}

async function downloadWeb(response: Response) {
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = "Relatorio_BDMD.pdf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

async function downloadNative(response: Response) {
  try {
    const FileSystem = await import("expo-file-system/legacy");
    const Sharing = await import("expo-sharing");

    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    // Usar cacheDirectory como fallback se documentDirectory não estiver disponível
    const fileDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    if (!fileDir) {
      throw new Error("Diretório de arquivos não disponível no dispositivo");
    }

    const fileUri = fileDir + "Relatorio_BDMD.pdf";
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "application/pdf",
        dialogTitle: "Relatório BDMD",
      });
    } else {
      Alert.alert(
        "Aviso",
        "Compartilhamento não disponível. O arquivo foi salvo no dispositivo.",
        [{ text: "OK" }]
      );
    }
  } catch (error: any) {
    console.error("[PDF Download Error]", error);
    throw new Error(`Erro ao salvar relatório: ${error.message}`);
  }
}

async function fetchExcel(atletaIds: number[], filters: ReportFilters): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/report/excel`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: atletaIds, filters }),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Erro ao gerar planilha: ${response.status}`);
  }

  return response;
}

async function downloadWebExcel(response: Response) {
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = "Atletas_BDMD.xlsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

async function downloadNativeExcel(response: Response) {
  try {
    const FileSystem = await import("expo-file-system/legacy");
    const Sharing = await import("expo-sharing");

    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    // Usar cacheDirectory como fallback se documentDirectory não estiver disponível
    const fileDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    if (!fileDir) {
      throw new Error("Diretório de arquivos não disponível no dispositivo");
    }

    const fileUri = fileDir + "Atletas_BDMD.xlsx";
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Atletas BDMD",
      });
    } else {
      Alert.alert(
        "Aviso",
        "Compartilhamento não disponível. O arquivo foi salvo no dispositivo.",
        [{ text: "OK" }]
      );
    }
  } catch (error: any) {
    console.error("[Excel Download Error]", error);
    throw new Error(`Erro ao salvar planilha: ${error.message}`);
  }
}

export async function generateReport(
  atletaIds: number[],
  filters: ReportFilters
): Promise<void> {
  try {
    const response = await fetchPdf(atletaIds, filters);

    if (Platform.OS === "web") {
      await downloadWeb(response);
    } else {
      await downloadNative(response);
    }
  } catch (error: any) {
    console.error("[Report Generation Error]", error);
    throw error;
  }
}

export async function generateExcel(
  atletaIds: number[],
  filters: ReportFilters
): Promise<void> {
  try {
    const response = await fetchExcel(atletaIds, filters);

    if (Platform.OS === "web") {
      await downloadWebExcel(response);
    } else {
      await downloadNativeExcel(response);
    }
  } catch (error: any) {
    console.error("[Excel Generation Error]", error);
    throw error;
  }
}
