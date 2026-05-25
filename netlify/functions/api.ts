import type { Handler } from "@netlify/functions";

// URL do servidor backend em produção
const BACKEND_URL =
  "https://3000-i5kwitdmyqlrw6vnwa7mo-90ced762.us2.manus.computer";

/**
 * Netlify Function que faz proxy de todas as requisições /api/*
 * para o servidor backend em produção.
 *
 * Isso resolve o problema de CORS e permite que o frontend
 * acesse os dados do backend através do mesmo domínio.
 */
const handler: Handler = async (event) => {
  try {
    // Extrair o caminho da requisição (remover /.netlify/functions/api)
    const path = event.path.replace("/.netlify/functions/api", "");

    // URL completa do backend
    const backendUrl = `${BACKEND_URL}${path}`;

    console.log(`[API Proxy] ${event.httpMethod} ${backendUrl}`);

    // Headers para passar para o backend
    const headers: Record<string, string> = {};

    // Copiar headers relevantes da requisição original
    if (event.headers["content-type"]) {
      headers["content-type"] = event.headers["content-type"];
    }

    // Fazer a requisição para o backend
    const response = await fetch(backendUrl, {
      method: event.httpMethod,
      headers,
      body:
        event.httpMethod !== "GET" && event.body
          ? event.body
          : undefined,
    });

    // Ler o corpo da resposta
    const responseBody = await response.text();

    console.log(`[API Proxy] Response: ${response.status}`);

    // Retornar a resposta com os headers apropriados
    return {
      statusCode: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: responseBody,
    };
  } catch (error) {
    console.error("[API Proxy] Erro ao fazer proxy da requisição:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Erro ao conectar ao servidor backend",
        message:
          error instanceof Error
            ? error.message
            : "Erro desconhecido",
      }),
    };
  }
};

export { handler };
