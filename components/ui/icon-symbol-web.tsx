import { Platform, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconSymbolName = 
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

const MAPPING: Record<IconSymbolName, string> = {
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
};

/**
 * Emoji icons para web - renderiza emojis em vez de usar fonte
 */
const EMOJI_ICONS: Record<string, string> = {
  "home": "🏠",
  "send": "📤",
  "settings": "⚙️",
  "search": "🔍",
  "add": "➕",
  "delete": "🗑️",
  "close": "✕",
  "edit": "✏️",
  "check": "✓",
  "person": "👤",
  "filter-list": "⊕",
  "tune": "🎚️",
  "star": "⭐",
  "event": "📅",
  "share": "↗️",
  "download": "⬇️",
  "location-on": "📍",
  "business": "🏢",
  "favorite": "❤️",
  "gps-fixed": "🎯",
  "photo": "📷",
  "person-off": "👤",
  "photo-camera": "📸",
  "shield": "🛡️",
  "analytics": "📊",
  "sports-soccer": "⚽",
  "code": "<>",
  "chevron-right": "›",
  "tag": "#",
  "bar-chart": "📊",
  "link": "🔗",
  "straighten": "📏",
  "directions-walk": "🚶",
  "description": "📄",
  "cancel": "✕",
  "flash-on": "⚡",
};

export function IconSymbolWeb({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) {
  if (Platform.OS === "web") {
    const iconName = MAPPING[name];
    const emoji = EMOJI_ICONS[iconName];
    
    if (emoji) {
      return (
        <Text
          style={[
            { fontSize: size, color, lineHeight: size },
            style,
          ]}
        >
          {emoji}
        </Text>
      );
    }
  }

  // Fallback para mobile - usar Material Icons
  return (
    <MaterialIcons 
      color={color} 
      size={size} 
      name={MAPPING[name] as any} 
      style={style} 
    />
  );
}
