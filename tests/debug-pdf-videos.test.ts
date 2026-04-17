import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "../server/db";
import { atletas, midias } from "../drizzle/schema";
import { eq, inArray, and } from "drizzle-orm";

describe("Debug PDF Videos", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  it("should find videos for athlete 1650013", async () => {
    // Verificar se o atleta existe
    const atletaResult = await db
      .select()
      .from(atletas)
      .where(eq(atletas.id, 1650013));
    console.log("Atleta encontrado:", atletaResult);
    expect(atletaResult.length).toBeGreaterThan(0);

    // Verificar se há vídeos para este atleta
    const videosResult = await db
      .select()
      .from(midias)
      .where(eq(midias.atletaId, 1650013));
    console.log("Vídeos encontrados (sem filtro):", videosResult);
    if (videosResult.length > 0) {
      console.log("Tipo do primeiro vídeo:", videosResult[0].tipo);
      console.log("URL do primeiro vídeo:", videosResult[0].url);
    }

    // Verificar com filtro de tipo
    const videosFiltered = await db
      .select()
      .from(midias)
      .where(
        and(
          eq(midias.atletaId, 1650013),
          eq(midias.tipo, "video")
        )
      );
    console.log("Vídeos encontrados (com filtro tipo=video):", videosFiltered);
    expect(videosFiltered.length).toBeGreaterThan(0);
  });

  it("should simulate PDF route query", async () => {
    const ids = [1650013];

    // Simular a query da rota de PDF
    const atletasData = await db
      .select()
      .from(atletas)
      .where(inArray(atletas.id, ids));
    console.log("Atletas da rota:", atletasData);

    const videosData = await db
      .select()
      .from(midias)
      .where(
        and(
          inArray(midias.atletaId, ids),
          eq(midias.tipo, "video")
        )
      );
    console.log("Vídeos da rota:", videosData);

    // Criar mapa de vídeos
    const videoMap = new Map<number, string[]>();
    videosData.forEach((video: any) => {
      if (video.atletaId && video.tipo === "video" && video.url) {
        if (!videoMap.has(video.atletaId)) {
          videoMap.set(video.atletaId, []);
        }
        videoMap.get(video.atletaId)!.push(video.url);
      }
    });

    console.log("Video map:", videoMap);

    // Adicionar vídeos aos atletas
    const data = atletasData.map((a: any) => ({
      ...a,
      videos: videoMap.get(a.id) || [],
    }));

    console.log("Final data with videos:", data);
    expect(data[0].videos.length).toBeGreaterThan(0);
  });
});
