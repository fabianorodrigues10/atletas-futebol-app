// Mapeamento de valências ofensivas e defensivas
// Primeira coluna: abreviação (usada nos quadradinhos do scout)
// Segunda coluna: nome completo (usado nos relatórios)

export const VALENCIAS_OFENSIVAS = {
  "Gol": "Gol",
  "Ass": "Assistência",
  "Fin C": "Finalização Certa",
  "Fin E": "Finalização Errada",
  "Pass C": "Passe Certo",
  "Pass E": "Passe Errado",
  "Pass F": "Passe para Finalização",
  "Cruz C": "Cruzamento Certo",
  "Cruz E": "Cruzamento Errado",
  "Long C": "Passe Longo Certo",
  "Long E": "Passe Longo Errado",
  "Drib C": "Drible Certo",
  "Drib E": "Drible Errado",
  "Desp": "Desperdício de Bola",
  "Falt S": "Falta Sofrida",
} as const;

export const VALENCIAS_DEFENSIVAS = {
  "Des": "Desarmes",
  "Aer G": "Jogo Aéreo Ganho",
  "Aer P": "Jogo Aéreo Perdido",
  "Prim G": "Bola Aérea Área Ganha",
  "Prim P": "Bola Aérea Área Perdida",
  "Fal C": "Falta Cometida",
  "Recu": "Bola Recuperada",
  "Inter": "Finalização Interceptada",
  "Duel G": "Duelo pelo chão Ganho",
  "Duel P": "Duelo pelo chão Perdido",
} as const;

// Função auxiliar para obter o nome completo de uma valência
export function obterNomeValencia(abreviacao: string): string {
  return VALENCIAS_OFENSIVAS[abreviacao as keyof typeof VALENCIAS_OFENSIVAS] ||
         VALENCIAS_DEFENSIVAS[abreviacao as keyof typeof VALENCIAS_DEFENSIVAS] ||
         abreviacao;
}

// Tipo para valências
export type ValenciaOfensiva = keyof typeof VALENCIAS_OFENSIVAS;
export type ValenciaDefensiva = keyof typeof VALENCIAS_DEFENSIVAS;
