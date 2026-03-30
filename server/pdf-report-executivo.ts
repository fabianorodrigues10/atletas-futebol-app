/**
 * Relatório Executivo PDF - Comissão Técnica BDMD
 * Layout compacto: 3 atletas por página A4
 */
import PDFDocument from "pdfkit";
import { Request, Response } from "express";
import { getDb } from "./db";
import { atletas, midias, estatisticasTemporada } from "../drizzle/schema";
import { eq, inArray, and } from "drizzle-orm";
import https from "https";
import http from "http";

type RGB = [number, number, number];

// Identidade visual Marcílio Dias
const PRIMARY: RGB = [223, 16, 26];   // Vermelho
const DARK: RGB = [30, 32, 115];      // Azul escuro
const GRAY: RGB = [104, 112, 118];
const LIGHT_GRAY: RGB = [245, 245, 245];
const BORDER: RGB = [220, 220, 230];
const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [20, 20, 20];

// Dimensões da página A4 (pontos)
const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;

// Cabeçalho ocupa 50px, rodapé 28px
const HEADER_H = 50;
const FOOTER_H = 28;
const USABLE_H = PAGE_H - HEADER_H - FOOTER_H; // ~764px

// Cada ficha ocupa exatamente 1/3 da área útil
const CARD_H = Math.floor(USABLE_H / 3); // ~254px
const CARD_PADDING = 5;
// Altura do cabeçalho da ficha
const CARD_HDR_H_CONST = 24;

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

function fetchImageBuffer(url: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
      resolve(null);
      return;
    }
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, { timeout: 5000 }, (res) => {
      if (res.statusCode !== 200) { resolve(null); return; }
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", () => resolve(null));
    });
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
  });
}

function drawPageHeader(doc: PDFKit.PDFDocument) {
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
    .text("Relatório Técnico — Comissão Técnica", 64, 27);

  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
  doc.fontSize(7).fillColor([180, 190, 220] as RGB)
    .text(`Emitido em ${dateStr}`, PAGE_W - 110, 20);

  doc.rect(0, HEADER_H, PAGE_W, 2).fill(PRIMARY);
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
 * Desenha a ficha compacta de um atleta dentro de uma "faixa" vertical da página.
 * cardY: posição Y de início da faixa
 */
async function drawAtletaCard(
  doc: PDFKit.PDFDocument,
  atleta: any,
  stats: any | null,
  cardY: number,
  fotoBuffer: Buffer | null
) {
  const cx = MARGIN;
  const cw = CONTENT_W;
  const p = CARD_PADDING;

  // Fundo da ficha
  doc.rect(cx, cardY + 2, cw, CARD_H - 4).fill(LIGHT_GRAY).stroke(BORDER);

  //  // ── FAIXA DE CABEÇALHO DA FICHA ────────────────────────────────────
  const CARD_HDR_H = CARD_HDR_H_CONST;
  doc.rect(cx, cardY + 2, cw, CARD_HDR_H).fill(DARK);

  // Sem coluna de foto — conteúdo ocupa toda a largura
  const INFO_X = cx + p;
  const INFO_W = cw - p * 2;
  const CONTENT_START_Y = cardY + CARD_HDR_H + 4;

  // Nome (na faixa escura)
  doc.fontSize(12).fillColor(WHITE).font("Helvetica-Bold")
    .text(atleta.nome || "—", INFO_X, cardY + 6, { width: INFO_W - 60 });

  // Badge de posição (canto direito da faixa escura)
  const posicao = atleta.posicao || "—";
  const posColors: Record<string, RGB> = {
    Goleiro: [245, 158, 11], Zagueiro: [59, 130, 246], Lateral: [34, 197, 94],
    Volante: [139, 92, 246], Meia: [236, 72, 153], Extremo: [239, 68, 68],
    Centroavante: [249, 115, 22], "2º Atacante": [249, 115, 22],
  };
  const posColor = posColors[posicao] || DARK;
  const posText = posicao;
  const BADGE_W = 80;
  doc.rect(cx + cw - BADGE_W - p, cardY + 4, BADGE_W, 16).fill(posColor);
  doc.fontSize(7).fillColor(WHITE).font("Helvetica-Bold")
    .text(posText.toUpperCase(), cx + cw - BADGE_W - p + 2, cardY + 8, { width: BADGE_W - 4, align: "center" });

  // ── DADOS PESSOAIS (linha compacta) ────────────────────────────────────
  let iy = CONTENT_START_Y;

  const dadosLinha = [
    atleta.dataNascimento ? `Nasc: ${formatDate(atleta.dataNascimento)}` : null,
    calcularIdade(atleta.dataNascimento) !== "—" ? calcularIdade(atleta.dataNascimento) : null,
    atleta.naturalidade ? `${atleta.naturalidade}` : null,
    atleta.altura ? `${atleta.altura}m` : null,
    atleta.pe ? `Pé: ${atleta.pe}` : null,
    atleta.clube ? `${atleta.clube}` : null,
  ].filter(Boolean).join("  •  ");

  doc.fontSize(7.5).fillColor(GRAY).font("Helvetica")
    .text(dadosLinha, INFO_X, iy, { width: INFO_W });
  iy += 14;

  // ── ESTATÍSTICAS ────────────────────────────────────────────────────────
  if (stats) {
    // Linha de stats: 14 campos em mini-boxes
    const allStats = [
      ["Jogos", stats.jogos ?? 0],
      ["Titular", stats.jogosTitular ?? 0],
      ["Min", stats.minutosJogados ?? 0],
      ["Gols", stats.gols ?? 0],
      ["Assist", stats.assistencias ?? 0],
      ["Final", stats.finalizacoes ?? 0],
      ["Desarme", stats.desarmes ?? 0],
      ["Intercep", stats.interceptacoes ?? 0],
      ["Duelos G", stats.duelosGanhos ?? 0],
      ["Passes", stats.passes ?? 0],
      ["Pass.C", stats.passesCompletos ?? 0],
      ["Amar", stats.cartoesAmarelos ?? 0],
      ["Verm", stats.cartoesVermelhos ?? 0],
    ];

    const BOX_W = Math.floor(INFO_W / allStats.length) - 1;
    const BOX_H = 40;

    allStats.forEach(([label, valor], i) => {
      const bx = INFO_X + i * (BOX_W + 1);
      doc.rect(bx, iy, BOX_W, BOX_H).fill(WHITE).stroke(BORDER);
      doc.rect(bx, iy, BOX_W, 10).fill(DARK);
      doc.fontSize(5.5).fillColor(WHITE).font("Helvetica-Bold")
        .text(String(label).toUpperCase(), bx + 1, iy + 3, { width: BOX_W - 2, align: "center" });
      doc.fontSize(11).fillColor(DARK).font("Helvetica-Bold")
        .text(String(valor), bx + 1, iy + 16, { width: BOX_W - 2, align: "center" });
    });
    iy += BOX_H + 8;

    // ── NOTAS AVALIATIVAS (barras compactas inline) ─────────────────────
    const notas = [
      ["Técnica", stats.notaTecnica],
      ["Física", stats.notaFisica],
      ["Tática", stats.notaTatica],
    ];

    const NOTA_W = Math.floor(INFO_W / notas.length) - 4;
    notas.forEach(([label, valor], i) => {
      const nx = INFO_X + i * (NOTA_W + 4);
      const nota = valor !== null && valor !== undefined ? parseFloat(String(valor)) : 0;
      const pct = Math.min(nota / 10, 1);

      doc.fontSize(7.5).fillColor(GRAY).font("Helvetica")
        .text(`${label}: ${nota > 0 ? nota.toFixed(1) : "—"}`, nx, iy, { width: NOTA_W });

      // Barra
      doc.rect(nx, iy + 11, NOTA_W, 7).fill([220, 220, 228] as RGB);
      let barColor: RGB = [239, 68, 68];
      if (nota >= 7) barColor = [34, 197, 94];
      else if (nota >= 5) barColor = [245, 158, 11];
      if (nota > 0) doc.rect(nx, iy + 11, NOTA_W * pct, 7).fill(barColor);
    });
    iy += 24;

    // ── OBSERVAÇÕES ─────────────────────────────────────────────────────
    if (stats.observacoes) {
      const obsMaxH = (cardY + CARD_H - 6) - iy;
      if (obsMaxH > 10) {
        doc.fontSize(6.5).fillColor(BLACK).font("Helvetica-Oblique")
          .text(`Obs: ${stats.observacoes}`, INFO_X, iy, { width: INFO_W, height: obsMaxH, ellipsis: true });
      }
    }
  } else {
    doc.fontSize(7).fillColor(GRAY).font("Helvetica-Oblique")
      .text("Estatísticas da temporada não preenchidas.", INFO_X, iy, { width: INFO_W });
  }

  // Linha divisória na base da ficha
  doc.moveTo(cx, cardY + CARD_H - 2).lineTo(cx + cw, cardY + CARD_H - 2)
    .strokeColor(BORDER).lineWidth(0.5).stroke();
}

export function registerPdfExecutivoRoutes(app: any) {
  app.post("/api/report/pdf-executivo", async (req: Request, res: Response) => {
    try {
      const { ids, temporada } = req.body as { ids?: number[]; temporada?: string };
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database not available" });

      const temporadaAlvo = temporada || "2025";

      let atletasData: any[] = [];
      if (ids && ids.length > 0) {
        atletasData = await db.select().from(atletas).where(inArray(atletas.id, ids));
      } else {
        return res.status(400).json({ error: "Nenhum atleta selecionado" });
      }

      if (!atletasData.length) return res.status(404).json({ error: "Atletas não encontrados" });

      // Buscar fotos
      const fotosData = await db.select().from(midias).where(
        and(inArray(midias.atletaId, ids!), eq(midias.tipo, "foto"))
      );
      const fotoMap = new Map<number, string>();
      fotosData.forEach((f: any) => {
        if (!fotoMap.has(f.atletaId)) {
          fotoMap.set(f.atletaId, f.s3Key
            ? `https://manus-storage.s3.amazonaws.com/${f.s3Key}`
            : f.url);
        }
      });

      // Buscar estatísticas de temporada
      const statsData = await db.select().from(estatisticasTemporada).where(
        and(inArray(estatisticasTemporada.atletaId, ids!),
            eq(estatisticasTemporada.temporada, temporadaAlvo))
      );
      const statsMap = new Map<number, any>();
      statsData.forEach((s: any) => statsMap.set(s.atletaId, s));

      // Pré-carregar fotos em paralelo
      const atletasCompletos = atletasData.map((a: any) => ({
        ...a,
        fotoUrl: fotoMap.get(a.id) || a.fotoUrl || null,
      }));

      const fotoBuffers = await Promise.all(
        atletasCompletos.map(async (a: any) => {
          if (!a.fotoUrl) return null;
          const fullUrl = a.fotoUrl.startsWith("http") ? a.fotoUrl : `https://manus-storage.s3.amazonaws.com/${a.fotoUrl}`;
          return fetchImageBuffer(fullUrl);
        })
      );

      // Gerar PDF
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        bufferPages: true,
        autoFirstPage: false,
      });

      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));

      // Distribuir atletas: 3 por página
      const ATLETAS_POR_PAGINA = 3;
      const totalPaginas = Math.ceil(atletasCompletos.length / ATLETAS_POR_PAGINA);

      for (let p = 0; p < totalPaginas; p++) {
        doc.addPage();
        drawPageHeader(doc);

        const startIdx = p * ATLETAS_POR_PAGINA;
        const pageAtletas = atletasCompletos.slice(startIdx, startIdx + ATLETAS_POR_PAGINA);

        for (let j = 0; j < pageAtletas.length; j++) {
          const atleta = pageAtletas[j];
          const stats = statsMap.get(atleta.id) || null;
          const fotoBuffer = fotoBuffers[startIdx + j];
          const cardY = HEADER_H + 2 + j * CARD_H;
          await drawAtletaCard(doc, atleta, stats, cardY, fotoBuffer);
        }
      }

      // Rodapés com numeração
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        drawPageFooter(doc, i + 1, range.count);
      }

      doc.end();
      await new Promise<void>((resolve) => doc.on("end", resolve));

      const pdfBuffer = Buffer.concat(chunks);
      const nomes = atletasCompletos.map((a: any) => a.nome?.split(" ")[0]).join("-");
      const filename = `Relatorio_Tecnico_${nomes}_${temporadaAlvo}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("[PDF Executivo] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
