/**
 * Módulo de geração de relatório PDF e Excel.
 * Envia os IDs dos atletas filtrados para o servidor e recebe o arquivo.
 */
import { Platform } from "react-native";
import { getApiBaseUrl } from "@/constants/oauth";

interface ReportFilters {
  posicao?: string | null;
  faixaIdade?: string | null;
  clube?: string | null;
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
  a.download = "Relatorio_Dados_do_Marinheiro.pdf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

async function downloadNative(response: Response) {
  const FileSystem = await import("expo-file-system/legacy");
  const Sharing = await import("expo-sharing");

  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  const fileUri = FileSystem.documentDirectory + "Relatorio_Dados_do_Marinheiro.pdf";
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: "application/pdf",
      dialogTitle: "Relatório Dados do Marinheiro",
    });
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
  a.download = "Atletas_Marcilio_Dias.xlsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

async function downloadNativeExcel(response: Response) {
  const FileSystem = await import("expo-file-system/legacy");
  const Sharing = await import("expo-sharing");

  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  const fileUri = FileSystem.documentDirectory + "Atletas_Marcilio_Dias.xlsx";
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      dialogTitle: "Atletas Marcílio Dias",
    });
  }
}

export async function generateReport(
  atletaIds: number[],
  filters: ReportFilters
): Promise<void> {
  const response = await fetchPdf(atletaIds, filters);

  if (Platform.OS === "web") {
    await downloadWeb(response);
  } else {
    await downloadNative(response);
  }
}

export async function generateExcel(
  atletaIds: number[],
  filters: ReportFilters
): Promise<void> {
  const response = await fetchExcel(atletaIds, filters);

  if (Platform.OS === "web") {
    await downloadWebExcel(response);
  } else {
    await downloadNativeExcel(response);
  }
}
