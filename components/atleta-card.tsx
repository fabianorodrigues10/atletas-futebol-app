import { Pressable, Text, View } from "react-native";
import { Atleta } from "@/drizzle/schema";
import { cn } from "@/lib/utils";

interface AtletaCardProps {
  atleta: Atleta;
  onPress: () => void;
}

export function AtletaCard({ atleta, onPress }: AtletaCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
      className="bg-surface rounded-xl p-4 mb-3 border border-border"
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground mb-1">
            {atleta.nome}
          </Text>
          
          <View className="flex-row gap-2 flex-wrap">
            {atleta.posicao && (
              <View className="bg-primary/10 px-2 py-1 rounded">
                <Text className="text-xs text-primary font-medium">
                  {atleta.posicao}
                </Text>
              </View>
            )}
            
            {atleta.clube && (
              <View className="bg-muted/20 px-2 py-1 rounded">
                <Text className="text-xs text-muted">
                  {atleta.clube}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View className="items-end">
          {atleta.idade && (
            <Text className="text-sm text-muted">
              {atleta.idade} anos
            </Text>
          )}
          {atleta.altura && (
            <Text className="text-xs text-muted mt-1">
              {atleta.altura} cm
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
