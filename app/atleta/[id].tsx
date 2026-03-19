import { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { OgolWebScraper, type OgolPlayerData } from "@/components/ogol-web-scraper";
import { getApiBaseUrl } from "@/constants/oauth";
import { useQueryClient } from "@tanstack/react-query";

const POSICOES = [
  "Goleiro",
  "Lateral",
  "Zagueiro",
  "Volante",
  "Meia",
  "Extremo",
  "Centroavante",
  "2º Atacante",
];

const PES = ["direito", "esquerdo", "ambidestro"];

export default function AtletaFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  
  const isEdit = Boolean(id && id !== "novo");
  
  // Estados do formulário
  const [nome, setNome] = useState("");
  const [posicao, setPosicao] = useState("");
  const [segundaPosicao, setSegundaPosicao] = useState("");
  const [clubeNome, setClubeNome] = useState("");
  const [clubeEstado, setClubeEstado] = useState("");
  const [clube, setClube] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [idade, setIdade] = useState("");
  const [altura, setAltura] = useState("");
  const [pe, setPe] = useState("");
  const [link, setLink] = useState("");
  const [escala, setEscala] = useState("");
  const [valencia, setValencia] = useState("");
  const [naturalidade, setNaturalidade] = useState("");
  const [videoLinks, setVideoLinks] = useState<string[]>([]);
  const [originalVideoLinks, setOriginalVideoLinks] = useState<string[]>([]);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoInputValue, setVideoInputValue] = useState("");
  const [ogolLoading, setOgolLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [fotoFileName, setFotoFileName] = useState<string>("");
  const [fotoMimeType, setFotoMimeType] = useState<string>("");
  const [fotoLoading, setFotoLoading] = useState(false);
  const [todasAsFotos, setTodasAsFotos] = useState<any[]>([]);
  const [fotoSelecionada, setFotoSelecionada] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para WebView scraper
  const [ogolScrapeUrl, setOgolScrapeUrl] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  
  // Query para buscar atleta (se editando)
  const [atleta, setAtleta] = useState<any>(null);
  const [loadingAtleta, setLoadingAtleta] = useState(false);
  
  useEffect(() => {
    if (isEdit && id) {
      setLoadingAtleta(true);
      fetch(`${getApiBaseUrl()}/api/atletas/${id}`)
        .then(res => res.json())
        .then(data => {
          setAtleta(data);
          setLoadingAtleta(false);
        })
        .catch(error => {
          console.error("[DEBUG] Erro ao carregar atleta:", error);
          setLoadingAtleta(false);
        });
    }
  }, [isEdit, id]);
  
  // Mutations
  const createMutation = trpc.atletas.create.useMutation();
  const updateMutation = trpc.atletas.update.useMutation();
  const deleteMutation = trpc.atletas.delete.useMutation();
  const uploadMutation = trpc.midias.uploadFoto.useMutation();
  const createVideoMutation = trpc.midias.create.useMutation({
    onError: (error) => {
      console.error("[MUTATION ERROR] Erro na criação de vídeo:", error);
    },
  });

  // Query para listar todos os atletas (para validar duplicatas)
  const { data: todosAtletas = [] } = trpc.atletas.list.useQuery(
    undefined,
    { enabled: Boolean(isAuthenticated) }
  );
  
  // Carrega dados do atleta ao editar
  useEffect(() => {
    if (atleta) {
      setNome(atleta.nome);
      setPosicao(atleta.posicao || "");
      setSegundaPosicao(atleta.segundaPosicao || "");
      setClube(atleta.clube || "");
      // Parse clube em nome e estado
      if (atleta.clube) {
        const parts = atleta.clube.split("/");
        if (parts.length === 2) {
          setClubeNome(parts[0]);
          setClubeEstado(parts[1]);
        }
      }
      if (atleta.dataNascimento) {
        const d = new Date(atleta.dataNascimento);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        setDataNascimento(`${dd}/${mm}/${yy}`);
      } else {
        setDataNascimento("");
      }
      setIdade(atleta.idade?.toString() || "");
      setAltura(atleta.altura || "");
      setPe(atleta.pe || "");
      setLink(atleta.link || "");
      setEscala(atleta.escala || "");
      setValencia(atleta.valencia || "");
      setNaturalidade(atleta.naturalidade || "");
      
      // Carregar todas as fotos do atleta
      const midias = (atleta as any).midias;
      if (midias && midias.length > 0) {
        const fotos = midias.filter((m: any) => m.tipo === 'foto');
        if (fotos.length > 0) {
          setTodasAsFotos(fotos);
          setFotoSelecionada(0);
          setFotoUri(fotos[0].url);
        }
      }
      
      // Carregar vídeos do atleta
      const videos = (atleta as any).videos;
      if (videos && videos.length > 0) {
        // Extrair apenas as URLs dos vídeos
        const videoUrls = videos.map((v: any) => v.url || v);
        setVideoLinks(videoUrls);
        // Armazenar os vídeos originais para comparação
        setOriginalVideoLinks(videoUrls);
      } else {
        setVideoLinks([]);
        setOriginalVideoLinks([]);
      }
    }
  }, [atleta]);
  
  // Calcula idade automaticamente a partir do formato dd/mm/aa
  useEffect(() => {
    if (dataNascimento && dataNascimento.length === 8) {
      try {
        const parts = dataNascimento.split("/");
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          let year = parseInt(parts[2]);
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            year = year > 50 ? 1900 + year : 2000 + year;
            const nascimento = new Date(year, month - 1, day);
            const hoje = new Date();
            let idadeCalculada = hoje.getFullYear() - nascimento.getFullYear();
            const mes = hoje.getMonth() - nascimento.getMonth();
            if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
              idadeCalculada--;
            }
            if (idadeCalculada >= 0 && idadeCalculada <= 60) {
              setIdade(idadeCalculada.toString());
            }
          }
        }
      } catch (e) {
        // Data inválida
      }
    }
  }, [dataNascimento]);

  // Aplica dados extraídos do Ogol ao formulário
  const applyOgolData = useCallback((data: OgolPlayerData) => {
    setOgolLoading(false);
    setOgolScrapeUrl(null);
    
    let preenchidos = 0;

    if (data.nome && !nome.trim()) {
      setNome(data.nome);
      preenchidos++;
    }
    if (data.posicao && !posicao.trim()) {
      setPosicao(data.posicao);
      preenchidos++;
    }
    if (data.dataNascimento && !dataNascimento.trim()) {
      setDataNascimento(data.dataNascimento);
      preenchidos++;
    }
    if (data.idade != null && !idade.trim()) {
      setIdade(data.idade.toString());
      preenchidos++;
    }
    if (data.altura != null && !altura.trim()) {
      setAltura(data.altura.toString());
      preenchidos++;
    }
    if (data.pe && !pe.trim()) {
      setPe(data.pe);
      preenchidos++;
    }
    if (data.clube && !clube.trim()) {
      setClube(data.clube);
      // Separar clube em nome e estado
      const parts = data.clube.split("/");
      if (parts.length === 2) {
        setClubeNome(parts[0]);
        setClubeEstado(parts[1]);
      } else {
        setClubeNome(data.clube);
      }
      preenchidos++;
    }
    if (data.naturalidade && !naturalidade.trim()) {
      setNaturalidade(data.naturalidade);
      preenchidos++;
    }

    if (preenchidos > 0) {
      Alert.alert(
        "Dados Importados",
        `${preenchidos} campo(s) preenchido(s) automaticamente a partir do Ogol.\n\nRevise os dados e ajuste o que for necessário.`
      );
    } else {
      Alert.alert(
        "Nenhum campo novo",
        "Todos os campos já estavam preenchidos. Os dados do Ogol não sobrescrevem campos existentes."
      );
    }
  }, [nome, posicao, dataNascimento, idade, altura, pe, clube]);

  const handleOgolError = useCallback((error: string) => {
    setOgolLoading(false);
    setOgolScrapeUrl(null);
    Alert.alert("Erro ao importar", error);
  }, []);

  // Preencher dados do Ogol - usa WebView no nativo, fetch na web
  const handlePreencherOgol = async () => {
    if (!link.trim()) {
      Alert.alert("Atenção", "Cole o link do Ogol no campo Link antes de preencher.");
      return;
    }
    if (!link.includes("ogol.com")) {
      Alert.alert("Atenção", "O link deve ser do site ogol.com.br");
      return;
    }

    setOgolLoading(true);

    if (Platform.OS === "web") {
      // Na web, tenta fetch direto (pode funcionar dependendo do CORS)
      try {
        const response = await fetch(link.trim(), {
          headers: {
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });
        if (response.ok) {
          const html = await response.text();
          // Importa o parser do lib/ogol.ts
          const { parseOgolHtml } = await import("@/lib/ogol");
          const data = parseOgolHtml(html);
          if (data.nome || data.posicao || data.dataNascimento) {
            applyOgolData(data);
            return;
          }
        }
      } catch (e) {
        console.log("[Ogol] Web fetch failed", e);
      }

      // Fallback: tenta via servidor
      try {
        const apiBaseUrl = getApiBaseUrl();
        const serverUrl = `${apiBaseUrl}/api/ogol/scrape`;
        console.log("[Ogol] Trying server URL:", serverUrl);
        const response = await fetch(serverUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: link.trim() }),
        });
        console.log("[Ogol] Server response status:", response.status);
        if (response.ok) {
          const jsonResult = await response.json();
          console.log("[Ogol] Server response data:", jsonResult);
          if (jsonResult.success && jsonResult.data) {
            applyOgolData(jsonResult.data);
            return;
          }
        } else {
          console.log("[Ogol] Server returned error:", response.statusText);
        }
      } catch (e) {
        console.log("[Ogol] Server fetch also failed", e);
      }

      setOgolLoading(false);
      Alert.alert(
        "Não disponível na web",
        "A importação automática do Ogol funciona melhor no celular (via Expo Go). Na web, o site do Ogol bloqueia a conexão.\n\nPreencha os dados manualmente ou teste no celular."
      );
    } else {
      // No celular, usa WebView oculta
      setOgolScrapeUrl(link.trim());
    }
  };
  
  const handleSalvar = async () => {
    console.log("[DEBUG] handleSalvar chamado");
    if (!nome.trim()) {
      Alert.alert("Erro", "O nome do atleta é obrigatório");
      return;
    }
    console.log("[DEBUG] Nome válido, continuando...");
    
    // Validar e formatar clube (NOME/XX ou XX-XXX)
    let clubeFormatado = "";
    if (clubeNome.trim() || clubeEstado.trim()) {
      if (!clubeNome.trim() || !clubeEstado.trim()) {
        Alert.alert("Erro", "Se preencheu o clube, preencha tanto o nome quanto o estado/país");
        return;
      }
      // Validar estado/país (2-3 letras maiúsculas)
      if (!/^[A-Z]{2,3}$/.test(clubeEstado.trim())) {
        Alert.alert("Formato inválido", "O estado/país deve ter 2 ou 3 letras maiúsculas (ex: CE, SP, USA)");
        return;
      }
      clubeFormatado = `${clubeNome.trim()}/${clubeEstado.trim()}`;
    }
    
    // Validar duplicata completa (apenas ao criar novo atleta)
    if (!isEdit && todosAtletas && todosAtletas.length > 0) {
      // Preparar dados do novo atleta para comparação
      let dataNascimentoISO: string | undefined = undefined;
      if (dataNascimento && dataNascimento.length === 8) {
        const parts = dataNascimento.split("/");
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          let year = parseInt(parts[2]);
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            year = year > 50 ? 1900 + year : 2000 + year;
            dataNascimentoISO = new Date(year, month - 1, day).toISOString();
          }
        }
      }

      let alturaNum: number | undefined = undefined;
      if (altura && altura.trim()) {
        const parsed = Number(altura);
        if (!isNaN(parsed) && parsed > 0) {
          alturaNum = parsed;
        }
      }
      
      let idadeNum: number | undefined = undefined;
      if (idade && idade.trim()) {
        const parsed = Number(idade);
        if (!isNaN(parsed) && parsed > 0) {
          idadeNum = parsed;
        }
      }
      
      const novoAtleta = {
        nome: nome.toLowerCase().trim(),
        posicao: (posicao || "").toLowerCase().trim(),
        segundaPosicao: (segundaPosicao || "").toLowerCase().trim(),
        clube: (clubeFormatado || "").toLowerCase().trim(),
        dataNascimento: dataNascimentoISO,
        idade: idadeNum,
        altura: alturaNum,
        pe: (pe || "").toLowerCase().trim(),
        link: (link || "").toLowerCase().trim(),
        escala: (escala || "").toLowerCase().trim(),
        valencia: (valencia || "").toLowerCase().trim(),
      };
      
      // Procurar por atleta com TODOS os dados idênticos
      const atletaDuplicado = todosAtletas.find((a: any) => {
        return (
          a.nome.toLowerCase().trim() === novoAtleta.nome &&
          (a.posicao || "").toLowerCase().trim() === novoAtleta.posicao &&
          (a.segundaPosicao || "").toLowerCase().trim() === novoAtleta.segundaPosicao &&
          (a.clube || "").toLowerCase().trim() === novoAtleta.clube &&
          a.dataNascimento === novoAtleta.dataNascimento &&
          a.idade === novoAtleta.idade &&
          a.altura === novoAtleta.altura &&
          (a.pe || "").toLowerCase().trim() === novoAtleta.pe &&
          (a.link || "").toLowerCase().trim() === novoAtleta.link &&
          (a.escala || "").toLowerCase().trim() === novoAtleta.escala &&
          (a.valencia || "").toLowerCase().trim() === novoAtleta.valencia
        );
      });
      
      if (atletaDuplicado) {
        Alert.alert(
          "⚠️ Atleta Duplicado",
          `Um atleta com exatamente os mesmos dados já está cadastrado no sistema.\n\nDeseja continuar mesmo assim?`,
          [
            { text: "Não", style: "cancel" },
            {
              text: "Sim, cadastrar mesmo assim",
              onPress: () => {
                // Continuar com o cadastro
                executarCadastro(clubeFormatado);
              },
            },
          ]
        );
        return;
      }
    }
    
    console.log("[DEBUG] Chamando executarCadastro com clubeFormatado:", clubeFormatado);
    executarCadastro(clubeFormatado);
  };

  const handleAdicionarVideo = () => {
    setShowVideoModal(true);
    setVideoInputValue("");
  };
  
  const handleConfirmarVideo = () => {
    if (videoInputValue.trim()) {
      setVideoLinks([...videoLinks, videoInputValue.trim()]);
      setVideoInputValue("");
      setShowVideoModal(false);
    } else {
      Alert.alert("Erro", "Cole um link válido do YouTube");
    }
  };
  
  const handleCancelarVideo = () => {
    setVideoInputValue("");
    setShowVideoModal(false);
  };

  const handleDeletarFoto = async () => {
    try {
      if (!id || todasAsFotos.length === 0) return;
      
      const fotoAtual = todasAsFotos[fotoSelecionada];
      if (!fotoAtual) return;
      
      const response = await fetch(`${getApiBaseUrl()}/api/atletas/${id}/foto/${fotoAtual.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar foto');
      }
      
      const novasFotos = todasAsFotos.filter((_, index) => index !== fotoSelecionada);
      setTodasAsFotos(novasFotos);
      
      if (novasFotos.length === 0) {
        setFotoUri(null);
        setFotoSelecionada(0);
      } else {
        const novoIndex = fotoSelecionada >= novasFotos.length ? novasFotos.length - 1 : fotoSelecionada;
        setFotoSelecionada(novoIndex);
        setFotoUri(novasFotos[novoIndex].url);
      }
      
      Alert.alert('Sucesso', 'Foto deletada com sucesso');
    } catch (error: any) {
      console.error('[DEBUG] Erro ao deletar foto:', error);
      Alert.alert('Erro', error.message || 'Erro ao deletar foto');
    }
  };

  const handleRemoverVideo = (index: number) => {
    setVideoLinks(videoLinks.filter((_, i) => i !== index));
  };
  
  const executarCadastro = async (clubeFormatado?: string) => {
    
    try {
      let dataNascimentoISO: string | undefined = undefined;
      if (dataNascimento && dataNascimento.length === 8) {
        const parts = dataNascimento.split("/");
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          let year = parseInt(parts[2]);
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            year = year > 50 ? 1900 + year : 2000 + year;
            dataNascimentoISO = new Date(year, month - 1, day).toISOString();
          }
        }
      }

      let alturaNum: number | undefined = undefined;
      if (altura && altura.trim()) {
        const parsed = Number(altura);
        if (!isNaN(parsed) && parsed > 0) {
          alturaNum = parsed;
        }
      }
      
      let idadeNum: number | undefined = undefined;
      if (idade && idade.trim()) {
        const parsed = Number(idade);
        if (!isNaN(parsed) && parsed > 0) {
          idadeNum = parsed;
        }
      }
      
      const data = {
        nome: nome.trim(),
        posicao: posicao || undefined,
        segundaPosicao: segundaPosicao || undefined,
        clube: clubeFormatado || undefined,
        dataNascimento: dataNascimentoISO,
        idade: idadeNum,
        altura: alturaNum,
        pe: pe as any || undefined,
        link: link || undefined,
        escala: escala || undefined,
        valencia: valencia || undefined,
        naturalidade: naturalidade || undefined,
      };
      
      if (isEdit) {
        try {
          console.log("[DEBUG] Enviando dados de atualização:", {
            id: Number(id),
            ...data,
          });
          
          // Usar o novo endpoint REST em vez do tRPC
          const response = await fetch(`${getApiBaseUrl()}/api/atletas/${id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            credentials: 'include',
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao atualizar atleta');
          }
          
          const result = await response.json();
          console.log("[DEBUG] Atleta atualizado com sucesso:", result);
        } catch (error: any) {
          console.error("[ERROR] Erro ao atualizar atleta:", error);
          console.error("[ERROR] Tipo de erro:", error?.constructor?.name);
          console.error("[ERROR] Status:", error?.status);
          console.error("[ERROR] Data:", error?.data);
          
          let errorMessage = "Erro desconhecido";
          
          if (error?.message) {
            errorMessage = error.message;
          } else if (error?.data?.message) {
            errorMessage = error.data.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          } else {
            errorMessage = JSON.stringify(error);
          }
          
          Alert.alert("Erro ao atualizar", `Não foi possível atualizar o atleta. Erro: ${errorMessage}`);
          throw error;
        }
        
        // Salvar foto se houver
        if (fotoUri && !fotoUri.startsWith('http')) {
          try {
            console.log("[DEBUG] Fazendo upload de foto para edição");
            const base64DataUrl = fotoUri.startsWith('data:') 
              ? fotoUri 
              : await fetch(fotoUri).then(res => res.blob()).then(blob => {
                  return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                  });
                });
            
            const base64Data = base64DataUrl.split(',')[1];
            const mimeType = base64DataUrl.split(';')[0].replace('data:', '');
            const fileName = `foto-${Date.now()}.jpg`;
            
            const fotoResponse = await fetch(`${getApiBaseUrl()}/api/atletas/${id}/foto`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                fileName,
                mimeType,
                base64Data,
              }),
              credentials: 'include',
            });
            
            if (!fotoResponse.ok) {
              const errorData = await fotoResponse.json();
              console.error("[DEBUG] Erro ao fazer upload de foto:", errorData);
            } else {
              console.log("[DEBUG] Foto salva com sucesso");
              // Invalidar cache para refetch dos dados
              await queryClient.invalidateQueries();
            }
          } catch (error) {
            console.error("[DEBUG] Erro ao fazer upload da foto:", error);
          }
        }
        
        // Salvar apenas vídeos NOVOS (que não estavam salvos antes)
        if (videoLinks && videoLinks.length > 0) {
          console.log("[DEBUG] videoLinks atuais:", videoLinks);
          console.log("[DEBUG] videoLinks originais:", originalVideoLinks);
          
          // Encontrar apenas os vídeos novos (que não estão em originalVideoLinks)
          const novosVideos = videoLinks.filter(
            (url) => !originalVideoLinks.includes(url.trim())
          );
          
          console.log("[DEBUG] Vídeos novos para salvar:", novosVideos);
          
          if (novosVideos.length > 0) {
            try {
              for (const videoUrl of novosVideos) {
                if (videoUrl.trim()) {
                  console.log("[DEBUG] Salvando vídeo novo:", videoUrl);
                  
                  const videoResponse = await fetch(`${getApiBaseUrl()}/api/atletas/${id}/video`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      url: videoUrl.trim(),
                      nome: `Vídeo - ${new Date().toLocaleString()}`,
                      descricao: 'Vídeo do YouTube',
                    }),
                    credentials: 'include',
                  });
                  
                  if (!videoResponse.ok) {
                    const errorData = await videoResponse.json();
                    console.error("[DEBUG] Erro ao salvar vídeo:", errorData);
                    throw new Error(errorData.error || 'Erro ao salvar vídeo');
                  }
                  
                  const videoResult = await videoResponse.json();
                  console.log("[DEBUG] Vídeo salvo com sucesso:", videoResult);
                }
              }
              console.log("[DEBUG] Todos os vídeos novos salvos com sucesso");
              // Invalidar cache para refetch dos atletas
              await queryClient.invalidateQueries();
            } catch (error) {
              console.error("[DEBUG] Erro ao salvar vídeos:", error);
              Alert.alert("Erro ao salvar vídeos", `Não foi possível salvar os vídeos. Tente novamente. Erro: ${error}`);
            }
          } else {
            console.log("[DEBUG] Nenhum vídeo novo para salvar");
          }
        }
        
        Alert.alert("Sucesso", "Atleta atualizado com sucesso");
      } else {
        console.log("[DEBUG] Criando novo atleta com dados:", data);
        let result;
        try {
          result = await createMutation.mutateAsync(data);
          console.log("[DEBUG] Atleta criado com sucesso:", result);
        } catch (createError: any) {
          console.error("[ERROR] Erro ao criar atleta:", createError);
          console.error("[ERROR] Tipo de erro:", createError?.constructor?.name);
          console.error("[ERROR] Status:", createError?.status);
          console.error("[ERROR] Data:", createError?.data);
          throw createError;
        }
        
        // Se houver foto, fazer upload após criar o atleta
        if (fotoUri && result.id) {
          try {
            const base64DataUrl = fotoUri.startsWith('data:') 
              ? fotoUri 
              : await fetch(fotoUri).then(res => res.blob()).then(blob => {
                  return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                  });
                });
            
            const base64Data = base64DataUrl.split(',')[1];
            const mimeType = base64DataUrl.split(';')[0].replace('data:', '');
            const fileName = `foto-${Date.now()}.jpg`;
            
            const fotoResponse = await fetch(`${getApiBaseUrl()}/api/atletas/${result.id}/foto`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                fileName,
                mimeType,
                base64Data,
              }),
              credentials: 'include',
            });
            
            if (!fotoResponse.ok) {
              const errorData = await fotoResponse.json();
              throw new Error(errorData.error || 'Erro ao fazer upload de foto');
            }
          } catch (error) {
            console.error("Erro ao fazer upload da foto:", error);
            // Não falha o cadastro se a foto não for salva
          }
        }
        
        // Salvar vídeos após criar o atleta
        if (videoLinks && videoLinks.length > 0 && result.id) {
          console.log("[DEBUG] Iniciando salvamento de vídeos:", videoLinks);
          let videoSaveError = false;
          try {
            for (const videoUrl of videoLinks) {
              if (videoUrl.trim()) {
                console.log("[DEBUG] Salvando vídeo:", videoUrl);
                // Gerar s3Key único para cada vídeo
                const s3Key = `videos/${result.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`;
                const videoPayload = {
                  atletaId: result.id,
                  tipo: 'video' as const,
                  nome: `Vídeo - ${new Date().toLocaleString()}`,
                  url: videoUrl.trim(),
                  s3Key: s3Key,
                  mimeType: 'video/youtube',
                  tamanho: 0,
                  descricao: 'Vídeo do YouTube',
                };
                console.log('[DEBUG] Payload do vídeo:', videoPayload);
                try {
                  const videoResult = await createVideoMutation.mutateAsync(videoPayload);
                  console.log("[DEBUG] Vídeo salvo com sucesso:", videoResult);
                } catch (videoError) {
                  console.error("[DEBUG] Erro ao salvar vídeo individual:", videoError);
                  videoSaveError = true;
                  throw videoError;
                }
              }
            }
            console.log("[DEBUG] Todos os vídeos salvos com sucesso");
            // Invalidar cache para refetch dos atletas
            await queryClient.invalidateQueries();
          } catch (error) {
            console.error("[DEBUG] Erro ao salvar vídeos:", error);
            Alert.alert("Erro ao salvar vídeos", `Não foi possível salvar os vídeos. Tente novamente. Erro: ${error}`);
            // Não retorna aqui para não bloquear o cadastro do atleta
          }
        } else {
          console.log("[DEBUG] Nenhum vídeo para salvar. videoLinks:", videoLinks, "result.id:", result.id);
        }
        
        Alert.alert("Sucesso", "Atleta cadastrado com sucesso");
      }
      
      router.back();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao salvar atleta");
    }
  };
  
   const handleAdicionarFoto = async () => {
    try {
      if (Platform.OS === "web") {
        fileInputRef.current?.click();
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        
        if (!result.canceled && result.assets[0]) {
          await uploadarFoto(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error("Erro ao selecionar foto:", error);
      Alert.alert("Erro", "Erro ao selecionar foto");
    }
  };
  
  const uploadarFoto = async (uri: string) => {
    try {
      setFotoLoading(true);
      
      // Converter para base64
      let base64DataUrl = uri;
      if (!uri.startsWith('data:')) {
        base64DataUrl = await fetch(uri).then(res => res.blob()).then(blob => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        });
      }
      
      // Extrair base64 sem o prefixo
      const base64Data = base64DataUrl.split(',')[1];
      const mimeType = base64DataUrl.split(';')[0].replace('data:', '');
      const fileName = `foto-${Date.now()}.jpg`;
      
      // Para novo atleta, apenas armazenar os dados localmente
      if (!isEdit) {
        setFotoUri(base64DataUrl);
        setFotoFileName(fileName);
        setFotoMimeType(mimeType);
        Alert.alert("Sucesso", "Foto selecionada. Será salva ao cadastrar o atleta.");
        return;
      }
      
      // Para atleta existente, fazer upload imediatamente
      const atletaId = Number(id);
      
      try {
        const fotoResponse = await fetch(`${getApiBaseUrl()}/api/atletas/${atletaId}/foto`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName,
            mimeType,
            base64Data,
          }),
          credentials: 'include',
        });
        
        if (!fotoResponse.ok) {
          const errorData = await fotoResponse.json();
          throw new Error(errorData.error || 'Erro ao fazer upload de foto');
        }
        
        const result = await fotoResponse.json();
        // Converter s3Key para URL completa
        const fotoUrl = `https://manus-storage.s3.amazonaws.com/${result.s3Key}`;
        setFotoUri(fotoUrl);
        // Invalidar cache para refetch dos dados
        await queryClient.invalidateQueries();
        Alert.alert("Sucesso", "Foto adicionada com sucesso");
      } catch (error: any) {
        console.error("[DEBUG] Erro ao fazer upload de foto:", error);
        throw error;
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      Alert.alert("Erro", "Erro ao fazer upload da foto");
    } finally {
      setFotoLoading(false);
    }
  };

  
  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        await uploadarFoto(base64);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleExcluir = () => {
    setShowDeleteModal(true);
  };
  
  const confirmarExclusao = async () => {
    try {
      console.log("[Delete] Iniciando exclusão do atleta ID:", id);
      await deleteMutation.mutateAsync({ id: Number(id) });
      console.log("[Delete] Sucesso");
      setShowDeleteModal(false);
      Alert.alert("Sucesso", "Atleta excluído com sucesso");
      router.back();
    } catch (error: any) {
      console.error("[Delete] Erro:", error);
      Alert.alert("Erro", error.message || "Erro ao excluir atleta");
      setShowDeleteModal(false);
    }
  };
  
  const cancelarExclusao = () => {
    setShowDeleteModal(false);
  };

  // Máscara para data dd/mm/aa
  const handleDataChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    let formatted = "";
    if (cleaned.length <= 2) {
      formatted = cleaned;
    } else if (cleaned.length <= 4) {
      formatted = cleaned.slice(0, 2) + "/" + cleaned.slice(2);
    } else {
      formatted = cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4) + "/" + cleaned.slice(4, 6);
    }
    setDataNascimento(formatted);
  };
  
  if (loadingAtleta) {
    return (
      <ScreenContainer style={{ justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }
  
  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const showOgolButton = link.includes("ogol.com");
  
  return (
    <ScreenContainer style={{ backgroundColor: colors.background, padding: 0 }}>
      <View style={{ flex: 1 }}>
        {/* WebView oculta para scraping do Ogol */}
        <OgolWebScraper
          url={ogolScrapeUrl}
          onResult={applyOgolData}
          onError={handleOgolError}
          onLoadStart={() => setOgolLoading(true)}
        />

        {/* Header */}
        <View style={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 12,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                marginRight: 12,
                padding: 6,
                borderRadius: 8,
                backgroundColor: colors.surface,
              }}
            >
              <IconSymbol name="chevron.right" size={22} color={colors.foreground} style={{ transform: [{ rotate: "180deg" }] }} />
            </TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground }}>
              {isEdit ? "Editar Atleta" : "Novo Atleta"}
            </Text>
          </View>
          
          {isEdit && (
            <TouchableOpacity
              onPress={handleExcluir}
              disabled={isLoading}
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: colors.error + "18",
              }}
            >
              <IconSymbol name="trash" size={22} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Formulário */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>

          {/* Link do Ogol */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
              Link do Ogol
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.surface,
                borderRadius: 8,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border,
                fontSize: 14,
              }}
              placeholder="Cole o link do ogol.com.br do atleta"
              placeholderTextColor={colors.muted}
              value={link}
              onChangeText={setLink}
              keyboardType="url"
              autoCapitalize="none"
              returnKeyType="done"
            />
            
            {showOgolButton && (
              <TouchableOpacity
                onPress={handlePreencherOgol}
                disabled={ogolLoading}
                style={{
                  marginTop: 8,
                  borderRadius: 8,
                  paddingVertical: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#FF6B00",
                  opacity: ogolLoading ? 0.6 : 1,
                }}
              >
                {ogolLoading ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={{ color: "white", fontWeight: "600", marginLeft: 8 }}>Buscando dados...</Text>
                  </>
                ) : (
                  <>
                    <IconSymbol name="bolt.fill" size={18} color="#FFFFFF" />
                    <Text style={{ color: "white", fontWeight: "600", marginLeft: 8 }}>Preencher do Ogol</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {showOgolButton && Platform.OS !== "web" && (
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4, textAlign: "center" }}>
                Abre a página do Ogol em segundo plano e extrai os dados automaticamente
              </Text>
            )}
          </View>

          {showOgolButton && (
            <View style={{ marginBottom: 16, flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              <Text style={{ marginHorizontal: 12, fontSize: 11, color: colors.muted }}>Dados do Atleta</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>
          )}

          {/* Nome */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
              Nome do Atleta *
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.surface,
                borderRadius: 8,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border,
                fontSize: 14,
              }}
              placeholder="Ex: Neymar Jr"
              placeholderTextColor={colors.muted}
              value={nome}
              onChangeText={setNome}
              returnKeyType="done"
            />
          </View>
          
          {/* Posição */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
              Posição Principal
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {POSICOES.map((pos) => (
                  <TouchableOpacity
                    key={pos}
                    onPress={() => setPosicao(posicao === pos ? "" : pos)}
                    style={{
                      backgroundColor: posicao === pos ? colors.primary : colors.surface,
                      borderWidth: posicao === pos ? 0 : 1,
                      borderColor: colors.border,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                    }}
                  >
                    <Text
                      style={{
                        color: posicao === pos ? "white" : colors.foreground,
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      {pos}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Segunda Posição */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
              Segunda Posição (opcional)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {POSICOES.map((pos) => (
                  <TouchableOpacity
                    key={pos}
                    onPress={() => setSegundaPosicao(segundaPosicao === pos ? "" : pos)}
                    style={{
                      backgroundColor: segundaPosicao === pos ? colors.primary : colors.surface,
                      borderWidth: segundaPosicao === pos ? 0 : 1,
                      borderColor: colors.border,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                    }}
                  >
                    <Text
                      style={{
                        color: segundaPosicao === pos ? "white" : colors.foreground,
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      {pos}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          
          {/* Clube */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
              Clube Atual
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                  fontSize: 14,
                }}
                placeholder="Nome do clube"
                placeholderTextColor={colors.muted}
                value={clubeNome}
                onChangeText={setClubeNome}
                returnKeyType="done"
              />
              <TextInput
                style={{
                  width: 80,
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                  fontSize: 14,
                }}
                placeholder="UF"
                placeholderTextColor={colors.muted}
                value={clubeEstado}
                onChangeText={(text) => setClubeEstado(text.toUpperCase())}
                maxLength={3}
                returnKeyType="done"
              />
            </View>
            {clube ? <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>Formato: {clube}</Text> : null}
          </View>
          
          {/* Data de Nascimento e Idade */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                Data Nasc. (dd/mm/aa)
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                  fontSize: 14,
                }}
                placeholder="01/03/97"
                placeholderTextColor={colors.muted}
                value={dataNascimento}
                onChangeText={handleDataChange}
                keyboardType="numeric"
                maxLength={8}
                returnKeyType="done"
              />
            </View>
            <View style={{ width: 90 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                Idade
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                  fontSize: 14,
                }}
                placeholder="Auto"
                placeholderTextColor={colors.muted}
                value={idade}
                onChangeText={setIdade}
                keyboardType="numeric"
                returnKeyType="done"
              />
            </View>
          </View>
          
          {/* Altura e Pé */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                Altura
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                  fontSize: 14,
                }}
                placeholder="Ex: 1.76"
                placeholderTextColor={colors.muted}
                value={altura}
                onChangeText={setAltura}
                returnKeyType="done"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                Pé Preferencial
              </Text>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {PES.map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPe(pe === p ? "" : p)}
                    style={{
                      backgroundColor: pe === p ? colors.primary : colors.surface,
                      borderWidth: pe === p ? 0 : 1,
                      borderColor: colors.border,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderRadius: 20,
                      flex: 1,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: pe === p ? "white" : colors.foreground,
                        fontSize: 11,
                        fontWeight: "600",
                      }}
                      numberOfLines={1}
                    >
                      {p === "direito" ? "Dir" : p === "esquerdo" ? "Esq" : "Amb"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          
          {/* Escala */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
              Escala
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.surface,
                borderRadius: 8,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border,
                fontSize: 14,
              }}
              placeholder="Ex: A, B, C..."
              placeholderTextColor={colors.muted}
              value={escala}
              onChangeText={setEscala}
              returnKeyType="done"
            />
          </View>

          {/* Naturalidade */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
              Naturalidade
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.surface,
                borderRadius: 8,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border,
                fontSize: 14,
              }}
              placeholder="Ex: São Paulo, SP ou Rio de Janeiro, RJ"
              placeholderTextColor={colors.muted}
              value={naturalidade}
              onChangeText={setNaturalidade}
              returnKeyType="done"
            />
          </View>

          {/* Valências */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
              Valências
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.surface,
                borderRadius: 8,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border,
                fontSize: 14,
                minHeight: 100,
              }}
              placeholder="Descreva as características e valências do atleta (até 500 caracteres)..."
              placeholderTextColor={colors.muted}
              value={valencia}
              onChangeText={(text) => setValencia(text.slice(0, 500))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={{ fontSize: 11, color: colors.muted, textAlign: "right", marginTop: 4 }}>
              {valencia.length}/500
            </Text>
          </View>
          
          {/* Campo de Foto */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
              Foto do Atleta (opcional)
            </Text>
            <TouchableOpacity
              onPress={handleAdicionarFoto}
              disabled={fotoLoading}
              style={{
                borderRadius: 10,
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: colors.border,
                padding: 24,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.surface,
                opacity: fotoLoading ? 0.6 : 1,
              }}
            >
              {fotoUri ? (
                <View style={{ alignItems: "center" }}>
                  <Image source={{ uri: fotoUri }} style={{ width: 100, height: 100, borderRadius: 8, marginBottom: 8 }} />
                  <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "600" }}>Foto adicionada</Text>
                  <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>Toque para trocar</Text>
                  <TouchableOpacity
                    onPress={handleDeletarFoto}
                    style={{ marginTop: 8, padding: 8 }}
                  >
                    <IconSymbol name="trash" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ) : fotoLoading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <View style={{ alignItems: "center" }}>
                  <IconSymbol name="photo.fill" size={32} color={colors.primary} />
                  <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: "600", marginTop: 8 }}>Adicionar Foto</Text>
                  <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>Toque para selecionar</Text>
                </View>
              )}
            </TouchableOpacity>
            {Platform.OS === "web" && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            )}
            
            {todasAsFotos.length > 1 && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 6 }}>Todas as fotos ({todasAsFotos.length})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {todasAsFotos.map((foto, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setFotoSelecionada(index);
                          setFotoUri(foto.url);
                        }}
                        style={{
                          borderRadius: 8,
                          borderWidth: 2,
                          borderColor: fotoSelecionada === index ? colors.primary : colors.border,
                        }}
                      >
                        <Image
                          source={{ uri: foto.url }}
                          style={{ width: 60, height: 60, borderRadius: 6 }}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
          
          {/* Seção de Vídeos */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>Vídeos do YouTube</Text>
            
            <TouchableOpacity
              onPress={handleAdicionarVideo}
              style={{
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: colors.primary,
                borderRadius: 10,
                padding: 16,
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: "600" }}>+ Adicionar Vídeo</Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>Cole o link do YouTube</Text>
            </TouchableOpacity>
            
            {videoLinks.length > 0 && (
              <View>
                {videoLinks.map((url, index) => (
                  <View key={index} style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: "600" }}>
                        Vídeo {index + 1}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.muted }} numberOfLines={1}>{url}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoverVideo(index)}
                      style={{ marginLeft: 8, padding: 8 }}
                    >
                      <Text style={{ color: colors.error, fontWeight: "700" }}>X</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
          
          {/* Botão Salvar */}
          <TouchableOpacity
            onPress={handleSalvar}
            disabled={isLoading}
            style={{
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: "center",
              marginBottom: 16,
              backgroundColor: isLoading ? colors.muted : colors.primary,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
                {isEdit ? "Salvar Alterações" : "Cadastrar Atleta"}
              </Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
      
      {/* Modal de adição de vídeo */}
      {showVideoModal && (
        <View style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 50,
          padding: 24,
        }}>
          <View style={{
            backgroundColor: colors.background,
            borderRadius: 16,
            padding: 24,
            width: "100%",
            maxWidth: 360,
          }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 16 }}>
              Adicionar Vídeo do YouTube
            </Text>
            
            <TextInput
              placeholder="Cole o link do YouTube aqui..."
              placeholderTextColor={colors.muted}
              value={videoInputValue}
              onChangeText={setVideoInputValue}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                color: colors.foreground,
                backgroundColor: colors.surface,
                fontSize: 14,
              }}
              multiline
            />
            
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={handleCancelarVideo}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "600", color: colors.foreground }}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleConfirmarVideo}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: "center",
                  backgroundColor: colors.primary,
                }}
              >
                <Text style={{ fontWeight: "600", color: "white" }}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && (
        <View style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}>
          <View style={{
            backgroundColor: colors.background,
            borderRadius: 16,
            padding: 24,
            width: "100%",
            maxWidth: 360,
          }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
              ⚠️ Tem certeza que deseja excluir?
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 24 }}>
              Você está prestes a excluir {nome}. Esta ação não pode ser desfeita.
            </Text>
            
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={cancelarExclusao}
                disabled={isLoading}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "600", color: colors.foreground }}>Não</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={confirmarExclusao}
                disabled={isLoading}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: "center",
                  backgroundColor: isLoading ? colors.muted : colors.error,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ fontWeight: "600", color: "white" }}>Sim, excluir</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}
