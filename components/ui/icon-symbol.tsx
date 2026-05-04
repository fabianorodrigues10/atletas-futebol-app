import { Platform, Text } from "react-native";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

type IconMapping = Record<string, string>;
type IconSymbolName = keyof typeof MAPPING;

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
  "chart.bar.fill": "insert-chart",
  "link": "link",
  "ruler": "straighten",
  "figure.walk": "directions-walk",
  "doc.text.fill": "description",
  "doc.text": "description",
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
  "radar": "gps-fixed",
  "people.fill": "group",
} as IconMapping;

/**
 * Componente de ícone que funciona em todas as plataformas
 * - Na web: usa Material Icons
 * - No mobile: usa emoji Unicode ou MaterialIcons
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
  // Na web, usar Material Icons sempre
  if (Platform.OS === "web") {
    const iconName = MAPPING[name];
    if (!iconName) {
      console.warn(`Icon not found: ${name}`);
      return null;
    }
    return (
      <MaterialIcons
        color={color}
        size={size}
        name={iconName}
        style={style}
      />
    );
  }

  // No mobile, tentar emoji primeiro
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
  if (MaterialIcons) {
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
