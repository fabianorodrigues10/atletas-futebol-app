import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  Alert,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { getApiBaseUrl } from "@/constants/oauth";
import Svg, { Polygon, Circle, Line, Text as SvgText } from "react-native-svg";
const marcilioDiasShield = require("@/assets/images/marcilio-dias-shield.png") as any;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CORES = {
  azulEscuro: "#1a237e",
  azulMedio: "#283593",
  azulClaro: "#3949ab",
  vermelho: "#c62828",
  vermelhoClaro: "#ef5350",
  branco: "#ffffff",
  cinzaClaro: "#f5f5f5",
  cinzaMedio: "#e0e0e0",
  cinzaTexto: "#757575",
  preto: "#212121",
  verde: "#2e7d32",
  amarelo: "#f57f17",
};

type Atleta = {
  id: number;
  nome: string;
  posicao: string | null;
  segundaPosicao: string | null;
  clube: string | null;
  dataNascimento: string | null;
  idade: number | null;
  altura: string | null;
  pe: string | null;
  escala: string | null;
  valencia: string | null;
  naturalidade: string | null;
  fotoUrl: string | null;
  estatisticas: EstatisticasTemporada | null;
};

type Jogo = {
  id?: number;
  mandante: string;
  visitante: string;
  competicao: string;
  data: string;
  dataExibicao?: string; // DD/MM/AAAA para exibição
  horario: string;
  local: string;
  arbitro: string;
  assistente1: string;
  assistente2: string;
  renda: string;
  publico: string;
  gols: string;
  placarMandante: string;
  placarVisitante: string;
  observacoes: string;
};

const JOGO_VAZIO: Jogo = {
  mandante: "Marcílio Dias",
  visitante: "",
  competicao: "",
  data: "",
  dataExibicao: "",
  horario: "",
  local: "",
  arbitro: "",
  assistente1: "",
  assistente2: "",
  renda: "",
  publico: "",
  gols: "",
  placarMandante: "",
  placarVisitante: "",
  observacoes: "",
};

type ScoutAtleta = {
  atletaId: number;
  titular: boolean;
  minutosJogados: number;
  // Ofensivo
  gol: number;
  assistencia: number;
  finalizacaoCerta: number;
  finalizacaoErrada: number;
  passeCerto: number;
  passeErrado: number;
  passeFinalizacao: number;
  cruzamentoCerto: number;
  cruzamentoErrado: number;
  passeLongoCerto: number;
  passeLongoErrado: number;
  dribleCerto: number;
  dribleErrado: number;
  desperdicio: number;
  faltaSofrida: number;
  // Defensivo
  desarme: number;
  jogoAereoGanho: number;
  jogoAereoPerdido: number;
  bolaAreaGanha: number;
  bolaAreaPerdida: number;
  faltaCometida: number;
  bolaRecuperada: number;
  finalizacaoInterceptada: number;
  duelChaoGanho: number;
  duelChaoPerdido: number;
  // Disciplina e Notas
  cartoesAmarelos: number;
  cartoesVermelhos: number;
  notaTecnica: string;
  notaFisica: string;
  notaTatica: string;
  notaAtitudinal: string;
  notaPotencial: string;
  observacoes: string;
};

type EstatisticasTemporada = {
  id?: number;
  atletaId?: number;
  temporada?: string;
  minutosJogados: number;
  jogos: number;
  jogosTitular: number;
  // Ofensivo
  gol: number;
  assistencia: number;
  finalizacaoCerta: number;
  finalizacaoErrada: number;
  passeCerto: number;
  passeErrado: number;
  passeFinalizacao: number;
  cruzamentoCerto: number;
  cruzamentoErrado: number;
  passeLongoCerto: number;
  passeLongoErrado: number;
  dribleCerto: number;
  dribleErrado: number;
  desperdicio: number;
  faltaSofrida: number;
  // Defensivo
  desarme: number;
  jogoAereoGanho: number;
  jogoAereoPerdido: number;
  bolaAreaGanha: number;
  bolaAreaPerdida: number;
  faltaCometida: number;
  bolaRecuperada: number;
  finalizacaoInterceptada: number;
  duelChaoGanho: number;
  duelChaoPerdido: number;
  // Disciplina e Notas
  cartoesAmarelos: number;
  cartoesVermelhos: number;
  notaTecnica: string | null;
  notaFisica: string | null;
  notaTatica: string | null;
  notaAtitudinal: string | null;
  notaPotencial: string | null;
  observacoes: string | null;
};

const STATS_VAZIA: EstatisticasTemporada = {
  minutosJogados: 0, jogos: 0, jogosTitular: 0,
  // Ofensivo
  gol: 0, assistencia: 0, finalizacaoCerta: 0, finalizacaoErrada: 0,
  passeCerto: 0, passeErrado: 0, passeFinalizacao: 0,
  cruzamentoCerto: 0, cruzamentoErrado: 0,
  passeLongoCerto: 0, passeLongoErrado: 0,
  dribleCerto: 0, dribleErrado: 0,
  desperdicio: 0, faltaSofrida: 0,
  // Defensivo
  desarme: 0, jogoAereoGanho: 0, jogoAereoPerdido: 0,
  bolaAreaGanha: 0, bolaAreaPerdida: 0,
  faltaCometida: 0, bolaRecuperada: 0,
  finalizacaoInterceptada: 0,
  duelChaoGanho: 0, duelChaoPerdido: 0,
  // Disciplina e Notas
  cartoesAmarelos: 0, cartoesVermelhos: 0,
  notaTecnica: null, notaFisica: null, notaTatica: null, notaAtitudinal: null, notaPotencial: null,
  observacoes: null,
};

function calcularIdade(dataNascimento: string | null, idadeDb: number | null): number | null {
  if (!dataNascimento) return idadeDb;
  try {
    const hoje = new Date();
    const nasc = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  } catch {
    return idadeDb;
  }
}

// ==================== GRÁFICO RADAR ====================
function GraficoRadar({ atleta, benchmark }: { atleta: Atleta; benchmark: any }) {
  const tamanho = Math.min(SCREEN_WIDTH - 64, 280);
  const centro = tamanho / 2;
  const raio = centro - 30;
  const categorias = [
    { label: "Técnica", valor: parseFloat(atleta.estatisticas?.notaTecnica || "0") },
    { label: "Física", valor: parseFloat(atleta.estatisticas?.notaFisica || "0") },
    { label: "Tática", valor: parseFloat(atleta.estatisticas?.notaTatica || "0") },

  ];
  const n = categorias.length;
  const angulo = (2 * Math.PI) / n;
  const temDados = categorias.some(c => c.valor > 0);

  const pontoParaXY = (indice: number, valor: number, max = 10) => {
    const ang = indice * angulo - Math.PI / 2;
    const r = (valor / max) * raio;
    return { x: centro + r * Math.cos(ang), y: centro + r * Math.sin(ang) };
  };

  const pontosAtleta = categorias.map((c, i) => pontoParaXY(i, c.valor));
  const pontosAtletaStr = pontosAtleta.map(p => `${p.x},${p.y}`).join(" ");

  // Grades de fundo (20%, 40%, 60%, 80%, 100%)
  const grades = [2, 4, 6, 8, 10];

  return (
    <View style={{ alignItems: "center" }}>
      {!temDados ? (
        <View style={{ width: tamanho, height: tamanho, alignItems: "center", justifyContent: "center", backgroundColor: CORES.cinzaClaro, borderRadius: 12 }}>
          <Text style={{ color: CORES.cinzaTexto, fontSize: 13, textAlign: "center" }}>
            Preencha as notas técnicas{"\n"}para ver o gráfico radar
          </Text>
        </View>
      ) : (
        <Svg width={tamanho} height={tamanho}>
          {/* Grades de fundo */}
          {grades.map((g) => {
            const pts = categorias.map((_, i) => pontoParaXY(i, g));
            return (
              <Polygon
                key={g}
                points={pts.map(p => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke={CORES.cinzaMedio}
                strokeWidth="1"
              />
            );
          })}
          {/* Linhas dos eixos */}
          {categorias.map((_, i) => {
            const fim = pontoParaXY(i, 10);
            return <Line key={i} x1={centro} y1={centro} x2={fim.x} y2={fim.y} stroke={CORES.cinzaMedio} strokeWidth="1" />;
          })}
          {/* Área do atleta */}
          <Polygon
            points={pontosAtletaStr}
            fill={`${CORES.azulClaro}40`}
            stroke={CORES.azulClaro}
            strokeWidth="2"
          />
          {/* Pontos */}
          {pontosAtleta.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={4} fill={CORES.azulClaro} />
          ))}
          {/* Labels */}
          {categorias.map((c, i) => {
            const pos = pontoParaXY(i, 11.5);
            return (
              <SvgText
                key={i}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                fontSize="10"
                fill={CORES.preto}
                fontWeight="600"
              >
                {c.label}
              </SvgText>
            );
          })}
          {/* Valores */}
          {categorias.map((c, i) => {
            if (c.valor === 0) return null;
            const pos = pontoParaXY(i, c.valor);
            return (
              <SvgText
                key={`v${i}`}
                x={pos.x + 6}
                y={pos.y - 4}
                fontSize="9"
                fill={CORES.azulEscuro}
                fontWeight="bold"
              >
                {c.valor.toFixed(1)}
              </SvgText>
            );
          })}
        </Svg>
      )}
    </View>
  );
}

// ==================== MODAL DE ESTATÍSTICAS ====================
function ModalEstatisticas({
  atleta,
  visivel,
  onFechar,
  onSalvar,
}: {
  atleta: Atleta | null;
  visivel: boolean;
  onFechar: () => void;
  onSalvar: (atletaId: number, stats: EstatisticasTemporada) => void;
}) {
  const [stats, setStats] = useState<EstatisticasTemporada>(STATS_VAZIA);
  const [salvando, setSalvando] = useState(false);

  // Só inicializa os stats quando o modal ABRE (visivel muda de false para true)
  // Nunca reinicializa enquanto o modal está aberto
  const atletaIdRef = React.useRef<number | null>(null);
  useEffect(() => {
    if (visivel && atleta && atleta.id !== atletaIdRef.current) {
      atletaIdRef.current = atleta.id;
      setStats(atleta.estatisticas ? { ...atleta.estatisticas } : { ...STATS_VAZIA });
    }
    if (!visivel) {
      atletaIdRef.current = null;
    }
  }, [visivel, atleta]);

  const campo = (label: string, chave: keyof EstatisticasTemporada, tipo: "numero" | "decimal" = "numero") => (
    <View style={styles.campoPar}>
      <Text style={styles.labelCampo}>{label}</Text>
      <TextInput
        style={styles.inputCampo}
        value={stats[chave] === 0 || stats[chave] === "0" ? "" : (stats[chave]?.toString() || "")}
        onChangeText={(v) => {
          if (v === "" || v === null) {
            setStats(prev => ({ ...prev, [chave]: 0 }));
          } else if (tipo === "decimal") {
            setStats(prev => ({ ...prev, [chave]: v }));
          } else {
            const num = parseInt(v);
            setStats(prev => ({ ...prev, [chave]: isNaN(num) ? 0 : num }));
          }
        }}
        keyboardType="numeric"
        placeholder="0"
      />
    </View>
  );

  const handleSalvar = async () => {
    if (!atleta) return;
    setSalvando(true);
    try {
      const base = getApiBaseUrl();
      const atletaId = atleta.id;
      // Extrair apenas os campos de estatísticas, sem campos internos do banco
      const { id: _id, atletaId: _aId, userId: _uId, createdAt: _c, updatedAt: _u, temporada: _t, ...statsLimpos } = stats as any;
      const payload = { ...statsLimpos, temporada: "2025" };
      const resp = await fetch(`${base}/api/atletas/${atletaId}/estatisticas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Falha ao salvar: ${errText}`);
      }
      // Buscar os dados atualizados do servidor para garantir consistência
      const respStats = await fetch(`${base}/api/atletas/${atletaId}/estatisticas?temporada=2025`);
      const statsAtualizados = respStats.ok ? await respStats.json() : payload;
      // Notifica o pai com os dados confirmados pelo servidor
      onSalvar(atletaId, statsAtualizados);
      // Fecha o modal
      onFechar();
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Não foi possível salvar as estatísticas.");
    } finally {
      setSalvando(false);
    }
  };

  if (!atleta) return null;

  return (
    <Modal visible={visivel} animationType="slide">
      <View style={{ flex: 1, backgroundColor: CORES.branco }}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onFechar} style={styles.btnFechar}>
            <Text style={{ color: CORES.vermelho, fontWeight: "700", fontSize: 15 }}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitulo}>{atleta.nome}</Text>
          <TouchableOpacity onPress={handleSalvar} style={styles.btnSalvar} disabled={salvando}>
            {salvando ? <ActivityIndicator size="small" color={CORES.branco} /> : <Text style={{ color: CORES.branco, fontWeight: "700", fontSize: 15 }}>Salvar</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.secaoTitulo}>⏱ Minutagem</Text>
          <View style={styles.gridCampos}>
            {campo("Minutos", "minutosJogados")}
            {campo("Jogos", "jogos")}
            {campo("Titular", "jogosTitular")}
          </View>

          <Text style={styles.secaoTitulo}>⚽ Ofensivo (Linha 1)</Text>
          <View style={styles.gridCampos}>
            {campo("Gol", "gol")}
            {campo("Ass", "assistencia")}
            {campo("Fin C", "finalizacaoCerta")}
            {campo("Fin E", "finalizacaoErrada")}
            {campo("Pass C", "passeCerto")}
            {campo("Pass E", "passeErrado")}
            {campo("Pass F", "passeFinalizacao")}
            {campo("Crz C", "cruzamentoCerto")}
          </View>

          <Text style={styles.secaoTitulo}>⚽ Ofensivo (Linha 2)</Text>
          <View style={styles.gridCampos}>
            {campo("Crz E", "cruzamentoErrado")}
            {campo("PL C", "passeLongoCerto")}
            {campo("PL E", "passeLongoErrado")}
            {campo("Drib C", "dribleCerto")}
            {campo("Drib E", "dribleErrado")}
            {campo("Desp", "desperdicio")}
            {campo("FS", "faltaSofrida")}
          </View>

          <Text style={styles.secaoTitulo}>🛡 Defensivo (Linha 1)</Text>
          <View style={styles.gridCampos}>
            {campo("Des", "desarme")}
            {campo("Aer G", "jogoAereoGanho")}
            {campo("Aer P", "jogoAereoPerdido")}
            {campo("Área G", "bolaAreaGanha")}
            {campo("Área P", "bolaAreaPerdida")}
            {campo("FC", "faltaCometida")}
            {campo("BR", "bolaRecuperada")}
            {campo("FI", "finalizacaoInterceptada")}
          </View>

          <Text style={styles.secaoTitulo}>🛡 Defensivo (Linha 2)</Text>
          <View style={styles.gridCampos}>
            {campo("DC G", "duelChaoGanho")}
            {campo("DC P", "duelChaoPerdido")}
          </View>

          <Text style={styles.secaoTitulo}>🟨 Disciplina</Text>
          <View style={styles.gridCampos}>
            {campo("Amarelos", "cartoesAmarelos")}
            {campo("Vermelhos", "cartoesVermelhos")}
          </View>


          <Text style={styles.secaoTitulo}>📝 Observações</Text>
          <TextInput
            style={[styles.inputCampo, { height: 80, textAlignVertical: "top", marginBottom: 32 }]}
            value={stats.observacoes || ""}
            onChangeText={(v) => setStats(prev => ({ ...prev, observacoes: v }))}
            multiline
            placeholder="Observações técnicas sobre o atleta..."
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ==================== CARD DO ATLETA ====================
function CardAtleta({
  atleta,
  selecionado,
  onToggle,
  onEditar,
  onVerDetalhes,
}: {
  atleta: Atleta;
  selecionado: boolean;
  onToggle: () => void;
  onEditar: () => void;
  onVerDetalhes: () => void;
}) {
  const idade = calcularIdade(atleta.dataNascimento, atleta.idade);
  const stats = atleta.estatisticas;
  const temStats = stats && (stats.jogos > 0 || stats.minutosJogados > 0);

  return (
    <View style={[styles.cardAtleta, selecionado && styles.cardSelecionado]}>
      <TouchableOpacity style={styles.cardHeader} onPress={onVerDetalhes} activeOpacity={0.8}>
        <View style={styles.cardAvatar}>
          <Text style={styles.cardAvatarLetra}>{atleta.nome.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardNome}>{atleta.nome}</Text>
          <Text style={styles.cardPosicao}>{atleta.posicao || "—"}{atleta.segundaPosicao ? ` / ${atleta.segundaPosicao}` : ""}</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
            {idade && <Text style={styles.cardInfo}>{idade} anos</Text>}
            {atleta.altura && <Text style={styles.cardInfo}>{parseFloat(atleta.altura).toFixed(2)}m</Text>}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.checkBox, selecionado && styles.checkBoxSelecionado]}
          onPress={onToggle}
        >
          {selecionado && <Text style={{ color: CORES.branco, fontSize: 12, fontWeight: "bold" }}>✓</Text>}
        </TouchableOpacity>
      </TouchableOpacity>

      {temStats && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValor}>{stats!.jogos}</Text>
            <Text style={styles.statLabel}>Jogos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValor}>{stats!.minutosJogados}</Text>
            <Text style={styles.statLabel}>Min</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValor}>{stats!.gol}</Text>
            <Text style={styles.statLabel}>Gols</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValor}>{stats!.assistencia}</Text>
            <Text style={styles.statLabel}>Assist</Text>
          </View>
          {stats!.passeCerto > 0 && (
            <View style={styles.statItem}>
              <Text style={styles.statValor}>
                {Math.round((stats!.passeCerto / (stats!.passeCerto + stats!.passeErrado)) * 100)}%
              </Text>
              <Text style={styles.statLabel}>Passes</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.cardAcoes}>
        <TouchableOpacity style={styles.btnEditar} onPress={onEditar}>
          <Text style={styles.btnEditarTexto}>✏️ Editar Dados</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnVerPerfil} onPress={onVerDetalhes}>
          <Text style={styles.btnVerPerfilTexto}>Ver Perfil →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ==================== TELA PRINCIPAL ====================
export default function MarcilioScreen() {
  const router = useRouter();
  const [elenco, setElenco] = useState<Atleta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroPosicao, setFiltroPosicao] = useState("");
  const [filtroIdadeMin, setFiltroIdadeMin] = useState("");
  const [filtroIdadeMax, setFiltroIdadeMax] = useState("");
  const [filtroMinutos, setFiltroMinutos] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [atletaEditando, setAtletaEditando] = useState<Atleta | null>(null);
  const [modalStatsVisivel, setModalStatsVisivel] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<"elenco" | "comparar" | "radar" | "jogos">("elenco");

  // ===== ESTADO DO MÓDULO JOGOS =====
  const [jogos, setJogos] = useState<any[]>([]);
  const [carregandoJogos, setCarregandoJogos] = useState(false);
  const [jogoSelecionado, setJogoSelecionado] = useState<any | null>(null);
  const [modalJogoVisivel, setModalJogoVisivel] = useState(false);
  const [modalScoutVisivel, setModalScoutVisivel] = useState(false);
  const [jogoEditando, setJogoEditando] = useState<Jogo>({ ...JOGO_VAZIO });
  const [scoutsDoJogo, setScoutsDoJogo] = useState<Record<number, ScoutAtleta>>({});
  const [atletasRelacionados, setAtletasRelacionados] = useState<number[]>([]);
  const [salvandoScout, setSalvandoScout] = useState(false);
  const [gerandoPdfJogo, setGerandoPdfJogo] = useState(false);
  const [carregandoScout, setCarregandoScout] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // ===== ESTADO DO FILTRO POR JOGO =====
  const [modalStatsJogoVisivel, setModalStatsJogoVisivel] = useState(false);
  const [jogoStatsVisualizado, setJogoStatsVisualizado] = useState<any | null>(null);
  const [scoutsStatsJogo, setScoutsStatsJogo] = useState<any[]>([]);
  const [carregandoStatsJogo, setCarregandoStatsJogo] = useState(false);

  const carregarJogos = useCallback(async () => {
    setCarregandoJogos(true);
    try {
      const base = getApiBaseUrl();
      const resp = await fetch(`${base}/api/jogos`);
      if (resp.ok) setJogos(await resp.json());
    } catch (e) { console.error("Erro ao carregar jogos:", e); }
    finally { setCarregandoJogos(false); }
  }, []);

  const carregarScoutsDoJogo = useCallback(async (jogoId: number) => {
    setCarregandoScout(true);
    try {
      const base = getApiBaseUrl();
      const resp = await fetch(`${base}/api/jogos/${jogoId}/scouts`);
      if (resp.ok) {
        const data: any[] = await resp.json();
        const mapa: Record<number, ScoutAtleta> = {};
        const relacionados: number[] = [];
        data.forEach((s: any) => {
          relacionados.push(s.atletaId);
          mapa[s.atletaId] = {
            atletaId: s.atletaId,
            titular: s.titular || false,
            minutosJogados: s.minutosJogados || 0,
            // Ofensivo
            gol: s.gol || 0,
            assistencia: s.assistencia || 0,
            finalizacaoCerta: s.finalizacaoCerta || 0,
            finalizacaoErrada: s.finalizacaoErrada || 0,
            passeCerto: s.passeCerto || 0,
            passeErrado: s.passeErrado || 0,
            passeFinalizacao: s.passeFinalizacao || 0,
            cruzamentoCerto: s.cruzamentoCerto || 0,
            cruzamentoErrado: s.cruzamentoErrado || 0,
            passeLongoCerto: s.passeLongoCerto || 0,
            passeLongoErrado: s.passeLongoErrado || 0,
            dribleCerto: s.dribleCerto || 0,
            dribleErrado: s.dribleErrado || 0,
            desperdicio: s.desperdicio || 0,
            faltaSofrida: s.faltaSofrida || 0,
            // Defensivo
            desarme: s.desarme || 0,
            jogoAereoGanho: s.jogoAereoGanho || 0,
            jogoAereoPerdido: s.jogoAereoPerdido || 0,
            bolaAreaGanha: s.bolaAreaGanha || 0,
            bolaAreaPerdida: s.bolaAreaPerdida || 0,
            faltaCometida: s.faltaCometida || 0,
            bolaRecuperada: s.bolaRecuperada || 0,
            finalizacaoInterceptada: s.finalizacaoInterceptada || 0,
            duelChaoGanho: s.duelChaoGanho || 0,
            duelChaoPerdido: s.duelChaoPerdido || 0,
            // Disciplina e Notas
            cartoesAmarelos: s.cartoesAmarelos || 0,
            cartoesVermelhos: s.cartoesVermelhos || 0,
            notaTecnica: s.notaTecnica != null ? String(s.notaTecnica) : "",
            notaFisica: s.notaFisica != null ? String(s.notaFisica) : "",
            notaTatica: s.notaTatica != null ? String(s.notaTatica) : "",
            notaAtitudinal: s.notaAtitudinal != null ? String(s.notaAtitudinal) : "",
            notaPotencial: s.notaPotencial != null ? String(s.notaPotencial) : "",
            observacoes: s.observacoes || "",
          };
        });
        setScoutsDoJogo(mapa);
        setAtletasRelacionados(relacionados);
      }
    } catch (e) { console.error("Erro ao carregar scouts:", e); }
    finally { setCarregandoScout(false); }
  }, []);

  const carregarStatsDoJogo = useCallback(async (jogo: any) => {
    setCarregandoStatsJogo(true);
    setJogoStatsVisualizado(jogo);
    try {
      const base = getApiBaseUrl();
      const resp = await fetch(`${base}/api/jogos/${jogo.id}/scouts`);
      if (resp.ok) {
        const data: any[] = await resp.json();
        // Enriquecer com nome e posição do atleta
        const enriched = data.map(s => {
          const atleta = elenco.find(a => a.id === s.atletaId);
          return { ...s, nomeAtleta: atleta?.nome || `Atleta ${s.atletaId}`, posicaoAtleta: atleta?.posicao || "" };
        }).sort((a, b) => {
          if (a.titular && !b.titular) return -1;
          if (!a.titular && b.titular) return 1;
          return a.nomeAtleta.localeCompare(b.nomeAtleta);
        });
        setScoutsStatsJogo(enriched);
      }
    } catch (e) { console.error("Erro ao carregar stats do jogo:", e); }
    finally { setCarregandoStatsJogo(false); }
  }, [elenco]);

  useEffect(() => {
    if (abaAtiva === "jogos" && jogos.length === 0) carregarJogos();
  }, [abaAtiva, carregarJogos]);

  const salvarJogo = async () => {
    try {
      const base = getApiBaseUrl();
      const payload: any = { ...jogoEditando };
      // Converter campos numéricos corretamente
      if (payload.placarMandante !== "") {
        const parsed = parseInt(payload.placarMandante, 10);
        payload.placarMandante = isNaN(parsed) ? null : parsed;
      } else {
        payload.placarMandante = null;
      }
      if (payload.placarVisitante !== "") {
        const parsed = parseInt(payload.placarVisitante, 10);
        payload.placarVisitante = isNaN(parsed) ? null : parsed;
      } else {
        payload.placarVisitante = null;
      }
      if (payload.publico !== "") {
        // Remove pontos e vírgulas, depois converte para número
        const cleaned = payload.publico.toString().replace(/[.,]/g, '');
        const parsed = parseInt(cleaned, 10);
        payload.publico = isNaN(parsed) ? null : parsed;
      } else {
        payload.publico = null;
      }
      console.log('[DEBUG] Payload sendo enviado:', JSON.stringify(payload, null, 2));
      let resp;
      if (jogoEditando.id) {
        resp = await fetch(`${base}/api/jogos/${jogoEditando.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        resp = await fetch(`${base}/api/jogos`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      if (resp.ok) {
        await carregarJogos();
        setModalJogoVisivel(false);
      } else {
        Alert.alert("Erro", "N\u00e3o foi poss\u00edvel salvar o jogo.");
      }
    } catch (e: any) { Alert.alert("Erro", e.message); }
  };

  const deletarJogo = async (id: number) => {
    Alert.alert("Confirmar", "Deseja excluir este jogo e todos os seus dados de scout?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
        const base = getApiBaseUrl();
        await fetch(`${base}/api/jogos/${id}`, { method: "DELETE" });
        await carregarJogos();
        if (jogoSelecionado?.id === id) setJogoSelecionado(null);
      }},
    ]);
  };

  const toggleAtletaRelacionado = (atletaId: number) => {
    setAtletasRelacionados(prev =>
      prev.includes(atletaId) ? prev.filter(id => id !== atletaId) : [...prev, atletaId]
    );
    if (!scoutsDoJogo[atletaId]) {
      setScoutsDoJogo(prev => ({
        ...prev,
        [atletaId]: {
          atletaId, titular: false, minutosJogados: 0,
          // Ofensivo
          gol: 0, assistencia: 0, finalizacaoCerta: 0, finalizacaoErrada: 0,
          passeCerto: 0, passeErrado: 0, passeFinalizacao: 0,
          cruzamentoCerto: 0, cruzamentoErrado: 0,
          passeLongoCerto: 0, passeLongoErrado: 0,
          dribleCerto: 0, dribleErrado: 0,
          desperdicio: 0, faltaSofrida: 0,
          // Defensivo
          desarme: 0, jogoAereoGanho: 0, jogoAereoPerdido: 0,
          bolaAreaGanha: 0, bolaAreaPerdida: 0,
          faltaCometida: 0, bolaRecuperada: 0,
          finalizacaoInterceptada: 0,
          duelChaoGanho: 0, duelChaoPerdido: 0,
          // Disciplina e Notas
          cartoesAmarelos: 0, cartoesVermelhos: 0,
          notaTecnica: "", notaFisica: "", notaTatica: "",
          notaAtitudinal: "", notaPotencial: "", observacoes: "",
        },
      }));
    }
  };

  const mostrarMensagem = (msg: string) => {
    setMensagemSucesso(msg);
    setTimeout(() => setMensagemSucesso(null), 3000);
  };

  const salvarScouts = async () => {
    if (!jogoSelecionado) return;
    setSalvandoScout(true);
    try {
      const base = getApiBaseUrl();
      const scouts = atletasRelacionados.map(id => ({
        ...scoutsDoJogo[id],
        atletaId: id,
      })).filter(Boolean);
      const resp = await fetch(`${base}/api/jogos/${jogoSelecionado.id}/scouts`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scouts }),
      });
      if (resp.ok) {
        mostrarMensagem("Scout salvo com sucesso! Estatísticas da temporada atualizadas.");
        await carregarElenco();
      } else {
        const errData = await resp.json().catch(() => ({}));
        mostrarMensagem(`Erro ao salvar: ${errData.error || "Tente novamente."}`);
      }
    } catch (e: any) {
      mostrarMensagem(`Erro: ${e.message}`);
    }
    finally { setSalvandoScout(false); }
  };

  const gerarRelatorioJogo = async (jogo: any) => {
    setGerandoPdfJogo(true);
    try {
      const base = getApiBaseUrl();
      if (Platform.OS === "web") {
        const resp = await fetch(`${base}/api/jogos/${jogo.id}/relatorio`, { method: "POST" });
        if (!resp.ok) throw new Error("Erro ao gerar relatório");
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else {
        // No Expo Go: fetch POST -> arrayBuffer -> base64 manual -> FileSystem -> Sharing
        const resp = await fetch(`${base}/api/jogos/${jogo.id}/relatorio`, { method: "POST" });
        if (!resp.ok) throw new Error("Erro ao gerar relatório");
        const arrayBuffer = await resp.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const binaryString = String.fromCharCode(...uint8Array);
        const base64 = btoa(binaryString);
        const FileSystem = await import("expo-file-system/legacy");
        const Sharing = await import("expo-sharing");
        const nomeArquivo = `Scout_${jogo.mandante}_x_${jogo.visitante}.pdf`.replace(/\s+/g, "_");
        const path = (FileSystem.cacheDirectory || "") + nomeArquivo;
        await FileSystem.writeAsStringAsync(path, base64, { encoding: "base64" });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(path, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
        } else {
          Alert.alert("Sucesso", `PDF salvo em: ${path}`);
        }
      }
    } catch (e: any) { Alert.alert("Erro", e.message); }
    finally { setGerandoPdfJogo(false); }
  };

  const carregarElenco = useCallback(async () => {
    try {
      setCarregando(true);
      const base = getApiBaseUrl();
      console.log('[DEBUG] Base URL:', base);
      const resp = await fetch(`${base}/api/atletas`);
      console.log('[DEBUG] Response status:', resp.status);
      if (resp.ok) {
        const json = await resp.json();
        console.log('[DEBUG] Response JSON:', json);
        const atletas = json.data || json || [];
        console.log('[DEBUG] Atletas carregados:', atletas.length);
        // Filtrar apenas atletas do Marcílio Dias
        const atletasMarcilio = atletas.filter((atleta: any) => {
          if (!atleta.clube) return false;
          const clubeNormalizado = atleta.clube.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          return clubeNormalizado.includes('marcilio dias');
        });
        console.log('[DEBUG] Atletas do Marcílio Dias:', atletasMarcilio.length);
        setElenco(atletasMarcilio);
      } else {
        console.error('[DEBUG] Response not ok:', resp.status);
      }
    } catch (e) {
      console.error('Erro ao carregar elenco:', e);
      console.error('[DEBUG] Erro completo:', JSON.stringify(e, null, 2));
      if (e instanceof Error) {
        console.error('[DEBUG] Mensagem:', e.message);
        console.error('[DEBUG] Stack:', e.stack);
      }
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregarElenco(); }, [carregarElenco]);

  const posicoes = useMemo(() => {
    const set = new Set<string>();
    elenco.forEach(a => { if (a.posicao) set.add(a.posicao); });
    return Array.from(set).sort();
  }, [elenco]);

  const elencoFiltrado = useMemo(() => {
    return elenco.filter(a => {
      const idade = calcularIdade(a.dataNascimento, a.idade);
      if (filtroPosicao && a.posicao !== filtroPosicao && a.segundaPosicao !== filtroPosicao) return false;
      if (filtroIdadeMin && idade !== null && idade < parseInt(filtroIdadeMin)) return false;
      if (filtroIdadeMax && idade !== null && idade > parseInt(filtroIdadeMax)) return false;
      if (filtroMinutos && (!a.estatisticas || (a.estatisticas.minutosJogados || 0) < parseInt(filtroMinutos))) return false;
      return true;
    });
  }, [elenco, filtroPosicao, filtroIdadeMin, filtroIdadeMax, filtroMinutos]);

  // Estatísticas do dashboard
  const dashboard = useMemo(() => {
    if (!elenco.length) return null;
    const idades = elenco.map(a => calcularIdade(a.dataNascimento, a.idade)).filter(Boolean) as number[];
    const alturas = elenco.map(a => parseFloat(a.altura || "0")).filter(Boolean);
    const mediaIdade = idades.length ? (idades.reduce((a, b) => a + b, 0) / idades.length).toFixed(1) : "—";
    const mediaAltura = alturas.length ? (alturas.reduce((a, b) => a + b, 0) / alturas.length).toFixed(2) : "—";
    const totalGols = elenco.reduce((acc, a) => acc + (a.estatisticas?.gol || 0), 0);
    const totalMinutos = elenco.reduce((acc, a) => acc + (a.estatisticas?.minutosJogados || 0), 0);
    const porPosicao: Record<string, number> = {};
    elenco.forEach(a => { if (a.posicao) porPosicao[a.posicao] = (porPosicao[a.posicao] || 0) + 1; });
    return { mediaIdade, mediaAltura, totalGols, totalMinutos, porPosicao, total: elenco.length };
  }, [elenco]);

  const atletasSelecionados = useMemo(() => elenco.filter(a => selecionados.includes(a.id)), [elenco, selecionados]);

  const toggleSelecionado = (id: number) => {
    setSelecionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSalvarStats = (atletaId: number, stats: EstatisticasTemporada) => {
    // Atualiza o elenco local imediatamente com os dados salvos
    setElenco(prev => prev.map(a => a.id === atletaId ? { ...a, estatisticas: { ...stats } } : a));
    // Também atualiza o atletaEditando para evitar que o useEffect do modal reinicialize
    setAtletaEditando(prev => prev && prev.id === atletaId ? { ...prev, estatisticas: { ...stats } } : prev);
  };

  const [gerandoPdf, setGerandoPdf] = useState(false);

  const gerarRelatorioExecutivo = async () => {
    if (selecionados.length === 0) {
      Alert.alert("Atenção", "Selecione pelo menos um atleta para gerar o relatório.");
      return;
    }
    setGerandoPdf(true);
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/report/pdf-executivo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selecionados, temporada: "2025" }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao gerar PDF");
      }
      const blob = await response.blob();
      if (Platform.OS === "web") {
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        // Revogar após delay para garantir que o navegador abriu
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else {
        const FileSystem = await import("expo-file-system/legacy");
        const Sharing = await import("expo-sharing");
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(",")[1];
          const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory || "";
          const path = dir + `Relatorio_Tecnico_BDMD_2025.pdf`;
          await FileSystem.writeAsStringAsync(path, base64, { encoding: FileSystem.EncodingType.Base64 });
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(path, { mimeType: "application/pdf" });
          } else {
            Alert.alert("Sucesso", `PDF salvo em:\n${path}`);
          }
        };
      }
    } catch (e: any) {
      Alert.alert("Erro", e.message || "Não foi possível gerar o relatório.");
    } finally {
      setGerandoPdf(false);
    }
  };

  const renderDashboard = () => (
    <View>
      {/* Cards do dashboard */}
      <View style={styles.dashboardGrid}>
        <View style={styles.dashCard}>
          <Text style={styles.dashValor}>{dashboard?.total || 0}</Text>
          <Text style={styles.dashLabel}>Atletas</Text>
        </View>
        <View style={styles.dashCard}>
          <Text style={styles.dashValor}>{dashboard?.mediaIdade || "—"}</Text>
          <Text style={styles.dashLabel}>Média Idade</Text>
        </View>
        <View style={styles.dashCard}>
          <Text style={styles.dashValor}>{dashboard?.mediaAltura ? `${dashboard.mediaAltura}m` : "—"}</Text>
          <Text style={styles.dashLabel}>Média Altura</Text>
        </View>
        <View style={styles.dashCard}>
          <Text style={styles.dashValor}>{dashboard?.totalGols || 0}</Text>
          <Text style={styles.dashLabel}>Gols</Text>
        </View>
      </View>

      {/* Distribuição por posição */}
      {dashboard && Object.keys(dashboard.porPosicao).length > 0 && (
        <View style={styles.secaoCard}>
          <Text style={styles.secaoTituloCard}>Distribuição por Posição</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {Object.entries(dashboard.porPosicao).sort((a, b) => b[1] - a[1]).map(([pos, qtd]) => (
              <View key={pos} style={styles.badgePosicao}>
                <Text style={styles.badgePosicaoTexto}>{pos}</Text>
                <View style={styles.badgePosicaoNum}>
                  <Text style={{ color: CORES.branco, fontSize: 11, fontWeight: "bold" }}>{qtd}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Filtros */}
      <TouchableOpacity style={styles.btnFiltros} onPress={() => setMostrarFiltros(!mostrarFiltros)}>
        <Text style={styles.btnFiltrosTexto}>{mostrarFiltros ? "▲ Ocultar Filtros" : "▼ Filtros Avançados"}</Text>
      </TouchableOpacity>

      {mostrarFiltros && (
        <View style={styles.filtrosContainer}>
          <Text style={styles.filtroLabel}>Posição</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <TouchableOpacity
              style={[styles.chipPosicao, !filtroPosicao && styles.chipPosicaoAtivo]}
              onPress={() => setFiltroPosicao("")}
            >
              <Text style={[styles.chipPosicaoTexto, !filtroPosicao && styles.chipPosicaoTextoAtivo]}>Todas</Text>
            </TouchableOpacity>
            {posicoes.map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.chipPosicao, filtroPosicao === p && styles.chipPosicaoAtivo]}
                onPress={() => setFiltroPosicao(filtroPosicao === p ? "" : p)}
              >
                <Text style={[styles.chipPosicaoTexto, filtroPosicao === p && styles.chipPosicaoTextoAtivo]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.filtroLabel}>Idade Mín.</Text>
              <TextInput style={styles.filtroInput} value={filtroIdadeMin} onChangeText={setFiltroIdadeMin} keyboardType="numeric" placeholder="Ex: 18" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.filtroLabel}>Idade Máx.</Text>
              <TextInput style={styles.filtroInput} value={filtroIdadeMax} onChangeText={setFiltroIdadeMax} keyboardType="numeric" placeholder="Ex: 30" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.filtroLabel}>Min. Mínimos</Text>
              <TextInput style={styles.filtroInput} value={filtroMinutos} onChangeText={setFiltroMinutos} keyboardType="numeric" placeholder="Ex: 90" />
            </View>
          </View>

          {(filtroPosicao || filtroIdadeMin || filtroIdadeMax || filtroMinutos) && (
            <TouchableOpacity onPress={() => { setFiltroPosicao(""); setFiltroIdadeMin(""); setFiltroIdadeMax(""); setFiltroMinutos(""); }} style={styles.btnLimparFiltros}>
              <Text style={{ color: CORES.vermelho, fontSize: 13, fontWeight: "600" }}>✕ Limpar Filtros</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Lista de atletas */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Text style={styles.totalAtletas}>{elencoFiltrado.length} atleta{elencoFiltrado.length !== 1 ? "s" : ""}</Text>
        {selecionados.length > 0 && (
          <TouchableOpacity style={[styles.btnRelatorio, gerandoPdf && { opacity: 0.7 }]} onPress={gerarRelatorioExecutivo} disabled={gerandoPdf}>
            {gerandoPdf
              ? <ActivityIndicator size="small" color={CORES.branco} />
              : <Text style={styles.btnRelatorioTexto}>📋 Relatório Técnico ({selecionados.length})</Text>
            }
          </TouchableOpacity>
        )}
      </View>

      {elencoFiltrado.map(atleta => (
        <CardAtleta
          key={atleta.id}
          atleta={atleta}
          selecionado={selecionados.includes(atleta.id)}
          onToggle={() => toggleSelecionado(atleta.id)}
          onEditar={() => { setAtletaEditando(atleta); setModalStatsVisivel(true); }}
          onVerDetalhes={() => router.push(`/atleta/detalhes/${atleta.id}`)}
        />
      ))}
    </View>
  );

  const renderComparar = () => {
    if (selecionados.length < 2) {
      return (
        <View style={styles.estadoVazio}>
          <Text style={styles.estadoVazioIcone}>⚖️</Text>
          <Text style={styles.estadoVazioTitulo}>Comparar Atletas</Text>
          <Text style={styles.estadoVazioTexto}>Selecione 2 ou mais atletas na aba Elenco para comparar suas estatísticas.</Text>
        </View>
      );
    }

    const campos: { label: string; chave: keyof EstatisticasTemporada; secao?: string }[] = [
      { label: "Jogos", chave: "jogos" },
      { label: "Minutos", chave: "minutosJogados" },
      // Ofensivo
      { label: "Gol", chave: "gol", secao: "Ofensivo" },
      { label: "Assistência", chave: "assistencia", secao: "Ofensivo" },
      { label: "Finalização Certa", chave: "finalizacaoCerta", secao: "Ofensivo" },
      { label: "Finalização Errada", chave: "finalizacaoErrada", secao: "Ofensivo" },
      { label: "Passe Certo", chave: "passeCerto", secao: "Ofensivo" },
      { label: "Passe Errado", chave: "passeErrado", secao: "Ofensivo" },
      { label: "Passe Finalização", chave: "passeFinalizacao", secao: "Ofensivo" },
      { label: "Cruzamento Certo", chave: "cruzamentoCerto", secao: "Ofensivo" },
      { label: "Cruzamento Errado", chave: "cruzamentoErrado", secao: "Ofensivo" },
      { label: "Passe Longo Certo", chave: "passeLongoCerto", secao: "Ofensivo" },
      { label: "Passe Longo Errado", chave: "passeLongoErrado", secao: "Ofensivo" },
      { label: "Drible Certo", chave: "dribleCerto", secao: "Ofensivo" },
      { label: "Drible Errado", chave: "dribleErrado", secao: "Ofensivo" },
      { label: "Desperdício", chave: "desperdicio", secao: "Ofensivo" },
      { label: "Falta Sofrida", chave: "faltaSofrida", secao: "Ofensivo" },
      // Defensivo
      { label: "Desarme", chave: "desarme", secao: "Defensivo" },
      { label: "Jogo Aéreo Ganho", chave: "jogoAereoGanho", secao: "Defensivo" },
      { label: "Jogo Aéreo Perdido", chave: "jogoAereoPerdido", secao: "Defensivo" },
      { label: "Bola Área Ganha", chave: "bolaAreaGanha", secao: "Defensivo" },
      { label: "Bola Área Perdida", chave: "bolaAreaPerdida", secao: "Defensivo" },
      { label: "Falta Cometida", chave: "faltaCometida", secao: "Defensivo" },
      { label: "Bola Recuperada", chave: "bolaRecuperada", secao: "Defensivo" },
      { label: "Finalização Interceptada", chave: "finalizacaoInterceptada", secao: "Defensivo" },
      { label: "Duel Chão Ganho", chave: "duelChaoGanho", secao: "Defensivo" },
      { label: "Duel Chão Perdido", chave: "duelChaoPerdido", secao: "Defensivo" },
      // Disciplina
      { label: "Amarelos", chave: "cartoesAmarelos", secao: "Disciplina" },
      { label: "Vermelhos", chave: "cartoesVermelhos", secao: "Disciplina" },
    ];

    return (
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header */}
            <View style={[styles.tabelaRow, styles.tabelaHeader]}>
              <Text style={[styles.tabelaCelula, styles.tabelaLabelCol]}>Estatística</Text>
              {atletasSelecionados.map(a => (
                <Text key={a.id} style={[styles.tabelaCelula, styles.tabelaAtletaCol]} numberOfLines={2}>{a.nome}</Text>
              ))}
            </View>
            {/* Linhas com separadores de seção */}
            {campos.map((campo, idx) => {
              const valores = atletasSelecionados.map(a => Number(a.estatisticas?.[campo.chave] || 0));
              const maximo = Math.max(...valores);
              const secaoAnterior = idx > 0 ? campos[idx - 1].secao : undefined;
              const mostraSeparador = campo.secao && campo.secao !== secaoAnterior;
              const corSecao = campo.secao === "Ofensivo" ? CORES.azulClaro : campo.secao === "Defensivo" ? CORES.verde : campo.secao === "Disciplina" ? "#b45309" : undefined;
              return (
                <React.Fragment key={campo.chave}>
                  {mostraSeparador && (
                    <View style={{ backgroundColor: corSecao, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ color: CORES.branco, fontSize: 9, fontWeight: "700", textTransform: "uppercase" }}>{campo.secao}</Text>
                    </View>
                  )}
                  <View style={[styles.tabelaRow, idx % 2 === 0 && { backgroundColor: CORES.cinzaClaro }]}>
                    <Text style={[styles.tabelaCelula, styles.tabelaLabelCol, { color: CORES.cinzaTexto }]}>{campo.label}</Text>
                    {atletasSelecionados.map(a => {
                      const val = Number(a.estatisticas?.[campo.chave] || 0);
                      const destaque = val === maximo && maximo > 0;
                      return (
                        <Text key={a.id} style={[styles.tabelaCelula, styles.tabelaAtletaCol, destaque && { color: CORES.verde, fontWeight: "bold" }]}>
                          {val}
                        </Text>
                      );
                    })}
                  </View>
                </React.Fragment>
              );
            })}
          </View>
        </ScrollView>
        <Text style={{ color: CORES.cinzaTexto, fontSize: 11, marginTop: 8, textAlign: "center" }}>
          ✅ Destaque em verde = melhor valor entre os selecionados
        </Text>
      </View>
    );
  };

  const renderRadar = () => {
    if (selecionados.length === 0) {
      return (
        <View style={styles.estadoVazio}>
          <Text style={styles.estadoVazioIcone}>🕸️</Text>
          <Text style={styles.estadoVazioTitulo}>Gráfico Radar</Text>
          <Text style={styles.estadoVazioTexto}>Selecione atletas na aba Elenco e preencha as notas técnicas para visualizar o radar.</Text>
        </View>
      );
    }

    return (
      <View>
        {atletasSelecionados.map(atleta => (
          <View key={atleta.id} style={styles.secaoCard}>
            <Text style={styles.secaoTituloCard}>{atleta.nome} — {atleta.posicao || "Posição não informada"}</Text>
            <GraficoRadar atleta={atleta} benchmark={null} />
            {atleta.estatisticas?.observacoes && (
              <View style={{ marginTop: 12, padding: 10, backgroundColor: CORES.cinzaClaro, borderRadius: 8 }}>
                <Text style={{ fontSize: 12, color: CORES.cinzaTexto, fontStyle: "italic" }}>
                  📝 {atleta.estatisticas.observacoes}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderJogos = () => (
    <View>
      {/* Botão Novo Jogo */}
      <TouchableOpacity
        style={[styles.btnRelatorio, { backgroundColor: CORES.verde, marginBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12 }]}
        onPress={() => { setJogoEditando({ ...JOGO_VAZIO }); setModalJogoVisivel(true); }}
      >
        <Text style={[styles.btnRelatorioTexto, { fontSize: 14 }]}>+ Novo Jogo</Text>
      </TouchableOpacity>

      {carregandoJogos ? (
        <ActivityIndicator size="large" color={CORES.azulClaro} style={{ marginTop: 40 }} />
      ) : jogos.length === 0 ? (
        <View style={styles.estadoVazio}>
          <Text style={styles.estadoVazioIcone}>⚽</Text>
          <Text style={styles.estadoVazioTitulo}>Nenhum jogo cadastrado</Text>
          <Text style={styles.estadoVazioTexto}>Toque em "+ Novo Jogo" para registrar a primeira partida.</Text>
        </View>
      ) : (
        jogos.map((jogo: any) => (
          <View key={jogo.id} style={styles.cardAtleta}>
            {/* Placar */}
            <View style={{ backgroundColor: CORES.azulEscuro, borderRadius: 10, padding: 12, margin: 10, alignItems: "center" }}>
              <Text style={{ color: `${CORES.branco}80`, fontSize: 11, marginBottom: 4 }}>{jogo.competicao || ""} {jogo.data ? `• ${new Date(jogo.data).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" })}` : ""}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Text style={{ color: CORES.branco, fontSize: 13, fontWeight: "700", flex: 1, textAlign: "right" }}>{jogo.mandante}</Text>
                <View style={{ backgroundColor: CORES.vermelho, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 }}>
                  <Text style={{ color: CORES.branco, fontSize: 20, fontWeight: "900" }}>
                    {jogo.placarMandante ?? "—"} x {jogo.placarVisitante ?? "—"}
                  </Text>
                </View>
                <Text style={{ color: CORES.branco, fontSize: 13, fontWeight: "700", flex: 1 }}>{jogo.visitante}</Text>
              </View>
              {jogo.local ? <Text style={{ color: `${CORES.branco}70`, fontSize: 11, marginTop: 4 }}>📍 {jogo.local}</Text> : null}
            </View>
            {/* Ações */}
            <View style={{ flexDirection: "row", gap: 8, padding: 10 }}>
              <TouchableOpacity
                style={[styles.btnEditar, { flex: 1 }]}
                onPress={() => {
                  // Converter data de AAAA-MM-DD para DD/MM/AAAA
                  const dataISO = jogo.data ? jogo.data.split("T")[0] : "";
                  let dataExibicao = "";
                  if (dataISO && dataISO.length === 10) {
                    const [aaaa, mm, dd] = dataISO.split("-");
                    dataExibicao = `${dd}/${mm}/${aaaa}`;
                  }
                  console.log('[DEBUG] Jogo carregado do banco:', jogo);
                  console.log('[DEBUG] jogo.publico:', jogo.publico, 'tipo:', typeof jogo.publico);
                  setJogoEditando({
                    ...JOGO_VAZIO,
                    ...jogo,
                    placarMandante: jogo.placarMandante?.toString() ?? "",
                    placarVisitante: jogo.placarVisitante?.toString() ?? "",
                    publico: jogo.publico?.toString() ?? "",
                    data: dataISO,
                    dataExibicao,
                  });
                  console.log('[DEBUG] jogoEditando após setJogoEditando:', { publico: jogo.publico?.toString() ?? "" });
                  setModalJogoVisivel(true);
                }}
              >
                <Text style={styles.btnEditarTexto}>✏️ Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnVerPerfil, { flex: 2 }]}
                onPress={async () => {
                  setJogoSelecionado(jogo);
                  await carregarScoutsDoJogo(jogo.id);
                  setModalScoutVisivel(true);
                }}
              >
                <Text style={styles.btnVerPerfilTexto}>📋 Scout do Jogo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnEditar, { backgroundColor: CORES.vermelho }]}
                onPress={() => deletarJogo(jogo.id)}
              >
                <Text style={[styles.btnEditarTexto, { color: CORES.branco }]}>🗑</Text>
              </TouchableOpacity>
            </View>
            {/* Botão Prévia + Download */}
            <TouchableOpacity
              style={[styles.btnRelatorio, { margin: 10, marginTop: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12 }]}
              onPress={async () => {
                await carregarStatsDoJogo(jogo);
                setModalStatsJogoVisivel(true);
              }}
            >
              <Text style={styles.btnRelatorioTexto}>📄 Ver Prévia e Baixar Relatório</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerEsquerda}>
          <Image
            source={marcilioDiasShield}
            style={styles.escudoImg}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.headerTitulo}>Análise de Elenco</Text>
            <Text style={styles.headerSubtitulo}>Marcílio Dias</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.btnAtualizar} onPress={carregarElenco}>
          <Text style={{ color: CORES.azulClaro, fontSize: 12, fontWeight: "600" }}>↻ Atualizar</Text>
        </TouchableOpacity>
      </View>

      {/* Abas */}
      <View style={styles.abas}>
           {(["elenco", "comparar", "radar", "jogos"] as const).map(aba => (
          <TouchableOpacity
            key={aba}
            style={[styles.aba, abaAtiva === aba && styles.abaAtiva]}
            onPress={() => setAbaAtiva(aba)}
          >
            <Text style={[styles.abaTexto, abaAtiva === aba && styles.abaTextoAtivo]}>
              {aba === "elenco" ? "🏙 Elenco" : aba === "comparar" ? "⚖️ Comparar" : aba === "radar" ? "🕸️ Radar" : "⚽ Jogos"}
            </Text>
          </TouchableOpacity>
        ))}
      
      </View>

      {carregando ? (
        <View style={styles.estadoVazio}>
          <ActivityIndicator size="large" color={CORES.azulClaro} />
          <Text style={{ color: CORES.cinzaTexto, marginTop: 12 }}>Carregando elenco...</Text>
        </View>
      ) : elenco.length === 0 ? (
        <View style={styles.estadoVazio}>
          <Text style={styles.estadoVazioIcone}>🏟️</Text>
          <Text style={styles.estadoVazioTitulo}>Nenhum atleta encontrado</Text>
          <Text style={styles.estadoVazioTexto}>
            Cadastre atletas com o clube "Marcílio Dias/SC" para que apareçam aqui automaticamente.
          </Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {abaAtiva === "elenco" && renderDashboard()}
          {abaAtiva === "comparar" && renderComparar()}
          {abaAtiva === "radar" && renderRadar()}
          {abaAtiva === "jogos" && renderJogos()}
        </ScrollView>
      )}

      <ModalEstatisticas
        atleta={atletaEditando}
        visivel={modalStatsVisivel}
        onFechar={() => { setModalStatsVisivel(false); setAtletaEditando(null); }}
        onSalvar={handleSalvarStats}
      />

      {/* Modal Cadastro de Jogo */}
      <Modal visible={modalJogoVisivel} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: CORES.branco }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.btnFechar} onPress={() => setModalJogoVisivel(false)}>
              <Text style={{ color: CORES.branco, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitulo}>{jogoEditando.id ? "Editar Jogo" : "Novo Jogo"}</Text>
            <TouchableOpacity style={styles.btnSalvar} onPress={salvarJogo}>
              <Text style={{ color: CORES.branco, fontWeight: "700", fontSize: 13 }}>Salvar</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {/* Placar */}
            <Text style={styles.secaoTitulo}>Placar</Text>
            <View style={{ flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 12 }}>
              <View style={{ flex: 2 }}>
                <Text style={styles.labelCampo}>Mandante</Text>
                <TextInput style={styles.inputCampo} value={jogoEditando.mandante} onChangeText={v => setJogoEditando(p => ({ ...p, mandante: v }))} placeholder="Marcílio Dias" />
              </View>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={styles.labelCampo}>Gols</Text>
                <TextInput style={[styles.inputCampo, { textAlign: "center", fontWeight: "800", fontSize: 18 }]} value={jogoEditando.placarMandante} onChangeText={v => setJogoEditando(p => ({ ...p, placarMandante: v }))} keyboardType="numeric" placeholder="0" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: "800", color: CORES.preto, paddingTop: 16 }}>x</Text>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={styles.labelCampo}>Gols</Text>
                <TextInput style={[styles.inputCampo, { textAlign: "center", fontWeight: "800", fontSize: 18 }]} value={jogoEditando.placarVisitante} onChangeText={v => setJogoEditando(p => ({ ...p, placarVisitante: v }))} keyboardType="numeric" placeholder="0" />
              </View>
              <View style={{ flex: 2 }}>
                <Text style={styles.labelCampo}>Visitante</Text>
                <TextInput style={styles.inputCampo} value={jogoEditando.visitante} onChangeText={v => setJogoEditando(p => ({ ...p, visitante: v }))} placeholder="Adversário" />
              </View>
            </View>

            {/* Informações do Jogo */}
            <Text style={styles.secaoTitulo}>Informações do Jogo</Text>
            <View style={styles.gridCampos}>
              <View style={styles.campoPar}>
                <Text style={styles.labelCampo}>Competição</Text>
                <TextInput style={styles.inputCampo} value={jogoEditando.competicao} onChangeText={v => setJogoEditando(p => ({ ...p, competicao: v }))} placeholder="Ex: Série D" />
              </View>
              <View style={styles.campoPar}>
                <Text style={styles.labelCampo}>Data (DD/MM/AAAA)</Text>
                <TextInput
                  style={styles.inputCampo}
                  value={jogoEditando.dataExibicao ?? ""}
                  onChangeText={v => {
                    // Remove tudo que não é dígito
                    const digits = v.replace(/\D/g, "").slice(0, 8);
                    // Aplica máscara DD/MM/AAAA
                    let masked = digits;
                    if (digits.length > 2) masked = digits.slice(0, 2) + "/" + digits.slice(2);
                    if (digits.length > 4) masked = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
                    // Converte para AAAA-MM-DD para salvar no banco
                    let iso = "";
                    if (digits.length === 8) {
                      const dd = digits.slice(0, 2);
                      const mm = digits.slice(2, 4);
                      const aaaa = digits.slice(4, 8);
                      iso = `${aaaa}-${mm}-${dd}`;
                    }
                    setJogoEditando(p => ({ ...p, dataExibicao: masked, data: iso || masked }));
                  }}
                  placeholder="06/04/2025"
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
              <View style={styles.campoPar}>
                <Text style={styles.labelCampo}>Horário</Text>
                <TextInput style={styles.inputCampo} value={jogoEditando.horario} onChangeText={v => setJogoEditando(p => ({ ...p, horario: v }))} placeholder="16:00" />
              </View>
              <View style={styles.campoPar}>
                <Text style={styles.labelCampo}>Local</Text>
                <TextInput style={styles.inputCampo} value={jogoEditando.local} onChangeText={v => setJogoEditando(p => ({ ...p, local: v }))} placeholder="Estádio" />
              </View>
            </View>

            {/* Arbitragem */}
            <Text style={styles.secaoTitulo}>Arbitragem</Text>
            <View style={styles.gridCampos}>
              <View style={styles.campoPar}>
                <Text style={styles.labelCampo}>Árbitro</Text>
                <TextInput style={styles.inputCampo} value={jogoEditando.arbitro} onChangeText={v => setJogoEditando(p => ({ ...p, arbitro: v }))} />
              </View>
              <View style={styles.campoPar}>
                <Text style={styles.labelCampo}>Assistente 1</Text>
                <TextInput style={styles.inputCampo} value={jogoEditando.assistente1} onChangeText={v => setJogoEditando(p => ({ ...p, assistente1: v }))} />
              </View>
              <View style={styles.campoPar}>
                <Text style={styles.labelCampo}>Assistente 2</Text>
                <TextInput style={styles.inputCampo} value={jogoEditando.assistente2} onChangeText={v => setJogoEditando(p => ({ ...p, assistente2: v }))} />
              </View>
            </View>

            {/* Dados da Partida */}
            <Text style={styles.secaoTitulo}>Dados da Partida</Text>
            <View style={styles.gridCampos}>
              <View style={styles.campoPar}>
                <Text style={styles.labelCampo}>Público</Text>
                <TextInput style={styles.inputCampo} value={jogoEditando.publico} onChangeText={v => setJogoEditando(p => ({ ...p, publico: v }))} keyboardType="numeric" />
              </View>
              <View style={styles.campoPar}>
                <Text style={styles.labelCampo}>Renda</Text>
                <TextInput style={styles.inputCampo} value={jogoEditando.renda} onChangeText={v => setJogoEditando(p => ({ ...p, renda: v }))} placeholder="R$ 0,00" />
              </View>
            </View>
            <View style={{ marginTop: 10 }}>
              <Text style={styles.labelCampo}>Gols (descritivo)</Text>
              <TextInput style={[styles.inputCampo, { minHeight: 60 }]} value={jogoEditando.gols} onChangeText={v => setJogoEditando(p => ({ ...p, gols: v }))} multiline placeholder="Ex: Davi Torres 23', Alan Costa 67'" />
            </View>
            <View style={{ marginTop: 10 }}>
              <Text style={styles.labelCampo}>Observações</Text>
              <TextInput style={[styles.inputCampo, { minHeight: 80 }]} value={jogoEditando.observacoes} onChangeText={v => setJogoEditando(p => ({ ...p, observacoes: v }))} multiline placeholder="Observações gerais sobre o jogo..." />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal Scout do Jogo */}
      <Modal visible={modalScoutVisivel} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: CORES.branco }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.btnFechar} onPress={() => setModalScoutVisivel(false)}>
              <Text style={{ color: CORES.branco, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitulo} numberOfLines={1}>
              {jogoSelecionado ? `${jogoSelecionado.mandante} x ${jogoSelecionado.visitante}` : "Scout"}
            </Text>
            <TouchableOpacity style={styles.btnSalvar} onPress={salvarScouts} disabled={salvandoScout}>
              {salvandoScout
                ? <ActivityIndicator size="small" color={CORES.branco} />
                : <Text style={{ color: CORES.branco, fontWeight: "700", fontSize: 13 }}>Salvar</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Banner de sucesso/erro */}
          {mensagemSucesso && (
            <View style={{
              backgroundColor: mensagemSucesso.startsWith("Erro") ? CORES.vermelho : CORES.verde,
              paddingVertical: 10, paddingHorizontal: 16,
            }}>
              <Text style={{ color: CORES.branco, fontSize: 13, fontWeight: "600", textAlign: "center" }}>
                {mensagemSucesso}
              </Text>
            </View>
          )}

          {carregandoScout ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator size="large" color={CORES.azulClaro} />
              <Text style={{ color: CORES.cinzaTexto, marginTop: 12 }}>Carregando dados do scout...</Text>
            </View>
          ) : (
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {/* Seleção de atletas */}
            <Text style={styles.secaoTitulo}>Selecionar Atletas Relacionados</Text>
            <Text style={{ fontSize: 12, color: CORES.cinzaTexto, marginBottom: 8 }}>Toque no atleta para incluir/remover da relação:</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {elenco.map(a => {
                const incl = atletasRelacionados.includes(a.id);
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.chipPosicao, incl && styles.chipPosicaoAtivo, { marginBottom: 4 }]}
                    onPress={() => toggleAtletaRelacionado(a.id)}
                  >
                    <Text style={[styles.chipPosicaoTexto, incl && styles.chipPosicaoTextoAtivo]}>{a.nome.split(" ")[0]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Planilha de scout por atleta */}
            {atletasRelacionados.length === 0 ? (
              <Text style={{ color: CORES.cinzaTexto, textAlign: "center", marginTop: 20 }}>Selecione atletas acima para preencher o scout.</Text>
            ) : (
              [...atletasRelacionados].sort((a, b) => {
                const ordemPosicao = (pos: string | null) => {
                  if (!pos) return 99;
                  const p = pos.toLowerCase();
                  if (p.includes("goleiro") || p === "gl") return 1;
                  if (p.includes("lateral") || p.includes("zagueiro") || p.includes("defensor") || p === "ld" || p === "le" || p === "zg") return 2;
                  if (p.includes("volante") || p.includes("meia") || p.includes("meio") || p === "vol" || p === "mc" || p === "md" || p === "me") return 3;
                  if (p.includes("atacante") || p.includes("ponta") || p.includes("centroavante") || p === "ca" || p === "pe" || p === "pd") return 4;
                  return 5;
                };
                const atletaA = elenco.find(x => x.id === a);
                const atletaB = elenco.find(x => x.id === b);
                return ordemPosicao(atletaA?.posicao || null) - ordemPosicao(atletaB?.posicao || null);
              }).map(atletaId => {
                const atleta = elenco.find(a => a.id === atletaId);
                if (!atleta) return null;
                const scout = scoutsDoJogo[atletaId] || {};
                const setScout = (campo: string, valor: any) => {
                  setScoutsDoJogo(prev => ({ ...prev, [atletaId]: { ...prev[atletaId], [campo]: valor } }));
                };
                const campoNum = (label: string, campo: string) => (
                  <View style={styles.campoPar} key={campo}>
                    <Text style={styles.labelCampo}>{label}</Text>
                    <TextInput
                      style={styles.inputCampo}
                      value={(scout as any)[campo] === 0 || (scout as any)[campo] === "" ? "" : String((scout as any)[campo] || "")}
                      onChangeText={v => setScout(campo, v === "" ? 0 : (campo.startsWith("nota") ? v : parseInt(v) || 0))}
                      keyboardType="numeric" placeholder="0"
                    />
                  </View>
                );
                // Campo numérico compacto
                const campoCompacto = (label: string, campo: string) => {
                  const val = (scout as any)[campo];
                  const isNota = campo.startsWith("nota");
                  // Para notas: mostrar string diretamente; para números: mostrar 0 como vazio
                  const displayValue = isNota
                    ? (val == null || val === "" ? "" : String(val))
                    : (val === 0 || val === "" || val == null ? "" : String(val));
                  return (
                  <View key={campo} style={{ alignItems: "center", minWidth: 52, flex: 1 }}>
                    <Text style={{ fontSize: 9, color: CORES.cinzaTexto, marginBottom: 2, textAlign: "center" }}>{label}</Text>
                    <TextInput
                      style={{ borderWidth: 1, borderColor: CORES.cinzaMedio, borderRadius: 6, paddingHorizontal: 4, paddingVertical: 3, fontSize: 13, fontWeight: "700", textAlign: "center", width: "100%", backgroundColor: CORES.cinzaClaro, color: CORES.preto }}
                      value={displayValue}
                      onChangeText={v => {
                        if (v === "" || v === null) {
                          setScout(campo, isNota ? "" : 0);
                        } else if (isNota) {
                          setScout(campo, v);
                        } else {
                          const num = parseInt(v);
                          setScout(campo, isNaN(num) ? 0 : num);
                        }
                      }}
                      keyboardType="numeric" placeholder="-"
                    />
                  </View>
                  );
                };
                return (
                  <View key={atletaId} style={{ backgroundColor: CORES.branco, borderRadius: 10, borderWidth: 1, borderColor: CORES.cinzaMedio, marginBottom: 10, padding: 10 }}>
                    {/* Linha de tabela: Atleta + Valências */}
                    <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: CORES.cinzaMedio, paddingVertical: 8 }}>
                      {/* Coluna fixa: Atleta */}
                      <View style={{ width: 120, paddingRight: 8, borderRightWidth: 1, borderRightColor: CORES.cinzaMedio }}>
                        <TouchableOpacity
                          style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: (scout as any).titular ? CORES.azulEscuro : CORES.cinzaMedio, backgroundColor: (scout as any).titular ? CORES.azulEscuro : "transparent", marginBottom: 4 }}
                          onPress={() => setScout("titular", !(scout as any).titular)}
                        >
                          <Text style={{ fontSize: 8, fontWeight: "700", color: (scout as any).titular ? CORES.branco : CORES.cinzaTexto, textAlign: "center" }}>TIT</Text>
                        </TouchableOpacity>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: CORES.preto, marginBottom: 3 }} numberOfLines={2}>{atleta.nome}</Text>
                        <Text style={{ fontSize: 8, color: CORES.azulClaro, fontWeight: "600", marginBottom: 3 }}>{atleta.posicao}</Text>
                        <View style={{ borderTopWidth: 1, borderTopColor: CORES.cinzaMedio, paddingTop: 3 }}>
                          <Text style={{ fontSize: 8, color: CORES.cinzaTexto, textAlign: "center", marginBottom: 2 }}>Min</Text>
                          <TextInput
                            style={{ borderWidth: 1, borderColor: CORES.cinzaMedio, borderRadius: 4, paddingHorizontal: 3, paddingVertical: 2, fontSize: 10, fontWeight: "700", textAlign: "center", backgroundColor: CORES.cinzaClaro, color: CORES.preto }}
                            value={(scout as any).minutosJogados === 0 || (scout as any).minutosJogados == null ? "" : String((scout as any).minutosJogados)}
                            onChangeText={v => {
                              if (v === "" || v === null) {
                                setScout("minutosJogados", 0);
                              } else {
                                const num = parseInt(v);
                                setScout("minutosJogados", isNaN(num) ? 0 : num);
                              }
                            }}
                            keyboardType="numeric" placeholder="-"
                          />
                        </View>
                      </View>

                      {/* ScrollView horizontal com as 25 valências */}
                      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", gap: 2 }}>
                          {/* Ofensivo */}
                          {["gol", "assistencia", "finalizacaoCerta", "finalizacaoErrada", "passeCerto", "passeErrado", "passeFinalizacao", "cruzamentoCerto", "cruzamentoErrado", "passeLongoCerto", "passeLongoErrado", "dribleCerto", "dribleErrado", "desperdicio", "faltaSofrida"].map((chave) => {
                            const labels: Record<string, string> = {
                              gol: "Gol", assistencia: "Ass", finalizacaoCerta: "Fin C", finalizacaoErrada: "Fin E",
                              passeCerto: "Pass C", passeErrado: "Pass E", passeFinalizacao: "Pass F",
                              cruzamentoCerto: "Crz C", cruzamentoErrado: "Crz E",
                              passeLongoCerto: "PL C", passeLongoErrado: "PL E",
                              dribleCerto: "Drib C", dribleErrado: "Drib E", desperdicio: "Desp", faltaSofrida: "FS"
                            };
                            return (
                              <View key={chave} style={{ width: 50, alignItems: "center" }}>
                                <Text style={{ fontSize: 7, color: CORES.azulClaro, fontWeight: "700", marginBottom: 2, textAlign: "center" }}>{labels[chave]}</Text>
                                <TextInput
                                  style={{ borderWidth: 1, borderColor: CORES.cinzaMedio, borderRadius: 4, paddingHorizontal: 3, paddingVertical: 3, fontSize: 10, fontWeight: "700", textAlign: "center", backgroundColor: CORES.cinzaClaro, color: CORES.preto, width: 45 }}
                                  value={(scout as any)[chave] === 0 || (scout as any)[chave] == null ? "" : String((scout as any)[chave])}
                                  onChangeText={v => {
                                    if (v === "" || v === null) {
                                      setScout(chave, 0);
                                    } else {
                                      const num = parseInt(v);
                                      setScout(chave, isNaN(num) ? 0 : num);
                                    }
                                  }}
                                  keyboardType="numeric" placeholder="-"
                                />
                              </View>
                            );
                          })}
                          {/* Defensivo */}
                          {["desarme", "jogoAereoGanho", "jogoAereoPerdido", "bolaAreaGanha", "bolaAreaPerdida", "faltaCometida", "bolaRecuperada", "finalizacaoInterceptada", "duelChaoGanho", "duelChaoPerdido"].map((chave) => {
                            const labels: Record<string, string> = {
                              desarme: "Des", jogoAereoGanho: "Aer G", jogoAereoPerdido: "Aer P",
                              bolaAreaGanha: "Área G", bolaAreaPerdida: "Área P",
                              faltaCometida: "FC", bolaRecuperada: "BR", finalizacaoInterceptada: "FI",
                              duelChaoGanho: "DC G", duelChaoPerdido: "DC P"
                            };
                            return (
                              <View key={chave} style={{ width: 50, alignItems: "center" }}>
                                <Text style={{ fontSize: 7, color: CORES.verde, fontWeight: "700", marginBottom: 2, textAlign: "center" }}>{labels[chave]}</Text>
                                <TextInput
                                  style={{ borderWidth: 1, borderColor: CORES.cinzaMedio, borderRadius: 4, paddingHorizontal: 3, paddingVertical: 3, fontSize: 10, fontWeight: "700", textAlign: "center", backgroundColor: CORES.cinzaClaro, color: CORES.preto, width: 45 }}
                                  value={(scout as any)[chave] === 0 || (scout as any)[chave] == null ? "" : String((scout as any)[chave])}
                                  onChangeText={v => {
                                    if (v === "" || v === null) {
                                      setScout(chave, 0);
                                    } else {
                                      const num = parseInt(v);
                                      setScout(chave, isNaN(num) ? 0 : num);
                                    }
                                  }}
                                  keyboardType="numeric" placeholder="-"
                                />
                              </View>
                            );
                          })}
                          {/* Disciplina */}
                          {["cartoesAmarelos", "cartoesVermelhos"].map((chave) => {
                            const labels: Record<string, string> = {
                              cartoesAmarelos: "Amar", cartoesVermelhos: "Verm"
                            };
                            return (
                              <View key={chave} style={{ width: 50, alignItems: "center" }}>
                                <Text style={{ fontSize: 7, color: "#b45309", fontWeight: "700", marginBottom: 2, textAlign: "center" }}>{labels[chave]}</Text>
                                <TextInput
                                  style={{ borderWidth: 1, borderColor: CORES.cinzaMedio, borderRadius: 4, paddingHorizontal: 3, paddingVertical: 3, fontSize: 10, fontWeight: "700", textAlign: "center", backgroundColor: CORES.cinzaClaro, color: CORES.preto, width: 45 }}
                                  value={(scout as any)[chave] === 0 || (scout as any)[chave] == null ? "" : String((scout as any)[chave])}
                                  onChangeText={v => {
                                    if (v === "" || v === null) {
                                      setScout(chave, 0);
                                    } else {
                                      const num = parseInt(v);
                                      setScout(chave, isNaN(num) ? 0 : num);
                                    }
                                  }}
                                  keyboardType="numeric" placeholder="-"
                                />
                              </View>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
          )}
        </View>
      </Modal>

      {/* Modal Prévia do Relatório de Jogo */}
      <Modal visible={modalStatsJogoVisivel} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: "#f0f2f5" }}>

          {/* Header */}
          <View style={[styles.modalHeader, { paddingBottom: 10 }]}>
            <TouchableOpacity style={styles.btnFechar} onPress={() => setModalStatsJogoVisivel(false)}>
              <Text style={{ color: CORES.branco, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitulo} numberOfLines={1}>📄 Prévia do Relatório</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* ScrollView único cobrindo cabeçalho + cards */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>

          {/* Cabeçalho do jogo */}
          {jogoStatsVisualizado && (
            <View style={{ backgroundColor: CORES.azulEscuro, paddingHorizontal: 16, paddingVertical: 14 }}>
              {/* Times e placar */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 6 }}>
                <Text style={{ color: CORES.branco, fontSize: 15, fontWeight: "800", flex: 1, textAlign: "right" }} numberOfLines={1}>{jogoStatsVisualizado.mandante}</Text>
                <View style={{ backgroundColor: `${CORES.branco}20`, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 }}>
                  <Text style={{ color: CORES.branco, fontSize: 22, fontWeight: "900", letterSpacing: 2 }}>
                    {jogoStatsVisualizado.placarMandante ?? "—"} × {jogoStatsVisualizado.placarVisitante ?? "—"}
                  </Text>
                </View>
                <Text style={{ color: CORES.branco, fontSize: 15, fontWeight: "800", flex: 1, textAlign: "left" }} numberOfLines={1}>{jogoStatsVisualizado.visitante}</Text>
              </View>
              {/* Informações */}
              <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
                {jogoStatsVisualizado.competicao ? <Text style={{ color: `${CORES.branco}BB`, fontSize: 11 }}>🏆 {jogoStatsVisualizado.competicao}</Text> : null}
                {jogoStatsVisualizado.data ? <Text style={{ color: `${CORES.branco}BB`, fontSize: 11 }}>📅 {new Date(jogoStatsVisualizado.data).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" })}</Text> : null}
                {jogoStatsVisualizado.local ? <Text style={{ color: `${CORES.branco}BB`, fontSize: 11 }}>📍 {jogoStatsVisualizado.local}</Text> : null}
              </View>
              {/* Totais coletivos do time */}
              {!carregandoStatsJogo && scoutsStatsJogo.length > 0 && (() => {
                const soma = (campo: string) => scoutsStatsJogo.reduce((acc: number, s: any) => acc + (s[campo] || 0), 0);
                const totalOfeTime = soma("gols") + soma("assistencias") + soma("finalizacoes") + soma("cruzamentos") + soma("passes") + soma("passesCompletos") + soma("faltasSofridas") + soma("dribles");
                const totalDefTime = soma("desarmes") + soma("interceptacoes") + soma("duelos") + soma("duelosGanhos") + soma("jogosAereos") + soma("duelosAereosPerdidos") + soma("faltasCometidas") + soma("bolasRecuperadas");
                return (
                  <View style={{ marginTop: 12 }}>
                    {/* Bloco Ofensivo */}
                    <View style={{ backgroundColor: `${CORES.branco}12`, borderRadius: 10, padding: 10, marginBottom: 6 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <Text style={{ color: `${CORES.branco}CC`, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>Ofensivo do Time</Text>
                        <View style={{ backgroundColor: `${CORES.branco}20`, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                          <Text style={{ color: CORES.branco, fontSize: 9, fontWeight: "700" }}>Total: {totalOfeTime}</Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 0 }}>
                        {[
                          ["Gols", soma("gols")],
                          ["Assist.", soma("assistencias")],
                          ["Finaliz.", soma("finalizacoes")],
                          ["Cruzam.", soma("cruzamentos")],
                          ["Passes", soma("passes")],
                          ["P.Certos", soma("passesCompletos")],
                          ["F.Sofrid.", soma("faltasSofridas")],
                          ["Dribles", soma("dribles")],
                        ].map(([label, val]: any, i: number) => (
                          <View key={label} style={{ width: "25%", alignItems: "center", paddingVertical: 4, borderRightWidth: i % 4 !== 3 ? 1 : 0, borderRightColor: `${CORES.branco}20`, borderBottomWidth: i < 4 ? 1 : 0, borderBottomColor: `${CORES.branco}20` }}>
                            <Text style={{ color: CORES.branco, fontSize: 17, fontWeight: "900" }}>{val}</Text>
                            <Text style={{ color: `${CORES.branco}70`, fontSize: 9 }}>{label}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Bloco Defensivo */}
                    <View style={{ backgroundColor: `${CORES.branco}12`, borderRadius: 10, padding: 10, marginBottom: 6 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <Text style={{ color: `${CORES.branco}CC`, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>Defensivo do Time</Text>
                        <View style={{ backgroundColor: `${CORES.branco}20`, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                          <Text style={{ color: CORES.branco, fontSize: 9, fontWeight: "700" }}>Total: {totalDefTime}</Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 0 }}>
                        {[
                          ["Desarmes", soma("desarmes")],
                          ["Intercept.", soma("interceptacoes")],
                          ["Duelos", soma("duelos")],
                          ["D.Ganhos", soma("duelosGanhos")],
                          ["J.Aéreo", soma("jogosAereos")],
                          ["Aér.Perd.", soma("duelosAereosPerdidos")],
                          ["F.Comet.", soma("faltasCometidas")],
                          ["B.Recup.", soma("bolasRecuperadas")],
                        ].map(([label, val]: any, i: number) => (
                          <View key={label} style={{ width: "25%", alignItems: "center", paddingVertical: 4, borderRightWidth: i % 4 !== 3 ? 1 : 0, borderRightColor: `${CORES.branco}20`, borderBottomWidth: i < 4 ? 1 : 0, borderBottomColor: `${CORES.branco}20` }}>
                            <Text style={{ color: CORES.branco, fontSize: 17, fontWeight: "900" }}>{val}</Text>
                            <Text style={{ color: `${CORES.branco}70`, fontSize: 9 }}>{label}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Disciplina do time */}
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <View style={{ flex: 1, backgroundColor: `${CORES.branco}12`, borderRadius: 10, padding: 10, flexDirection: "row", justifyContent: "space-around" }}>
                        <View style={{ alignItems: "center" }}>
                          <Text style={{ color: soma("cartoesAmarelos") > 0 ? "#fbbf24" : `${CORES.branco}80`, fontSize: 20, fontWeight: "900" }}>{soma("cartoesAmarelos")}</Text>
                          <Text style={{ color: `${CORES.branco}70`, fontSize: 9 }}>🟨 Amarelos</Text>
                        </View>
                        <View style={{ alignItems: "center" }}>
                          <Text style={{ color: soma("cartoesVermelhos") > 0 ? "#fca5a5" : `${CORES.branco}80`, fontSize: 20, fontWeight: "900" }}>{soma("cartoesVermelhos")}</Text>
                          <Text style={{ color: `${CORES.branco}70`, fontSize: 9 }}>🟥 Vermelhos</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })()}
            </View>
          )}

          {carregandoStatsJogo ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }}>
              <ActivityIndicator size="large" color={CORES.azulClaro} />
              <Text style={{ color: CORES.cinzaTexto, marginTop: 12 }}>Carregando dados...</Text>
            </View>
          ) : scoutsStatsJogo.length === 0 ? (
            <View style={styles.estadoVazio}>
              <Text style={styles.estadoVazioIcone}>📋</Text>
              <Text style={styles.estadoVazioTitulo}>Sem dados</Text>
              <Text style={styles.estadoVazioTexto}>Nenhum scout registrado para este jogo.</Text>
            </View>
          ) : (
            <View style={{ padding: 12 }}>
              {/* Título da seção */}
              <Text style={{ fontSize: 11, color: CORES.cinzaTexto, fontWeight: "700", textTransform: "uppercase", marginBottom: 8, letterSpacing: 0.5 }}>
                {scoutsStatsJogo.length} atleta{scoutsStatsJogo.length !== 1 ? "s" : ""} avaliado{scoutsStatsJogo.length !== 1 ? "s" : ""}
              </Text>

              {scoutsStatsJogo.map((s: any) => {
                const totalOfe = (s.gols || 0) + (s.assistencias || 0) + (s.finalizacoes || 0) + (s.cruzamentos || 0) + (s.passes || 0) + (s.passesCompletos || 0) + (s.faltasSofridas || 0) + (s.dribles || 0);
                const totalDef = (s.desarmes || 0) + (s.interceptacoes || 0) + (s.duelos || 0) + (s.duelosGanhos || 0) + (s.jogosAereos || 0) + (s.duelosAereosPerdidos || 0) + (s.faltasCometidas || 0) + (s.bolasRecuperadas || 0);
                const temNotas = s.notaTecnica || s.notaFisica || s.notaTatica;
                return (
                  <View key={s.atletaId} style={{
                    backgroundColor: CORES.branco,
                    borderRadius: 12,
                    marginBottom: 10,
                    overflow: "hidden",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 3,
                    elevation: 2,
                  }}>
                    {/* Faixa de cabeçalho do card */}
                    <View style={{ backgroundColor: s.titular ? CORES.azulEscuro : CORES.azulMedio, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        {s.titular ? (
                          <View style={{ backgroundColor: `${CORES.branco}30`, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                            <Text style={{ color: CORES.branco, fontSize: 9, fontWeight: "700" }}>★ TITULAR</Text>
                          </View>
                        ) : (
                          <View style={{ backgroundColor: `${CORES.branco}20`, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                            <Text style={{ color: `${CORES.branco}CC`, fontSize: 9, fontWeight: "600" }}>RESERVA</Text>
                          </View>
                        )}
                        <Text style={{ color: CORES.branco, fontSize: 14, fontWeight: "800" }}>{s.nomeAtleta}</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        {s.posicaoAtleta ? <Text style={{ color: `${CORES.branco}CC`, fontSize: 11, fontWeight: "600" }}>{s.posicaoAtleta}</Text> : null}
                        <View style={{ backgroundColor: `${CORES.branco}20`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                          <Text style={{ color: CORES.branco, fontSize: 12, fontWeight: "700" }}>{s.minutosJogados || 0}’</Text>
                        </View>
                      </View>
                    </View>

                    <View style={{ padding: 10 }}>
                      {/* Linha de destaques rápidos */}
                      {(s.gols > 0 || s.assistencias > 0 || s.cartoesAmarelos > 0 || s.cartoesVermelhos > 0) && (
                        <View style={{ flexDirection: "row", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                          {s.gols > 0 && <View style={{ backgroundColor: "#dcfce7", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={{ color: "#166534", fontSize: 12, fontWeight: "700" }}>⚽ {s.gols} gol{s.gols > 1 ? "s" : ""}</Text></View>}
                          {s.assistencias > 0 && <View style={{ backgroundColor: "#dbeafe", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={{ color: "#1e40af", fontSize: 12, fontWeight: "700" }}>🌟 {s.assistencias} assist.</Text></View>}
                          {s.cartoesAmarelos > 0 && <View style={{ backgroundColor: "#fef9c3", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={{ color: "#854d0e", fontSize: 12, fontWeight: "700" }}>🟨 {s.cartoesAmarelos}</Text></View>}
                          {s.cartoesVermelhos > 0 && <View style={{ backgroundColor: "#fee2e2", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={{ color: "#991b1b", fontSize: 12, fontWeight: "700" }}>🟥 {s.cartoesVermelhos}</Text></View>}
                        </View>
                      )}

                      {/* Ofensivo */}
                      <View style={{ marginBottom: 8 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <Text style={{ fontSize: 9, color: CORES.azulClaro, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>Ofensivo</Text>
                          <Text style={{ fontSize: 9, color: CORES.azulClaro, fontWeight: "600", backgroundColor: "#e8eaf6", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>Total: {totalOfe}</Text>
                        </View>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                          {[
                            ["Gols", s.gols, "#166534", "#dcfce7"],
                            ["Assist.", s.assistencias, "#1e40af", "#dbeafe"],
                            ["Finaliz.", s.finalizacoes, CORES.azulClaro, "#e8eaf6"],
                            ["Cruzam.", s.cruzamentos, CORES.azulClaro, "#e8eaf6"],
                            ["Passes", s.passes, CORES.azulClaro, "#e8eaf6"],
                            ["P.Certos", s.passesCompletos, CORES.azulClaro, "#e8eaf6"],
                            ["F.Sofrid.", s.faltasSofridas, CORES.azulClaro, "#e8eaf6"],
                            ["Dribles", s.dribles, CORES.azulClaro, "#e8eaf6"],
                          ].map(([label, val, cor, bg]: any) => (
                            <View key={label} style={{ alignItems: "center", backgroundColor: val > 0 ? bg : "#f9f9f9", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, minWidth: 54 }}>
                              <Text style={{ fontSize: 8, color: val > 0 ? cor : CORES.cinzaTexto }}>{label}</Text>
                              <Text style={{ fontSize: 16, fontWeight: "700", color: val > 0 ? cor : CORES.cinzaMedio }}>{val || 0}</Text>
                            </View>
                          ))}
                        </View>
                      </View>

                      {/* Defensivo */}
                      <View style={{ marginBottom: 8 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <Text style={{ fontSize: 9, color: CORES.verde, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>Defensivo</Text>
                          <Text style={{ fontSize: 9, color: CORES.verde, fontWeight: "600", backgroundColor: "#e8f5e9", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>Total: {totalDef}</Text>
                        </View>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                          {[
                            ["Desarmes", s.desarmes], ["Intercept.", s.interceptacoes], ["Duelos", s.duelos],
                            ["D.Ganhos", s.duelosGanhos], ["J.Aéreo", s.jogosAereos], ["Aér.Perd.", s.duelosAereosPerdidos],
                            ["F.Comet.", s.faltasCometidas], ["B.Recup.", s.bolasRecuperadas],
                          ].map(([label, val]: any) => (
                            <View key={label} style={{ alignItems: "center", backgroundColor: val > 0 ? "#e8f5e9" : "#f9f9f9", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, minWidth: 54 }}>
                              <Text style={{ fontSize: 8, color: val > 0 ? CORES.verde : CORES.cinzaTexto }}>{label}</Text>
                              <Text style={{ fontSize: 16, fontWeight: "700", color: val > 0 ? CORES.verde : CORES.cinzaMedio }}>{val || 0}</Text>
                            </View>
                          ))}
                        </View>
                      </View>

                      {/* Notas */}
                      {temNotas && (
                        <View style={{ backgroundColor: "#f5f3ff", borderRadius: 8, padding: 8, marginBottom: 6 }}>
                          <Text style={{ fontSize: 9, color: "#7c3aed", fontWeight: "700", textTransform: "uppercase", marginBottom: 6 }}>Avaliação</Text>
                          <View style={{ flexDirection: "row", gap: 8 }}>
                            {s.notaTecnica && (
                              <View style={{ flex: 1, alignItems: "center", backgroundColor: CORES.branco, borderRadius: 6, padding: 6 }}>
                                <Text style={{ fontSize: 9, color: CORES.cinzaTexto }}>Técnica</Text>
                                <Text style={{ fontSize: 20, fontWeight: "900", color: "#7c3aed" }}>{s.notaTecnica}</Text>
                              </View>
                            )}
                            {s.notaFisica && (
                              <View style={{ flex: 1, alignItems: "center", backgroundColor: CORES.branco, borderRadius: 6, padding: 6 }}>
                                <Text style={{ fontSize: 9, color: CORES.cinzaTexto }}>Física</Text>
                                <Text style={{ fontSize: 20, fontWeight: "900", color: "#7c3aed" }}>{s.notaFisica}</Text>
                              </View>
                            )}
                            {s.notaTatica && (
                              <View style={{ flex: 1, alignItems: "center", backgroundColor: CORES.branco, borderRadius: 6, padding: 6 }}>
                                <Text style={{ fontSize: 9, color: CORES.cinzaTexto }}>Tática</Text>
                                <Text style={{ fontSize: 20, fontWeight: "900", color: "#7c3aed" }}>{s.notaTatica}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}

                      {/* Observações */}
                      {s.observacoes ? (
                        <View style={{ backgroundColor: "#fffbeb", borderRadius: 8, padding: 8, borderLeftWidth: 3, borderLeftColor: "#f59e0b" }}>
                          <Text style={{ fontSize: 9, color: "#92400e", fontWeight: "700", marginBottom: 3 }}>OBSERVAÇÕES</Text>
                          <Text style={{ fontSize: 12, color: CORES.preto, fontStyle: "italic", lineHeight: 17 }}>{s.observacoes}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          </ScrollView>

          {/* Botão fixo de download */}
          {!carregandoStatsJogo && scoutsStatsJogo.length > 0 && jogoStatsVisualizado && (
            <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: CORES.branco, padding: 12, borderTopWidth: 1, borderTopColor: CORES.cinzaMedio, shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 8 }}>
              <TouchableOpacity
                style={{ backgroundColor: CORES.azulEscuro, borderRadius: 12, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                onPress={() => {
                  gerarRelatorioJogo(jogoStatsVisualizado);
                }}
                disabled={gerandoPdfJogo}
              >
                {gerandoPdfJogo
                  ? <ActivityIndicator size="small" color={CORES.branco} />
                  : <>
                    <Text style={{ color: CORES.branco, fontSize: 15, fontWeight: "800" }}>⬇️ Baixar Relatório PDF</Text>
                  </>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: CORES.azulEscuro,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerEsquerda: { flexDirection: "row", alignItems: "center", gap: 10 },
  escudoImg: {
    width: 40,
    height: 40,
  },
  headerTitulo: { color: CORES.branco, fontSize: 16, fontWeight: "800" },
  headerSubtitulo: { color: `${CORES.branco}99`, fontSize: 12 },
  btnAtualizar: { padding: 8, backgroundColor: `${CORES.branco}20`, borderRadius: 8 },
  abas: {
    flexDirection: "row",
    backgroundColor: CORES.azulMedio,
    paddingHorizontal: 8,
    paddingBottom: 0,
  },
  aba: {
    flex: 1, paddingVertical: 10, alignItems: "center",
    borderBottomWidth: 3, borderBottomColor: "transparent",
  },
  abaAtiva: { borderBottomColor: CORES.branco },
  abaTexto: { color: `${CORES.branco}80`, fontSize: 12, fontWeight: "600" },
  abaTextoAtivo: { color: CORES.branco },
  dashboardGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16,
  },
  dashCard: {
    flex: 1, minWidth: "22%",
    backgroundColor: CORES.azulEscuro,
    borderRadius: 10, padding: 12,
    alignItems: "center",
  },
  dashValor: { color: CORES.branco, fontSize: 22, fontWeight: "800" },
  dashLabel: { color: `${CORES.branco}80`, fontSize: 10, marginTop: 2 },
  secaoCard: {
    backgroundColor: CORES.branco,
    borderRadius: 12, padding: 14,
    marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  secaoTituloCard: { fontSize: 14, fontWeight: "700", color: CORES.azulEscuro, marginBottom: 4 },
  btnFiltros: {
    backgroundColor: CORES.cinzaClaro, borderRadius: 8,
    padding: 10, alignItems: "center", marginBottom: 8,
  },
  btnFiltrosTexto: { color: CORES.azulClaro, fontWeight: "600", fontSize: 13 },
  filtrosContainer: {
    backgroundColor: CORES.branco, borderRadius: 12, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: CORES.cinzaMedio,
  },
  filtroLabel: { fontSize: 12, color: CORES.cinzaTexto, fontWeight: "600", marginBottom: 4 },
  filtroInput: {
    borderWidth: 1, borderColor: CORES.cinzaMedio, borderRadius: 8,
    padding: 8, fontSize: 13, color: CORES.preto, backgroundColor: CORES.cinzaClaro,
  },
  chipPosicao: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: CORES.cinzaMedio,
    marginRight: 6, backgroundColor: CORES.branco,
  },
  chipPosicaoAtivo: { backgroundColor: CORES.azulClaro, borderColor: CORES.azulClaro },
  chipPosicaoTexto: { color: CORES.cinzaTexto, fontSize: 12 },
  chipPosicaoTextoAtivo: { color: CORES.branco, fontWeight: "600" },
  btnLimparFiltros: { marginTop: 8, alignItems: "center" },
  totalAtletas: { fontSize: 13, color: CORES.cinzaTexto, fontWeight: "600" },
  btnRelatorio: {
    backgroundColor: CORES.vermelho, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  btnRelatorioTexto: { color: CORES.branco, fontSize: 12, fontWeight: "700" },
  cardAtleta: {
    backgroundColor: CORES.branco, borderRadius: 12, marginBottom: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: CORES.cinzaMedio,
  },
  cardSelecionado: { borderColor: CORES.azulClaro, borderWidth: 2 },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10 },
  cardAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: CORES.azulEscuro, alignItems: "center", justifyContent: "center",
  },
  cardAvatarLetra: { color: CORES.branco, fontSize: 18, fontWeight: "800" },
  cardNome: { fontSize: 15, fontWeight: "700", color: CORES.preto },
  cardPosicao: { fontSize: 12, color: CORES.azulClaro, fontWeight: "600" },
  cardInfo: { fontSize: 11, color: CORES.cinzaTexto },
  badgeEscala: {
    backgroundColor: `${CORES.azulClaro}20`, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  badgeEscalaTexto: { fontSize: 10, color: CORES.azulClaro, fontWeight: "700" },
  checkBox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: CORES.cinzaMedio,
    alignItems: "center", justifyContent: "center",
  },
  checkBoxSelecionado: { backgroundColor: CORES.azulClaro, borderColor: CORES.azulClaro },
  statsRow: {
    flexDirection: "row", justifyContent: "space-around",
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: CORES.cinzaClaro,
    paddingHorizontal: 12,
  },
  statItem: { alignItems: "center" },
  statValor: { fontSize: 16, fontWeight: "800", color: CORES.azulEscuro },
  statLabel: { fontSize: 10, color: CORES.cinzaTexto },
  cardAcoes: {
    flexDirection: "row", gap: 8, padding: 10,
    borderTopWidth: 1, borderTopColor: CORES.cinzaClaro,
  },
  btnEditar: {
    flex: 1, backgroundColor: CORES.cinzaClaro, borderRadius: 8,
    padding: 8, alignItems: "center",
  },
  btnEditarTexto: { fontSize: 12, color: CORES.preto, fontWeight: "600" },
  btnVerPerfil: {
    flex: 1, backgroundColor: CORES.azulEscuro, borderRadius: 8,
    padding: 8, alignItems: "center",
  },
  btnVerPerfilTexto: { fontSize: 12, color: CORES.branco, fontWeight: "600" },
  badgePosicao: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: CORES.branco, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: CORES.cinzaMedio,
  },
  badgePosicaoTexto: { fontSize: 12, color: CORES.preto, fontWeight: "600" },
  badgePosicaoNum: {
    backgroundColor: CORES.azulClaro, borderRadius: 10,
    width: 20, height: 20, alignItems: "center", justifyContent: "center",
  },
  estadoVazio: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  estadoVazioIcone: { fontSize: 48, marginBottom: 12 },
  estadoVazioTitulo: { fontSize: 18, fontWeight: "700", color: CORES.preto, marginBottom: 8 },
  estadoVazioTexto: { fontSize: 14, color: CORES.cinzaTexto, textAlign: "center", lineHeight: 20 },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16, borderBottomWidth: 1, borderBottomColor: CORES.cinzaMedio,
    backgroundColor: CORES.azulEscuro,
  },
  modalTitulo: { fontSize: 15, fontWeight: "700", color: CORES.branco, flex: 1, textAlign: "center" },
  btnFechar: { padding: 4 },
  btnSalvar: {
    backgroundColor: CORES.verde, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  secaoTitulo: {
    fontSize: 13, fontWeight: "700", color: CORES.azulEscuro,
    marginTop: 16, marginBottom: 8,
  },
  gridCampos: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between" },
  campoPar: { width: "23%", minHeight: 70 },
  labelCampo: { fontSize: 10, color: CORES.cinzaTexto, marginBottom: 4, flexWrap: "wrap", textAlign: "center" },
  inputCampo: {
    borderWidth: 1, borderColor: CORES.cinzaMedio, borderRadius: 6,
    padding: 6, fontSize: 13, color: CORES.preto, backgroundColor: CORES.cinzaClaro, textAlign: "center",
  },
  tabelaRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: CORES.cinzaMedio },
  tabelaHeader: { backgroundColor: CORES.azulEscuro },
  tabelaCelula: { padding: 10, textAlign: "center", fontSize: 12, color: CORES.preto },
  tabelaLabelCol: { width: 110, textAlign: "left", color: CORES.branco, fontWeight: "600" },
  tabelaAtletaCol: { width: 80, fontWeight: "600" },
});
