/**
 * OgolWebScraper - Componente com WebView oculta para extrair dados do Ogol.
 *
 * A WebView carrega a página do Ogol como um navegador real, passando pela
 * proteção Cloudflare. Depois que a página carrega, injeta JavaScript para
 * extrair os dados pessoais do jogador e retorna via callback.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { View, Platform } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

export interface OgolPlayerData {
  nome: string | null;
  posicao: string | null;
  dataNascimento: string | null; // formato dd/mm/aa
  idade: number | null;
  altura: number | null; // em metros (ex: 1.76)
  pe: string | null; // "direito" | "esquerdo" | "ambidestro"
  clube: string | null;
  naturalidade: string | null; // Cidade/Estado de nascimento
}

interface OgolWebScraperProps {
  url: string | null; // URL do Ogol para carregar (null = não carregar)
  onResult: (data: OgolPlayerData) => void;
  onError: (error: string) => void;
  onLoadStart?: () => void;
}

// JavaScript injetado na WebView para extrair dados do Ogol
const INJECTED_JS = `
(function() {
  // Aguarda a página carregar completamente
  function tryExtract() {
    var result = {
      nome: null,
      posicao: null,
      dataNascimento: null,
      idade: null,
      altura: null,
      pe: null,
      clube: null,
      naturalidade: null
    };

    // Busca todos os labels e valores na seção de dados pessoais
    var labels = document.querySelectorAll('.card-data__label, .card-data__title');
    var values = document.querySelectorAll('.card-data__value, .card-data__text');

    // Se não encontrou com classes específicas, tenta abordagem genérica
    if (labels.length === 0) {
      // Tenta encontrar a seção "DADOS PESSOAIS" pelo texto
      var allElements = document.querySelectorAll('*');
      var dadosPessoais = null;
      for (var i = 0; i < allElements.length; i++) {
        if (allElements[i].textContent && allElements[i].textContent.trim() === 'DADOS PESSOAIS') {
          dadosPessoais = allElements[i].parentElement;
          break;
        }
      }
      if (dadosPessoais) {
        labels = dadosPessoais.querySelectorAll('span, div, td');
      }
    }

    // Abordagem 1: Busca por card-data__row (cada row tem label + value)
    var rows = document.querySelectorAll('.card-data__row');
    if (rows.length > 0) {
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var labelEl = row.querySelector('.card-data__label');
        if (!labelEl) continue;
        var labelText = labelEl.textContent ? labelEl.textContent.trim() : '';
        
        // Busca o valor: pode ser .card-data__value, .card-data__values, ou .text dentro de micrologo_and_text
        var valueText = '';
        var valueEl = row.querySelector('.card-data__value');
        var textEl = row.querySelector('.micrologo_and_text .text');
        var valuesEl = row.querySelector('.card-data__values');
        
        if (textEl) {
          valueText = textEl.textContent ? textEl.textContent.trim() : '';
        } else if (valueEl) {
          valueText = valueEl.textContent ? valueEl.textContent.trim() : '';
        } else if (valuesEl) {
          valueText = valuesEl.textContent ? valuesEl.textContent.trim() : '';
        }

        if (!valueText) continue;

        if (labelText === 'Nome' || labelText === 'Nome Completo') {
          result.nome = valueText;
        }
        else if (labelText.indexOf('Data de Nascimento') !== -1) {
          var dateMatch = valueText.match(/(\\d{4})-(\\d{2})-(\\d{2})\\s*\\((\\d+)\\s*anos?\\)/);
          if (dateMatch) {
            var yy = dateMatch[1].slice(2);
            result.dataNascimento = dateMatch[3] + '/' + dateMatch[2] + '/' + yy;
            result.idade = parseInt(dateMatch[4]);
          } else {
            var dateMatch2 = valueText.match(/(\\d{2})\\/(\\d{2})\\/(\\d{4})\\s*\\((\\d+)\\s*anos?\\)/);
            if (dateMatch2) {
              var yy2 = dateMatch2[3].slice(2);
              result.dataNascimento = dateMatch2[1] + '/' + dateMatch2[2] + '/' + yy2;
              result.idade = parseInt(dateMatch2[4]);
            }
          }
        }
        else if (labelText === 'Posi\u00e7\u00e3o' || labelText === 'Posicao' || (labelText.indexOf('Posi') !== -1 && labelText.length < 20)) {
          // Posição: o valor está dentro de card-data__values > card-data__value
          var posValueEl = row.querySelector('.card-data__value');
          if (posValueEl) {
            result.posicao = posValueEl.textContent ? posValueEl.textContent.trim() : '';
          } else {
            result.posicao = valueText;
          }
        }
        else if (labelText.indexOf('preferencial') !== -1) {
          result.pe = valueText.toLowerCase();
        }
        else if (labelText.indexOf('Altura') !== -1) {
          var altMatch = valueText.match(/(\\d{3})\\s*cm/);
          if (altMatch) {
            result.altura = parseInt(altMatch[1]) / 100;
          }
        }
        else if (labelText.indexOf('Clube atual') !== -1 || labelText === 'Clube') {
          // Clube: valor pode estar em .text dentro de micrologo_and_text
          var clubeTextEl = row.querySelector('.micrologo_and_text .text');
          var clubeValue = clubeTextEl ? (clubeTextEl.textContent ? clubeTextEl.textContent.trim() : '') : valueText;
          if (clubeValue && clubeValue !== 'Sem Clube') {
            result.clube = clubeValue;
          }
        }
        else if (labelText.indexOf('Naturalidade') !== -1 || (labelText.indexOf('Nascimento') !== -1 && labelText.indexOf('Data') === -1)) {
          // Naturalidade: valor pode estar em .text dentro de micrologo_and_text
          var natTextEl = row.querySelector('.micrologo_and_text .text');
          if (natTextEl) {
            result.naturalidade = natTextEl.textContent ? natTextEl.textContent.trim() : '';
          } else {
            result.naturalidade = valueText;
          }
        }
      }
    }

    // Abordagem 2: Fallback com regex no HTML inteiro (roda se algum campo importante estiver faltando)
    if (!result.posicao || !result.clube || !result.naturalidade || !result.nome) {
      var bodyHtml = document.body ? document.body.innerHTML : '';
      
      // Nome (só se não encontrou na Abordagem 1)
      if (!result.nome) {
        var nomeMatch = bodyHtml.match(/Nome<\\/span>\\s*<span[^>]*>([^<]+)/i);
        if (nomeMatch) result.nome = nomeMatch[1].trim();
      }

      // Data de nascimento
      var dataMatch = bodyHtml.match(/Data de Nascimento<\\/span>\\s*<span[^>]*>\\s*(\\d{4})-(\\d{2})-(\\d{2})\\s*\\((\\d+)\\s*anos?\\)/i);
      if (dataMatch) {
        var yy3 = dataMatch[1].slice(2);
        result.dataNascimento = dataMatch[3] + '/' + dataMatch[2] + '/' + yy3;
        result.idade = parseInt(dataMatch[4]);
      }

      // Posição - múltiplos padrões (só se não encontrou na Abordagem 1)
      if (!result.posicao) {
        var posMatch = bodyHtml.match(/Posi[çc][ãa]o<\/span>\s*<span[^>]*>([^<]+)/i);
        if (!posMatch) posMatch = bodyHtml.match(/Posi[çc][ãa]o[^<]*<\/[^>]*>\s*<[^>]*class="card-data__values"[^>]*>\s*<span[^>]*>([^<]+)/i);
        if (!posMatch) posMatch = bodyHtml.match(/Posi[çc][ãa]o[^<]*<\/[^>]*>\s*<div[^>]*>\s*<span[^>]*class="card-data__values"[^>]*>\s*<span[^>]*>([^<]+)/i);
        if (!posMatch) posMatch = bodyHtml.match(/Posi[çc][ãa]o<\/span>\s*<div[^>]*>.*?<span class="card-data__value">([^<]+)/is);
        if (posMatch) result.posicao = posMatch[1].trim();
      }

      // Pé
      var peMatch = bodyHtml.match(/P[ée] preferencial<\/span>\s*<span[^>]*>([^<]+)/i);
      if (peMatch) result.pe = peMatch[1].trim().toLowerCase();

      // Altura
      var altMatch2 = bodyHtml.match(/Altura[^<]*<\/span>\s*<span[^>]*>\s*(\d{3})\s*cm/i);
      if (altMatch2) result.altura = parseInt(altMatch2[1]) / 100;

      // Clube - múltiplos padrões (só se não encontrou na Abordagem 1)
      if (!result.clube) {
        var clubeMatch = bodyHtml.match(/Clube atual<\/span>\s*(?:<[^>]*>\s*)*<div[^>]*>\s*<div[^>]*>\s*<div[^>]*>\s*<a[^>]*>.*?<\/a>\s*<\/div>\s*<div[^>]*>([^<]+)/is);
        if (!clubeMatch) clubeMatch = bodyHtml.match(/Clube atual<\/span>\s*(?:<[^>]*>\s*)*([^<]+)/i);
        if (!clubeMatch) clubeMatch = bodyHtml.match(/Clube atual[^<]*<\/[^>]*>\s*<div[^>]*class="card-data__values"[^>]*>\s*<span[^>]*>.*?<div[^>]*class="text">([^<]+)/is);
        if (!clubeMatch) clubeMatch = bodyHtml.match(/Clube[^<]*<\/[^>]*>\s*<span[^>]*>([^<]+)/i);
        if (clubeMatch && clubeMatch[1].trim() !== 'Sem Clube') {
          result.clube = clubeMatch[1].trim();
        }
      }

      // Naturalidade - múltiplos padrões (só se não encontrou na Abordagem 1)
      if (!result.naturalidade) {
        var naturalidadeMatch = bodyHtml.match(/País de Nascimento \(Naturalidade\)<\/span>\s*<span[^>]*>\s*<div[^>]*>\s*<div[^>]*>\s*<a[^>]*>.*?<\/a>\s*<\/div>\s*<div[^>]*class="text">([^<]+)/is);
        if (!naturalidadeMatch) naturalidadeMatch = bodyHtml.match(/Naturalidade<\/span>\s*(?:<[^>]*>\s*)*([^<]+)/i);
        if (!naturalidadeMatch) naturalidadeMatch = bodyHtml.match(/País de Nascimento[^<]*<\/span>\s*(?:<[^>]*>\s*)*<div[^>]*>\s*<div[^>]*>\s*<a[^>]*>.*?<\/a>\s*<\/div>\s*<div[^>]*class="text">([^<]+)/is);
        if (naturalidadeMatch) {
          result.naturalidade = naturalidadeMatch[1].trim();
        }
      }
    }

    // Só envia se encontrou pelo menos algum dado
    if (result.nome || result.posicao || result.dataNascimento) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'data', result: result }));
    } else {
      // Tenta de novo em 2 segundos (a página pode ainda estar carregando)
      if (!window.__ogolRetries) window.__ogolRetries = 0;
      window.__ogolRetries++;
      if (window.__ogolRetries < 5) {
        setTimeout(tryExtract, 2000);
      } else {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'Não foi possível extrair dados desta página. Verifique se o link está correto.' }));
      }
    }
  }

  // Aguarda um pouco para a página renderizar
  setTimeout(tryExtract, 1500);
})();
true;
`;

// Mapeamento de posição do Ogol para categorias do app
const POSICAO_MAP: Record<string, string> = {
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
  "medio defensivo": "Volante",
  "meio-campista": "Meia",
  "médio": "Meia",
  medio: "Meia",
  meia: "Meia",
  "meia-atacante": "Meia",
  "médio ofensivo": "Meia",
  "medio ofensivo": "Meia",
  extremo: "Extremo",
  ponta: "Extremo",
  "ponta direita": "Extremo",
  "ponta esquerda": "Extremo",
  atacante: "Centroavante",
  "avançado": "Centroavante",
  avancado: "Centroavante",
  centroavante: "Centroavante",
  "segundo avançado": "2º Atacante",
  "segundo avancado": "2º Atacante",
};

function mapPosicao(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if (POSICAO_MAP[lower]) return POSICAO_MAP[lower];
  for (const [key, value] of Object.entries(POSICAO_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return value;
  }
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function mapPe(raw: string): string | null {
  const pe = raw.toLowerCase().trim();
  if (pe === "destro" || pe === "direito") return "direito";
  if (pe === "canhoto" || pe === "esquerdo") return "esquerdo";
  if (pe === "ambidestro" || pe.includes("ambos")) return "ambidestro";
  return null;
}

export function OgolWebScraper({ url, onResult, onError, onLoadStart }: OgolWebScraperProps) {
  const webViewRef = useRef<WebView>(null);
  const [key, setKey] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Quando a URL muda, recarrega a WebView
  useEffect(() => {
    if (url) {
      setKey((k) => k + 1);
      onLoadStart?.();
      // Timeout de segurança: 20 segundos
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        onError("Tempo esgotado. O site do Ogol pode estar lento. Tente novamente.");
      }, 20000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [url]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === "data" && msg.result) {
          const raw = msg.result as OgolPlayerData;
          // Mapear posição e pé
          const mapped: OgolPlayerData = {
            ...raw,
            posicao: raw.posicao ? mapPosicao(raw.posicao) : null,
            pe: raw.pe ? mapPe(raw.pe) : null,
          };
          onResult(mapped);
        } else if (msg.type === "error") {
          onError(msg.message || "Erro ao extrair dados.");
        }
      } catch (e) {
        onError("Erro ao processar dados da página.");
      }
    },
    [onResult, onError]
  );

  // Não renderiza se não tem URL
  if (!url) return null;

  // Na web, abre o Ogol em nova aba para o usuário copiar manualmente
  if (Platform.OS === "web") {
    if (url && typeof window !== "undefined") {
      window.open(url, "_blank");
      onError("Página do Ogol aberta em nova aba. Copie os dados manualmente ou use o celular para auto-preenchimento.");
    }
    return null;
  }

  return (
    <View style={{ height: 0, width: 0, overflow: "hidden", position: "absolute" }}>
      <WebView
        key={key}
        ref={webViewRef}
        source={{ uri: url }}
        style={{ height: 1, width: 1 }}
        onMessage={handleMessage}
        injectedJavaScript={INJECTED_JS}
        javaScriptEnabled
        domStorageEnabled
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        onError={() => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          onError("Erro ao carregar a página do Ogol. Verifique sua conexão.");
        }}
        onHttpError={(e) => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          onError(`Erro HTTP ${e.nativeEvent.statusCode} ao acessar o Ogol.`);
        }}
      />
    </View>
  );
}
