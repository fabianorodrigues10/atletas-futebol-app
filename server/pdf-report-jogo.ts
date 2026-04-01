import type { Express } from "express";

export function registerPdfJogoRoutes(app: Express) {
  app.post("/api/jogos/:id/relatorio", async (req, res) => {
    try {
      const jogoId = Number(req.params.id);
      const userId = 1;

      const { getDb } = await import("../server/db");
      const { jogos, scoutJogo } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const dbConn = await getDb();
      if (!dbConn) return res.status(500).json({ error: "DB unavailable" });

      // Buscar dados do jogo
      const [jogo] = await dbConn.select().from(jogos)
        .where(and(eq(jogos.id, jogoId), eq(jogos.userId, userId)))
        .limit(1);
      if (!jogo) return res.status(404).json({ error: "Jogo não encontrado" });

      // Buscar scouts do jogo
      const scouts = await dbConn.select().from(scoutJogo)
        .where(and(eq(scoutJogo.jogoId, jogoId), eq(scoutJogo.userId, userId)));

      // Buscar nomes dos atletas
      const atletaIds = scouts.map(s => s.atletaId);
      let atletasMap: Record<number, { nome: string; posicao: string }> = {};
      if (atletaIds.length > 0) {
        const { inArray } = await import("drizzle-orm");
        const { atletas } = await import("../drizzle/schema");
        const atletasData = await dbConn.select({ id: atletas.id, nome: atletas.nome, posicao: atletas.posicao })
          .from(atletas).where(inArray(atletas.id, atletaIds));
        atletasData.forEach(a => { atletasMap[a.id] = { nome: a.nome, posicao: a.posicao || "" }; });
      }

      // Gerar PDF com PDFKit
      const PDFDocument = (await import("pdfkit")).default;
      const doc = new PDFDocument({ margin: 40, size: "A4" });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="Scout_${jogo.mandante}_x_${jogo.visitante}.pdf"`);
      doc.pipe(res);

      const AZUL = "#1a3a5c";
      const VERMELHO = "#c0392b";
      const CINZA = "#666666";
      const CINZA_CLARO = "#f5f5f5";
      const BRANCO = "#ffffff";

      // ===== CABEÇALHO =====
      doc.rect(0, 0, doc.page.width, 120).fill(AZUL);

      // Placar central
      const placarText = `${jogo.mandante}  ${jogo.placarMandante ?? "—"} x ${jogo.placarVisitante ?? "—"}  ${jogo.visitante}`;
      doc.fontSize(18).fillColor(BRANCO).font("Helvetica-Bold")
        .text(placarText, 40, 30, { align: "center", width: doc.page.width - 80 });

      // Competição e data
      const dataFormatada = jogo.data
        ? new Date(jogo.data).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" })
        : "";
      doc.fontSize(11).fillColor(`${BRANCO}CC`).font("Helvetica")
        .text(`${jogo.competicao || ""} ${dataFormatada ? "• " + dataFormatada : ""} ${jogo.horario ? "• " + jogo.horario : ""}`, 40, 60, { align: "center", width: doc.page.width - 80 });

      if (jogo.local) {
        doc.fontSize(10).fillColor(`${BRANCO}99`)
          .text(`Local: ${jogo.local}`, 40, 80, { align: "center", width: doc.page.width - 80 });
      }

      let y = 130;

      // ===== INFORMAÇÕES DO JOGO =====
      const infoItems: [string, string][] = [];
      if (jogo.arbitro) infoItems.push(["Árbitro", jogo.arbitro]);
      if (jogo.assistente1) infoItems.push(["Assistente 1", jogo.assistente1]);
      if (jogo.assistente2) infoItems.push(["Assistente 2", jogo.assistente2]);
      if (jogo.publico) infoItems.push(["Público", String(jogo.publico)]);
      if (jogo.renda) infoItems.push(["Renda", jogo.renda]);
      if (jogo.gols) infoItems.push(["Gols", jogo.gols]);

      if (infoItems.length > 0) {
        doc.fontSize(12).fillColor(AZUL).font("Helvetica-Bold").text("Informações da Partida", 40, y);
        y += 18;
        doc.moveTo(40, y).lineTo(doc.page.width - 40, y).strokeColor(AZUL).lineWidth(1).stroke();
        y += 8;

        const colW = (doc.page.width - 80) / 2;
        infoItems.forEach(([label, valor], i) => {
          const x = i % 2 === 0 ? 40 : 40 + colW;
          if (i % 2 === 0 && i > 0) y += 18;
          doc.fontSize(9).fillColor(CINZA).font("Helvetica").text(label + ":", x, y, { width: colW * 0.35 });
          doc.fontSize(9).fillColor("#333333").font("Helvetica-Bold").text(valor, x + colW * 0.36, y, { width: colW * 0.6 });
        });
        y += 22;
      }

      if (jogo.observacoes) {
        doc.fontSize(9).fillColor(CINZA).font("Helvetica-Oblique")
          .text(`Observações: ${jogo.observacoes}`, 40, y, { width: doc.page.width - 80 });
        y += doc.heightOfString(jogo.observacoes, { width: doc.page.width - 80 }) + 10;
      }

      y += 6;

      // ===== TABELA DE SCOUTS =====
      if (scouts.length === 0) {
        doc.fontSize(12).fillColor(CINZA).text("Nenhum scout registrado para este jogo.", 40, y, { align: "center" });
      } else {
        doc.fontSize(12).fillColor(AZUL).font("Helvetica-Bold").text("Scout dos Atletas", 40, y);
        y += 18;
        doc.moveTo(40, y).lineTo(doc.page.width - 40, y).strokeColor(AZUL).lineWidth(1).stroke();
        y += 8;

        // Ordenar: titulares primeiro
        const scoutsOrdenados = [...scouts].sort((a, b) => {
          if (a.titular && !b.titular) return -1;
          if (!a.titular && b.titular) return 1;
          const nA = atletasMap[a.atletaId]?.nome || "";
          const nB = atletasMap[b.atletaId]?.nome || "";
          return nA.localeCompare(nB);
        });

        const colNome = 130;
        const colPos = 55;
        const colMin = 35;
        const colNum = 28;
        const cols = [colNome, colPos, colMin, colNum, colNum, colNum, colNum, colNum, colNum, colNum, colNum, colNum, colNum, colNum];
        const headers = ["Atleta", "Posição", "Min", "G", "A", "Fin", "Pas", "P.C", "Des", "Int", "Aér", "A.P", "CA", "CV"];
        const fields = ["", "", "minutosJogados", "gols", "assistencias", "finalizacoes", "passes", "passesCompletos", "desarmes", "interceptacoes", "jogosAereos", "duelosAereosPerdidos", "cartoesAmarelos", "cartoesVermelhos"];

        const rowH = 18;
        const tableW = doc.page.width - 80;

        // Header da tabela
        doc.rect(40, y, tableW, rowH).fill(AZUL);
        let xCol = 40;
        headers.forEach((h, i) => {
          doc.fontSize(7).fillColor(BRANCO).font("Helvetica-Bold")
            .text(h, xCol + 2, y + 5, { width: cols[i] - 4, align: i === 0 ? "left" : "center" });
          xCol += cols[i];
        });
        y += rowH;

        scoutsOrdenados.forEach((scout: any, idx) => {
          if (y > doc.page.height - 80) {
            doc.addPage();
            y = 40;
          }
          const bg = idx % 2 === 0 ? CINZA_CLARO : BRANCO;
          doc.rect(40, y, tableW, rowH).fill(bg);

          xCol = 40;
          const atleta = atletasMap[scout.atletaId];
          const nome = atleta?.nome || `Atleta ${scout.atletaId}`;
          const posicao = atleta?.posicao || "";
          const titular = scout.titular ? "★ " : "";

          // Nome
          doc.fontSize(7.5).fillColor("#222222").font("Helvetica-Bold")
            .text(titular + nome, xCol + 2, y + 5, { width: cols[0] - 4, ellipsis: true });
          xCol += cols[0];

          // Posição
          doc.fontSize(7).fillColor(CINZA).font("Helvetica")
            .text(posicao, xCol + 2, y + 5, { width: cols[1] - 4, align: "center" });
          xCol += cols[1];

          // Campos numéricos
          fields.slice(2).forEach((field, fi) => {
            const val = scout[field] ?? 0;
            const cor = (field === "cartoesAmarelos" && val > 0) ? "#e67e22"
              : (field === "cartoesVermelhos" && val > 0) ? VERMELHO
              : (field === "gols" && val > 0) ? "#27ae60"
              : "#333333";
            doc.fontSize(7.5).fillColor(cor).font(val > 0 ? "Helvetica-Bold" : "Helvetica")
              .text(val > 0 ? String(val) : "—", xCol + 2, y + 5, { width: cols[fi + 2] - 4, align: "center" });
            xCol += cols[fi + 2];
          });

          y += rowH;
        });

        // Notas dos atletas
        const scoutsComNotas = scoutsOrdenados.filter((s: any) =>
          s.notaTecnica || s.notaFisica || s.notaTatica || s.notaAtitudinal || s.notaPotencial || s.observacoes
        );

        if (scoutsComNotas.length > 0) {
          y += 16;
          if (y > doc.page.height - 80) { doc.addPage(); y = 40; }
          doc.fontSize(12).fillColor(AZUL).font("Helvetica-Bold").text("Avaliações Individuais", 40, y);
          y += 18;
          doc.moveTo(40, y).lineTo(doc.page.width - 40, y).strokeColor(AZUL).lineWidth(1).stroke();
          y += 8;

          scoutsComNotas.forEach((scout: any) => {
            if (y > doc.page.height - 100) { doc.addPage(); y = 40; }
            const atleta = atletasMap[scout.atletaId];
            const nome = atleta?.nome || `Atleta ${scout.atletaId}`;

            doc.fontSize(9).fillColor(AZUL).font("Helvetica-Bold").text(nome, 40, y);
            y += 14;

            const notas = [
              ["Técnica", scout.notaTecnica],
              ["Física", scout.notaFisica],
              ["Tática", scout.notaTatica],
              ["Atitudinal", scout.notaAtitudinal],
              ["Potencial", scout.notaPotencial],
            ].filter(([, v]) => v);

            if (notas.length > 0) {
              const notaW = (doc.page.width - 80) / notas.length;
              notas.forEach(([label, valor], i) => {
                const x = 40 + i * notaW;
                doc.rect(x, y, notaW - 4, 28).fill(CINZA_CLARO);
                doc.fontSize(7).fillColor(CINZA).font("Helvetica").text(String(label), x + 2, y + 3, { width: notaW - 8, align: "center" });
                doc.fontSize(13).fillColor(AZUL).font("Helvetica-Bold").text(String(valor), x + 2, y + 12, { width: notaW - 8, align: "center" });
              });
              y += 34;
            }

            if (scout.observacoes) {
              doc.fontSize(8).fillColor(CINZA).font("Helvetica-Oblique")
                .text(`"${scout.observacoes}"`, 40, y, { width: doc.page.width - 80 });
              y += doc.heightOfString(scout.observacoes, { width: doc.page.width - 80 }) + 8;
            }

            y += 6;
          });
        }
      }

      // Rodapé
      const footerY = doc.page.height - 30;
      doc.fontSize(8).fillColor(CINZA).font("Helvetica")
        .text(`Relatório gerado em ${new Date().toLocaleDateString("pt-BR")} — Marcílio Dias Scout App`, 40, footerY, { align: "center", width: doc.page.width - 80 });

      doc.end();
    } catch (error: any) {
      console.error("Erro ao gerar PDF do jogo:", error);
      if (!res.headersSent) res.status(500).json({ error: error.message });
    }
  });
}
