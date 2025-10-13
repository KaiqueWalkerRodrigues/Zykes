// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Estrutura dos dados do usuário (igual à sua)
interface User {
  id_usuario: number;
  nome: string;
  usuario: string;
  ativo: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User) => void; // agora só seta estado (não persiste em localStorage)
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper: decodifica o payload do JWT (sem verificar assinatura — apenas para leitura do estado)
function parseJwt<T = any>(token: string): T | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      // 🔹 MIGRAÇÃO: apaga qualquer 'user' legado
      localStorage.removeItem("user");

      // 🔹 Carrega usuário do access_token (se existir)
      const access = localStorage.getItem("access_token");
      if (access) {
        const payload = parseJwt<any>(access);
        // No backend, você colocou o usuário em payload.usr
        const usr = payload?.usr;
        if (usr && typeof usr.id_usuario === "number") {
          setUser({
            id_usuario: usr.id_usuario,
            nome: usr.nome,
            usuario: usr.usuario,
            ativo: usr.ativo,
          });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Falha ao ler access_token", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (userData: User) => {
    // 🔹 NÃO salva em localStorage — apenas em memória
    setUser(userData);
  };

  const logout = () => {
    // 🔹 Limpa tudo relacionado a sessão
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user"); // legado
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
