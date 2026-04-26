/**
 * Gerador de Relatório PDF - BDMD
 * Gera PDF profissional com dados de atletas usando PDFKit.
 */
import PDFDocument from "pdfkit";
import { Request, Response } from "express";
import { getDb } from "./db";
import { atletas, midias } from "../drizzle/schema";
import { eq, inArray, and } from "drizzle-orm";

// Cores - Marcílio Dias
type RGB = [number, number, number];
const PRIMARY: RGB = [223, 16, 26]; // #DF101A (Vermelho Marcílio)
const DARK: RGB = [30, 32, 115]; // #1E2073 (Azul Marcílio)
const GRAY: RGB = [104, 112, 118]; // #687076
const LIGHT_GRAY: RGB = [245, 245, 245]; // #F5F5F5
const BORDER: RGB = [229, 231, 235]; // #E5E7EB
const WHITE: RGB = [255, 255, 255];

// Cores por posição
const POS_COLORS: Record<string, RGB> = {
  Goleiro: [245, 158, 11],
  Zagueiro: [59, 130, 246],
  Lateral: [34, 197, 94],
  Volante: [139, 92, 246],
  Meia: [236, 72, 153],
  Extremo: [239, 68, 68],
  Centroavante: [249, 115, 22],
  "2º Atacante": [249, 115, 22],
};

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

function drawHeader(doc: PDFKit.PDFDocument, count: number, filters: any) {
  // Logo/Escudo - usar imagem em vez de texto
  try {
    const shieldPath = require.resolve("../assets/images/marcilio-dias-shield.png");
    doc.image(shieldPath, 40, 20, { width: 60, height: 60 });
    doc.fontSize(12).fillColor(GRAY).font("Helvetica").text("Banco de Dados Marcílio Dias", 110, 45);
  } catch (e) {
    // Fallback se imagem não existir
    doc.fontSize(28).fillColor(PRIMARY).font("Helvetica-Bold").text("BDMD", 40, 30);
    doc.fontSize(12).fillColor(GRAY).font("Helvetica").text("Banco de Dados Marcílio Dias", 40, 62);
  }

  // Linha separadora
  doc.moveTo(40, 82).lineTo(555, 82).strokeColor(PRIMARY).lineWidth(3).stroke();

  // Info
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()} às ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  doc.fontSize(9).fillColor(GRAY).font("Helvetica").text(`Gerado em ${dateStr}  •  ${count} atleta${count !== 1 ? "s" : ""} selecionado${count !== 1 ? "s" : ""}`, 40, 92);

  return 110;
}



function drawTable(doc: PDFKit.PDFDocument, data: any[], startY: number): number {
  let y = startY;
  doc.fontSize(14).fillColor(DARK).font("Helvetica-Bold").text("Lista de Atletas", 40, y);
  y += 22;

  const cols = [
    { header: "Nome", width: 100, align: "left" as const },
    { header: "Posição", width: 65, align: "left" as const },
    { header: "Clube", width: 105, align: "left" as const },
    { header: "Idade", width: 40, align: "center" as const },
    { header: "Altura", width: 45, align: "center" as const },
    { header: "Pé", width: 55, align: "center" as const },
    { header: "Nasc.", width: 50, align: "center" as const },
    { header: "Escala", width: 45, align: "center" as const },
  ];

  const tableX = 40;
  const rowH = 22;

  // Header
  doc.rect(tableX, y, 515, rowH).fillColor(DARK).fill();
  let cx = tableX + 4;
  cols.forEach((col) => {
    doc.fontSize(8).fillColor(WHITE).font("Helvetica-Bold").text(col.header, cx, y + 6, { width: col.width - 8, align: col.align });
    cx += col.width;
  });
  y += rowH;

  // Rows
  data.forEach((a, idx) => {
    if (y > 740) {
      doc.addPage();
      y = 40;
      // Redraw header
      doc.rect(tableX, y, 515, rowH).fillColor(DARK).fill();
      let hx = tableX + 4;
      cols.forEach((col) => {
        doc.fontSize(8).fillColor(WHITE).font("Helvetica-Bold").text(col.header, hx, y + 6, { width: col.width - 8, align: col.align });
        hx += col.width;
      });
      y += rowH;
    }

    if (idx % 2 === 1) {
      doc.rect(tableX, y, 515, rowH).fillColor(LIGHT_GRAY).fill();
    }

    cx = tableX + 4;
    const rowData = [
      a.nome || "—",
      a.posicao || "—",
      a.clube || "—",
      a.idade != null ? String(a.idade) : "—",
      a.altura || "—",
      a.pe || "—",
      formatDate(a.dataNascimento),
      a.escala || "—",
    ];

    rowData.forEach((val, ci) => {
      const col = cols[ci];
      const isPos = ci === 1;
      doc.fontSize(8).fillColor(isPos ? PRIMARY : DARK).font(isPos ? "Helvetica-Bold" : "Helvetica").text(val, cx, y + 6, { width: col.width - 8, align: col.align, lineBreak: false });
      cx += col.width;
    });

    // Bottom border
    doc.moveTo(tableX, y + rowH).lineTo(tableX + 515, y + rowH).strokeColor(BORDER).lineWidth(0.5).stroke();
    y += rowH;
  });

  // Final border
  doc.moveTo(tableX, y).lineTo(tableX + 515, y).strokeColor(DARK).lineWidth(1).stroke();

  return y + 10;
}

function drawCards(doc: PDFKit.PDFDocument, data: any[], startY: number) {
  let y = startY;

  if (y > 680) {
    doc.addPage();
    y = 40;
  }

  doc.fontSize(14).fillColor(DARK).font("Helvetica-Bold").text("Fichas Individuais", 40, y);
  y += 25;

  data.forEach((a) => {
    const posColor = POS_COLORS[a.posicao || ""] || PRIMARY;
    const cardH = 80;

    if (y + cardH > 750) {
      doc.addPage();
      y = 40;
    }

    // Left border
    doc.rect(40, y, 3, cardH).fillColor(posColor).fill();

    // Name
    doc.fontSize(13).fillColor(DARK).font("Helvetica-Bold").text(a.nome || "—", 50, y + 5);

    // Position
    const posText = a.segundaPosicao ? `${a.posicao || "—"} / ${a.segundaPosicao}` : (a.posicao || "—");
    doc.fontSize(10).fillColor(PRIMARY).font("Helvetica").text(posText, 50, y + 21);

    // Info line
    const infoParts: string[] = [];
    if (a.clube) infoParts.push(`Clube: ${a.clube}`);
    if (a.idade) infoParts.push(`Idade: ${a.idade} anos`);
    if (a.dataNascimento) infoParts.push(`Nasc: ${formatDate(a.dataNascimento)}`);
    if (a.altura) infoParts.push(`Altura: ${a.altura} m`);
    if (a.pe) infoParts.push(`Pé: ${a.pe}`);
    if (a.escala) infoParts.push(`Escala: ${a.escala}`);
    doc.fontSize(8).fillColor(GRAY).font("Helvetica").text(infoParts.join("  •  "), 50, y + 36, { width: 500 });

    // Links (Ogol e YouTube)
    let linkY = y + 49;
    if (a.link) {
      const linkDisplay = a.link.length > 70 ? a.link.substring(0, 70) + "..." : a.link;
      doc.fontSize(8).fillColor([10, 126, 164] as RGB).text(linkDisplay, 50, linkY, { link: a.link, width: 500 });
      linkY += 13;
    }
    
    // Videos do YouTube
    if (a.videos && Array.isArray(a.videos) && a.videos.length > 0) {
      a.videos.forEach((video: string, idx: number) => {
        const videoDisplay = video.length > 70 ? video.substring(0, 70) + "..." : video;
        doc.fontSize(8).fillColor([10, 126, 164] as RGB).text(videoDisplay, 50, linkY, { link: video, width: 500 });
        linkY += 13;
      });
    }

    // Separator
    const sepY = y + cardH - 2;
    doc.moveTo(40, sepY).lineTo(555, sepY).strokeColor(BORDER).lineWidth(0.5).stroke();

    y += cardH + 5;
  });

  return y;
}

function drawFooter(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).fillColor(GRAY).font("Helvetica").text(
      "BDMD - Banco de Dados Marcílio Dias  •  Relatório gerado automaticamente  •  Confidencial",
      40, 770,
      { width: 515, align: "center" }
    );
    doc.text(`Página ${i + 1} de ${range.count}`, 40, 782, { width: 515, align: "center" });
  }
}

export function registerPdfRoutes(app: any) {
  app.post("/api/report/pdf", async (req: Request, res: Response) => {
    try {
      const { ids, filters } = req.body as { ids?: number[]; filters?: any };

      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      let data: any[];
      if (ids && ids.length > 0) {
        // Buscar atletas
        const atletasData = await db.select().from(atletas).where(inArray(atletas.id, ids));
        
        // Buscar vídeos para cada atleta
        const videosData = await db.select().from(midias).where(
          and(
            inArray(midias.atletaId, ids),
            eq(midias.tipo, 'video')
          )
        );
        
        // Criar mapa de vídeos por atletaId
        const videoMap = new Map<number, string[]>();
        videosData.forEach((video: any) => {
          if (video.atletaId && video.tipo === 'video' && video.url) {
            if (!videoMap.has(video.atletaId)) {
              videoMap.set(video.atletaId, []);
            }
            videoMap.get(video.atletaId)!.push(video.url);
          }
        });
        
        // Adicionar vídeos aos atletas
        data = atletasData.map((a: any) => ({
          ...a,
          videos: videoMap.get(a.id) || []
        }));
      } else {
        // Se nenhum ID foi fornecido, retornar vazio
        data = [];
      }

      // Criar PDF
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 20, bottom: 30, left: 40, right: 40 },
        bufferPages: true,
      });

      // Coletar chunks
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="Relatorio_BDMD.pdf"`);
        res.setHeader("Content-Length", pdfBuffer.length);
        res.send(pdfBuffer);
      });

      // Gerar conteúdo
      let y = drawHeader(doc, data.length, filters || {});
      y = drawTable(doc, data, y + 10);
      drawCards(doc, data, y + 10);
      drawFooter(doc);

      doc.end();
    } catch (error: any) {
      console.error("[PDF Report] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
