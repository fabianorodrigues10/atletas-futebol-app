import { createClient } from "@supabase/supabase-js";

async function querySupabase() {
  try {
    console.log("🔄 Conectando ao Supabase com chave de acesso...\n");

    const supabaseUrl = "https://zymljijmlfkmxhwwgmao.supabase.co";
    // Usando a chave de serviço (service role) que tem acesso completo
    const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5bWxqaWptbGZrbXhod3dntWFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODc3MzUwMiwiZXhwIjoxODY2NTQwMzAyfQ.7Uj5Zj3-tZq8vQxY9pL2kM0nR4sT6uV7wX8yZ1aB2cD";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("✅ Conectado ao Supabase!\n");

    // Contar atletas
    const { data: atletas, error: atletasError, count } = await supabase
      .from("atletas")
      .select("*", { count: "exact" });

    if (atletasError) {
      console.log("⚠️  Erro ao buscar atletas:", atletasError.message);
    } else {
      console.log(`📊 Total de atletas no Supabase: ${count}`);
      console.log(`✅ Primeiros 5 atletas:`);
      atletas?.slice(0, 5).forEach((row: any) => {
        console.log(`   - ${row.nome} (${row.posicao}) - ${row.clube}`);
      });
    }

    // Procurar por Marcílio Dias
    const { data: marcilioDias, error: marcilioError } = await supabase
      .from("atletas")
      .select("id, nome, posicao, clube")
      .or(`clube.ilike.%Marcílio%,clube.ilike.%Dias%`)
      .limit(50);

    if (marcilioError) {
      console.log("⚠️  Erro ao procurar Marcílio Dias:", marcilioError.message);
    } else {
      console.log(`\n🔍 Atletas do Marcílio Dias encontrados: ${marcilioDias?.length || 0}`);
      marcilioDias?.forEach((row: any) => {
        console.log(`   - ${row.nome} (${row.posicao}) - ${row.clube}`);
      });
    }

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

querySupabase();
