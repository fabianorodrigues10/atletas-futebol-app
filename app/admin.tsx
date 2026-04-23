import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";

interface User {
  id: number;
  username: string;
  role: "admin" | "user";
  createdAt: string;
}

export default function AdminScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null);

  useEffect(() => {
    // Verificar se é admin
    const user = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (user) {
      const userData = JSON.parse(user);
      setCurrentUser(userData);
      if (userData.role !== "admin") {
        Alert.alert("Acesso negado", "Apenas admin pode acessar esta página");
        router.back();
        return;
      }
    }
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      if (!token) {
        Alert.alert("Erro", "Token não encontrado");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar usuários");
      }

      const data = await response.json();
      setUsers(data);
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    Alert.alert(
      "Confirmar exclusão",
      `Tem certeza que deseja deletar o usuário "${username}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Deletar",
          style: "destructive",
          onPress: async () => {
            try {
              const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
              const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!response.ok) {
                throw new Error("Erro ao deletar usuário");
              }

              Alert.alert("Sucesso", "Usuário deletado");
              loadUsers();
            } catch (error: any) {
              Alert.alert("Erro", error.message);
            }
          },
        },
      ]
    );
  };

  const handleChangeRole = async (userId: number, newRole: "admin" | "user") => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar role");
      }

      Alert.alert("Sucesso", "Role atualizado");
      loadUsers();
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    }
  };

  const handleLogout = () => {
    Alert.alert("Confirmar logout", "Deseja sair da conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => {
          if (typeof window !== "undefined") {
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
          }
          router.replace("/login");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color="#0a7ea4" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6 p-4 bg-surface rounded-lg">
          <View>
            <Text className="text-lg font-bold text-foreground">
              Painel de Admin
            </Text>
            <Text className="text-sm text-muted">
              {currentUser?.username}
            </Text>
          </View>
          <TouchableOpacity
            className="px-4 py-2 bg-error rounded-lg"
            onPress={handleLogout}
          >
            <Text className="text-white font-semibold">Sair</Text>
          </TouchableOpacity>
        </View>

        {/* Estatísticas */}
        <View className="mb-6 p-4 bg-surface rounded-lg border border-border">
          <Text className="text-sm text-muted mb-2">Total de usuários</Text>
          <Text className="text-3xl font-bold text-foreground">{users.length}</Text>
        </View>

        {/* Lista de Usuários */}
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground mb-4">Usuários</Text>
          <FlatList
            data={users}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View className="mb-3 p-4 bg-surface rounded-lg border border-border">
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      {item.username}
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      Criado em: {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                    </Text>
                  </View>
                  <View
                    className={`px-3 py-1 rounded-full ${
                      item.role === "admin"
                        ? "bg-primary"
                        : "bg-muted"
                    }`}
                  >
                    <Text className="text-xs font-semibold text-white">
                      {item.role === "admin" ? "Admin" : "Usuário"}
                    </Text>
                  </View>
                </View>

                {/* Ações */}
                <View className="flex-row gap-2">
                  {item.role === "user" && (
                    <TouchableOpacity
                      className="flex-1 px-3 py-2 bg-primary rounded-lg"
                      onPress={() => handleChangeRole(item.id, "admin")}
                    >
                      <Text className="text-white font-semibold text-center text-sm">
                        Promover a Admin
                      </Text>
                    </TouchableOpacity>
                  )}
                  {item.role === "admin" && item.username !== "admin" && (
                    <TouchableOpacity
                      className="flex-1 px-3 py-2 bg-warning rounded-lg"
                      onPress={() => handleChangeRole(item.id, "user")}
                    >
                      <Text className="text-white font-semibold text-center text-sm">
                        Rebaixar para Usuário
                      </Text>
                    </TouchableOpacity>
                  )}
                  {item.username !== "admin" && (
                    <TouchableOpacity
                      className="flex-1 px-3 py-2 bg-error rounded-lg"
                      onPress={() => handleDeleteUser(item.id, item.username)}
                    >
                      <Text className="text-white font-semibold text-center text-sm">
                        Deletar
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View className="items-center justify-center py-8">
                <Text className="text-muted">Nenhum usuário encontrado</Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
