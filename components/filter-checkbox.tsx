import { View, TouchableOpacity, Text } from "react-native";
import { IconSymbol } from "./ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface FilterCheckboxProps {
  label: string;
  checked: boolean;
  onPress: () => void;
}

export function FilterCheckbox({ label, checked, onPress }: FilterCheckboxProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: checked ? colors.primary : colors.border,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          borderWidth: 2,
          borderColor: checked ? colors.primary : colors.border,
          backgroundColor: checked ? colors.primary : "transparent",
          justifyContent: "center",
          alignItems: "center",
          marginRight: 12,
        }}
      >
        {checked && (
          <IconSymbol name="checkmark" size={14} color="white" />
        )}
      </View>
      <Text
        style={{
          flex: 1,
          color: colors.foreground,
          fontSize: 14,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
