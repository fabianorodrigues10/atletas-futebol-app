import { describe, it, expect } from "vitest";

/**
 * Testes para o formato dd/mm/aa da data de nascimento e lógica de filtros.
 */

describe("Data de Nascimento - formato dd/mm/aa", () => {
  // Simula a auto-formatação do campo
  function autoFormat(input: string): string {
    const digits = input.replace(/\D/g, "").slice(0, 6);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
    } else if (digits.length > 2) {
      formatted = digits.slice(0, 2) + "/" + digits.slice(2);
    }
    return formatted;
  }

  it("should format 280397 as 28/03/97", () => {
    expect(autoFormat("280397")).toBe("28/03/97");
  });

  it("should format 0502 as 05/02", () => {
    expect(autoFormat("0502")).toBe("05/02");
  });

  it("should format 05 as 05", () => {
    expect(autoFormat("05")).toBe("05");
  });

  it("should strip non-digit characters", () => {
    expect(autoFormat("28/03/97")).toBe("28/03/97");
  });

  it("should limit to 6 digits (dd/mm/aa)", () => {
    expect(autoFormat("28031997")).toBe("28/03/19"); // only first 6 digits
  });

  // Simula a conversão dd/mm/aa -> ISO
  function ddmmaaToISO(input: string): string | null {
    if (input.length !== 8) return null; // dd/mm/aa = 8 chars with slashes
    const parts = input.split("/");
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    let year = parseInt(parts[2]);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    year = year > 50 ? 1900 + year : 2000 + year;
    return new Date(year, month - 1, day).toISOString();
  }

  it("should convert 28/03/97 to ISO date in 1997", () => {
    const iso = ddmmaaToISO("28/03/97");
    expect(iso).not.toBeNull();
    const d = new Date(iso!);
    expect(d.getFullYear()).toBe(1997);
    expect(d.getMonth()).toBe(2); // March = 2
    expect(d.getDate()).toBe(28);
  });

  it("should convert 15/01/05 to ISO date in 2005", () => {
    const iso = ddmmaaToISO("15/01/05");
    expect(iso).not.toBeNull();
    const d = new Date(iso!);
    expect(d.getFullYear()).toBe(2005);
    expect(d.getMonth()).toBe(0); // January = 0
    expect(d.getDate()).toBe(15);
  });

  it("should treat year > 50 as 1900s", () => {
    const iso = ddmmaaToISO("01/06/85");
    const d = new Date(iso!);
    expect(d.getFullYear()).toBe(1985);
  });

  it("should treat year <= 50 as 2000s", () => {
    const iso = ddmmaaToISO("01/06/10");
    const d = new Date(iso!);
    expect(d.getFullYear()).toBe(2010);
  });

  // Simula conversão ISO -> dd/mm/aa para exibição
  function isoToDdmmaa(isoDate: string): string {
    const d = new Date(isoDate);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  it("should convert ISO back to dd/mm/aa", () => {
    const iso = new Date(1997, 2, 28).toISOString();
    expect(isoToDdmmaa(iso)).toBe("28/03/97");
  });

  it("should handle year 2005 as 05", () => {
    const iso = new Date(2005, 0, 15).toISOString();
    expect(isoToDdmmaa(iso)).toBe("15/01/05");
  });
});

describe("Filtros da página inicial", () => {
  // Simula dados de atletas
  const atletas = [
    { nome: "Igor", posicao: "Volante", clube: "Ypiranga/RS", idade: 29 },
    { nome: "Emerson", posicao: "Extremo", clube: "Joinville/SC", idade: 23 },
    { nome: "Kevyn", posicao: "Lateral", clube: "Londrina/PR", idade: null },
    { nome: "Wanderson", posicao: "Zagueiro", clube: "Náutico/PE", idade: 30 },
    { nome: "Danrlei", posicao: "Zagueiro", clube: "CRAC/GO", idade: 35 },
    { nome: "Carlos", posicao: "Goleiro", clube: "Ypiranga/RS", idade: 20 },
  ];

  function filterAtletas(
    data: typeof atletas,
    search: string,
    posicao: string | null,
    clube: string | null,
    faixaIdx: number
  ) {
    const FAIXAS = [
      { min: 0, max: 99 },
      { min: 1, max: 21 },
      { min: 21, max: 25 },
      { min: 26, max: 30 },
      { min: 31, max: 99 },
    ];
    const faixa = FAIXAS[faixaIdx];

    return data.filter((a) => {
      if (search && !a.nome.toLowerCase().includes(search.toLowerCase())) return false;
      if (posicao && a.posicao !== posicao) return false;
      if (clube && a.clube !== clube) return false;
      if (faixa && faixa.min > 0) {
        const idade = a.idade ?? 0;
        if (idade < faixa.min || idade > faixa.max) return false;
      }
      return true;
    });
  }

  it("should return all when no filters", () => {
    expect(filterAtletas(atletas, "", null, null, 0)).toHaveLength(6);
  });

  it("should filter by search query", () => {
    expect(filterAtletas(atletas, "igor", null, null, 0)).toHaveLength(1);
  });

  it("should filter by posição", () => {
    expect(filterAtletas(atletas, "", "Zagueiro", null, 0)).toHaveLength(2);
  });

  it("should filter by clube", () => {
    expect(filterAtletas(atletas, "", null, "Ypiranga/RS", 0)).toHaveLength(2);
  });

  it("should filter by faixa de idade Sub-21", () => {
    // Sub-21: min=1, max=21 — only Carlos (20) matches. Kevyn has null idade (treated as 0, excluded)
    expect(filterAtletas(atletas, "", null, null, 1)).toHaveLength(1);
  });

  it("should filter by faixa de idade 21-25", () => {
    expect(filterAtletas(atletas, "", null, null, 2)).toHaveLength(1); // Emerson, 23
  });

  it("should filter by faixa de idade 26-30", () => {
    expect(filterAtletas(atletas, "", null, null, 3)).toHaveLength(2); // Igor 29, Wanderson 30
  });

  it("should filter by faixa de idade 31+", () => {
    expect(filterAtletas(atletas, "", null, null, 4)).toHaveLength(1); // Danrlei, 35
  });

  it("should combine posição + faixa de idade", () => {
    expect(filterAtletas(atletas, "", "Zagueiro", null, 3)).toHaveLength(1); // Wanderson 30
  });

  it("should combine search + posição + clube", () => {
    expect(filterAtletas(atletas, "carlos", "Goleiro", "Ypiranga/RS", 0)).toHaveLength(1);
  });

  it("should return empty when no match", () => {
    expect(filterAtletas(atletas, "xyz", null, null, 0)).toHaveLength(0);
  });
});
