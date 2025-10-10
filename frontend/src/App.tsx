import { BrowserRouter as Router, Routes, Route } from "react-router";

// Páginas e Layouts
import AppLayout from "./layout/AppLayout";
import Login from "./pages/AuthPages/Login";
import Logout from "./pages/AuthPages/Logout";
import NotFound from "./pages/OtherPage/NotFound";
import Home from "./pages/Dashboard/Home";
import Caixa from "./pages/Caixa";
import Lente_familias from "./pages/configuracoes/Lente_familias";
import Usuarios from "./pages/configuracoes/Usuarios";
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

                {/* Forms */}
                <Route
                  path="/configuracoes/lente_familias"
                  element={<Lente_familias />}
                />
                <Route path="/configuracoes/usuarios" element={<Usuarios />} />

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
