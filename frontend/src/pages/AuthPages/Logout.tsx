// src/pages/auth/Logout.tsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Chama a API de logout
        await fetch("http://localhost:81/api/others/logout.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        // Limpa os dados de autenticação do localStorage
        localStorage.removeItem("user");
        localStorage.removeItem("isAuthenticated");

        // Redireciona para a página de login
        navigate("/login");
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
        // Mesmo se a API falhar, limpa os dados localmente e redireciona
        localStorage.removeItem("user");
        localStorage.removeItem("isAuthenticated");
        navigate("/login");
      }
    };

    performLogout();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Saindo...</p>
      </div>
    </div>
  );
}
