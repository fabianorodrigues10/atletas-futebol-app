import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and tailwind-merge.
 * This ensures Tailwind classes are properly merged without conflicts.
 *
 * Usage:
 * ```tsx
 * cn("px-4 py-2", isActive && "bg-primary", className)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata altura de número (ex: 165) para formato brasileiro (ex: 1,65)
 * @param altura - Altura em centímetros como string ou número
 * @returns Altura formatada com vírgula como separador decimal (ex: "1,65")
 */
export function formatarAltura(altura: string | number | null | undefined): string {
  if (!altura) return "—";
  
  const num = typeof altura === "string" ? parseFloat(altura) : altura;
  
  if (isNaN(num)) return "—";
  
  // Se o número é maior que 100, assume que está em centímetros e converte para metros
  const alturaEmMetros = num > 100 ? num / 100 : num;
  
  // Formata com vírgula como separador decimal e máximo 2 casas decimais
  return alturaEmMetros.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
