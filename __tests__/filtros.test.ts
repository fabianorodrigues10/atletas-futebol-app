/**
 * Testes para página de Filtros com naturalidade
 */

import { describe, it, expect } from "vitest";

describe("Filtros - Naturalidade", () => {
  // Mock de atletas com naturalidade
  const mockAtletas = [
    {
      id: 1,
      nome: "Atleta SP",
      posicao: "Meia",
      clube: "Corinthians/SP",
      idade: 25,
      naturalidade: "São Paulo, SP",
    },
    {
      id: 2,
      nome: "Atleta RJ",
      posicao: "Lateral",
      clube: "Flamengo/RJ",
      idade: 23,
      naturalidade: "Rio de Janeiro, RJ",
    },
    {
      id: 3,
      nome: "Atleta MG",
      posicao: "Zagueiro",
      clube: "Atlético/MG",
      idade: 28,
      naturalidade: "Belo Horizonte, MG",
    },
    {
      id: 4,
      nome: "Atleta SP 2",
      posicao: "Goleiro",
      clube: "Santos/SP",
      idade: 30,
      naturalidade: "São Paulo, SP",
    },
  ];

  it("deve extrair naturalidades únicas dos atletas", () => {
    const naturalidades = new Set<string>();
    mockAtletas.forEach((a) => {
      if (a.naturalidade) naturalidades.add(a.naturalidade);
    });
    const result = Array.from(naturalidades).sort();

    expect(result).toEqual([
      "Belo Horizonte, MG",
      "Rio de Janeiro, RJ",
      "São Paulo, SP",
    ]);
    expect(result.length).toBe(3);
  });

  it("deve filtrar atletas por naturalidade única", () => {
    const selectedNaturalidades = ["São Paulo, SP"];

    const filtered = mockAtletas.filter((atleta) =>
      selectedNaturalidades.includes(atleta.naturalidade || "")
    );

    expect(filtered.length).toBe(2);
    expect(filtered.every((a) => a.naturalidade === "São Paulo, SP")).toBe(
      true
    );
  });

  it("deve filtrar atletas por múltiplas naturalidades", () => {
    const selectedNaturalidades = ["São Paulo, SP", "Rio de Janeiro, RJ"];

    const filtered = mockAtletas.filter((atleta) =>
      selectedNaturalidades.includes(atleta.naturalidade || "")
    );

    expect(filtered.length).toBe(3);
    expect(
      filtered.every(
        (a) =>
          a.naturalidade === "São Paulo, SP" ||
          a.naturalidade === "Rio de Janeiro, RJ"
      )
    ).toBe(true);
  });

  it("deve combinar filtros de naturalidade com outros filtros", () => {
    const selectedNaturalidades = ["São Paulo, SP"];
    const selectedPosicoes = ["Meia"];

    const filtered = mockAtletas.filter((atleta) => {
      if (selectedPosicoes.length > 0 && !selectedPosicoes.includes(atleta.posicao || "")) {
        return false;
      }
      if (selectedNaturalidades.length > 0 && !selectedNaturalidades.includes(atleta.naturalidade || "")) {
        return false;
      }
      return true;
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe(1);
    expect(filtered[0].nome).toBe("Atleta SP");
  });

  it("deve retornar lista vazia quando nenhum atleta corresponde ao filtro", () => {
    const selectedNaturalidades = ["Brasília, DF"];

    const filtered = mockAtletas.filter((atleta) =>
      selectedNaturalidades.includes(atleta.naturalidade || "")
    );

    expect(filtered.length).toBe(0);
  });

  it("deve retornar todos os atletas quando nenhum filtro é aplicado", () => {
    const selectedNaturalidades: string[] = [];

    const filtered = mockAtletas.filter((atleta) => {
      if (selectedNaturalidades.length > 0 && !selectedNaturalidades.includes(atleta.naturalidade || "")) {
        return false;
      }
      return true;
    });

    expect(filtered.length).toBe(mockAtletas.length);
  });

  it("deve lidar com atletas sem naturalidade definida", () => {
    const atletasComNull = [
      ...mockAtletas,
      {
        id: 5,
        nome: "Atleta Sem Naturalidade",
        posicao: "Atacante",
        clube: "Desconhecido",
        idade: 22,
        naturalidade: null,
      },
    ];

    const naturalidades = new Set<string>();
    atletasComNull.forEach((a) => {
      if (a.naturalidade) naturalidades.add(a.naturalidade);
    });

    expect(naturalidades.size).toBe(3); // Não inclui null
    expect(Array.from(naturalidades)).not.toContain(null);
  });
});
