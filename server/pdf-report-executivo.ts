/**
 * Relatório Radar PDF - Comissão Técnica BDMD
 * Layout: lista simples de atletas por posição — até 10 por página
 */
import PDFDocument from "pdfkit";
import { Request, Response } from "express";
import { getDb } from "./db";
import { atletas, midias, estatisticasTemporada } from "../drizzle/schema";
import { eq, inArray, and } from "drizzle-orm";

type RGB = [number, number, number];

// Identidade visual Marcílio Dias
const PRIMARY: RGB = [223, 16, 26];   // Vermelho
const DARK: RGB = [30, 32, 115];      // Azul escuro
const GRAY: RGB = [104, 112, 118];
const LIGHT_GRAY: RGB = [245, 245, 245];
const BORDER: RGB = [220, 220, 230];
const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [20, 20, 20];
const STRIPE: RGB = [237, 240, 255];  // Linha alternada

// Dimensões A4
const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 28;
const CONTENT_W = PAGE_W - MARGIN * 2;

// Cabeçalho e rodapé
const HEADER_H = 50;
const FOOTER_H = 28;

// Linha da tabela
const ROW_H = 22;
const TABLE_HDR_H = 18;

function formatDate(dateStr: string | Date | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  } catch { return "—"; }
}

function calcularIdade(dataNascimento: string | Date | null): string {
  if (!dataNascimento) return "—";
  try {
    const nasc = new Date(dataNascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return `${idade} anos`;
  } catch { return "—"; }
}

function drawPageHeader(doc: PDFKit.PDFDocument, posicaoNome?: string) {
  doc.rect(0, 0, PAGE_W, HEADER_H).fill(DARK);

  try {
    const shieldPath = require.resolve("../assets/images/marcilio-dias-shield.png");
    doc.image(shieldPath, 14, 5, { width: 40, height: 40 });
  } catch {
    doc.fontSize(16).fillColor(WHITE).font("Helvetica-Bold").text("BDMD", 14, 16);
  }

  doc.fontSize(13).fillColor(WHITE).font("Helvetica-Bold")
    .text("BANCO DE DADOS MARCÍLIO DIAS", 64, 10);
  doc.fontSize(8).fillColor([180, 190, 220] as RGB).font("Helvetica")
    .text("Radar de Scouting — Comissão Técnica", 64, 27);

  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
  doc.fontSize(7).fillColor([180, 190, 220] as RGB)
    .text(`Emitido em ${dateStr}`, PAGE_W - 110, 20);

  doc.rect(0, HEADER_H, PAGE_W, 2).fill(PRIMARY);

  // Título da posição abaixo do cabeçalho
  if (posicaoNome) {
    doc.fontSize(11).fillColor(DARK).font("Helvetica-Bold")
      .text(posicaoNome.toUpperCase(), MARGIN, HEADER_H + 8);
    doc.moveTo(MARGIN, HEADER_H + 22).lineTo(PAGE_W - MARGIN, HEADER_H + 22)
      .strokeColor(BORDER).lineWidth(1).stroke();
  }
}

function drawPageFooter(doc: PDFKit.PDFDocument, pageNum: number, totalPages: number) {
  const fy = PAGE_H - FOOTER_H;
  doc.rect(0, fy, PAGE_W, FOOTER_H).fill(DARK);
  doc.fontSize(6.5).fillColor([180, 190, 220] as RGB).font("Helvetica")
    .text("BDMD — Banco de Dados Marcílio Dias  •  Documento Confidencial  •  Uso Exclusivo da Comissão Técnica",
      0, fy + 8, { width: PAGE_W, align: "center" });
  doc.text(`Página ${pageNum} de ${totalPages}`, 0, fy + 18, { width: PAGE_W, align: "center" });
}

/**
 * Desenha a tabela de atletas de uma posição.
 * Retorna a posição Y final após a tabela.
 */
function drawAtletasTable(
  doc: PDFKit.PDFDocument,
  atletasList: any[],
  startY: number
): number {
  const cx = MARGIN;
  const cw = CONTENT_W;

  // Colunas: Nº | Nome | Nasc. | Idade | Naturalidade | Altura | Pé | Clube
  const cols = [
    { label: "Nº",           w: 22,  align: "center" as const },
    { label: "Nome",         w: 150, align: "left"   as const },
    { label: "Nascimento",   w: 60,  align: "center" as const },
    { label: "Idade",        w: 40,  align: "center" as const },
    { label: "Naturalidade", w: 90,  align: "left"   as const },
    { label: "Alt.",         w: 30,  align: "center" as const },
    { label: "Pé",           w: 30,  align: "center" as const },
    { label: "Clube",        w: 117, align: "left"   as const },
  ];

  // Ajustar última coluna para preencher a largura total
  const totalFixed = cols.slice(0, -1).reduce((s, c) => s + c.w, 0);
  cols[cols.length - 1].w = cw - totalFixed;

  let y = startY;

  // Cabeçalho da tabela
  doc.rect(cx, y, cw, TABLE_HDR_H).fill(DARK);
  let colX = cx;
  cols.forEach((col) => {
    doc.fontSize(6.5).fillColor(WHITE).font("Helvetica-Bold")
      .text(col.label, colX + 3, y + 5, { width: col.w - 6, align: col.align });
    colX += col.w;
  });
  y += TABLE_HDR_H;

  // Linhas de atletas
  atletasList.forEach((atleta, idx) => {
    const rowColor: RGB = idx % 2 === 0 ? WHITE : STRIPE;
    doc.rect(cx, y, cw, ROW_H).fill(rowColor).stroke(BORDER);

    const rowData = [
      String(idx + 1),
      atleta.nome || "—",
      formatDate(atleta.dataNascimento),
      calcularIdade(atleta.dataNascimento),
      atleta.naturalidade || "—",
      atleta.altura ? `${atleta.altura}m` : "—",
      atleta.pe || "—",
      atleta.clube || "—",
    ];

    colX = cx;
    rowData.forEach((val, ci) => {
      const col = cols[ci];
      doc.fontSize(7.5).fillColor(BLACK).font(ci === 1 ? "Helvetica-Bold" : "Helvetica")
        .text(val, colX + 3, y + 7, { width: col.w - 6, align: col.align, ellipsis: true });
      colX += col.w;
    });

    // Linha divisória vertical entre colunas
    colX = cx;
    cols.forEach((col, ci) => {
      if (ci > 0) {
        doc.moveTo(colX, y).lineTo(colX, y + ROW_H)
          .strokeColor(BORDER).lineWidth(0.3).stroke();
      }
      colX += col.w;
    });

    y += ROW_H;
  });

  // Borda externa da tabela
  doc.rect(cx, startY, cw, TABLE_HDR_H + atletasList.length * ROW_H)
    .strokeColor(DARK).lineWidth(0.8).stroke();

  return y;
}

export function registerPdfExecutivoRoutes(app: any) {
  app.post("/api/report/pdf-executivo", async (req: Request, res: Response) => {
    try {
      const { ids, temporada, posicaoNome } = req.body as {
        ids?: number[];
        temporada?: string;
        posicaoNome?: string;
      };
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database not available" });

      if (!ids || ids.length === 0) {
        return res.status(400).json({ error: "Nenhum atleta selecionado" });
      }

      // Buscar atletas mantendo a ordem dos IDs (ordem definida pelo usuário no Radar)
      const atletasRaw = await db.select().from(atletas).where(inArray(atletas.id, ids));
      const atletasMap = new Map<number, any>(atletasRaw.map((a: any) => [a.id, a]));
      const atletasOrdenados = ids.map((id) => atletasMap.get(id)).filter(Boolean);

      if (!atletasOrdenados.length) {
        return res.status(404).json({ error: "Atletas não encontrados" });
      }

      // Gerar PDF
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        bufferPages: true,
        autoFirstPage: false,
      });

      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));

      // Uma única página com todos os atletas (máx 10)
      doc.addPage();
      drawPageHeader(doc, posicaoNome);

      const tableStartY = HEADER_H + 30; // abaixo do título da posição
      drawAtletasTable(doc, atletasOrdenados, tableStartY);

      // Rodapé
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        drawPageFooter(doc, i + 1, range.count);
      }

      doc.end();
      await new Promise<void>((resolve) => doc.on("end", resolve));

      const pdfBuffer = Buffer.concat(chunks);
      const posSlug = (posicaoNome || "Radar").replace(/\s+/g, "_");
      const filename = `Radar_${posSlug}_${temporada || "2025"}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.end(pdfBuffer);
    } catch (err: any) {
      console.error("[PDF Executivo] Erro:", err);
      res.status(500).json({ error: err.message || "Erro interno" });
    }
  });
}
