import * as fs from "fs";
import * as path from "path";

interface AtletaFoto {
  id: number;
  nome: string;
  fotoUrl: string | null;
}

async function extractPhotoFromOgol(html: string): Promise<string | null> {
  const patterns = [
    /<img[^>]*class="[^"]*player[^"]*"[^>]*src="([^"]+)"/i,
    /<img[^>]*class="[^"]*photo[^"]*"[^>]*src="([^"]+)"/i,
    /<img[^>]*class="[^"]*jogador[^"]*"[^>]*src="([^"]+)"/i,
    /<img[^>]*src="([^"]*\/jogador\/[^"]+)"/i,
    /<img[^>]*src="([^"]*\/player[^"]+)"/i,
    /<img[^>]*src="([^"]*\/fotos\/[^"]+)"/i,
    /<img[^>]*src="([^"]*\/images\/[^"]+)"/i,
    /<div[^>]*class="[^"]*perfil[^"]*"[^>]*>.*?<img[^>]*src="([^"]+)"/is,
    /<img[^>]*alt="[^"]*jogador[^"]*"[^>]*src="([^"]+)"/i,
    /<img[^>]*src="([^"]*\.(?:jpg|jpeg|png|webp))[^"]*"[^>]*>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      let fotoUrl = match[1].trim();
      if (
        fotoUrl.includes("placeholder") ||
        fotoUrl.includes("icon") ||
        fotoUrl.includes("default") ||
        fotoUrl.includes("logo")
      ) {
        continue;
      }
      if (fotoUrl.startsWith("/")) {
        fotoUrl = "https://www.ogol.com.br" + fotoUrl;
      } else if (!fotoUrl.startsWith("http")) {
        fotoUrl = "https://www.ogol.com.br/" + fotoUrl;
      }
      return fotoUrl;
    }
  }

  return null;
}

async function extractFromOgol(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        Referer: "https://www.ogol.com.br/",
      },
    });

    if (!response.ok) {
      return null;
    }

    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder("iso-8859-1");
    const html = decoder.decode(buffer);

    return extractPhotoFromOgol(html);
  } catch (error) {
    return null;
  }
}

async function main() {
  console.log("🔄 Lendo lista de atletas...\n");

  // Ler arquivo de atletas (assumindo que existe um arquivo JSON com os atletas)
  const atletasFile = path.join(
    __dirname,
    "../public/atletas.json"
  );

  let atletas: any[] = [];

  // Se não existir, criar um arquivo vazio
  if (!fs.existsSync(atletasFile)) {
    console.log("⚠️  Arquivo de atletas não encontrado");
    console.log(
      "Você precisa ter um arquivo public/atletas.json com a lista de atletas"
    );
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(atletasFile, "utf-8");
    atletas = JSON.parse(content);
  } catch (error) {
    console.log("❌ Erro ao ler arquivo de atletas");
    process.exit(1);
  }

  console.log(`📊 Total de atletas: ${atletas.length}\n`);

  const fotosMap: Record<number, string> = {};
  let atualizados = 0;
  let erros = 0;

  for (let i = 0; i < atletas.length; i++) {
    const atleta = atletas[i];

    process.stdout.write(
      `⏳ ${i + 1}/${atletas.length} ${atleta.nome}... `
    );

    if (atleta.link) {
      const fotoUrl = await extractFromOgol(atleta.link);

      if (fotoUrl) {
        fotosMap[atleta.id] = fotoUrl;
        console.log(`✅ OGOL`);
        atualizados++;
      } else {
        console.log(`⚠️  Não encontrou`);
        erros++;
      }
    } else {
      console.log(`⚠️  Sem link`);
      erros++;
    }

    // Delay para não sobrecarregar
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  // Salvar mapa de fotos
  const outputFile = path.join(__dirname, "../public/fotos-map.json");
  fs.writeFileSync(outputFile, JSON.stringify(fotosMap, null, 2));

  console.log(`\n✅ Processo concluído!`);
  console.log(`📈 Fotos encontradas: ${atualizados}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`📁 Salvo em: ${outputFile}`);
}

main().catch(console.error);
