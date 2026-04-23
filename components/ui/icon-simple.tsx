import { Text, type StyleProp, type TextStyle } from "react-native";
import { OpaqueColorValue } from "react-native";

type IconName = 
  | "house.fill"
  | "paperplane.fill"
  | "chevron.left.forwardslash.chevron.right"
  | "chevron.right"
  | "person.fill"
  | "plus"
  | "magnifyingglass"
  | "line.3.horizontal.decrease"
  | "pencil"
  | "trash"
  | "xmark"
  | "xmark.circle.fill"
  | "slider.horizontal.3"
  | "gearshape.fill"
  | "checkmark"
  | "star.fill"
  | "bolt.fill"
  | "calendar"
  | "number"
  | "chart.bar.fill"
  | "link"
  | "ruler"
  | "figure.walk"
  | "doc.text.fill"
  | "square.and.arrow.up"
  | "square.and.arrow.down"
  | "map.pin.circle.fill"
  | "building.2.fill"
  | "heart.fill"
  | "target"
  | "photo.fill"
  | "person.crop.circle.badge.exclamationmark"
  | "camera.fill"
  | "shield.fill"
  | "waveform.path.ecg"
  | "sportscourt.fill";

/**
 * Mapeamento de ícones para caracteres Unicode simples
 * Estes caracteres funcionam em qualquer plataforma sem precisar de fontes especiais
 */
const UNICODE_ICONS: Record<IconName, string> = {
  "house.fill": "🏠",
  "paperplane.fill": "✈️",
  "chevron.left.forwardslash.chevron.right": "<>",
  "chevron.right": "›",
  "person.fill": "👤",
  "plus": "➕",
  "magnifyingglass": "🔍",
  "line.3.horizontal.decrease": "≡",
  "pencil": "✏️",
  "trash": "🗑️",
  "xmark": "✕",
  "xmark.circle.fill": "⊗",
  "slider.horizontal.3": "🎚️",
  "gearshape.fill": "⚙️",
  "checkmark": "✓",
  "star.fill": "⭐",
  "bolt.fill": "⚡",
  "calendar": "📅",
  "number": "#",
  "chart.bar.fill": "📊",
  "link": "🔗",
  "ruler": "📏",
  "figure.walk": "🚶",
  "doc.text.fill": "📄",
  "square.and.arrow.up": "↗️",
  "square.and.arrow.down": "↙️",
  "map.pin.circle.fill": "📍",
  "building.2.fill": "🏢",
  "heart.fill": "❤️",
  "target": "🎯",
  "photo.fill": "📷",
  "person.crop.circle.badge.exclamationmark": "⚠️",
  "camera.fill": "📸",
  "shield.fill": "🛡️",
  "waveform.path.ecg": "📈",
  "sportscourt.fill": "⚽",
};

export function IconSimple({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) {
  const icon = UNICODE_ICONS[name];

  return (
    <Text
      style={[
        {
          fontSize: size,
          color: String(color),
          lineHeight: size * 1.2,
          textAlignVertical: "center",
        },
        style,
      ]}
    >
      {icon}
    </Text>
  );
}
