import { useState, useEffect } from "react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import {
  FaCashRegister,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaDoorClosed,
  FaFileInvoiceDollar,
  FaWallet,
  FaBuilding,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext"; // Importação correta

// --- Tipos de Dados ---
type UserType = {
  id_usuario: number;
  nome: string;
};

type EmpresaType = {
  id_empresa: number;
  nome: string;
};

type CaixaType = {
  id_caixa: number;
  id_usuario: number;
  nome_usuario?: string;
  id_empresa: number;
  status: number;
  data_abertura: string;
  data_fechamento: string | null;
  saldo_inicio: number;
  saldo_final: number | null;
  observacao: string | null;
};

type CaixaStateType = {
  status: "loading" | "aberto" | "fechado" | "error";
  data: CaixaType | null;
};

type VendaCaixa = {
  id_venda: number;
  data_hora: string;
  nome_vendedor: string;
  valor: number;
  nome_cliente: string;
};

// --- Componentes View (Abrir, Caixa Aberto) ---
// (Nenhuma alteração nos componentes AbrirCaixaView e CaixaAbertoView)
const AbrirCaixaView = ({
  onAbrirCaixaRequest,
  isLoading,
}: {
  onAbrirCaixaRequest: (saldo: number, observacao: string) => void;
  isLoading: boolean;
}) => {
  const [saldoInicial, setSaldoInicial] = useState("");
  const [observacao, setObservacao] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const valor = parseFloat(saldoInicial.replace(",", "."));
    if (isNaN(valor) || valor < 0) {
      alert("Por favor, insira um valor de saldo inicial válido.");
      return;
    }
    onAbrirCaixaRequest(valor, observacao.trim());
  };

  return (
    <div className="text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
      <FaTimesCircle className="mx-auto text-5xl text-red-500 mb-4" />
      <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-2">
        Nenhum Caixa Aberto
      </h4>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Para iniciar as operações, você precisa primeiro abrir o caixa.
      </p>
      <form onSubmit={handleSubmit} className="max-w-sm mx-auto">
        <div className="mb-4 text-left">
          <label
            htmlFor="saldo_inicial"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Saldo Inicial (R$) *
          </label>
          <input
            type="text"
            id="saldo_inicial"
            value={saldoInicial}
            onChange={(e) => setSaldoInicial(e.target.value)}
            className="bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-300 rounded-md px-3 py-2 w-full dark:text-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: 150,00"
            required
            disabled={isLoading}
          />
        </div>
        <div className="mb-4 text-left">
          <label
            htmlFor="observacao"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Observação (Opcional)
          </label>
          <textarea
            id="observacao"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={3}
            className="bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-300 rounded-md px-3 py-2 w-full dark:text-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
            placeholder="Alguma nota sobre a abertura do caixa..."
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-green-700 py-2 px-4 text-sm text-white shadow-md hover:bg-green-800 transition disabled:opacity-50"
        >
          {isLoading ? (
            <FaSpinner className="animate-spin" />
          ) : (
            <FaCashRegister />
          )}
          {isLoading ? "Aguarde..." : "Abrir Caixa"}
        </button>
      </form>
    </div>
  );
};

const CaixaAbertoView = ({
  caixa,
  vendas,
  onFecharCaixaRequest,
}: {
  caixa: CaixaType;
  vendas: VendaCaixa[];
  onFecharCaixaRequest: () => void;
}) => {
  const totalVendas = vendas.reduce(
    (acc, venda) => acc + Number(venda.valor),
    0
  );
  const saldoAtual = caixa.saldo_inicio + totalVendas;

  return (
    <div className="p-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
      <div className="flex items-center gap-4 mb-6">
        <FaCheckCircle className="text-4xl text-green-500" />
        <div>
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Caixa Aberto
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ID do Caixa: #{caixa.id_caixa}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
        <div className="bg-white dark:bg-white/5 p-4 rounded-md">
          <p className="text-gray-500 dark:text-gray-400">Aberto em:</p>
          <p className="font-semibold text-base text-gray-800 dark:text-white/80">
            {new Date(caixa.data_abertura).toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="bg-white dark:bg-white/5 p-4 rounded-md">
          <p className="text-gray-500 dark:text-gray-400">Saldo Inicial:</p>
          <p className="font-semibold text-base text-green-600 dark:text-green-400">
            {caixa.saldo_inicio.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
        </div>
        <div className="bg-white dark:bg-white/5 p-4 rounded-md border-l-4 border-blue-500">
          <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <FaWallet className="text-blue-500" /> Saldo Atual:
          </p>
          <p className="font-bold text-lg text-blue-600 dark:text-blue-400">
            {saldoAtual.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
        </div>
        <div className="bg-white dark:bg-white/5 p-4 rounded-md">
          <p className="text-gray-500 dark:text-gray-400">Aberto por:</p>
          <p className="font-semibold text-base text-gray-800 dark:text-white/80">
            {caixa.nome_usuario || `Usuário #${caixa.id_usuario}`}
          </p>
        </div>
      </div>
      {caixa.observacao && (
        <div className="mt-6 bg-white dark:bg-white/5 p-4 rounded-md">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Observação de Abertura:
          </p>
          <p className="text-sm text-gray-700 dark:text-white/70 italic">
            "{caixa.observacao}"
          </p>
        </div>
      )}
      <div className="mt-8 flex justify-end gap-3">
        <button
          onClick={onFecharCaixaRequest}
          className="rounded-md bg-red-600 py-2 px-4 text-sm text-white shadow-md hover:bg-red-700 transition flex items-center gap-2"
        >
          <FaDoorClosed /> Fechar Caixa
        </button>
      </div>
    </div>
  );
};

// --- Outros Componentes (ModalSelecionarEmpresa, ModalFecharCaixa, ListaVendasCaixa) ---
// (Nenhuma alteração nestes componentes)
const ModalSelecionarEmpresa = ({
  open,
  onClose,
  empresas,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  empresas: EmpresaType[];
  onSelect: (id_empresa: number) => void;
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center transition-opacity duration-300 bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative m-4 p-6 w-full max-w-md rounded-lg bg-white shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-4 border-b dark:border-gray-700">
          <div>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
              Selecionar Empresa
            </h3>
            <p className="text-sm text-slate-500">
              Escolha a empresa para abrir o caixa.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <FaTimesCircle />
          </button>
        </div>
        <div className="py-6 space-y-3">
          {empresas.map((empresa) => (
            <button
              key={empresa.id_empresa}
              onClick={() => onSelect(empresa.id_empresa)}
              className="w-full text-left p-4 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition flex items-center gap-3"
            >
              <FaBuilding className="text-slate-500" />
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {empresa.nome}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ModalFecharCaixa = ({
  open,
  onClose,
  onSuccess,
  caixa,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  caixa: CaixaType | null;
}) => {
  const [saldoFinal, setSaldoFinal] = useState("");
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSaldoFinal("");
      setObservacao("");
      setError(null);
      setLoading(false);
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!caixa) return;
    const valor = parseFloat(saldoFinal.replace(",", "."));
    if (isNaN(valor) || valor < 0) {
      setError("Por favor, insira um valor de saldo final válido.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "http://localhost:81/api/updates/update_caixa.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_caixa: caixa.id_caixa,
            saldo_final: valor,
            observacao: observacao.trim(),
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao fechar o caixa.");
      }
      onSuccess();
    } catch (err: any) {
      console.error("Erro ao fechar caixa:", err);
      setError(err.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center transition-opacity duration-300 bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative m-4 p-6 w-full max-w-lg rounded-lg bg-white shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex items-start justify-between pb-4 border-b dark:border-gray-700">
            <div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                Fechar Caixa
              </h3>
              <p className="text-sm text-slate-500">
                Confirme o saldo final para encerrar as operações.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <FaTimesCircle />
            </button>
          </div>
          <div className="py-6 space-y-4">
            <div>
              <label
                htmlFor="saldo_final"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Saldo Final (R$) *
              </label>
              <input
                type="text"
                id="saldo_final"
                value={saldoFinal}
                onChange={(e) => setSaldoFinal(e.target.value)}
                className="bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-300 rounded-md px-3 py-2 w-full dark:text-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-red-500"
                placeholder="Ex: 2500,50"
                required
                autoFocus
                disabled={loading}
              />
            </div>
            <div>
              <label
                htmlFor="obs_fechamento"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Observação de Fechamento (Opcional)
              </label>
              <textarea
                id="obs_fechamento"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={3}
                className="bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-300 rounded-md px-3 py-2 w-full dark:text-slate-200 dark:border-slate-600"
                placeholder="Alguma nota sobre o fechamento..."
                disabled={loading}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 dark:border-slate-600 py-2 px-4 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-red-600 py-2 px-4 text-sm text-white shadow-md hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaDoorClosed />
              )}
              {loading ? "Fechando..." : "Confirmar Fechamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ListaVendasCaixa = ({
  vendas,
  loading,
  error,
}: {
  vendas: VendaCaixa[];
  loading: boolean;
  error: string | null;
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <FaSpinner className="animate-spin text-2xl text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
        <p>Erro ao carregar as vendas: {error}</p>
      </div>
    );
  }

  if (vendas.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed rounded-lg">
        <FaFileInvoiceDollar className="mx-auto text-4xl text-gray-400 mb-3" />
        <p className="text-gray-500 dark:text-gray-400">
          Nenhuma venda registrada neste caixa ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-3">
              Cliente
            </th>
            <th scope="col" className="px-6 py-3">
              Vendedor
            </th>
            <th scope="col" className="px-6 py-3">
              Data/Hora
            </th>
            <th scope="col" className="px-6 py-3 text-right">
              Valor
            </th>
          </tr>
        </thead>
        <tbody>
          {vendas.map((venda) => (
            <tr
              key={venda.id_venda}
              className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                {venda.nome_cliente}
              </td>
              <td className="px-6 py-4">{venda.nome_vendedor}</td>
              <td className="px-6 py-4">
                {new Date(venda.data_hora).toLocaleString("pt-BR")}
              </td>
              <td className="px-6 py-4 text-right font-bold text-green-600 dark:text-green-400">
                {Number(venda.valor).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- Componente Principal (ALTAMENTE MODIFICADO) ---
export default function Caixa() {
  // 1. Corrigir a desestruturação do useAuth para pegar 'isLoading' e renomeá-lo
  const { user, isLoading: authLoading } = useAuth();

  // 2. Reintroduzir o estado local para a empresa atual
  const [currentEmpresa, setCurrentEmpresa] = useState<EmpresaType | null>(
    null
  );

  // Estados específicos da página
  const [caixaState, setCaixaState] = useState<CaixaStateType>({
    status: "loading",
    data: null,
  });
  const [isFecharModalOpen, setFecharModalOpen] = useState(false);
  const [vendas, setVendas] = useState<VendaCaixa[]>([]);
  const [vendasLoading, setVendasLoading] = useState(true);
  const [vendasError, setVendasError] = useState<string | null>(null);
  const [isEmpresaModalOpen, setEmpresaModalOpen] = useState(false);
  const [empresasParaSelecao, setEmpresasParaSelecao] = useState<EmpresaType[]>(
    []
  );
  const [dadosParaAbertura, setDadosParaAbertura] = useState<{
    saldo: number;
    observacao: string;
  } | null>(null);
  const [aberturaLoading, setAberturaLoading] = useState(false);

  // 3. Reintroduzir o useEffect para carregar a empresa do localStorage
  useEffect(() => {
    try {
      const dataString = localStorage.getItem("local_data");
      if (dataString) {
        const parsedData = JSON.parse(dataString);
        // O `user` vem do AuthContext, mas a `empresa_selecionada` vem daqui
        setCurrentEmpresa(parsedData.empresa_selecionada || null);
      }
    } catch (error) {
      console.error("Falha ao carregar empresa do localStorage:", error);
      setCurrentEmpresa(null); // Garante estado limpo em caso de erro
    }
  }, []);

  // Função para verificar o caixa da empresa ATIVA
  const verificarCaixa = async () => {
    if (!currentEmpresa) return;

    setCaixaState({ status: "loading", data: null });
    try {
      const response = await fetch(
        `http://localhost:81/api/gets/verificar_caixa_aberto.php?id_empresa=${currentEmpresa.id_empresa}`,
        { method: "GET", cache: "no-cache" }
      );
      if (!response.ok) throw new Error("Falha na comunicação com o servidor.");
      const result = await response.json();
      if (result.status === "success") {
        setCaixaState({
          status: result.aberto ? "aberto" : "fechado",
          data: result.aberto ? result.data : null,
        });
      } else {
        throw new Error(result.message || "Erro ao obter dados do caixa.");
      }
    } catch (error) {
      console.error("Erro ao verificar o caixa:", error);
      setCaixaState({ status: "error", data: null });
    }
  };

  // Efeito para verificar o caixa quando a empresa mudar
  useEffect(() => {
    // Só verifica o caixa se a autenticação já terminou e se temos uma empresa
    if (!authLoading && currentEmpresa?.id_empresa) {
      verificarCaixa();
    }
  }, [currentEmpresa?.id_empresa, authLoading]);

  // Efeito para buscar as vendas do caixa aberto
  useEffect(() => {
    const fetchVendas = async (idCaixa: number) => {
      setVendasLoading(true);
      setVendasError(null);
      try {
        const response = await fetch(
          `http://localhost:81/api/gets/get_vendas.php?id_caixa=${idCaixa}`
        );
        const result = await response.json();
        if (result.status === "success") setVendas(result.data);
        else throw new Error(result.message);
      } catch (error: any) {
        setVendasError(error.message);
      } finally {
        setVendasLoading(false);
      }
    };
    if (caixaState.status === "aberto" && caixaState.data?.id_caixa) {
      fetchVendas(caixaState.data.id_caixa);
    } else {
      setVendas([]);
    }
  }, [caixaState.status, caixaState.data]);

  // Funções de manipulação (handleAbrirCaixaRequest, etc.) sem alterações
  const handleAbrirCaixaRequest = async (saldo: number, observacao: string) => {
    if (!user) {
      alert("Usuário não encontrado. Faça login novamente.");
      return;
    }
    setAberturaLoading(true);
    try {
      const response = await fetch(
        `http://localhost:81/api/gets/get_usuario.php?id_usuario=${user.id_usuario}`
      );
      const userData = await response.json();

      if (!userData || !userData.empresas) {
        throw new Error("Não foi possível buscar as empresas do usuário.");
      }

      const empresasUsuario: EmpresaType[] = userData.empresas;

      if (empresasUsuario.length === 0) {
        alert("Você não está associado a nenhuma empresa.");
        return;
      }

      if (empresasUsuario.length === 1) {
        await executarAberturaCaixa(
          saldo,
          observacao,
          empresasUsuario[0].id_empresa
        );
      } else {
        setDadosParaAbertura({ saldo, observacao });
        setEmpresasParaSelecao(empresasUsuario);
        setEmpresaModalOpen(true);
      }
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setAberturaLoading(false);
    }
  };

  const executarAberturaCaixa = async (
    saldo: number,
    observacao: string,
    id_empresa: number
  ) => {
    if (!user) {
      alert("Usuário não encontrado. Faça login novamente.");
      return;
    }
    setAberturaLoading(true);
    try {
      const response = await fetch(
        "http://localhost:81/api/creates/create_caixa.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            saldo_inicio: saldo,
            id_usuario: user.id_usuario,
            id_empresa: id_empresa,
            observacao: observacao,
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao abrir o caixa.");
      }
      setEmpresaModalOpen(false);
      verificarCaixa();
    } catch (err: any) {
      alert(`Erro ao abrir o caixa: ${err.message}`);
    } finally {
      setAberturaLoading(false);
    }
  };

  const handleEmpresaSelecionada = (id_empresa: number) => {
    if (dadosParaAbertura) {
      executarAberturaCaixa(
        dadosParaAbertura.saldo,
        dadosParaAbertura.observacao,
        id_empresa
      );
    }
  };

  const handleFechamentoSuccess = () => {
    setFecharModalOpen(false);
    verificarCaixa();
  };

  // Funções de renderização condicional
  const renderAuthLoading = () => (
    <div className="flex flex-col items-center justify-center p-10">
      <FaSpinner className="animate-spin text-4xl text-gray-500" />
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        Carregando dados de autenticação...
      </p>
    </div>
  );

  const renderAuthError = () => (
    <div className="text-center p-10 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
      <p className="text-yellow-700 dark:text-yellow-300">
        Não foi possível carregar os dados do usuário ou da empresa. Por favor,
        faça o login novamente.
      </p>
    </div>
  );

  const renderContent = () => {
    switch (caixaState.status) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center p-10">
            <FaSpinner className="animate-spin text-4xl text-gray-500" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Verificando status do caixa...
            </p>
          </div>
        );
      case "aberto":
        return (
          <>
            <CaixaAbertoView
              caixa={caixaState.data!}
              vendas={vendas}
              onFecharCaixaRequest={() => setFecharModalOpen(true)}
            />
            <div className="mt-8">
              <h4 className="mb-4 font-semibold text-gray-700 text-lg dark:text-white/80">
                Vendas Realizadas neste Caixa
              </h4>
              <ListaVendasCaixa
                vendas={vendas}
                loading={vendasLoading}
                error={vendasError}
              />
            </div>
          </>
        );
      case "fechado":
        return (
          <AbrirCaixaView
            onAbrirCaixaRequest={handleAbrirCaixaRequest}
            isLoading={aberturaLoading}
          />
        );
      case "error":
        return (
          <div className="text-center p-10 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <p className="text-red-600">
              Ocorreu um erro ao verificar o caixa. Verifique sua conexão e o
              backend.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <PageMeta
        title="Gestão de Caixa"
        description="Página para abertura e gerenciamento do caixa."
      />
      <PageBreadcrumb
        items={[
          { label: "Home", to: "/" },
          { label: "Caixa", to: "/caixa" },
        ]}
      />
      <div className="mt-4 rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <h3 className="mb-6 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
          Gerenciamento de Caixa ({currentEmpresa?.nome || "..."})
        </h3>

        {/* 4. Ajustar a condição de renderização para usar o 'user' do contexto e 'currentEmpresa' do estado local */}
        {authLoading
          ? renderAuthLoading()
          : user && currentEmpresa
          ? renderContent()
          : renderAuthError()}
      </div>

      <ModalFecharCaixa
        open={isFecharModalOpen}
        onClose={() => setFecharModalOpen(false)}
        onSuccess={handleFechamentoSuccess}
        caixa={caixaState.data}
      />

      <ModalSelecionarEmpresa
        open={isEmpresaModalOpen}
        onClose={() => setEmpresaModalOpen(false)}
        empresas={empresasParaSelecao}
        onSelect={handleEmpresaSelecionada}
      />
    </div>
  );
}
