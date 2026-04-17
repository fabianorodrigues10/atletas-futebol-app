import { useState } from "react";
import { View, TouchableOpacity, Text, ScrollView } from "react-native";
import { IconSymbol } from "./ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface FilterDropdownProps {
  title: string;
  options: string[];
  selectedOptions: string[];
  onToggleOption: (option: string) => void;
  closeOnSelect?: boolean;
}

export function FilterDropdown({
  title,
  options,
  selectedOptions,
  onToggleOption,
  closeOnSelect = true,
}: FilterDropdownProps) {
  const colors = useColors();
  const [isOpen, setIsOpen] = useState(false);

  const selectedCount = selectedOptions.length;

  return (
    <View style={{ marginBottom: 12 }}>
      {/* Header do Dropdown */}
      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 12,
          paddingHorizontal: 12,
          borderRadius: 8,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
            {title}
          </Text>
          {selectedCount > 0 && (
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
              {selectedCount} selecionado{selectedCount > 1 ? "s" : ""}
            </Text>
          )}
        </View>
        <IconSymbol
          name={isOpen ? "chevron.up" : "chevron.down"}
          size={20}
          color={colors.muted}
        />
      </TouchableOpacity>

      {/* Conteúdo do Dropdown */}
      {isOpen && (
        <View
          style={{
            marginTop: 4,
            borderRadius: 8,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            maxHeight: 300,
            overflow: "visible",
            zIndex: 1000,
          }}
        >
          <ScrollView scrollEnabled={options.length > 6}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => {
                  onToggleOption(option);
                  if (closeOnSelect) {
                    setIsOpen(false);
                  }
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 3,
                    borderWidth: 2,
                    borderColor: selectedOptions.includes(option)
                      ? colors.primary
                      : colors.border,
                    backgroundColor: selectedOptions.includes(option)
                      ? colors.primary
                      : "transparent",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 10,
                  }}
                >
                  {selectedOptions.includes(option) && (
                    <IconSymbol name="checkmark" size={12} color="white" />
                  )}
                </View>
                <Text
                  style={{
                    flex: 1,
                    color: colors.foreground,
                    fontSize: 13,
                    fontWeight: "500",
                  }}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
