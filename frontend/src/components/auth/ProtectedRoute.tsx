// src/components/auth/ProtectedRoute.tsx

import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../context/AuthContext";

// Você pode criar um componente de Spinner/Loading simples
const LoadingSpinner = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
    }}
  >
    <h2>Carregando...</h2>
  </div>
);

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth(); // Pega ambos os estados do contexto

  // 1. Se estiver carregando, exibe um spinner ou tela em branco
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 2. Se não estiver autenticado (após o carregamento), redireciona para o login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. Se estiver autenticado, renderiza a página solicitada
  return <Outlet />;
};

export default ProtectedRoute;
