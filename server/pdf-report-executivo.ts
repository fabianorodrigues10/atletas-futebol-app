/**
 * Relatório Executivo PDF - Comissão Técnica BDMD
 * Ficha completa por atleta: perfil + estatísticas de temporada + notas avaliativas
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
const GOLD: RGB = [212, 175, 55];     // Dourado
const GRAY: RGB = [104, 112, 118];
const LIGHT_GRAY: RGB = [245, 245, 245];
const BORDER: RGB = [220, 220, 230];
const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [20, 20, 20];

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
  // Faixa de cabeçalho
  doc.rect(0, 0, 595, 70).fill(DARK);

  // Tentar escudo
  try {
    const shieldPath = require.resolve("../assets/images/marcilio-dias-shield.png");
    doc.image(shieldPath, 20, 8, { width: 54, height: 54 });
  } catch {
    doc.fontSize(22).fillColor(WHITE).font("Helvetica-Bold").text("BDMD", 20, 22);
  }

  // Título
  doc.fontSize(16).fillColor(WHITE).font("Helvetica-Bold").text("BANCO DE DADOS MARCÍLIO DIAS", 90, 18);
  doc.fontSize(9).fillColor([180, 190, 220] as RGB).font("Helvetica").text("Relatório Técnico — Comissão Técnica", 90, 38);

  // Data
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
  doc.fontSize(8).fillColor([180, 190, 220] as RGB).text(`Emitido em ${dateStr}`, 90, 52);

  // Linha dourada decorativa
  doc.rect(0, 70, 595, 3).fill(PRIMARY);
}

function drawPageFooter(doc: PDFKit.PDFDocument, pageNum: number, totalPages: number) {
  doc.rect(0, 810, 595, 32).fill(DARK);
  doc.fontSize(7).fillColor([180, 190, 220] as RGB).font("Helvetica")
    .text("BDMD — Banco de Dados Marcílio Dias  •  Documento Confidencial  •  Uso Exclusivo da Comissão Técnica",
      0, 818, { width: 595, align: "center" });
  doc.text(`Página ${pageNum} de ${totalPages}`, 0, 828, { width: 595, align: "center" });
}

function drawNotaBar(doc: PDFKit.PDFDocument, label: string, valor: number | null, x: number, y: number, barWidth: number = 140) {
  const nota = valor ?? 0;
  const pct = Math.min(nota / 10, 1);

  // Label
  doc.fontSize(7).fillColor(GRAY).font("Helvetica").text(label, x, y);

  // Fundo da barra
  doc.rect(x, y + 10, barWidth, 6).fill([230, 230, 235] as RGB);

  // Cor da barra por nota
  let barColor: RGB = [239, 68, 68]; // vermelho
  if (nota >= 7) barColor = [34, 197, 94]; // verde
  else if (nota >= 5) barColor = [245, 158, 11]; // amarelo

  doc.rect(x, y + 10, barWidth * pct, 6).fill(barColor);

  // Valor
  doc.fontSize(7).fillColor(BLACK).font("Helvetica-Bold")
    .text(nota > 0 ? nota.toFixed(1) : "—", x + barWidth + 4, y + 8);
}

function drawStatBox(doc: PDFKit.PDFDocument, label: string, valor: string | number, x: number, y: number, w: number = 70, h: number = 38) {
  // Caixa
  doc.rect(x, y, w, h).fill(LIGHT_GRAY).stroke();
  doc.rect(x, y, w, 14).fill(DARK);

  // Label
  doc.fontSize(6).fillColor(WHITE).font("Helvetica-Bold")
    .text(label.toUpperCase(), x + 2, y + 4, { width: w - 4, align: "center" });

  // Valor
  doc.fontSize(14).fillColor(DARK).font("Helvetica-Bold")
    .text(String(valor ?? "—"), x + 2, y + 17, { width: w - 4, align: "center" });
}

async function drawAtletaPage(doc: PDFKit.PDFDocument, atleta: any, stats: any | null, isFirst: boolean) {
  if (!isFirst) doc.addPage();

  drawPageHeader(doc);

  let y = 85;

  // ── SEÇÃO: FOTO + IDENTIFICAÇÃO ──────────────────────────────────────────
  // Foto do atleta
  const fotoUrl = atleta.fotoUrl || (atleta.midias?.find((m: any) => m.tipo === "foto")?.url);
  let fotoBuffer: Buffer | null = null;
  if (fotoUrl) {
    const fullUrl = fotoUrl.startsWith("http") ? fotoUrl : `https://manus-storage.s3.amazonaws.com/${fotoUrl}`;
    fotoBuffer = await fetchImageBuffer(fullUrl);
  }

  const FOTO_X = 30;
  const FOTO_Y = y;
  const FOTO_W = 90;
  const FOTO_H = 110;

  if (fotoBuffer) {
    try {
      doc.image(fotoBuffer, FOTO_X, FOTO_Y, { width: FOTO_W, height: FOTO_H, cover: [FOTO_W, FOTO_H] });
      doc.rect(FOTO_X, FOTO_Y, FOTO_W, FOTO_H).stroke(BORDER);
    } catch {
      doc.rect(FOTO_X, FOTO_Y, FOTO_W, FOTO_H).fill(LIGHT_GRAY);
      doc.fontSize(9).fillColor(GRAY).text("Sem foto", FOTO_X, FOTO_Y + 45, { width: FOTO_W, align: "center" });
    }
  } else {
    doc.rect(FOTO_X, FOTO_Y, FOTO_W, FOTO_H).fill(LIGHT_GRAY);
    doc.fontSize(9).fillColor(GRAY).text("Sem foto", FOTO_X, FOTO_Y + 45, { width: FOTO_W, align: "center" });
  }

  // Identificação ao lado da foto
  const ID_X = 135;
  doc.fontSize(20).fillColor(DARK).font("Helvetica-Bold").text(atleta.nome || "—", ID_X, y, { width: 430 });
  y += 26;

  // Posição com badge colorido
  const posicao = atleta.posicao || "—";
  const posColors: Record<string, RGB> = {
    Goleiro: [245, 158, 11], Zagueiro: [59, 130, 246], Lateral: [34, 197, 94],
    Volante: [139, 92, 246], Meia: [236, 72, 153], Extremo: [239, 68, 68],
    Centroavante: [249, 115, 22], "2º Atacante": [249, 115, 22],
  };
  const posColor = posColors[posicao] || DARK;
  const posText = atleta.segundaPosicao ? `${posicao} / ${atleta.segundaPosicao}` : posicao;
  doc.rect(ID_X, y, 160, 16).fill(posColor);
  doc.fontSize(9).fillColor(WHITE).font("Helvetica-Bold").text(posText.toUpperCase(), ID_X + 4, y + 4, { width: 152 });
  y += 22;

  // Clube e escala
  if (atleta.clube) {
    doc.fontSize(10).fillColor(GRAY).font("Helvetica").text(`🏟  ${atleta.clube}`, ID_X, y);
    y += 14;
  }
  if (atleta.escala) {
    doc.fontSize(9).fillColor(GRAY).font("Helvetica").text(`Escala: ${atleta.escala}`, ID_X, y);
    y += 14;
  }

  // Linha separadora
  y = Math.max(y, FOTO_Y + FOTO_H + 10);
  doc.moveTo(30, y).lineTo(565, y).strokeColor(BORDER).lineWidth(0.8).stroke();
  y += 12;

  // ── SEÇÃO: DADOS PESSOAIS E FÍSICOS ─────────────────────────────────────
  doc.rect(30, y, 535, 14).fill(DARK);
  doc.fontSize(8).fillColor(WHITE).font("Helvetica-Bold").text("DADOS PESSOAIS E FÍSICOS", 35, y + 3);
  y += 18;

  const dadosPessoais = [
    ["Data de Nascimento", formatDate(atleta.dataNascimento)],
    ["Idade", calcularIdade(atleta.dataNascimento)],
    ["Naturalidade", atleta.naturalidade || "—"],
    ["Altura", atleta.altura ? `${atleta.altura} m` : "—"],
    ["Pé Preferencial", atleta.pe || "—"],
  ];

  const COL_W = 106;
  dadosPessoais.forEach(([label, valor], i) => {
    const cx = 30 + i * COL_W;
    doc.rect(cx, y, COL_W - 2, 32).fill(LIGHT_GRAY);
    doc.fontSize(6.5).fillColor(GRAY).font("Helvetica").text(label, cx + 4, y + 4, { width: COL_W - 8 });
    doc.fontSize(9).fillColor(DARK).font("Helvetica-Bold").text(String(valor), cx + 4, y + 14, { width: COL_W - 8 });
  });
  y += 40;

  // ── SEÇÃO: VALÊNCIAS ─────────────────────────────────────────────────────
  if (atleta.valencia) {
    doc.rect(30, y, 535, 14).fill([240, 240, 248] as RGB);
    doc.fontSize(8).fillColor(DARK).font("Helvetica-Bold").text("VALÊNCIAS TÉCNICAS", 35, y + 3);
    y += 18;
    doc.fontSize(8.5).fillColor(BLACK).font("Helvetica").text(atleta.valencia, 30, y, { width: 535, lineGap: 2 });
    y += doc.heightOfString(atleta.valencia, { width: 535 }) + 10;
  }

  // ── SEÇÃO: ESTATÍSTICAS DA TEMPORADA ─────────────────────────────────────
  doc.rect(30, y, 535, 14).fill(PRIMARY);
  doc.fontSize(8).fillColor(WHITE).font("Helvetica-Bold")
    .text(`ESTATÍSTICAS DA TEMPORADA ${stats?.temporada || "2025"}`, 35, y + 3);
  y += 18;

  if (stats) {
    // Linha 1: stats de participação
    const statsRow1 = [
      ["Jogos", stats.jogos ?? 0],
      ["Titular", stats.jogosTitular ?? 0],
      ["Minutos", stats.minutosJogados ?? 0],
      ["Gols", stats.gols ?? 0],
      ["Assist.", stats.assistencias ?? 0],
      ["Finaliz.", stats.finalizacoes ?? 0],
      ["Desarmes", stats.desarmes ?? 0],
    ];
    const BOX_W = 74;
    statsRow1.forEach(([label, valor], i) => {
      drawStatBox(doc, String(label), String(valor), 30 + i * (BOX_W + 2), y, BOX_W, 40);
    });
    y += 48;

    // Linha 2: stats defensivos/disciplina
    const statsRow2 = [
      ["Intercep.", stats.interceptacoes ?? 0],
      ["Duelos", stats.duelos ?? 0],
      ["Duelos G.", stats.duelosGanhos ?? 0],
      ["Passes", stats.passes ?? 0],
      ["Passes C.", stats.passesCompletos ?? 0],
      ["Amarelos", stats.cartoesAmarelos ?? 0],
      ["Vermelhos", stats.cartoesVermelhos ?? 0],
    ];
    statsRow2.forEach(([label, valor], i) => {
      drawStatBox(doc, String(label), String(valor), 30 + i * (BOX_W + 2), y, BOX_W, 40);
    });
    y += 48;

    // ── NOTAS AVALIATIVAS ────────────────────────────────────────────────
    doc.rect(30, y, 535, 14).fill([240, 240, 248] as RGB);
    doc.fontSize(8).fillColor(DARK).font("Helvetica-Bold").text("NOTAS AVALIATIVAS (0–10)", 35, y + 3);
    y += 18;

    const notas = [
      ["Técnica", stats.notaTecnica],
      ["Física", stats.notaFisica],
      ["Tática", stats.notaTatica],
      ["Atitudinal", stats.notaAtitudinal],
      ["Potencial", stats.notaPotencial],
    ];

    const BAR_W = 90;
    const NOTA_COL_W = 110;
    notas.forEach(([label, valor], i) => {
      const cx = 30 + i * NOTA_COL_W;
      drawNotaBar(doc, String(label), valor !== null ? parseFloat(String(valor)) : null, cx, y, BAR_W);
    });
    y += 30;

    // Observações
    if (stats.observacoes) {
      doc.rect(30, y, 535, 14).fill([240, 240, 248] as RGB);
      doc.fontSize(8).fillColor(DARK).font("Helvetica-Bold").text("OBSERVAÇÕES DA COMISSÃO TÉCNICA", 35, y + 3);
      y += 18;
      doc.rect(30, y, 535, 0).fill(WHITE);
      doc.fontSize(8.5).fillColor(BLACK).font("Helvetica-Oblique")
        .text(`"${stats.observacoes}"`, 35, y, { width: 525, lineGap: 3 });
      y += doc.heightOfString(`"${stats.observacoes}"`, { width: 525 }) + 10;
    }
  } else {
    doc.fontSize(9).fillColor(GRAY).font("Helvetica-Oblique")
      .text("Estatísticas de temporada ainda não preenchidas para este atleta.", 30, y, { width: 535 });
    y += 20;
  }

  // ── LINKS ────────────────────────────────────────────────────────────────
  const hasLinks = atleta.link || (atleta.videos && atleta.videos.length > 0);
  if (hasLinks) {
    doc.rect(30, y, 535, 14).fill([240, 240, 248] as RGB);
    doc.fontSize(8).fillColor(DARK).font("Helvetica-Bold").text("LINKS E VÍDEOS", 35, y + 3);
    y += 18;

    if (atleta.link) {
      doc.fontSize(8).fillColor(GRAY).font("Helvetica").text("Perfil: ", 30, y, { continued: true });
      const linkDisplay = atleta.link.length > 80 ? atleta.link.substring(0, 80) + "..." : atleta.link;
      doc.fillColor([10, 126, 164] as RGB).text(linkDisplay, { link: atleta.link });
      y += 13;
    }
    if (atleta.videos && Array.isArray(atleta.videos)) {
      atleta.videos.forEach((v: string, idx: number) => {
        const vDisplay = v.length > 80 ? v.substring(0, 80) + "..." : v;
        doc.fontSize(8).fillColor(GRAY).font("Helvetica").text(`Vídeo ${idx + 1}: `, 30, y, { continued: true });
        doc.fillColor([10, 126, 164] as RGB).text(vDisplay, { link: v });
        y += 13;
      });
    }
  }
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

      // Buscar vídeos
      const videosData = await db.select().from(midias).where(
        and(inArray(midias.atletaId, ids!), eq(midias.tipo, "video"))
      );
      const videoMap = new Map<number, string[]>();
      videosData.forEach((v: any) => {
        if (!videoMap.has(v.atletaId)) videoMap.set(v.atletaId, []);
        videoMap.get(v.atletaId)!.push(v.url);
      });

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

      // Montar dados completos
      const atletasCompletos = atletasData.map((a: any) => ({
        ...a,
        fotoUrl: fotoMap.get(a.id) || null,
        videos: videoMap.get(a.id) || [],
      }));

      // Gerar PDF
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        bufferPages: true,
        autoFirstPage: false,
      });

      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));

      // Gerar uma página por atleta
      for (let i = 0; i < atletasCompletos.length; i++) {
        if (i === 0) doc.addPage();
        const atleta = atletasCompletos[i];
        const stats = statsMap.get(atleta.id) || null;
        await drawAtletaPage(doc, atleta, stats, i === 0);
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
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("[PDF Executivo] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
