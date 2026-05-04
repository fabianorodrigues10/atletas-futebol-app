import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Platform } from "react-native";
import { useRouter } from "expo-router";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";

function showAlert(title: string, message: string) {
  if (Platform.OS === "web") {
    alert(`${title}: ${message}`);
  } else {
    // React Native Alert (não será usado em web)
    try {
      const Alert = require("react-native").Alert;
      Alert.alert(title, message);
    } catch {
      console.error(`${title}: ${message}`);
    }
  }
}

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      showAlert("Erro", "Preencha usuário e senha");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        try {
          const error = await response.json();
          throw new Error(error.error || "Erro ao fazer login");
        } catch {
          throw new Error("Erro ao fazer login");
        }
      }

      const data = await response.json();
      
      // Salvar token no localStorage (web) ou AsyncStorage (mobile)
      if (typeof window !== "undefined") {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      showAlert("Sucesso", `Bem-vindo, ${data.user.username}!`);
      router.replace("/(tabs)");
    } catch (error: any) {
      showAlert("Erro", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!username || !password) {
      showAlert("Erro", "Preencha usuário e senha");
      return;
    }

    if (password.length < 6) {
      showAlert("Erro", "Senha deve ter no mínimo 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        try {
          const error = await response.json();
          throw new Error(error.error || "Erro ao criar usuário");
        } catch {
          throw new Error("Erro ao criar usuário");
        }
      }

      showAlert("Sucesso", "Usuário criado! Faça login para continuar");
      setIsLogin(true);
      setPassword("");
    } catch (error: any) {
      showAlert("Erro", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="flex-1 justify-center items-center p-6 min-h-screen">
        {/* Logo/Header */}
        <View className="mb-8 items-center">
          <Text className="text-4xl font-bold text-foreground mb-2">
            Marcílio Dias
          </Text>
          <Text className="text-lg text-muted">
            Análise de Mercado de Atletas
          </Text>
        </View>

        {/* Card de Login */}
        <View className="w-full max-w-sm bg-surface rounded-2xl p-6 border border-border shadow-sm">
          <Text className="text-2xl font-bold text-foreground mb-6 text-center">
            {isLogin ? "Entrar" : "Criar Conta"}
          </Text>

          {/* Username Input */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              Usuário
            </Text>
            <TextInput
              className="w-full px-4 py-3 border border-border rounded-lg text-foreground bg-background"
              placeholder="Digite seu usuário"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              editable={!loading}
            />
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">
              Senha
            </Text>
            <TextInput
              className="w-full px-4 py-3 border border-border rounded-lg text-foreground bg-background"
              placeholder="Digite sua senha"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
          </View>

          {/* Login/Signup Button */}
          <TouchableOpacity
            className={`w-full py-3 rounded-lg mb-4 ${
              loading ? "bg-primary opacity-70" : "bg-primary"
            }`}
            onPress={isLogin ? handleLogin : handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-center text-white font-semibold">
                {isLogin ? "Entrar" : "Criar Conta"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Toggle Login/Signup */}
          <View className="flex-row justify-center items-center">
            <Text className="text-muted">
              {isLogin ? "Não tem conta? " : "Já tem conta? "}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setIsLogin(!isLogin);
                setPassword("");
              }}
              disabled={loading}
            >
              <Text className="text-primary font-semibold">
                {isLogin ? "Criar conta" : "Entrar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Text */}
        <View className="mt-8 max-w-sm">
          <Text className="text-sm text-muted text-center leading-relaxed">
            {isLogin
              ? "Admin: usuario 'admin' com senha 'Marcilio1919!'"
              : "Crie uma conta para visualizar os dados dos atletas"}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
