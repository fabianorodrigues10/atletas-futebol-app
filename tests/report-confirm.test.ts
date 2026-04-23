import { describe, it, expect } from "vitest";

/**
 * Testes para a lógica do modal de confirmação do relatório PDF.
 * Valida que os filtros são corretamente resumidos e que a contagem
 * de atletas é precisa antes de gerar o relatório.
 */

// Simula a lógica de filtragem da tela principal
const FAIXAS_IDADE = [
  { label: "Todas", min: 0, max: 99 },
  { label: "Sub-21", min: 1, max: 21 },
  { label: "21-25", min: 21, max: 25 },
  { label: "26-30", min: 26, max: 30 },
  { label: "31+", min: 31, max: 99 },
];

interface Atleta {
  id: number;
  nome: string;
  posicao: string | null;
  clube: string | null;
  idade: number | null;
}

function filterAtletas(
  atletas: Atleta[],
  searchQuery: string,
  selectedPosicao: string | null,
  selectedClube: string | null,
  selectedIdadeFaixa: number
): Atleta[] {
  const faixa = FAIXAS_IDADE[selectedIdadeFaixa];
  return atletas.filter((atleta) => {
    if (searchQuery && !atleta.nome.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedPosicao && atleta.posicao !== selectedPosicao) {
      return false;
    }
    if (selectedClube && atleta.clube !== selectedClube) {
      return false;
    }
    if (faixa && faixa.min > 0) {
      const idade = atleta.idade ?? 0;
      if (idade < faixa.min || idade > faixa.max) {
        return false;
      }
    }
    return true;
  });
}

function buildFilterSummary(
  selectedPosicao: string | null,
  selectedClube: string | null,
  selectedIdadeFaixa: number,
  searchQuery: string
) {
  return {
    posicao: selectedPosicao || "Todas",
    faixaIdade: selectedIdadeFaixa > 0 ? FAIXAS_IDADE[selectedIdadeFaixa].label : "Todas",
    clube: selectedClube || "Todos",
    busca: searchQuery || undefined,
  };
}

const mockAtletas: Atleta[] = [
  { id: 1, nome: "João Silva", posicao: "Zagueiro", clube: "Flamengo/RJ", idade: 25 },
  { id: 2, nome: "Pedro Santos", posicao: "Extremo", clube: "Vasco/RJ", idade: 22 },
  { id: 3, nome: "Carlos Lima", posicao: "Goleiro", clube: "Flamengo/RJ", idade: 30 },
  { id: 4, nome: "André Costa", posicao: "Zagueiro", clube: "Botafogo/RJ", idade: 19 },
  { id: 5, nome: "Lucas Melo", posicao: "Meia", clube: "Fluminense/RJ", idade: 33 },
  { id: 6, nome: "Rafael Souza", posicao: "Lateral", clube: "Vasco/RJ", idade: 27 },
];

describe("Modal de confirmação - contagem de atletas", () => {
  it("sem filtros mostra todos os atletas", () => {
    const filtered = filterAtletas(mockAtletas, "", null, null, 0);
    expect(filtered.length).toBe(6);
  });

  it("filtro por posição reduz a contagem", () => {
    const filtered = filterAtletas(mockAtletas, "", "Zagueiro", null, 0);
    expect(filtered.length).toBe(2);
    expect(filtered.every((a) => a.posicao === "Zagueiro")).toBe(true);
  });

  it("filtro por clube reduz a contagem", () => {
    const filtered = filterAtletas(mockAtletas, "", null, "Flamengo/RJ", 0);
    expect(filtered.length).toBe(2);
    expect(filtered.every((a) => a.clube === "Flamengo/RJ")).toBe(true);
  });

  it("filtro por faixa de idade Sub-21 funciona", () => {
    const filtered = filterAtletas(mockAtletas, "", null, null, 1); // Sub-21
    expect(filtered.length).toBe(1);
    expect(filtered[0].nome).toBe("André Costa");
  });

  it("filtro por faixa 26-30 funciona", () => {
    const filtered = filterAtletas(mockAtletas, "", null, null, 3); // 26-30
    expect(filtered.length).toBe(2);
  });

  it("filtros combinados (posição + clube) funcionam", () => {
    const filtered = filterAtletas(mockAtletas, "", "Zagueiro", "Flamengo/RJ", 0);
    expect(filtered.length).toBe(1);
    expect(filtered[0].nome).toBe("João Silva");
  });

  it("busca + filtro combinados funcionam", () => {
    const filtered = filterAtletas(mockAtletas, "Pedro", "Extremo", null, 0);
    expect(filtered.length).toBe(1);
    expect(filtered[0].nome).toBe("Pedro Santos");
  });

  it("filtros sem resultado retornam lista vazia", () => {
    const filtered = filterAtletas(mockAtletas, "", "Goleiro", "Vasco/RJ", 0);
    expect(filtered.length).toBe(0);
  });
});

describe("Modal de confirmação - resumo de filtros", () => {
  it("sem filtros mostra 'Todas' e 'Todos'", () => {
    const summary = buildFilterSummary(null, null, 0, "");
    expect(summary.posicao).toBe("Todas");
    expect(summary.faixaIdade).toBe("Todas");
    expect(summary.clube).toBe("Todos");
    expect(summary.busca).toBeUndefined();
  });

  it("com filtros aplicados mostra valores corretos", () => {
    const summary = buildFilterSummary("Zagueiro", "Flamengo/RJ", 3, "João");
    expect(summary.posicao).toBe("Zagueiro");
    expect(summary.faixaIdade).toBe("26-30");
    expect(summary.clube).toBe("Flamengo/RJ");
    expect(summary.busca).toBe("João");
  });

  it("faixa Sub-21 aparece no resumo", () => {
    const summary = buildFilterSummary(null, null, 1, "");
    expect(summary.faixaIdade).toBe("Sub-21");
  });

  it("faixa 31+ aparece no resumo", () => {
    const summary = buildFilterSummary(null, null, 4, "");
    expect(summary.faixaIdade).toBe("31+");
  });
});
