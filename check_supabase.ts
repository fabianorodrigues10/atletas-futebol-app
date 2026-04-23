import { createClient } from "@supabase/supabase-js";

async function checkSupabase() {
  try {
    console.log("🔄 Conectando ao Supabase...\n");

    const supabaseUrl = "https://zymljijmlfkmxhwwgmao.supabase.co";
    const supabaseAnonKey = "sb_publishable_byXVSfXch21XGPepKwcZrA_SPsGbv2a";

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log("✅ Conectado ao Supabase!\n");

    // Contar atletas
    const { data: atletas, error: atletasError } = await supabase
      .from("atletas")
      .select("id", { count: "exact" });

    if (atletasError) {
      console.log("⚠️  Erro ao contar atletas:", atletasError.message);
    } else {
      console.log(`📊 Total de atletas no Supabase: ${atletas?.length || 0}`);
    }

    // Procurar por Marcílio Dias
    const { data: marcilioDias, error: marcilioError } = await supabase
      .from("atletas")
      .select("id, nome, posicao, clube")
      .or(`clube.ilike.%Marcílio%,clube.ilike.%Dias%`)
      .limit(20);

    if (marcilioError) {
      console.log("⚠️  Erro ao procurar Marcílio Dias:", marcilioError.message);
    } else {
      console.log(`\n🔍 Atletas do Marcílio Dias encontrados: ${marcilioDias?.length || 0}`);
      marcilioDias?.forEach((row: any) => {
        console.log(`   - ${row.nome} (${row.posicao}) - ${row.clube}`);
      });
    }

    // Listar tabelas
    console.log("\n📋 Tabelas disponíveis:");
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public");

    if (tablesError) {
      console.log("   ⚠️  Não consegui listar tabelas");
    } else {
      tables?.forEach((t: any) => {
        console.log(`   - ${t.table_name}`);
      });
    }

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

checkSupabase();
