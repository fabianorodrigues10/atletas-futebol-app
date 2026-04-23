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

      // Gerar PDF com PDFKit — orientação retrato A4
      const PDFDocument = (await import("pdfkit")).default;
      const doc = new PDFDocument({ margin: 36, size: "A4", layout: "portrait" });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="Scout_${jogo.mandante}_x_${jogo.visitante}.pdf"`);
      doc.pipe(res);

      const AZUL_ESCURO = "#1a237e";
      const AZUL_MEDIO = "#283593";
      const AZUL_CLARO = "#3949ab";
      const VERDE = "#2e7d32";
      const VERMELHO = "#c62828";
      const AMARELO_CARD = "#f57f17";
      const CINZA = "#666666";
      const CINZA_CLARO = "#f5f5f5";
      const BRANCO = "#ffffff";
      const ROXO = "#6d28d9";
      const LARANJA = "#b45309";

      const PW = doc.page.width;   // 595
      const MARGIN = 36;
      const CONTENT_W = PW - MARGIN * 2;

      // ===== HELPERS =====
      const soma = (field: string) => scouts.reduce((acc: number, s: any) => acc + (Number(s[field]) || 0), 0);

      // ===== CABEÇALHO DO JOGO =====
      const headerH = 110;
      doc.rect(0, 0, PW, headerH).fill(AZUL_ESCURO);

      // Times e placar
      const mandante = jogo.mandante || "";
      const visitante = jogo.visitante || "";
      const placar = `${jogo.placarMandante ?? "—"}  ×  ${jogo.placarVisitante ?? "—"}`;

      doc.fontSize(13).fillColor(BRANCO).font("Helvetica-Bold")
        .text(mandante, MARGIN, 18, { width: CONTENT_W * 0.38, align: "right" });
      doc.fontSize(20).fillColor(BRANCO).font("Helvetica-Bold")
        .text(placar, MARGIN + CONTENT_W * 0.38 + 4, 14, { width: CONTENT_W * 0.24, align: "center" });
      doc.fontSize(13).fillColor(BRANCO).font("Helvetica-Bold")
        .text(visitante, MARGIN + CONTENT_W * 0.62 + 8, 18, { width: CONTENT_W * 0.38, align: "left" });

      // Linha de info
      const dataFormatada = jogo.data
        ? new Date(jogo.data).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" })
        : "";
      const infoPartes = [
        jogo.competicao,
        dataFormatada,
        jogo.horario,
        jogo.local ? `Local: ${jogo.local}` : null,
      ].filter(Boolean).join("   •   ");
      doc.fontSize(9).fillColor("#ffffffBB").font("Helvetica")
        .text(infoPartes, MARGIN, 46, { width: CONTENT_W, align: "center" });

      let y = headerH + 10;

      // ===== BLOCO TOTAIS DO TIME =====
      if (scouts.length > 0) {
        // Título
        doc.fontSize(10).fillColor(AZUL_ESCURO).font("Helvetica-Bold")
          .text("TOTAIS DO TIME", MARGIN, y);
        y += 14;
        doc.moveTo(MARGIN, y).lineTo(PW - MARGIN, y).strokeColor(AZUL_CLARO).lineWidth(0.5).stroke();
        y += 6;

        const drawTotaisGrid = (
          titulo: string,
          cor: string,
          campos: [string, string][],
          startY: number
        ): number => {
          const blockW = CONTENT_W;
          const cellW = blockW / campos.length;
          const blockH = 42;

          // Fundo
          doc.rect(MARGIN, startY, blockW, blockH).fill("#f0f4ff");
          // Título do bloco
          doc.fontSize(7).fillColor(cor).font("Helvetica-Bold")
            .text(titulo, MARGIN + 4, startY + 4);

          // Total geral
          const totalGeral = campos.reduce((acc, [, field]) => acc + soma(field), 0);
          doc.fontSize(7).fillColor(cor).font("Helvetica")
            .text(`Total: ${totalGeral}`, MARGIN + blockW - 60, startY + 4, { width: 56, align: "right" });

          // Células
          campos.forEach(([label, field], i) => {
            const cx = MARGIN + i * cellW;
            const val = soma(field);
            // Borda vertical
            if (i > 0) {
              doc.moveTo(cx, startY + 14).lineTo(cx, startY + blockH - 2).strokeColor("#cccccc").lineWidth(0.3).stroke();
            }
            doc.fontSize(14).fillColor(val > 0 ? cor : "#cccccc").font("Helvetica-Bold")
              .text(String(val), cx + 2, startY + 16, { width: cellW - 4, align: "center" });
            doc.fontSize(6.5).fillColor(CINZA).font("Helvetica")
              .text(label, cx + 2, startY + 32, { width: cellW - 4, align: "center" });
          });

          return startY + blockH + 4;
        };

        y = drawTotaisGrid("OFENSIVO", AZUL_CLARO, [
          ["Gols", "gols"],
          ["Assist.", "assistencias"],
          ["Finaliz.", "finalizacoes"],
          ["Cruzam.", "cruzamentos"],
          ["Passes", "passes"],
          ["P.Certos", "passesCompletos"],
          ["F.Sofrid.", "faltasSofridas"],
          ["Dribles", "dribles"],
        ], y);

        y = drawTotaisGrid("DEFENSIVO", VERDE, [
          ["Desarmes", "desarmes"],
          ["Intercept.", "interceptacoes"],
          ["Duelos", "duelos"],
          ["D.Ganhos", "duelosGanhos"],
          ["J.Aéreo", "jogosAereos"],
          ["Aér.Perd.", "duelosAereosPerdidos"],
          ["F.Comet.", "faltasCometidas"],
          ["B.Recup.", "bolasRecuperadas"],
        ], y);

        // Disciplina do time (linha única)
        const amarelos = soma("cartoesAmarelos");
        const vermelhos = soma("cartoesVermelhos");
        doc.rect(MARGIN, y, CONTENT_W, 22).fill("#fffbeb");
        doc.fontSize(7).fillColor(LARANJA).font("Helvetica-Bold").text("DISCIPLINA", MARGIN + 4, y + 7);
        doc.fontSize(9).fillColor(amarelos > 0 ? AMARELO_CARD : CINZA).font("Helvetica-Bold")
          .text(`Amarelos: ${amarelos}`, MARGIN + 90, y + 7);
        doc.fontSize(9).fillColor(vermelhos > 0 ? VERMELHO : CINZA).font("Helvetica-Bold")
          .text(`Vermelhos: ${vermelhos}`, MARGIN + 220, y + 7);
        y += 28;
      }

      // ===== CARDS INDIVIDUAIS =====
      y += 4;
      doc.fontSize(10).fillColor(AZUL_ESCURO).font("Helvetica-Bold")
        .text(`ATLETAS AVALIADOS (${scouts.length})`, MARGIN, y);
      y += 14;
      doc.moveTo(MARGIN, y).lineTo(PW - MARGIN, y).strokeColor(AZUL_CLARO).lineWidth(0.5).stroke();
      y += 8;

      // Ordenar: titulares primeiro
      const scoutsOrdenados = [...scouts].sort((a: any, b: any) => {
        if (a.titular && !b.titular) return -1;
        if (!a.titular && b.titular) return 1;
        const nA = atletasMap[a.atletaId]?.nome || "";
        const nB = atletasMap[b.atletaId]?.nome || "";
        return nA.localeCompare(nB);
      });

      const CARD_H_BASE = 110; // altura mínima do card

      scoutsOrdenados.forEach((scout: any) => {
        const atleta = atletasMap[scout.atletaId];
        const nome = atleta?.nome || `Atleta ${scout.atletaId}`;
        const posicao = atleta?.posicao || "";
        const temObs = !!scout.observacoes;

        // Estimar altura do card
        let cardH = CARD_H_BASE;
        if (temObs) {
          const obsH = doc.heightOfString(`"${scout.observacoes}"`, { width: CONTENT_W - 16 });
          cardH += obsH + 12;
        }

        if (y + cardH > doc.page.height - 50) {
          doc.addPage();
          y = 36;
        }

        // Fundo do card
        doc.rect(MARGIN, y, CONTENT_W, cardH).fill(CINZA_CLARO).stroke();

        // Faixa de cabeçalho do card
        const faixaCor = scout.titular ? AZUL_ESCURO : AZUL_MEDIO;
        doc.rect(MARGIN, y, CONTENT_W, 20).fill(faixaCor);

        // Badge titular/reserva
        const badge = scout.titular ? "★ TITULAR" : "RESERVA";
        doc.fontSize(7).fillColor(BRANCO).font("Helvetica-Bold")
          .text(badge, MARGIN + 4, y + 6, { width: 55 });

        // Nome
        doc.fontSize(10).fillColor(BRANCO).font("Helvetica-Bold")
          .text(nome, MARGIN + 62, y + 5, { width: CONTENT_W - 160, ellipsis: true });

        // Posição e minutos
        doc.fontSize(8).fillColor("#ffffffCC").font("Helvetica")
          .text(posicao, MARGIN + CONTENT_W - 110, y + 6, { width: 60, align: "right" });
        doc.fontSize(8).fillColor(BRANCO).font("Helvetica-Bold")
          .text(`${scout.minutosJogados || 0}'`, MARGIN + CONTENT_W - 46, y + 6, { width: 40, align: "right" });

        let cy = y + 24;

        // Chips de destaque (gols, assistências, cartões)
        const destaques: string[] = [];
        if ((scout.gols || 0) > 0) destaques.push(`⚽ ${scout.gols} gol${scout.gols > 1 ? "s" : ""}`);
        if ((scout.assistencias || 0) > 0) destaques.push(`★ ${scout.assistencias} assist.`);
        if ((scout.cartoesAmarelos || 0) > 0) destaques.push(`CA: ${scout.cartoesAmarelos}`);
        if ((scout.cartoesVermelhos || 0) > 0) destaques.push(`CV: ${scout.cartoesVermelhos}`);
        if (destaques.length > 0) {
          doc.fontSize(8).fillColor(AZUL_ESCURO).font("Helvetica-Bold")
            .text(destaques.join("   "), MARGIN + 8, cy, { width: CONTENT_W - 16 });
          cy += 13;
        }

        // Linha Ofensivo
        const camposOfe: [string, string][] = [
          ["Gols", "gols"], ["Assist.", "assistencias"], ["Finaliz.", "finalizacoes"],
          ["Cruzam.", "cruzamentos"], ["Passes", "passes"], ["P.Certos", "passesCompletos"],
          ["F.Sofrid.", "faltasSofridas"], ["Dribles", "dribles"],
        ];
        const totalOfe = camposOfe.reduce((acc, [, f]) => acc + (Number(scout[f]) || 0), 0);
        const cellWOfe = CONTENT_W / camposOfe.length;

        doc.fontSize(6.5).fillColor(AZUL_CLARO).font("Helvetica-Bold")
          .text("OFENSIVO", MARGIN + 4, cy);
        doc.fontSize(6.5).fillColor(AZUL_CLARO).font("Helvetica")
          .text(`Total: ${totalOfe}`, MARGIN + CONTENT_W - 50, cy, { width: 46, align: "right" });
        cy += 9;

        camposOfe.forEach(([label, field], i) => {
          const cx = MARGIN + i * cellWOfe;
          const val = Number(scout[field]) || 0;
          if (i > 0) {
            doc.moveTo(cx, cy).lineTo(cx, cy + 20).strokeColor("#cccccc").lineWidth(0.3).stroke();
          }
          doc.fontSize(11).fillColor(val > 0 ? AZUL_CLARO : "#cccccc").font(val > 0 ? "Helvetica-Bold" : "Helvetica")
            .text(String(val), cx + 2, cy + 1, { width: cellWOfe - 4, align: "center" });
          doc.fontSize(6).fillColor(CINZA).font("Helvetica")
            .text(label, cx + 2, cy + 13, { width: cellWOfe - 4, align: "center" });
        });
        cy += 22;

        // Linha Defensivo
        const camposDef: [string, string][] = [
          ["Desarmes", "desarmes"], ["Intercept.", "interceptacoes"], ["Duelos", "duelos"],
          ["D.Ganhos", "duelosGanhos"], ["J.Aéreo", "jogosAereos"], ["Aér.Perd.", "duelosAereosPerdidos"],
          ["F.Comet.", "faltasCometidas"], ["B.Recup.", "bolasRecuperadas"],
        ];
        const totalDef = camposDef.reduce((acc, [, f]) => acc + (Number(scout[f]) || 0), 0);
        const cellWDef = CONTENT_W / camposDef.length;

        doc.fontSize(6.5).fillColor(VERDE).font("Helvetica-Bold")
          .text("DEFENSIVO", MARGIN + 4, cy);
        doc.fontSize(6.5).fillColor(VERDE).font("Helvetica")
          .text(`Total: ${totalDef}`, MARGIN + CONTENT_W - 50, cy, { width: 46, align: "right" });
        cy += 9;

        camposDef.forEach(([label, field], i) => {
          const cx = MARGIN + i * cellWDef;
          const val = Number(scout[field]) || 0;
          if (i > 0) {
            doc.moveTo(cx, cy).lineTo(cx, cy + 20).strokeColor("#cccccc").lineWidth(0.3).stroke();
          }
          doc.fontSize(11).fillColor(val > 0 ? VERDE : "#cccccc").font(val > 0 ? "Helvetica-Bold" : "Helvetica")
            .text(String(val), cx + 2, cy + 1, { width: cellWDef - 4, align: "center" });
          doc.fontSize(6).fillColor(CINZA).font("Helvetica")
            .text(label, cx + 2, cy + 13, { width: cellWDef - 4, align: "center" });
        });
        cy += 22;

        // Notas removidas - dados mantidos apenas para uso interno

        // Observações
        if (temObs) {
          doc.rect(MARGIN + 2, cy, CONTENT_W - 4, 4).fill("#f59e0b");
          cy += 6;
          doc.fontSize(7).fillColor(LARANJA).font("Helvetica-Bold").text("OBSERVAÇÕES", MARGIN + 8, cy);
          cy += 10;
          doc.fontSize(8).fillColor("#333333").font("Helvetica-Oblique")
            .text(`"${scout.observacoes}"`, MARGIN + 8, cy, { width: CONTENT_W - 16 });
          cy += doc.heightOfString(`"${scout.observacoes}"`, { width: CONTENT_W - 16 }) + 4;
        }

        y += cardH + 6;
      });

      // Rodapé
      const footerY = doc.page.height - 24;
      doc.fontSize(7.5).fillColor(CINZA).font("Helvetica")
        .text(`Relatório gerado em ${new Date().toLocaleDateString("pt-BR")} — Marcílio Dias Scout App`, MARGIN, footerY, { align: "center", width: CONTENT_W });

      doc.end();
    } catch (error: any) {
      console.error("Erro ao gerar PDF do jogo:", error);
      if (!res.headersSent) res.status(500).json({ error: error.message });
    }
  });
}
