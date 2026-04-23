import { View, Image, Platform, type ImageProps } from "react-native";
import { useMemo } from "react";

interface ImageWebProps extends ImageProps {
  source: any;
  style?: any;
  resizeMode?: "cover" | "contain" | "stretch" | "center";
}

/**
 * Componente que renderiza imagens corretamente em ambas as plataformas (mobile e web).
 * Na web, usa uma tag <img> nativa para evitar problemas com require() do Metro.
 * No mobile, usa o Image component normal.
 */
export function ImageWeb({ source, style, resizeMode = "contain", ...props }: ImageWebProps) {
  const imageUri = useMemo(() => {
    if (!source) return null;
    
    // Se é um objeto com uri (URL)
    if (source.uri) {
      return source.uri;
    }
    
    // Se é um require() (número no mobile)
    if (typeof source === "number") {
      return null; // Não conseguimos usar require() na web
    }
    
    return null;
  }, [source]);

  if (Platform.OS === "web") {
    // Na web, renderizar como img tag nativa
    if (!imageUri) {
      return <View style={[{ backgroundColor: "#f0f0f0" }, style]} />;
    }

    const width = style?.width || "auto";
    const height = style?.height || "auto";
    const objectFit = resizeMode === "contain" ? "contain" : "cover";

    return (
      <img
        src={imageUri}
        style={{
          width,
          height,
          objectFit,
          objectPosition: "center",
          ...style,
        }}
        {...(props as any)}
      />
    );
  }

  // No mobile, usar o Image component normal
  return (
    <Image
      source={source}
      style={style}
      resizeMode={resizeMode}
      {...props}
    />
  );
}
