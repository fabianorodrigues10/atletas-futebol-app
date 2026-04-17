import { describe, expect, it } from "vitest";

describe("Report PDF endpoint", () => {
  const API_URL = "http://127.0.0.1:3000";

  it("should return a PDF for valid athlete IDs", async () => {
    const response = await fetch(`${API_URL}/api/report/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: [60001, 60002, 60003],
        filters: { posicao: "Todas", faixaIdade: "Todas", clube: "Todos" },
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");

    const buffer = await response.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(500);

    // PDF files start with %PDF
    const header = new TextDecoder().decode(new Uint8Array(buffer).slice(0, 5));
    expect(header).toBe("%PDF-");
  });

  it("should return a PDF when no IDs are provided (all athletes)", async () => {
    const response = await fetch(`${API_URL}/api/report/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filters: { posicao: "Todas", faixaIdade: "Todas", clube: "Todos" },
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");

    const buffer = await response.arrayBuffer();
    // Full report should be larger
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });

  it("should include correct Content-Disposition header", async () => {
    const response = await fetch(`${API_URL}/api/report/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: [60001],
        filters: {},
      }),
    });

    expect(response.status).toBe(200);
    const disposition = response.headers.get("content-disposition");
    expect(disposition).toContain("Relatorio_Fabiano_Scout.pdf");
  });

  it("should handle filters in the request body", async () => {
    const response = await fetch(`${API_URL}/api/report/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: [60001, 60002],
        filters: {
          posicao: "Zagueiro",
          faixaIdade: "21-25",
          clube: "Ceilândia/DF",
          busca: "Santos",
        },
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
  });
});
