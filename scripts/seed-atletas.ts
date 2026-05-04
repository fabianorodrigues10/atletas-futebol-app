import { db } from "../server/db";

const atletasTeste = [
  {
    nome: "João Silva",
    posicao: "Goleiro",
    segundaPosicao: null,
    clube: "Marcílio Dias",
    dataNascimento: "1995-03-15",
    idade: 30,
    altura: "1.87",
    pe: "direito",
    link: "https://ogol.com.br",
    escala: "5",
    valencia: "Goleiro experiente com boa saída de bola",
    naturalidade: "Santa Catarina",
    userId: 1,
  },
  {
    nome: "Carlos Santos",
    posicao: "Zagueiro",
    segundaPosicao: null,
    clube: "Marcílio Dias",
    dataNascimento: "1998-07-22",
    idade: 27,
    altura: "1.88",
    pe: "direito",
    link: "https://ogol.com.br",
    escala: "6",
    valencia: "Zagueiro forte, com boa marcação",
    naturalidade: "Santa Catarina",
    userId: 1,
  },
  {
    nome: "Pedro Oliveira",
    posicao: "Lateral-Direito",
    segundaPosicao: "Zagueiro",
    clube: "Marcílio Dias",
    dataNascimento: "2000-01-10",
    idade: 25,
    altura: "1.78",
    pe: "direito",
    link: "https://ogol.com.br",
    escala: "7",
    valencia: "Lateral rápido com boa capacidade de cruzamento",
    naturalidade: "Santa Catarina",
    userId: 1,
  },
  {
    nome: "Lucas Ferreira",
    posicao: "Meia",
    segundaPosicao: "Volante",
    clube: "Marcílio Dias",
    dataNascimento: "1997-05-18",
    idade: 28,
    altura: "1.75",
    pe: "esquerdo",
    link: "https://ogol.com.br",
    escala: "7",
    valencia: "Meia criativo com boa visão de jogo",
    naturalidade: "Santa Catarina",
    userId: 1,
  },
  {
    nome: "Rafael Costa",
    posicao: "Atacante",
    segundaPosicao: "Meia",
    clube: "Marcílio Dias",
    dataNascimento: "1999-09-30",
    idade: 26,
    altura: "1.82",
    pe: "direito",
    link: "https://ogol.com.br",
    escala: "8",
    valencia: "Atacante rápido com boa finalização",
    naturalidade: "Santa Catarina",
    userId: 1,
  },
];

async function seed() {
  console.log("Iniciando seed de atletas...");
  try {
    for (const atleta of atletasTeste) {
      await db.createAtleta(atleta as any);
      console.log(`✓ Atleta ${atleta.nome} criado`);
    }
    console.log("✓ Seed concluído com sucesso!");
  } catch (error) {
    console.error("Erro ao fazer seed:", error);
    process.exit(1);
  }
}

seed();
