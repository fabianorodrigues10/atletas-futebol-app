import { Platform, Text } from "react-native";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<string, string>;
type IconSymbolName = keyof typeof MAPPING;

// Font stack que garante suporte a emojis na web
const EMOJI_FONT_STACK = Platform.select({
  web: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",system-ui,sans-serif',
  default: undefined,
});

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
 * - Na web: renderiza emojis Unicode com fontFamily forçada
 * - No mobile: usa emoji Unicode
 * 
 * Estratégia: Emojis com fontFamily inline garantem renderização correta
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
  style?: StyleProp<TextStyle>;
  weight?: any;
}) {
  // Usar emoji Unicode em todas as plataformas
  const emoji = EMOJI_ICONS[name];
  
  if (emoji) {
    return (
      <Text
        style={[
          {
            fontSize: size,
            color: color,
            lineHeight: size,
            fontFamily: EMOJI_FONT_STACK,
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
