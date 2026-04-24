import { Text } from "react-native";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconSymbolName = 
  | "house.fill"
  | "radar"
  | "chart.bar.fill"
  | "people.fill"
  | "gearshape.fill"
  | "paperplane.fill"
  | "magnifyingglass"
  | "chevron.right"
  | "person.fill"
  | "plus"
  | "pencil"
  | "trash"
  | "xmark"
  | "star.fill"
  | "heart.fill"
  | "calendar"
  | "photo.fill"
  | "camera.fill"
  | "shield.fill"
  | "waveform.path.ecg"
  | "sportscourt.fill"
  | "xmark.circle.fill"
  | "slider.horizontal.3"
  | "checkmark"
  | "bolt.fill"
  | "line.3.horizontal.decrease"
  | "chevron.left.forwardslash.chevron.right"
  | "number"
  | "link"
  | "ruler"
  | "figure.walk"
  | "doc.text.fill"
  | "square.and.arrow.up"
  | "square.and.arrow.down"
  | "map.pin.circle.fill"
  | "building.2.fill"
  | "target"
  | "person.crop.circle.badge.exclamationmark";

/**
 * Mapeamento de SF Symbols para emojis Unicode
 */
const EMOJI_ICONS: Record<IconSymbolName, string> = {
  "house.fill": "🏠",
  "radar": "📡",
  "chart.bar.fill": "📊",
  "people.fill": "👥",
  "gearshape.fill": "⚙️",
  "paperplane.fill": "✈️",
  "magnifyingglass": "🔍",
  "chevron.right": "▶️",
  "person.fill": "👤",
  "plus": "➕",
  "pencil": "✏️",
  "trash": "🗑️",
  "xmark": "❌",
  "star.fill": "⭐",
  "heart.fill": "❤️",
  "calendar": "📅",
  "photo.fill": "📷",
  "camera.fill": "📷",
  "shield.fill": "🛡️",
  "waveform.path.ecg": "📈",
  "sportscourt.fill": "⚽",
  "xmark.circle.fill": "❌",
  "slider.horizontal.3": "🎚️",
  "checkmark": "✅",
  "bolt.fill": "⚡",
  "line.3.horizontal.decrease": "📋",
  "chevron.left.forwardslash.chevron.right": "💻",
  "number": "#️⃣",
  "link": "🔗",
  "ruler": "📏",
  "figure.walk": "🚶",
  "doc.text.fill": "📄",
  "square.and.arrow.up": "↗️",
  "square.and.arrow.down": "↙️",
  "map.pin.circle.fill": "📍",
  "building.2.fill": "🏢",
  "target": "🎯",
  "person.crop.circle.badge.exclamationmark": "⚠️",
};

/**
 * Componente de ícone para web usando Text com emojis Unicode
 * Renderiza diretamente como texto para máxima compatibilidade
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
  const emoji = EMOJI_ICONS[name];

  if (!emoji) {
    return null;
  }

  // Renderizar como Text simples - funciona melhor na web
  return (
    <Text
      style={[
        {
          fontSize: size,
          color: typeof color === "string" ? color : color,
          lineHeight: size * 1.2,
        },
        style,
      ]}
    >
      {emoji}
    </Text>
  );
}
