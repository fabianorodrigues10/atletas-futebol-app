/**
 * Testa a extração de dados do Ogol simulando o DOM como o WebView faria.
 * Usa o HTML real baixado do Ogol para validar os padrões.
 */
import * as fs from "fs";
import { JSDOM } from "jsdom";

const html = fs.readFileSync("/home/ubuntu/ogol-debug.html", "utf-8");
const dom = new JSDOM(html);
const document = dom.window.document;

// Simula a extração da Abordagem 1 (card-data__row)
const result: Record<string, any> = {
  nome: null,
  posicao: null,
  dataNascimento: null,
  idade: null,
  altura: null,
  pe: null,
  clube: null,
  naturalidade: null,
};

const rows = document.querySelectorAll(".card-data__row");
console.log(`[Test] Encontradas ${rows.length} card-data__row`);

for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  const labelEl = row.querySelector(".card-data__label");
  if (!labelEl) continue;
  const labelText = labelEl.textContent?.trim() || "";

  // Busca o valor
  let valueText = "";
  const valueEl = row.querySelector(".card-data__value");
  const textEl = row.querySelector(".micrologo_and_text .text");
  const valuesEl = row.querySelector(".card-data__values");

  if (textEl) {
    valueText = textEl.textContent?.trim() || "";
  } else if (valueEl) {
    valueText = valueEl.textContent?.trim() || "";
  } else if (valuesEl) {
    valueText = valuesEl.textContent?.trim() || "";
  }

  console.log(`  [Row ${i}] Label: "${labelText}" | Value: "${valueText.substring(0, 80)}"`);

  if (labelText === "Nome" || labelText === "Nome Completo") {
    result.nome = valueText;
  } else if (
    labelText.indexOf("Data de Nascimento") !== -1
  ) {
    const dateMatch = valueText.match(
      /(\d{4})-(\d{2})-(\d{2})\s*\((\d+)\s*anos?\)/
    );
    if (dateMatch) {
      const yy = dateMatch[1].slice(2);
      result.dataNascimento = dateMatch[3] + "/" + dateMatch[2] + "/" + yy;
      result.idade = parseInt(dateMatch[4]);
    }
  } else if (
    labelText === "Posição" ||
    labelText === "Posicao" ||
    (labelText.indexOf("Posi") !== -1 && labelText.length < 20)
  ) {
    const posValueEl = row.querySelector(".card-data__value");
    if (posValueEl) {
      result.posicao = posValueEl.textContent?.trim() || "";
    } else {
      result.posicao = valueText;
    }
  } else if (labelText.indexOf("preferencial") !== -1) {
    result.pe = valueText.toLowerCase();
  } else if (labelText.indexOf("Altura") !== -1) {
    const altMatch = valueText.match(/(\d{3})\s*cm/);
    if (altMatch) {
      result.altura = parseInt(altMatch[1]) / 100;
    }
  } else if (
    labelText.indexOf("Clube atual") !== -1 ||
    labelText === "Clube"
  ) {
    const clubeTextEl = row.querySelector(".micrologo_and_text .text");
    const clubeValue = clubeTextEl
      ? clubeTextEl.textContent?.trim() || ""
      : valueText;
    if (clubeValue && clubeValue !== "Sem Clube") {
      result.clube = clubeValue;
    }
  } else if (
    labelText.indexOf("Naturalidade") !== -1 ||
    (labelText.indexOf("Nascimento") !== -1 && labelText.indexOf("Data") === -1)
  ) {
    const natTextEl = row.querySelector(".micrologo_and_text .text");
    if (natTextEl) {
      result.naturalidade = natTextEl.textContent?.trim() || "";
    } else {
      result.naturalidade = valueText;
    }
  }
}

console.log("\n[Test] === RESULTADO FINAL ===");
console.log(`  Nome: ${result.nome}`);
console.log(`  Posição: ${result.posicao}`);
console.log(`  Data Nascimento: ${result.dataNascimento}`);
console.log(`  Idade: ${result.idade}`);
console.log(`  Altura: ${result.altura}`);
console.log(`  Pé: ${result.pe}`);
console.log(`  Clube: ${result.clube}`);
console.log(`  Naturalidade: ${result.naturalidade}`);

// Verificação
const missing = Object.entries(result)
  .filter(([_, v]) => v === null || v === "")
  .map(([k]) => k);
if (missing.length > 0) {
  console.log(`\n[Test] ❌ CAMPOS FALTANDO: ${missing.join(", ")}`);
} else {
  console.log("\n[Test] ✅ TODOS OS CAMPOS EXTRAÍDOS COM SUCESSO!");
}
