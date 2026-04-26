import { Platform, Text, Image, View } from "react-native";
import { OpaqueColorValue, type StyleProp, type TextStyle, type ImageStyle } from "react-native";

// Importar MaterialIcons apenas para mobile
let MaterialIcons: any;
if (Platform.OS !== "web") {
  MaterialIcons = require("@expo/vector-icons/MaterialIcons").default;
}

type IconMapping = Record<string, string>;
type IconSymbolName = keyof typeof MAPPING;

// URLs CloudFront dos ícones PNG para a web
const ICON_URLS: Record<string, string> = {
  "house.fill": "https://d2xsxph8kpxj0f.cloudfront.net/310519663350073320/7XTarzVUuQNAxDd5Eu29wi/tab-atletas-79Z3L6taaiAdxtG4xspRyK.png",
  "radar": "https://d2xsxph8kpxj0f.cloudfront.net/310519663350073320/7XTarzVUuQNAxDd5Eu29wi/tab-radar-XVKMpmGefjknQ9vNqcU3x2.png",
  "chart.bar.fill": "https://d2xsxph8kpxj0f.cloudfront.net/310519663350073320/7XTarzVUuQNAxDd5Eu29wi/tab-stats-AcuNEF5aB8mRS5deY2hva5.png",
  "people.fill": "https://d2xsxph8kpxj0f.cloudfront.net/310519663350073320/7XTarzVUuQNAxDd5Eu29wi/tab-elenco-jK2DByQXqEFwkHJFUTseX3.png",
  "gearshape.fill": "https://d2xsxph8kpxj0f.cloudfront.net/310519663350073320/7XTarzVUuQNAxDd5Eu29wi/tab-settings-hBQjoYZdp349Axxv5RMPg4.png",
};

/**
 * Mapeamento de SF Symbols para emojis Unicode
 * Cada ícone é mapeado para um emoji que funciona em qualquer plataforma
 */
const EMOJI_ICONS: Record<string, string> = {
  "house.fill": "🏠",
  "paperplane.fill": "✈️",
  "magnifyingglass": "🔍",
  "chevron.right": "▶️",
  "person.fill": "👤",
  "plus": "➕",
  "pencil": "✏️",
  "trash": "🗑️",
  "xmark": "❌",
  "gearshape.fill": "⚙️",
  "chart.bar.fill": "📊",
  "star.fill": "⭐",
  "heart.fill": "❤️",
  "calendar": "📅",
  "photo.fill": "📷",
  "camera.fill": "📷",
  "shield.fill": "🛡️",
  "waveform.path.ecg": "📈",
  "sportscourt.fill": "⚽",
  "radar": "📡",
  "people.fill": "👥",
};

const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "person.fill": "person",
  "plus": "add",
  "magnifyingglass": "search",
  "line.3.horizontal.decrease": "filter-list",
  "pencil": "edit",
  "trash": "delete",
  "xmark": "close",
  "xmark.circle.fill": "cancel",
  "slider.horizontal.3": "tune",
  "gearshape.fill": "settings",
  "checkmark": "check",
  "star.fill": "star",
  "bolt.fill": "flash-on",
  "calendar": "event",
  "number": "tag",
  "chart.bar.fill": "bar-chart",
  "link": "link",
  "ruler": "straighten",
  "figure.walk": "directions-walk",
  "doc.text.fill": "description",
  "square.and.arrow.up": "share",
  "square.and.arrow.down": "download",
  "map.pin.circle.fill": "location-on",
  "building.2.fill": "business",
  "heart.fill": "favorite",
  "target": "gps-fixed",
  "photo.fill": "photo",
  "person.crop.circle.badge.exclamationmark": "person-off",
  "camera.fill": "photo-camera",
  "shield.fill": "shield",
  "waveform.path.ecg": "analytics",
  "sportscourt.fill": "sports-soccer",
  "radar": "radar",
  "people.fill": "people",
} as IconMapping;

/**
 * Componente de ícone que funciona em todas as plataformas
 * - Na web: renderiza emojis Unicode (mais confiável que imagens)
 * - No mobile: usa emoji Unicode ou MaterialIcons
 * 
 * Estratégia: Emojis são mais confiáveis na web que imagens PNG
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle | ImageStyle>;
  weight?: any;
}) {
  // Usar emoji Unicode em todas as plataformas (funciona 100%)
  const emoji = EMOJI_ICONS[name];
  
  if (emoji) {
    return (
      <Text
        style={[
          {
            fontSize: size,
            color: color,
            lineHeight: size,
          },
          style,
        ]}
      >
        {emoji}
      </Text>
    );
  }

  // Fallback para mobile: usar MaterialIcons se não houver emoji
  if (Platform.OS !== "web" && MaterialIcons) {
    return (
      <MaterialIcons
        color={color}
        size={size}
        name={MAPPING[name]}
        style={style}
      />
    );
  }

  return null;
}
