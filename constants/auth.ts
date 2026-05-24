/**
 * API Base URL Configuration
 * 
 * Retorna a URL base correta da API dependendo do ambiente:
 * - Desenvolvimento (localhost): http://localhost:3000
 * - Produção (Netlify): https://atletas-futebol-app.netlify.app
 * - Domínio customizado: https://marciliodias.app.br
 */

export function getApiBaseUrl(): string {
  // Verificar se está em ambiente de desenvolvimento
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Se estiver em localhost, usar o servidor de desenvolvimento local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    
    // Para qualquer outro domínio (produção), usar a URL do Netlify
    // O Netlify vai fazer o proxy para o backend correto
    return 'https://atletas-futebol-app.netlify.app';
  }
  
  // Fallback para SSR ou ambiente sem window
  return 'https://atletas-futebol-app.netlify.app';
}

/**
 * Alternativa: Se você quiser usar o domínio customizado diretamente
 * Descomente a função abaixo e comente a função acima
 */
/*
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
  }
  
  // Usar o domínio customizado em produção
  return 'https://marciliodias.app.br';
}
*/
