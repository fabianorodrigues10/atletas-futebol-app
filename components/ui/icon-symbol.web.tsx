import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<string, string>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  "house.fill": "home",
  "plus": "add",
  "chart.bar.fill": "insert-chart",
  "doc.text": "description",
  "gearshape.fill": "settings",
  "radar": "gps-fixed",
  "people.fill": "group",
  "magnifyingglass": "search",
  "slider.horizontal.3": "tune",
  "xmark.circle.fill": "cancel",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "person.fill": "person",
  "line.3.horizontal.decrease": "filter-list",
  "pencil": "edit",
  "trash": "delete",
  "xmark": "close",
  "checkmark": "check",
  "star.fill": "star",
  "bolt.fill": "flash-on",
  "calendar": "event",
  "number": "tag",
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
} as IconMapping;

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
