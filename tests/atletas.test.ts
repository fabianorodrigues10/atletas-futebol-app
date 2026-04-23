import { describe, it, expect, beforeAll } from "vitest";
import * as db from "../server/db";

describe("Atletas Database Functions", () => {
  const testUserId = 999999; // ID fictício para testes
  
  it("deve criar um atleta", async () => {
    const atletaData = {
      userId: testUserId,
      nome: "Teste Atleta",
      posicao: "Atacante",
      clube: "Teste FC",
      idade: 25,
      altura: "180",
    };
    
    const id = await db.createAtleta(atletaData);
    expect(id).toBeGreaterThan(0);
    
    // Limpar após teste
    await db.deleteAtleta(id, testUserId);
  });
  
  it("deve buscar atletas por usuário", async () => {
    // Cria um atleta de teste
    const atletaData = {
      userId: testUserId,
      nome: "Teste Busca",
      posicao: "Meio-campo",
    };
    
    const id = await db.createAtleta(atletaData);
    
    // Busca atletas
    const atletas = await db.getAtletas(testUserId);
    expect(Array.isArray(atletas)).toBe(true);
    
    // Limpar
    await db.deleteAtleta(id, testUserId);
  });
  
  it("deve atualizar um atleta", async () => {
    // Cria atleta
    const id = await db.createAtleta({
      userId: testUserId,
      nome: "Antes Update",
      posicao: "Goleiro",
    });
    
    // Atualiza
    await db.updateAtleta(id, testUserId, {
      nome: "Depois Update",
      clube: "Novo Clube",
    });
    
    // Verifica
    const atleta = await db.getAtletaById(id, testUserId);
    expect(atleta?.nome).toBe("Depois Update");
    expect(atleta?.clube).toBe("Novo Clube");
    
    // Limpar
    await db.deleteAtleta(id, testUserId);
  });
  
  it("deve buscar atletas com filtros", async () => {
    // Cria alguns atletas de teste
    const id1 = await db.createAtleta({
      userId: testUserId,
      nome: "Jogador A",
      posicao: "Atacante",
      clube: "Time A",
      idade: 20,
    });
    
    const id2 = await db.createAtleta({
      userId: testUserId,
      nome: "Jogador B",
      posicao: "Zagueiro",
      clube: "Time B",
      idade: 30,
    });
    
    // Busca com filtro de posição
    const atacantes = await db.searchAtletas(testUserId, {
      posicao: "Atacante",
    });
    
    expect(atacantes.length).toBeGreaterThan(0);
    expect(atacantes.some(a => a.id === id1)).toBe(true);
    
    // Busca com filtro de idade
    const jovens = await db.searchAtletas(testUserId, {
      idadeMax: 25,
    });
    
    expect(jovens.some(a => a.id === id1)).toBe(true);
    
    // Limpar
    await db.deleteAtleta(id1, testUserId);
    await db.deleteAtleta(id2, testUserId);
  });
  
  it("deve excluir um atleta", async () => {
    const id = await db.createAtleta({
      userId: testUserId,
      nome: "Para Excluir",
    });
    
    await db.deleteAtleta(id, testUserId);
    
    const atleta = await db.getAtletaById(id, testUserId);
    expect(atleta).toBeNull();
  });
});

describe("Campos Customizados Database Functions", () => {
  const testUserId = 999999;
  
  it("deve criar um campo customizado", async () => {
    const campoData = {
      userId: testUserId,
      nomeCampo: "Teste Campo",
      tipoCampo: "text" as const,
      ativo: true,
      ordem: 0,
    };
    
    const id = await db.createCampoCustomizado(campoData);
    expect(id).toBeGreaterThan(0);
    
    // Limpar
    await db.deleteCampoCustomizado(id, testUserId);
  });
  
  it("deve buscar campos customizados", async () => {
    const id = await db.createCampoCustomizado({
      userId: testUserId,
      nomeCampo: "Campo Teste",
      tipoCampo: "number" as const,
      ativo: true,
      ordem: 0,
    });
    
    const campos = await db.getCamposCustomizados(testUserId);
    expect(Array.isArray(campos)).toBe(true);
    
    // Limpar
    await db.deleteCampoCustomizado(id, testUserId);
  });
  
  it("deve atualizar um campo customizado", async () => {
    const id = await db.createCampoCustomizado({
      userId: testUserId,
      nomeCampo: "Campo Original",
      tipoCampo: "text" as const,
      ativo: true,
      ordem: 0,
    });
    
    await db.updateCampoCustomizado(id, testUserId, {
      nomeCampo: "Campo Atualizado",
      ativo: false,
    });
    
    const campos = await db.getCamposCustomizados(testUserId);
    const campo = campos.find(c => c.id === id);
    
    expect(campo?.nomeCampo).toBe("Campo Atualizado");
    expect(campo?.ativo).toBe(false);
    
    // Limpar
    await db.deleteCampoCustomizado(id, testUserId);
  });
});
