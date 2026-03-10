import PDFDocument from "pdfkit";
import { Readable } from "stream";

interface AtletaParaPDF {
  nome: string;
  posicao?: string | null;
  segundaPosicao?: string | null;
  idade?: number | null;
  altura?: string | null;
  clube?: string | null;
  valencia?: string | null;
  link?: string | null;
  videos?: string[] | null;
}

interface EstatisticasPDF {
  totalAtletas: number;
  idadeMedia: number;
  alturaMedia: string;
  posicoes: Record<string, number>;
}

export async function gerarRelatorioPDF(
  titulo: string,
  atletas: AtletaParaPDF[],
  stats: EstatisticasPDF
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
      });

      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on("error", reject);

      // Título
      doc.fontSize(24).font("Helvetica-Bold").text(titulo, { align: "center" });
      doc.moveDown(0.5);

      // Data
      const data = new Date().toLocaleDateString("pt-BR");
      doc.fontSize(10).font("Helvetica").text(`Gerado em: ${data}`, { align: "center" });
      doc.moveDown(1);

      // Seção de Estatísticas
      doc.fontSize(14).font("Helvetica-Bold").text("Estatísticas Gerais");
      doc.moveDown(0.3);

      const stats_data = [
        ["Total de Atletas", stats.totalAtletas.toString()],
        ["Idade Média", `${stats.idadeMedia} anos`],
        ["Altura Média", `${stats.alturaMedia} m`],
      ];

      doc.fontSize(10).font("Helvetica");
      stats_data.forEach(([label, value]) => {
        doc.text(`${label}: ${value}`);
      });

      doc.moveDown(1);

      // Seção de Posições
      doc.fontSize(12).font("Helvetica-Bold").text("Distribuição de Posições");
      doc.moveDown(0.3);

      doc.fontSize(9).font("Helvetica");
      Object.entries(stats.posicoes)
        .sort((a, b) => b[1] - a[1])
        .forEach(([posicao, count]) => {
          const percentual = ((count / stats.totalAtletas) * 100).toFixed(1);
          doc.text(`${posicao}: ${count} (${percentual}%)`);
        });

      doc.moveDown(1);

      // Seção de Fichas Individuais dos Atletas
      doc.fontSize(12).font("Helvetica-Bold").text("Fichas dos Atletas");
      doc.moveDown(0.5);

      atletas.forEach((atleta, index) => {
        // Verificar se precisa de nova página
        if (doc.y > 700) {
          doc.addPage();
        }

        // Cabeçalho da ficha
        doc.fontSize(11).font("Helvetica-Bold").text(`${index + 1}. ${atleta.nome}`);
        
        // Links (Ogol e YouTube)
        const linksText: string[] = [];
        if (atleta.link) {
          linksText.push(`Ogol: ${atleta.link}`);
        }
        if (atleta.videos && atleta.videos.length > 0) {
          atleta.videos.forEach((video, idx) => {
            linksText.push(`YouTube ${idx + 1}: ${video}`);
          });
        }
        
        if (linksText.length > 0) {
          doc.fontSize(8).font("Helvetica").fillColor("#DF101A");
          linksText.forEach(link => {
            doc.text(link, { underline: true });
          });
          doc.fillColor("#000000");
        }

        // Dados do atleta
        doc.fontSize(9).font("Helvetica");
        const dados = [
          [`Posição: ${atleta.posicao || "-"}`, `Idade: ${atleta.idade || "-"}`],
          [`Altura: ${atleta.altura || "-"}`, `2ª Posição: ${atleta.segundaPosicao || "-"}`],
          [`Clube: ${atleta.clube || "-"}`, `Valência: ${atleta.valencia || "-"}`],
        ];

        dados.forEach(([col1, col2]) => {
          doc.text(col1, 40, doc.y, { width: 250, continued: true });
          doc.text(col2, 300, doc.y - doc.currentLineHeight());
          doc.moveDown(1);
        });

        doc.moveDown(0.5);
        doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
      });

      // Rodapé
      doc.fontSize(8).font("Helvetica").text("Relatório gerado automaticamente por Dados do Marinheiro - Marcílio Dias", 40, 750, {
        align: "center",
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
