import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "../server/db";
import { atletas, midias } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Test Video Save", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  it("should save a video with the correct tipo", async () => {
    // Criar um atleta de teste
    const atletaData = {
      userId: 1,
      nome: "Teste Video",
      posicao: "Volante",
      clube: "Test Club",
      dataNascimento: new Date("1990-01-01"),
      idade: 34,
      pe: "direito",
      escala: "D",
      valencia: "Test",
      naturalidade: "Test",
    };

    const atletaResult = await db.insert(atletas).values(atletaData);
    const atletaId = atletaResult[0]?.id || 1;
    console.log("Atleta criado com ID:", atletaId);

    // Salvar um vídeo
    const videoData = {
      userId: 1,
      atletaId: atletaId,
      tipo: "video",
      nome: "Test Video",
      url: "https://www.youtube.com/watch?v=40jklbCSR-w&t=7s",
      s3Key: "videos/test/test-video",
      mimeType: "video/youtube",
      tamanho: 0,
      descricao: "Test video",
    };

    const videoResult = await db.insert(midias).values(videoData);
    console.log("Vídeo salvo:", videoResult);

    // Verificar se foi salvo com tipo = 'video'
    const savedVideo = await db
      .select()
      .from(midias)
      .where(eq(midias.url, "https://www.youtube.com/watch?v=40jklbCSR-w&t=7s"));

    console.log("Vídeo recuperado do banco:", savedVideo);
    expect(savedVideo[0].tipo).toBe("video");
    expect(savedVideo[0].url).toBe("https://www.youtube.com/watch?v=40jklbCSR-w&t=7s");
  });
});
