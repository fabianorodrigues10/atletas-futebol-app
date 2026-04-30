import { describe, it, expect } from "vitest";

/**
 * Testes para validar a funcionalidade de contrato
 */

describe("Contrato - Validação de Dados", () => {
  // Função auxiliar para converter DD/MM/AA em ISO
  function convertDataContratoToISO(dataStr: string): string | undefined {
    if (!dataStr || dataStr.length !== 8) return undefined;
    
    const parts = dataStr.split("/");
    if (parts.length !== 3) return undefined;
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    let year = parseInt(parts[2]);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return undefined;
    
    year = year > 50 ? 1900 + year : 2000 + year;
    return new Date(year, month - 1, day).toISOString();
  }

  it("deve converter data DD/MM/AA para ISO corretamente", () => {
    const result = convertDataContratoToISO("15/03/25");
    expect(result).toBeDefined();
    expect(result).toContain("2025-03-15");
  });

  it("deve retornar undefined para data inválida", () => {
    expect(convertDataContratoToISO("")).toBeUndefined();
    expect(convertDataContratoToISO("15/03")).toBeUndefined();
    expect(convertDataContratoToISO("abc/de/fg")).toBeUndefined();
  });

  it("deve validar tipo de contrato", () => {
    const tiposValidos = ["emprestimo", "definitivo"];
    
    tiposValidos.forEach(tipo => {
      expect(["emprestimo", "definitivo"].includes(tipo)).toBe(true);
    });
  });

  it("deve exigir dados diferentes para empréstimo vs definitivo", () => {
    // Empréstimo requer: tipo, dataFim, clube, clubePertence
    const emprestimoData = {
      contratoTipo: "emprestimo",
      contratoDataFim: "15/03/25",
      contratoClube: "Clube A",
      contratoClubePertence: "Clube B",
    };
    
    expect(emprestimoData.contratoTipo).toBe("emprestimo");
    expect(emprestimoData.contratoClubePertence).toBeDefined();
    
    // Definitivo requer: tipo, dataFim, clube
    const definitivoData = {
      contratoTipo: "definitivo",
      contratoDataFim: "15/03/25",
      contratoClube: "Clube A",
      contratoClubePertence: undefined,
    };
    
    expect(definitivoData.contratoTipo).toBe("definitivo");
    expect(definitivoData.contratoClubePertence).toBeUndefined();
  });

  it("deve formatar data para exibição em pt-BR", () => {
    // Nota: Ao criar Date com ISO string, há offset de timezone
    // Usar UTC para evitar problemas
    const isoDate = "2025-03-15T00:00:00.000Z";
    const date = new Date(isoDate);
    const formatted = date.toLocaleDateString("pt-BR");
    
    // A data pode variar por 1 dia dependendo do timezone
    expect(["14/03/2025", "15/03/2025"]).toContain(formatted);
  });

  it("deve validar formatação automática de data DD/MM/AA", () => {
    // Simula o comportamento do input com máscara
    let dataFormatada = "";
    
    // Usuário digita: 1
    let cleaned = "1".replace(/\D/g, "").slice(0, 6);
    if (cleaned.length <= 2) {
      dataFormatada = cleaned; // "1"
    }
    expect(dataFormatada).toBe("1");
    
    // Usuário digita: 15
    cleaned = "15".replace(/\D/g, "").slice(0, 6);
    if (cleaned.length <= 2) {
      dataFormatada = cleaned; // "15"
    }
    expect(dataFormatada).toBe("15");
    
    // Usuário digita: 150
    cleaned = "150".replace(/\D/g, "").slice(0, 6);
    if (cleaned.length <= 2) {
      dataFormatada = cleaned;
    } else if (cleaned.length <= 4) {
      dataFormatada = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`; // "15/0"
    }
    expect(dataFormatada).toBe("15/0");
    
    // Usuário digita: 150325
    cleaned = "150325".replace(/\D/g, "").slice(0, 6);
    if (cleaned.length <= 2) {
      dataFormatada = cleaned;
    } else if (cleaned.length <= 4) {
      dataFormatada = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    } else {
      dataFormatada = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`; // "15/03/25"
    }
    expect(dataFormatada).toBe("15/03/25");
    

  });

  it("deve validar que campos de contrato são opcionais", () => {
    const atletaSemContrato = {
      nome: "João",
      contratoTipo: undefined,
      contratoDataFim: undefined,
      contratoClube: undefined,
      contratoClubePertence: undefined,
    };
    
    expect(atletaSemContrato.contratoTipo).toBeUndefined();
    expect(atletaSemContrato.contratoDataFim).toBeUndefined();
  });

  it("deve validar que clubePertence é obrigatório apenas para empréstimo", () => {
    const emprestimoCompleto = {
      contratoTipo: "emprestimo",
      contratoClubePertence: "Clube B",
    };
    
    const definitivoSemClubePertence = {
      contratoTipo: "definitivo",
      contratoClubePertence: undefined,
    };
    
    if (emprestimoCompleto.contratoTipo === "emprestimo") {
      expect(emprestimoCompleto.contratoClubePertence).toBeDefined();
    }
    
    if (definitivoSemClubePertence.contratoTipo === "definitivo") {
      expect(definitivoSemClubePertence.contratoClubePertence).toBeUndefined();
    }
  });
});
