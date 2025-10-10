// src/context/AuthContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Define a estrutura dos dados do usuário (sem alterações)
interface User {
  id_usuario: number;
  nome: string;
  usuario: string;
  ativo: number;
}

// Define a estrutura do contexto (adicionado isLoading)
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // 👈 Adicionado estado de carregamento
  login: (userData: User) => void;
  logout: () => void;
}

// Cria o contexto com um valor padrão
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cria o Provedor do contexto
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // 👈 Estado para controlar o carregamento inicial

  // Ao iniciar a aplicação, verifica se há um usuário salvo no localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Falha ao carregar usuário do localStorage", error);
      // Garante que o usuário seja nulo em caso de erro no parse
      setUser(null);
    } finally {
      // Independente do resultado, o carregamento inicial terminou
      setIsLoading(false); // 👈 Finaliza o carregamento
    }
  }, []);

  const login = (userData: User) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading, // 👈 Exposto para os componentes
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Cria um hook customizado para facilitar o uso do contexto (sem alterações)
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
