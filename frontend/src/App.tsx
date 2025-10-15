import { BrowserRouter as Router, Routes, Route } from "react-router";

// Páginas e Layouts
import AppLayout from "./layout/AppLayout";

import Login from "./pages/Auth/Login";
import Logout from "./pages/Auth/Logout";

import Home from "./pages/Dashboard/Home";
import Caixa from "./pages/Caixa";
import OrdensServico from "./pages/ordens_servico/Ordens_servico.tsx";
import Lente_familias from "./pages/configuracoes/lentes/Lente_familias";
import Usuarios from "./pages/configuracoes/usuarios/Usuarios";

import NotFound from "./pages/OtherPage/NotFound";
import BlankPage from "./pages/Blank";

import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";

// Componentes e Contexto
import { ScrollToTop } from "./components/common/ScrollToTop";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";

export default function App() {
  return (
    <>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* ================================================ */}
            {/* Rotas Públicas (acessíveis sem login) */}
            {/* ================================================ */}
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<Logout />} />

            {/* ================================================ */}
            {/* Rotas Protegidas (exigem login) */}
            {/* ================================================ */}
            <Route element={<ProtectedRoute />}>
              {" "}
              {/* 👈 2. Rota "guardiã" */}
              {/* Todas as rotas abaixo estão agora protegidas */}
              <Route element={<AppLayout />}>
                <Route index path="/" element={<Home />} />

                <Route index path="/caixa" element={<Caixa />} />
                <Route
                  index
                  path="/ordens_servico"
                  element={<OrdensServico />}
                />

                {/* Forms */}
                <Route
                  path="/configuracoes/lente_familias"
                  element={<Lente_familias />}
                />
                <Route path="/configuracoes/usuarios" element={<Usuarios />} />

                <Route path="/blank" element={<BlankPage />} />

                {/* Charts */}
                <Route path="/line-chart" element={<LineChart />} />
                <Route path="/bar-chart" element={<BarChart />} />
              </Route>
            </Route>

            {/* ================================================ */}
            {/* Rota de Fallback (Página não encontrada) */}
            {/* ================================================ */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </>
  );
}
