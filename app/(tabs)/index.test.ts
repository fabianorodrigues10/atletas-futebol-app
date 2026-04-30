import { describe, it, expect } from "vitest";

// Normaliza string removendo acentos, espaços extras e convertendo para minúsculas
function normalizeStr(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

describe("Busca de Atletas - normalizeStr", () => {
  it("deve normalizar nomes com acentos", () => {
    expect(normalizeStr("João da Silva")).toBe("joao da silva");
    expect(normalizeStr("José Pereira")).toBe("jose pereira");
    expect(normalizeStr("André Luís")).toBe("andre luis");
  });

  it("deve remover espaços extras", () => {
    expect(normalizeStr("João  da  Silva")).toBe("joao da silva");
    expect(normalizeStr("  João da Silva  ")).toBe("joao da silva");
    expect(normalizeStr("João\t\nda\tSilva")).toBe("joao da silva");
  });

  it("deve converter para minúsculas", () => {
    expect(normalizeStr("JOÃO DA SILVA")).toBe("joao da silva");
    expect(normalizeStr("João DA silva")).toBe("joao da silva");
  });

  it("deve combinar todas as normalizações", () => {
    expect(normalizeStr("  JOÃO   DA   SILVA  ")).toBe("joao da silva");
    expect(normalizeStr("JOSÉ  PEREIRA")).toBe("jose pereira");
  });

  it("deve encontrar correspondências parciais", () => {
    const nome = normalizeStr("João da Silva");
    expect(nome.includes(normalizeStr("joão"))).toBe(true);
    expect(nome.includes(normalizeStr("da silva"))).toBe(true);
    expect(nome.includes(normalizeStr("joao da"))).toBe(true);
  });

  it("deve não encontrar correspondências incorretas", () => {
    const nome = normalizeStr("João da Silva");
    expect(nome.includes(normalizeStr("pedro"))).toBe(false);
    expect(nome.includes(normalizeStr("santos"))).toBe(false);
  });

  it("deve lidar com strings vazias", () => {
    expect(normalizeStr("")).toBe("");
    expect(normalizeStr("   ")).toBe("");
  });

  it("deve buscar atletas com variações de digitação", () => {
    const atletas = [
      { nome: "João da Silva" },
      { nome: "José Pereira" },
      { nome: "André Luís" },
    ];

    // Busca por "joao" deve encontrar "João da Silva"
    const resultado1 = atletas.filter((a) =>
      normalizeStr(a.nome).includes(normalizeStr("joao"))
    );
    expect(resultado1).toHaveLength(1);
    expect(resultado1[0].nome).toBe("João da Silva");

    // Busca por "JOSE" deve encontrar "José Pereira"
    const resultado2 = atletas.filter((a) =>
      normalizeStr(a.nome).includes(normalizeStr("JOSE"))
    );
    expect(resultado2).toHaveLength(1);
    expect(resultado2[0].nome).toBe("José Pereira");

    // Busca por "andre luis" deve encontrar "André Luís"
    const resultado3 = atletas.filter((a) =>
      normalizeStr(a.nome).includes(normalizeStr("andre luis"))
    );
    expect(resultado3).toHaveLength(1);
    expect(resultado3[0].nome).toBe("André Luís");
  });
});
