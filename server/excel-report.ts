/**
 * Gerador de Relatório Excel - BDMD
 * Gera planilha profissional com dados de atletas usando ExcelJS.
 */
import ExcelJS from "exceljs";
import { Request, Response } from "express";
import { getDb } from "./db";
import { atletas } from "../drizzle/schema";
import { eq, inArray } from "drizzle-orm";

function formatDate(dateStr: string | Date | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  } catch {
    return "—";
  }
}

export function registerExcelRoutes(app: any) {
  app.post("/api/report/excel", async (req: Request, res: Response) => {
    try {
      const { ids, filters } = req.body as { ids?: number[]; filters?: any };

      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      let data: any[];
      if (ids && ids.length > 0) {
        data = await db.select().from(atletas).where(inArray(atletas.id, ids));
      } else {
        // Se nenhum ID foi fornecido, retornar vazio
        data = [];
      }

      // Criar workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Atletas");

      // Definir colunas
      worksheet.columns = [
        { header: "Nome", key: "nome", width: 25 },
        { header: "Posição Principal", key: "posicao", width: 18 },
        { header: "Segunda Posição", key: "segundaPosicao", width: 18 },
        { header: "Clube", key: "clube", width: 20 },
        { header: "Data Nascimento", key: "dataNascimento", width: 15 },
        { header: "Idade", key: "idade", width: 10 },
        { header: "Altura (m)", key: "altura", width: 12 },
        { header: "Pé", key: "pe", width: 10 },
        { header: "Escala", key: "escala", width: 10 },
        { header: "Valências", key: "valencia", width: 40 },
      ];

      // Estilizar header
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A1A2E" } } as any;
      headerRow.alignment = { horizontal: "center", vertical: "middle", wrapText: true } as any;

      // Adicionar dados
      data.forEach((atleta) => {
        worksheet.addRow({
          nome: atleta.nome || "—",
          posicao: atleta.posicao || "—",
          segundaPosicao: atleta.segundaPosicao || "—",
          clube: atleta.clube || "—",
          dataNascimento: formatDate(atleta.dataNascimento),
          idade: atleta.idade != null ? atleta.idade : "—",
          altura: atleta.altura || "—",
          pe: atleta.pe || "—",
          escala: atleta.escala || "—",
          valencia: atleta.valencia || "—",
        });
      });

      // Estilizar dados
      worksheet.eachRow((row: any, rowNumber: number) => {
        if (rowNumber > 1) {
          row.alignment = { horizontal: "left", vertical: "middle", wrapText: true } as any;
          row.font = { size: 11 };
          if (rowNumber % 2 === 0) {
            row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } } as any;
          }
        }
      });

      // Adicionar aba de resumo
      const summarySheet = workbook.addWorksheet("Resumo", { properties: { tabColor: { argb: "FFE8930C" } } });

      const posSet = new Set<string>();
      const clubeSet = new Set<string>();
      const idades: number[] = [];
      data.forEach((a) => {
        if (a.posicao) posSet.add(a.posicao);
        if (a.clube) clubeSet.add(a.clube);
        if (a.idade) idades.push(a.idade);
      });
      const mediaIdade = idades.length > 0 ? (idades.reduce((s, v) => s + v, 0) / idades.length).toFixed(1) : "—";

      summarySheet.columns = [
        { header: "Métrica", key: "metric", width: 20 },
        { header: "Valor", key: "value", width: 15 },
      ];

      const summaryHeader = summarySheet.getRow(1);
      summaryHeader.font = { bold: true, color: { argb: "FFFFFFFF" } };
      summaryHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDF101A" } } as any;

      const summaryData = [
        { metric: "Total de Atletas", value: data.length },
        { metric: "Posições Diferentes", value: posSet.size },
        { metric: "Idade Média", value: mediaIdade },
        { metric: "Clubes Diferentes", value: clubeSet.size },
      ];

      if (filters) {
        summaryData.push({ metric: "Posição Filtro", value: filters.posicao || "Todas" });
        summaryData.push({ metric: "Faixa Idade Filtro", value: filters.faixaIdade || "Todas" });
        summaryData.push({ metric: "Clube Filtro", value: filters.clube || "Todos" });
        if (filters.busca) summaryData.push({ metric: "Busca", value: filters.busca });
      }

      summaryData.forEach((row) => {
        summarySheet.addRow(row);
      });

      // Gerar buffer
      const buffer = await workbook.xlsx.writeBuffer() as any;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="Atletas_BDMD.xlsx"`);
      res.setHeader("Content-Length", (buffer as any).length);
      res.send(buffer);
    } catch (error: any) {
      console.error("[Excel Report] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
