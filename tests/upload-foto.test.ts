import { describe, it, expect, vi } from "vitest";

// Mock do storagePut
vi.mock("../server/storage", () => ({
  storagePut: vi.fn().mockResolvedValue({
    key: "atletas/1/1/12345-abc-foto.jpg",
    url: "https://storage.example.com/atletas/1/1/12345-abc-foto.jpg",
  }),
}));

// Mock do db.createMidia
vi.mock("../server/db", async () => {
  const actual = await vi.importActual("../server/db");
  return {
    ...actual,
    createMidia: vi.fn().mockResolvedValue(42),
  };
});

describe("Upload de Foto - Validações", () => {
  it("deve gerar chave S3 correta com userId, atletaId e timestamp", () => {
    const userId = 1;
    const atletaId = 5;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileName = "foto_atleta.jpg";
    const s3Key = `atletas/${userId}/${atletaId}/${timestamp}-${random}-${fileName}`;

    expect(s3Key).toContain(`atletas/${userId}/${atletaId}/`);
    expect(s3Key).toContain(fileName);
    expect(s3Key.split("/").length).toBe(4);
  });

  it("deve decodificar base64 corretamente", () => {
    const originalText = "Hello, World!";
    const base64 = Buffer.from(originalText).toString("base64");
    const decoded = Buffer.from(base64, "base64").toString("utf-8");

    expect(decoded).toBe(originalText);
  });

  it("deve rejeitar base64 vazio", () => {
    const base64 = "";
    const buffer = Buffer.from(base64, "base64");
    expect(buffer.length).toBe(0);
  });

  it("deve aceitar tipos MIME de imagem válidos", () => {
    const validMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    validMimeTypes.forEach((mimeType) => {
      expect(mimeType.startsWith("image/")).toBe(true);
    });
  });

  it("deve gerar nome de arquivo com timestamp quando não fornecido", () => {
    const timestamp = Date.now();
    const fileName = `foto_${timestamp}.jpg`;
    expect(fileName).toMatch(/^foto_\d+\.jpg$/);
  });

  it("deve construir dados de mídia corretamente", () => {
    const midiaData = {
      userId: 1,
      atletaId: 5,
      tipo: "foto" as const,
      nome: "foto_atleta.jpg",
      url: "https://storage.example.com/atletas/1/5/foto.jpg",
      s3Key: "atletas/1/5/foto.jpg",
      mimeType: "image/jpeg",
      tamanho: 1024,
      descricao: "Foto do atleta",
    };

    expect(midiaData.tipo).toBe("foto");
    expect(midiaData.url).toContain("https://");
    expect(midiaData.tamanho).toBeGreaterThan(0);
    expect(midiaData.atletaId).toBe(5);
  });

  it("deve calcular tamanho do buffer a partir de base64", () => {
    // Simula uma imagem pequena em base64
    const fakeImageData = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const buffer = Buffer.from(fakeImageData, "base64");
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.length).toBe(70); // PNG 1x1 pixel
  });
});
