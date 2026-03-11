/**
 * Módulo de geração de relatório PDF com prévia.
 * Envia os IDs dos atletas filtrados para o servidor, recebe o arquivo
 * e permite visualizar antes de baixar.
 */
import { Platform } from "react-native";
import { getApiBaseUrl } from "@/constants/oauth";

interface ReportFilters {
  posicao?: string | null;
  faixaIdade?: string | null;
  clube?: string | null;
  pe?: string | null;
  busca?: string | null;
}

export async function fetchPdfBlob(
  atletaIds: number[],
  filters: ReportFilters
): Promise<Blob> {
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

  return await response.blob();
}

async function downloadWeb(blob: Blob, fileName: string) {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

async function downloadNative(blob: Blob, fileName: string) {
  const FileSystem = await import("expo-file-system/legacy");
  const Sharing = await import("expo-sharing");

  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  const fileUri = FileSystem.documentDirectory + fileName;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: "application/pdf",
      dialogTitle: "Relatório BDMD",
    });
  }
}

export async function downloadPdf(blob: Blob, fileName: string = "Relatorio_BDMD.pdf"): Promise<void> {
  if (Platform.OS === "web") {
    await downloadWeb(blob, fileName);
  } else {
    await downloadNative(blob, fileName);
  }
}

export async function generateReportWithPreview(
  atletaIds: number[],
  filters: ReportFilters
): Promise<Blob> {
  return await fetchPdfBlob(atletaIds, filters);
}
