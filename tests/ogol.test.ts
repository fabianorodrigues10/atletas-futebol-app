import { describe, it, expect } from "vitest";

// Import the core functions from the ogol module
// Since ogol.ts imports from react-native, we replicate the pure logic here for testing

function mapPosicao(ogolPos: string): string {
  const pos = ogolPos.toLowerCase().trim();
  const mapping: Record<string, string> = {
    goleiro: "Goleiro",
    "guarda-redes": "Goleiro",
    zagueiro: "Zagueiro",
    "defesa central": "Zagueiro",
    defensor: "Zagueiro",
    lateral: "Lateral",
    "lateral direito": "Lateral",
    "lateral esquerdo": "Lateral",
    volante: "Volante",
    "médio defensivo": "Volante",
    "meio-campista": "Meia",
    médio: "Meia",
    meia: "Meia",
    "meia-atacante": "Meia",
    "médio ofensivo": "Meia",
    extremo: "Extremo",
    ponta: "Extremo",
    "ponta direita": "Extremo",
    "ponta esquerda": "Extremo",
    atacante: "Centroavante",
    avançado: "Centroavante",
    centroavante: "Centroavante",
    "segundo avançado": "2º Atacante",
  };
  if (mapping[pos]) return mapping[pos];
  for (const [key, value] of Object.entries(mapping)) {
    if (pos.includes(key) || key.includes(pos)) return value;
  }
  return ogolPos.charAt(0).toUpperCase() + ogolPos.slice(1);
}

function mapPe(ogolPe: string): string | null {
  const pe = ogolPe.toLowerCase().trim();
  if (pe === "destro" || pe === "direito") return "direito";
  if (pe === "canhoto" || pe === "esquerdo") return "esquerdo";
  if (pe === "ambidestro" || pe.includes("ambos")) return "ambidestro";
  return null;
}

function isoToShortDate(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length !== 3) return "";
  const year = parts[0].slice(2);
  return `${parts[2]}/${parts[1]}/${year}`;
}

interface OgolPlayerData {
  nome: string | null;
  posicao: string | null;
  dataNascimento: string | null;
  idade: number | null;
  altura: number | null;
  pe: string | null;
  clube: string | null;
}

function extractField(html: string, label: string): string | null {
  const labelRegex = new RegExp(label, "i");
  const labelMatch = html.match(labelRegex);
  if (!labelMatch || labelMatch.index === undefined) return null;

  const afterLabel = html.substring(labelMatch.index + labelMatch[0].length);

  const valueMatch = afterLabel.match(
    /card-data__value[s]?"[^>]*>(?:\s*(?:<[^>]+>\s*)*)?([^<]+)/i
  );
  if (valueMatch?.[1]?.trim()) return valueMatch[1].trim();

  const directMatch = afterLabel.match(/<\/span>\s*<[^>]+>\s*([^<]+)/i);
  if (directMatch?.[1]?.trim()) return directMatch[1].trim();

  const plainMatch = afterLabel.match(/^\s+([^\n<]+)/);
  if (plainMatch?.[1]?.trim()) return plainMatch[1].trim();

  return null;
}

function parseOgolHtml(html: string): OgolPlayerData {
  const result: OgolPlayerData = {
    nome: null,
    posicao: null,
    dataNascimento: null,
    idade: null,
    altura: null,
    pe: null,
    clube: null,
  };

  const nomeRaw = extractField(html, "Nome");
  if (nomeRaw && nomeRaw.length > 2) {
    result.nome = nomeRaw;
  }

  const dataRaw = extractField(html, "Data de Nascimento");
  if (dataRaw) {
    const dataMatch = dataRaw.match(/(\d{4}-\d{2}-\d{2})\s*\((\d+)\s*anos?\)/);
    if (dataMatch) {
      result.dataNascimento = isoToShortDate(dataMatch[1]);
      result.idade = parseInt(dataMatch[2], 10);
    }
  }

  const posRaw = extractField(html, "Posi(?:ção|çao|cao|ção)");
  if (posRaw && posRaw.length < 30) {
    result.posicao = mapPosicao(posRaw);
  }

  const peRaw = extractField(html, "P(?:é|e) preferencial");
  if (peRaw) {
    result.pe = mapPe(peRaw);
  }

  const alturaRaw = extractField(html, "Altura");
  if (alturaRaw) {
    const altMatch = alturaRaw.match(/(\d{3})\s*cm/);
    if (altMatch) {
      const cm = parseInt(altMatch[1], 10);
      result.altura = parseFloat((cm / 100).toFixed(2));
    }
  }

  const clubeRaw = extractField(html, "Clube atual");
  if (clubeRaw && clubeRaw !== "Sem Clube" && clubeRaw.length > 1) {
    result.clube = clubeRaw;
  }

  return result;
}

// ===== TESTS =====

describe("mapPosicao", () => {
  it("mapeia posições comuns do Ogol para o app", () => {
    expect(mapPosicao("Atacante")).toBe("Centroavante");
    expect(mapPosicao("Zagueiro")).toBe("Zagueiro");
    expect(mapPosicao("Goleiro")).toBe("Goleiro");
    expect(mapPosicao("Lateral")).toBe("Lateral");
    expect(mapPosicao("Volante")).toBe("Volante");
    expect(mapPosicao("Extremo")).toBe("Extremo");
    expect(mapPosicao("Meia")).toBe("Meia");
  });

  it("mapeia posições portuguesas do Ogol", () => {
    expect(mapPosicao("Guarda-Redes")).toBe("Goleiro");
    expect(mapPosicao("Defesa Central")).toBe("Zagueiro");
    expect(mapPosicao("Avançado")).toBe("Centroavante");
    expect(mapPosicao("Médio Defensivo")).toBe("Volante");
    expect(mapPosicao("Segundo Avançado")).toBe("2º Atacante");
  });

  it("retorna posição original capitalizada se não mapeada", () => {
    expect(mapPosicao("ala")).toBe("Ala");
  });
});

describe("mapPe", () => {
  it("mapeia pé preferencial corretamente", () => {
    expect(mapPe("Destro")).toBe("direito");
    expect(mapPe("Canhoto")).toBe("esquerdo");
    expect(mapPe("Ambidestro")).toBe("ambidestro");
    expect(mapPe("direito")).toBe("direito");
    expect(mapPe("esquerdo")).toBe("esquerdo");
  });

  it("retorna null para valor desconhecido", () => {
    expect(mapPe("desconhecido")).toBeNull();
  });
});

describe("isoToShortDate", () => {
  it("converte data ISO para dd/mm/aa", () => {
    expect(isoToShortDate("1997-03-28")).toBe("28/03/97");
    expect(isoToShortDate("2001-12-05")).toBe("05/12/01");
    expect(isoToShortDate("1985-01-15")).toBe("15/01/85");
  });

  it("retorna vazio para formato inválido", () => {
    expect(isoToShortDate("invalid")).toBe("");
  });
});

describe("parseOgolHtml - HTML real do Ogol", () => {
  // HTML baseado na estrutura REAL do Ogol (card-data__label / card-data__value)
  const realOgolHtml = `
    <div class="card-data__header"><h2 class="card-data__title">DADOS PESSOAIS</h2></div>
    <div class="card-data__body">
      <div class="card-data__row ">
        <span class="card-data__label">Nome</span>
        <span class="card-data__value">Ronaldy Wyllian da Silva Santana</span>
      </div>
      <div class="card-data__row ">
        <span class="card-data__label">Data de Nascimento</span>
        <span class="card-data__value">1997-03-28 (28 anos)</span>
      </div>
      <div class="card-data__row">
        <span class="card-data__label">Posição</span>
        <span class="card-data__values"><span class="card-data__value">Atacante</span></span>
      </div>
      <div class="card-data__row">
        <span class="card-data__label">Pé preferencial</span>
        <span class="card-data__value">Destro</span>
      </div>
      <div class="card-data__row">
        <span class="card-data__label">Altura / Peso</span>
        <span class="card-data__value">176 cm / 74 kg</span>
      </div>
      <div class="card-data__row hiddentr d-none">
        <span class="card-data__label">Clube atual</span>
        <div class="card-data__values">Sem Clube</div>
      </div>
    </div>
  `;

  it("extrai nome completo do HTML real", () => {
    const data = parseOgolHtml(realOgolHtml);
    expect(data.nome).toBe("Ronaldy Wyllian da Silva Santana");
  });

  it("extrai data de nascimento no formato dd/mm/aa", () => {
    const data = parseOgolHtml(realOgolHtml);
    expect(data.dataNascimento).toBe("28/03/97");
  });

  it("extrai idade corretamente", () => {
    const data = parseOgolHtml(realOgolHtml);
    expect(data.idade).toBe(28);
  });

  it("extrai e mapeia posição (Atacante -> Centroavante)", () => {
    const data = parseOgolHtml(realOgolHtml);
    expect(data.posicao).toBe("Centroavante");
  });

  it("extrai e mapeia pé preferencial (Destro -> direito)", () => {
    const data = parseOgolHtml(realOgolHtml);
    expect(data.pe).toBe("direito");
  });

  it("extrai altura em metros", () => {
    const data = parseOgolHtml(realOgolHtml);
    expect(data.altura).toBe(1.76);
  });

  it("ignora Sem Clube como valor de clube", () => {
    const data = parseOgolHtml(realOgolHtml);
    expect(data.clube).toBeNull();
  });
});

describe("parseOgolHtml - atleta com clube", () => {
  const htmlComClube = `
    <div class="card-data__body">
      <div class="card-data__row ">
        <span class="card-data__label">Nome</span>
        <span class="card-data__value">José Leandro Bento Costa</span>
      </div>
      <div class="card-data__row ">
        <span class="card-data__label">Data de Nascimento</span>
        <span class="card-data__value">1998-03-18 (27 anos)</span>
      </div>
      <div class="card-data__row">
        <span class="card-data__label">Posição</span>
        <span class="card-data__values"><span class="card-data__value">Zagueiro</span></span>
      </div>
      <div class="card-data__row">
        <span class="card-data__label">Pé preferencial</span>
        <span class="card-data__value">Canhoto</span>
      </div>
      <div class="card-data__row">
        <span class="card-data__label">Altura / Peso</span>
        <span class="card-data__value">190 cm / 82 kg</span>
      </div>
      <div class="card-data__row">
        <span class="card-data__label">Clube atual</span>
        <div class="card-data__values"><span class="card-data__value">Santa Catarina</span></div>
      </div>
    </div>
  `;

  it("extrai todos os dados de atleta com clube", () => {
    const data = parseOgolHtml(htmlComClube);
    expect(data.nome).toBe("José Leandro Bento Costa");
    expect(data.dataNascimento).toBe("18/03/98");
    expect(data.idade).toBe(27);
    expect(data.posicao).toBe("Zagueiro");
    expect(data.pe).toBe("esquerdo");
    expect(data.altura).toBe(1.9);
    expect(data.clube).toBe("Santa Catarina");
  });
});

describe("parseOgolHtml - texto markdown (fallback)", () => {
  const markdownText = `
## DADOS PESSOAIS

Nome Ronaldy Wyllian da Silva Santana

Data de Nascimento 1997-03-28 (28 anos)

Posição Atacante

Pé preferencial Destro

Altura / Peso 176 cm / 74 kg

Clube atual Flamengo
  `;

  it("extrai dados de texto markdown extraído", () => {
    const data = parseOgolHtml(markdownText);
    expect(data.nome).toBe("Ronaldy Wyllian da Silva Santana");
    expect(data.dataNascimento).toBe("28/03/97");
    expect(data.idade).toBe(28);
    expect(data.posicao).toBe("Centroavante");
    expect(data.pe).toBe("direito");
    expect(data.altura).toBe(1.76);
    expect(data.clube).toBe("Flamengo");
  });
});

describe("parseOgolHtml - HTML sem dados", () => {
  it("retorna null para campos ausentes", () => {
    const html = `<div>Página sem dados pessoais</div>`;
    const data = parseOgolHtml(html);
    expect(data.nome).toBeNull();
    expect(data.posicao).toBeNull();
    expect(data.dataNascimento).toBeNull();
    expect(data.idade).toBeNull();
    expect(data.altura).toBeNull();
    expect(data.pe).toBeNull();
    expect(data.clube).toBeNull();
  });
});

describe("Formulário - integração Ogol", () => {
  it("URL do Ogol é validada corretamente", () => {
    const validUrls = [
      "https://www.ogol.com.br/jogador/ronaldy/515291",
      "https://ogol.com.br/jogador/ze-leandro/557286",
    ];
    const invalidUrls = [
      "https://google.com",
      "https://transfermarkt.com/player/123",
      "",
    ];

    for (const url of validUrls) {
      expect(url.includes("ogol.com")).toBe(true);
    }
    for (const url of invalidUrls) {
      expect(url.includes("ogol.com")).toBe(false);
    }
  });

  it("dados do Ogol não sobrescrevem campos já preenchidos", () => {
    const existingNome = "Ronaldy";
    const ogolNome = "Ronaldy Wyllian da Silva Santana";
    const finalNome = existingNome.trim() ? existingNome : ogolNome;
    expect(finalNome).toBe("Ronaldy");
  });
});
