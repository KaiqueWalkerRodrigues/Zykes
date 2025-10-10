import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
// Este import assume que o arquivo AuthContext.tsx está em 'src/contexts/'
import { useAuth } from "../../context/AuthContext";

// --- Ícones embutidos como componentes SVG ---
const EyeIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeCloseIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9.9 4.24A9 9 0 0 1 12 4c7 0 10 7 10 7a13.8 13.8 0 0 1-4.2 4.24" />
    <path d="M3.5 14.5A13.8 13.8 0 0 1 2 12c0-7 3-7 10-7" />
    <path d="m2 2 20 20" />
    <path d="M15 12c0 1.1-.4 2.1-.9 2.8" />
  </svg>
);
// --- Fim dos Ícones ---

export default function SignInForm() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!usuario || !senha) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:81/api/others/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, senha }),
      });

      const data = await response.json();

      if (!response.ok || data.status === "error") {
        throw new Error(data.message || "Falha na autenticação.");
      }

      if (data.user) {
        login(data.user);
        navigate("/"); // Redireciona para a página principal
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    "w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg py-3 px-4 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition";

  return (
    <div className="flex flex-col justify-center flex-1 w-full h-full lg:w-1/2">
      <div className="w-full max-w-md mx-auto p-6">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-800 sm:text-4xl dark:text-white/90">
            Acessar o Sistema
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400">
            Por favor, insira seus dados para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-center text-red-800 bg-red-100 border border-red-200 rounded-md dark:bg-red-900/20 dark:text-red-300 dark:border-red-500/30">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="usuario"
                className="block mb-2 text-sm font-medium text-gray-800 dark:text-gray-300"
              >
                Usuário <span className="text-red-500">*</span>
              </label>
              <input
                id="usuario"
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="seu.usuario"
                required
                className={inputClasses}
              />
            </div>

            <div>
              <label
                htmlFor="senha"
                className="block mb-2 text-sm font-medium text-gray-800 dark:text-gray-300"
              >
                Senha <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="senha"
                  type={showPassword ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={inputClasses}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute z-10 -translate-y-1/2 cursor-pointer right-4 top-1/2 text-gray-500 dark:text-gray-400"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeIcon className="size-5" />
                  ) : (
                    <EyeCloseIcon className="size-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link
                to="/esqueci-minha-senha"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-500"
              >
                Esqueceu a senha?
              </Link>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {loading ? "Verificando..." : "Entrar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
