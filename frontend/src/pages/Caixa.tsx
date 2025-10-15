import { useState, useEffect, useCallback, useRef } from "react"; // Added useRef
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
  FaExclamationTriangle,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { ENDPOINTS } from "../lib/endpoints";

// --- Tipos de Dados ---
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
  status: "loading" | "aberto" | "fechado" | "error" | "idle";
  data: CaixaType | null;
};

type VendaCaixa = {
  id_venda: number;
  data_hora: string;
  nome_vendedor: string;
  valor: number;
  nome_cliente: string;
};

// --- Componentes ---
// Seus componentes (AbrirCaixaView, CaixaAbertoView, ModalFecharCaixa, etc.) permanecem aqui sem alterações.
// Cole-os aqui para manter o arquivo completo.
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
      const response = await fetch(ENDPOINTS.caixas.update, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_caixa: caixa.id_caixa,
          saldo_final: valor,
          observacao: observacao.trim(),
        }),
      });
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

function ToastSuccess({
  open,
  message,
  onClose,
}: {
  open: boolean;
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[80] transition-all duration-300 ${
        open
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-5 pointer-events-none"
      }`}
      role="alert"
    >
      <div
        id="toast-success"
        className="flex items-center w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow-lg dark:text-gray-400 dark:bg-gray-800"
      >
        <div className="inline-flex items-center justify-center shrink-0 w-8 h-8 text-green-500 bg-green-100 rounded-lg dark:bg-green-800 dark:text-green-200">
          <svg
            className="w-5 h-5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
          </svg>
          <span className="sr-only">Check icon</span>
        </div>
        <div className="ms-3 text-sm font-normal">{message}</div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <span className="sr-only">Close</span>
          <svg
            className="w-3 h-3"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 14 14"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// --- Componente Principal ---
export default function Caixa() {
  const { user, isLoading: authLoading } = useAuth();

  // Estados da página
  const [userEmpresas, setUserEmpresas] = useState<EmpresaType[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<EmpresaType | null>(
    null
  );
  const [empresasLoading, setEmpresasLoading] = useState(true);
  const [caixaState, setCaixaState] = useState<CaixaStateType>({
    status: "idle",
    data: null,
  });
  const [aberturaLoading, setAberturaLoading] = useState(false);
  const [isFecharModalOpen, setFecharModalOpen] = useState(false);
  const [vendas, setVendas] = useState<VendaCaixa[]>([]);
  const [vendasLoading, setVendasLoading] = useState(true);
  const [vendasError, setVendasError] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // NOVO: Refs para controle do ETag e polling
  const caixaEtagRef = useRef<string | null>(null);
  const lastCaixaDataRef = useRef<string | null>(null);

  // Efeito para buscar as empresas do usuário
  useEffect(() => {
    const fetchUserEmpresas = async () => {
      if (!user) return;
      setEmpresasLoading(true);
      try {
        const response = await fetch(
          ENDPOINTS.usuarios.get + `?id_usuario=${user.id_usuario}`
        );
        const userData = await response.json();
        if (!userData || !userData.empresas) {
          throw new Error("Não foi possível buscar as empresas do usuário.");
        }
        const empresasDoUsuario: EmpresaType[] = userData.empresas;
        setUserEmpresas(empresasDoUsuario);

        if (empresasDoUsuario.length >= 1) {
          setSelectedEmpresa(empresasDoUsuario[0]);
        }
      } catch (error) {
        console.error("Erro ao buscar empresas do usuário:", error);
        setUserEmpresas([]);
      } finally {
        setEmpresasLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchUserEmpresas();
    }
  }, [authLoading, user]);

  // ALTERADO: Lógica de verificação para suportar ETag
  const verificarCaixa = useCallback(
    async (isForced = false) => {
      if (!selectedEmpresa) {
        setCaixaState({ status: "idle", data: null });
        return;
      }

      // Mostra 'loading' apenas na primeira vez ou quando forçado para evitar flicker
      if (caixaState.status === "idle" || isForced) {
        setCaixaState({ status: "loading", data: null });
      }

      try {
        const headers: Record<string, string> = {};
        if (caixaEtagRef.current && !isForced) {
          headers["If-None-Match"] = caixaEtagRef.current;
        }

        const response = await fetch(
          ENDPOINTS.caixas.get + `?id_empresa=${selectedEmpresa.id_empresa}`,
          { method: "GET", headers }
        );

        if (response.status === 304) {
          // 304 Not Modified: os dados não mudaram, então não fazemos nada.
          return;
        }

        if (!response.ok)
          throw new Error("Falha na comunicação com o servidor.");

        const newEtag = response.headers.get("etag");
        const result = await response.json();
        const resultString = JSON.stringify(result);

        // Compara a nova resposta com a última para evitar re-renderizações desnecessárias
        if (resultString !== lastCaixaDataRef.current) {
          if (newEtag) caixaEtagRef.current = newEtag;
          lastCaixaDataRef.current = resultString;

          if (result.status === "success") {
            setCaixaState({
              status: result.aberto ? "aberto" : "fechado",
              data: result.aberto ? result.data : null,
            });
          } else {
            throw new Error(result.message || "Erro ao obter dados do caixa.");
          }
        }
      } catch (error) {
        console.error("Erro ao verificar o caixa:", error);
        setCaixaState({ status: "error", data: null });
      }
    },
    [selectedEmpresa, caixaState.status]
  );

  // ALTERADO: Efeito que chama a verificação inicial ao mudar de empresa
  useEffect(() => {
    if (selectedEmpresa) {
      // Quando a empresa muda, resetamos o ETag e forçamos a busca
      caixaEtagRef.current = null;
      lastCaixaDataRef.current = null;
      verificarCaixa(true);
    }
  }, [selectedEmpresa]);

  // NOVO: Efeito de polling para atualização automática em segundo plano
  useEffect(() => {
    if (selectedEmpresa) {
      const intervalId = setInterval(() => {
        verificarCaixa(); // Chama a verificação periodicamente
      }, 5000); // A cada 5 segundos

      return () => clearInterval(intervalId); // Limpa o intervalo ao desmontar
    }
  }, [selectedEmpresa, verificarCaixa]);

  // Efeito para buscar as vendas do caixa aberto (sem alteração)
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

  const handleEmpresaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const empresaId = Number(event.target.value);
    const empresa = userEmpresas.find((e) => e.id_empresa === empresaId);
    if (empresa) {
      setSelectedEmpresa(empresa);
    }
  };

  const handleAbrirCaixaRequest = async (saldo: number, observacao: string) => {
    if (!user || !selectedEmpresa) {
      alert("Usuário ou empresa não selecionados. Ação cancelada.");
      return;
    }
    setAberturaLoading(true);
    try {
      const response = await fetch(ENDPOINTS.caixas.create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saldo_inicio: saldo,
          id_usuario: user.id_usuario,
          id_empresa: selectedEmpresa.id_empresa,
          observacao: observacao,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao abrir o caixa.");
      }

      // ALTERADO: Força a atualização imediata
      await verificarCaixa(true);

      setToastMsg("Caixa aberto com sucesso!");
      setToastOpen(true);
      setTimeout(() => setToastOpen(false), 3000);
    } catch (err: any) {
      alert(`Erro ao abrir o caixa: ${err.message}`);
    } finally {
      setAberturaLoading(false);
    }
  };

  const handleFechamentoSuccess = async () => {
    setFecharModalOpen(false);

    // ALTERADO: Força a atualização imediata
    await verificarCaixa(true);

    setToastMsg("Caixa fechado com sucesso!");
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 3000);
  };

  const renderLoading = (message: string) => (
    <div className="flex flex-col items-center justify-center p-10">
      <FaSpinner className="animate-spin text-4xl text-gray-500" />
      <p className="mt-4 text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );

  const renderContent = () => {
    if (!selectedEmpresa) {
      if (userEmpresas.length > 0) {
        return (
          <div className="text-center p-10">
            <p>Por favor, selecione uma empresa acima para começar.</p>
          </div>
        );
      }
      return (
        <div className="text-center p-10 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <FaExclamationTriangle className="mx-auto text-4xl text-yellow-500 mb-4" />
          <p className="text-yellow-700 dark:text-yellow-300">
            Seu usuário não está associado a nenhuma empresa.
          </p>
        </div>
      );
    }

    switch (caixaState.status) {
      case "loading":
        return renderLoading(`Verificando caixa de ${selectedEmpresa.nome}...`);
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
      case "idle":
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
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <h3 className="font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
            Gerenciamento de Caixa
          </h3>
          {userEmpresas.length > 1 && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="empresa-select"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Empresa:
              </label>
              <select
                id="empresa-select"
                value={selectedEmpresa?.id_empresa || ""}
                onChange={handleEmpresaChange}
                className="bg-transparent dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                {userEmpresas.map((empresa) => (
                  <option
                    key={empresa.id_empresa}
                    value={empresa.id_empresa}
                    className="dark:bg-slate-800 dark:text-slate-200"
                  >
                    {empresa.nome}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {authLoading || empresasLoading
          ? renderLoading("Carregando dados do usuário...")
          : user
          ? renderContent()
          : "Erro de autenticação."}
      </div>

      <ModalFecharCaixa
        open={isFecharModalOpen}
        onClose={() => setFecharModalOpen(false)}
        onSuccess={handleFechamentoSuccess}
        caixa={caixaState.data}
      />

      <ToastSuccess
        open={toastOpen}
        message={toastMsg}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
}
