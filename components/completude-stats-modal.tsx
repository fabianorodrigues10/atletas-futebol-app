import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface CompletudeBracket {
  min: number;
  max: number;
  label: string;
  count: number;
  percentage: number;
}

interface CompletudStatsModalProps {
  visible: boolean;
  onClose: () => void;
  stats: CompletudeBracket[];
  totalAtletas: number;
  onSelectBracket?: (min: number, max: number, label: string) => void;
}

export function CompletudStatsModal({
  visible,
  onClose,
  stats,
  totalAtletas,
  onSelectBracket,
}: CompletudStatsModalProps) {
  const colors = useColors();

  const maxCount = Math.max(...stats.map(s => s.count), 1);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-background rounded-2xl w-full max-w-md p-6 border border-border shadow-lg">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-primary/20 justify-center items-center mr-3">
                <IconSymbol name="chart.bar.fill" size={20} color={colors.primary} />
              </View>
              <Text className="text-xl font-bold text-foreground flex-1">
                Estatísticas
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-surface justify-center items-center"
            >
              <IconSymbol name="xmark" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Total de atletas */}
          <View className="bg-primary/10 rounded-xl p-4 mb-6 border border-primary/30">
            <Text className="text-sm text-muted mb-1">Total de Atletas</Text>
            <Text className="text-3xl font-bold text-primary">
              {totalAtletas}
            </Text>
          </View>

          {/* Instrução */}
          <Text className="text-xs text-muted mb-4 text-center">
            Clique em uma linha para filtrar atletas por faixa de completude
          </Text>

          {/* Stats List */}
          <ScrollView showsVerticalScrollIndicator={false} className="max-h-80">
            <View className="gap-3">
              {stats.map((stat, index) => {
                const barWidth = (stat.count / maxCount) * 100;
                const isComplete = stat.min === 100;

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      onSelectBracket?.(stat.min, stat.max, stat.label);
                      onClose();
                    }}
                    className="mb-4 active:opacity-70"
                  >
                    {/* Label e Count */}
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className={`font-semibold ${isComplete ? "text-success" : "text-foreground"}`}>
                        {stat.label}
                      </Text>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-sm text-muted">
                          {stat.count}
                        </Text>
                        <Text className={`text-sm font-semibold ${isComplete ? "text-success" : "text-primary"}`}>
                          {stat.percentage}%
                        </Text>
                      </View>
                    </View>

                    {/* Bar */}
                    <View className="h-8 bg-surface rounded-lg overflow-hidden border border-border/50">
                      <View
                        className={`h-full rounded-lg flex-row items-center justify-end pr-2 ${
                          isComplete ? "bg-success/30" : "bg-primary/30"
                        }`}
                        style={{ width: `${barWidth}%` }}
                      >
                        {stat.count > 0 && (
                          <Text className={`text-xs font-bold ${isComplete ? "text-success" : "text-primary"}`}>
                            {stat.count}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            className="bg-primary rounded-lg py-3 mt-6 items-center"
          >
            <Text className="text-white font-semibold">Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
