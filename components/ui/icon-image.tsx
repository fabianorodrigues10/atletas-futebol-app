import { Platform, Image, Text, ImageStyle } from "react-native";
import { OpaqueColorValue, type StyleProp } from "react-native";

// URLs CloudFront dos ícones PNG
const ICON_URLS: Record<string, string> = {
  "house.fill": "https://d2xsxph8kpxj0f.cloudfront.net/310519663350073320/7XTarzVUuQNAxDd5Eu29wi/tab-atletas-79Z3L6taaiAdxtG4xspRyK.png",
  "radar": "https://d2xsxph8kpxj0f.cloudfront.net/310519663350073320/7XTarzVUuQNAxDd5Eu29wi/tab-radar-XVKMpmGefjknQ9vNqcU3x2.png",
  "chart.bar.fill": "https://d2xsxph8kpxj0f.cloudfront.net/310519663350073320/7XTarzVUuQNAxDd5Eu29wi/tab-stats-AcuNEF5aB8mRS5deY2hva5.png",
  "people.fill": "https://d2xsxph8kpxj0f.cloudfront.net/310519663350073320/7XTarzVUuQNAxDd5Eu29wi/tab-elenco-jK2DByQXqEFwkHJFUTseX3.png",
  "gearshape.fill": "https://d2xsxph8kpxj0f.cloudfront.net/310519663350073320/7XTarzVUuQNAxDd5Eu29wi/tab-settings-hBQjoYZdp349Axxv5RMPg4.png",
};

// Emojis como fallback
const EMOJI_ICONS: Record<string, string> = {
  "house.fill": "🏠",
  "radar": "📡",
  "chart.bar.fill": "📊",
  "people.fill": "👥",
  "gearshape.fill": "⚙️",
};

type IconImageName = keyof typeof ICON_URLS;

/**
 * Componente de ícone que renderiza imagens PNG na web
 * - Na web: renderiza imagem PNG via URL CloudFront
 * - No mobile: renderiza emoji Unicode como fallback
 */
export function IconImage({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconImageName;
  size?: number;
  color?: string | OpaqueColorValue;
  style?: StyleProp<ImageStyle>;
}) {
  const iconUrl = ICON_URLS[name];
  const emoji = EMOJI_ICONS[name];

  // Na web, renderizar imagem PNG
  if (Platform.OS === "web" && iconUrl) {
    return (
      <Image
        source={{ uri: iconUrl }}
        style={[
          {
            width: size,
            height: size,
          },
          style,
        ]}
      />
    );
  }

  // No mobile, usar emoji como fallback
  if (emoji) {
    return (
      <Text
        style={[
          {
            fontSize: size,
            lineHeight: size,
          },
          style,
        ]}
      >
        {emoji}
      </Text>
    );
  }

  return null;
}
