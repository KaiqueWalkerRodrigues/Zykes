import { ColumnDef } from "@tanstack/react-table";
import React, { useEffect, useRef, useState } from "react";
import { FaEdit, FaShoppingCart, FaTrash, FaWrench } from "react-icons/fa";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTable from "../../components/tables/table";
// Renomeado para maior clareza e carregado sob demanda
const ClientesPage = React.lazy(() => import("./Clientes"));
import { ENDPOINTS } from "../../lib/endpoints";

// --- TIPOS ---

type OrdemServico = {
  id_ordem_servico: number;
  id_cliente: number;
  id_vendedor: number;
  id_entregador?: number;
  valor_sub_total: number;
  created_at: string;
};

type LenteOrdemServico = {
  id_lente_ordem_servico: number;
  id_ordem_servico: number;
  id_lente: number;
  quantidade: number;
  valor_unitario: number;
};

type SelectItem = {
  id: number;
  nome: string;
};

// O tipo Cliente usado no modal de busca
type ClienteParaSelecao = {
  id: number;
  nome: string;
  cpf?: string;
  data_nascimento?: string;
};

// --- COMPONENTES AUXILIARES ---

const nomeCache = new Map<string, string>();

async function fetchNome(
  id: number,
  tipo: "cliente" | "vendedor"
): Promise<string> {
  const cacheKey = `${tipo}-${id}`;
  if (nomeCache.has(cacheKey)) {
    return nomeCache.get(cacheKey)!;
  }

  const url = `http://localhost:81/api/gets/get_${tipo}.php?id_${tipo}=${id}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return `ID ${id} não encontrado`;

    const result = await res.json();
    const nome = result?.data?.nome ?? `Inválido`;
    nomeCache.set(cacheKey, nome);
    return nome;
  } catch (error) {
    console.error(`Erro ao buscar ${tipo}:`, error);
    return "Erro ao carregar";
  }
}

function NomeCell({ id, tipo }: { id: number; tipo: "cliente" | "vendedor" }) {
  const [nome, setNome] = useState<string>("Carregando...");

  useEffect(() => {
    let isActive = true;
    if (id) {
      fetchNome(id, tipo).then((n) => {
        if (isActive) setNome(n);
      });
    } else {
      setNome("N/A");
    }
    return () => {
      isActive = false;
    };
  }, [id, tipo]);

  return <span>{nome}</span>;
}

// --- MODAIS ---

function ModalCriarOrdemServico({
  open,
  onClose,
  onSuccess,
  idEmpresa,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  idEmpresa: number;
}) {
  const [idCliente, setIdCliente] = useState<number | "">("");
  const [nomeCliente, setNomeCliente] = useState<string>("");
  const [idVendedor, setIdVendedor] = useState<number | "">("");
  const [vendedores, setVendedores] = useState<SelectItem[]>([]);
  const [clientesModalOpen, setClientesModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setIdCliente("");
      setNomeCliente("");
      setIdVendedor("");

      const fetchVendedores = async () => {
        setLoading(true);
        try {
          const res = await fetch(ENDPOINTS.vendedores.list);
          const data = await res.json();
          const listaVendedores: SelectItem[] = (data ?? []).map((v: any) => ({
            id: Number(v.id_usuario),
            nome: String(v.nome),
          }));
          setVendedores(listaVendedores);
        } catch (error) {
          console.error("Erro ao carregar vendedores:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchVendedores();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCliente || !idVendedor) {
      alert("Por favor, selecione o cliente e o vendedor.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        id_empresa: idEmpresa,
        id_cliente: Number(idCliente),
        id_vendedor: Number(idVendedor),
        valor_sub_total: 0,
      };
      const response = await fetch(ENDPOINTS.ordens_servico.create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Falha ao criar a ordem de serviço."
        );
      }
      onSuccess();
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 grid place-items-center bg-black/60"
        onClick={onClose}
      >
        <div
          className="relative p-6 bg-white rounded-lg shadow-xl w-full max-w-lg dark:bg-gray-900"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold mb-4 dark:text-slate-200">
            Criar Nova Ordem de Serviço
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
                  Cliente *
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={idCliente ? `#${idCliente} - ${nomeCliente}` : ""}
                    placeholder="Nenhum cliente selecionado"
                    className="flex-1 p-2 border rounded-md bg-gray-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setClientesModalOpen(true)}
                    className="px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Buscar
                  </button>
                </div>
              </div>
              <div>
                <label
                  htmlFor="vendedor"
                  className="block text-sm font-medium text-gray-700 dark:text-slate-200"
                >
                  Vendedor *
                </label>
                <select
                  id="vendedor"
                  value={idVendedor}
                  onChange={(e) => setIdVendedor(Number(e.target.value))}
                  className="mt-1 block w-full p-2 border rounded-md shadow-sm dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
                  disabled={loading}
                  required
                >
                  <option value="">
                    {loading ? "Carregando..." : "Selecione um vendedor"}
                  </option>
                  {vendedores.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className="px-4 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-700 dark:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-400"
              >
                {loading ? "Cadastrando..." : "Cadastrar"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <ClienteSearchModal
        open={clientesModalOpen}
        onClose={() => setClientesModalOpen(false)}
        onPick={(c) => {
          setIdCliente(c.id);
          setNomeCliente(c.nome);
        }}
      />
    </>
  );
}

function ModalGerenciarLentes({
  open,
  onClose,
  ordemServico,
}: {
  open: boolean;
  onClose: () => void;
  ordemServico: OrdemServico | null;
}) {
  const [lentes, setLentes] = useState<LenteOrdemServico[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && ordemServico) {
      setLoading(true);
      fetch(
        `http://localhost:81/api/gets/get_lentes_by_os.php?id_ordem_servico=${ordemServico.id_ordem_servico}`
      )
        .then((res) => res.json())
        .then((data) => setLentes(data.data || []))
        .catch((err) => console.error("Erro ao buscar lentes da OS:", err))
        .finally(() => setLoading(false));
    }
  }, [open, ordemServico]);

  const handleDeleteLente = async (id_lente_ordem_servico: number) => {
    if (!window.confirm("Deseja remover esta lente da OS?")) return;
    try {
      const response = await fetch(
        `http://localhost:81/api/deletes/delete_lente_ordem_servico.php?id_lente_ordem_servico=${id_lente_ordem_servico}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Falha ao excluir a lente.");

      setLentes(
        lentes.filter(
          (l) => l.id_lente_ordem_servico !== id_lente_ordem_servico
        )
      );
      alert("Lente removida com sucesso!");
    } catch (error) {
      alert((error as Error).message);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/60" onClick={onClose}>
      <div
        className="relative flex flex-col mx-auto my-8 h-[calc(100vh-4rem)] w-[min(900px,90vw)] bg-white rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">
            Lentes da OS #{ordemServico?.id_ordem_servico}
          </h2>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm bg-gray-200 rounded-md"
          >
            Fechar
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => alert("Funcionalidade a ser implementada.")}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Adicionar Lente
            </button>
          </div>
          {loading ? (
            <p>Carregando lentes...</p>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">ID Lente</th>
                  <th className="px-6 py-3">Quantidade</th>
                  <th className="px-6 py-3">Valor Unit.</th>
                  <th className="px-6 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {lentes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center">
                      Nenhuma lente adicionada.
                    </td>
                  </tr>
                ) : (
                  lentes.map((lente) => (
                    <tr
                      key={lente.id_lente_ordem_servico}
                      className="bg-white border-b"
                    >
                      <td className="px-6 py-4">{lente.id_lente}</td>
                      <td className="px-6 py-4">{lente.quantidade}</td>
                      <td className="px-6 py-4">
                        R$ {parseFloat(String(lente.valor_unitario)).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            handleDeleteLente(lente.id_lente_ordem_servico)
                          }
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function ModalGerarVenda({
  open,
  onClose,
  ordemServico,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  ordemServico: OrdemServico | null;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleGenerateSale = async () => {
    if (!ordemServico) return;
    setLoading(true);
    try {
      const vendaRes = await fetch(
        "http://localhost:81/api/creates/create_venda.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_cliente: ordemServico.id_cliente,
            id_vendedor: ordemServico.id_vendedor,
            valor_total: ordemServico.valor_sub_total,
          }),
        }
      );
      if (!vendaRes.ok) throw new Error("Falha ao criar a venda.");

      const vendaData = await vendaRes.json();
      const newVendaId = vendaData.id_venda;
      if (!newVendaId) throw new Error("ID da nova venda não retornado.");

      const linkRes = await fetch(
        "http://localhost:81/api/creates/create_venda_ordem_servico.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_venda: newVendaId,
            id_ordem_servico: ordemServico.id_ordem_servico,
          }),
        }
      );
      if (!linkRes.ok) throw new Error("Falha ao vincular a venda à OS.");

      onSuccess();
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative p-6 bg-white rounded-lg shadow-xl w-1/3 min-w-[350px]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold">Gerar Venda</h2>
        <p className="my-4">
          Tem certeza que deseja gerar uma venda para a Ordem de Serviço #
          {ordemServico?.id_ordem_servico}?
          <br />
          <span className="text-sm text-gray-600">
            Valor: R${" "}
            {parseFloat(String(ordemServico?.valor_sub_total)).toFixed(2)}
          </span>
        </p>
        <div className="flex justify-end gap-2">
          <button
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            disabled={loading}
            onClick={handleGenerateSale}
            className="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-400"
          >
            {loading ? "Gerando..." : "Confirmar e Gerar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal de busca de clientes (Mantido aqui pois é um helper específico para esta página)
function ClienteSearchModal({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (cliente: ClienteParaSelecao) => void;
}) {
  const [allClientes, setAllClientes] = useState<ClienteParaSelecao[]>([]);
  const [filtered, setFiltered] = useState<ClienteParaSelecao[]>([]);
  const [query, setQuery] = useState({ nomeId: "", cpf: "", nasc: "" });
  const [loading, setLoading] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery({ nomeId: "", cpf: "", nasc: "" });
    setLoading(true);
    fetch(ENDPOINTS.clientes.list)
      .then((r) => r.json())
      .then((json) => {
        const arr = (json?.data || []).map((c: any) => ({
          id: c.id_cliente,
          nome: c.nome,
          cpf: c.cpf ?? "",
          data_nascimento: c.data_nascimento ?? "",
        }));
        setAllClientes(arr);
        setFiltered(arr);
      })
      .catch((e) => alert("Não foi possível carregar os clientes."))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    const applyFilter = () => {
      const sNomeId = query.nomeId.trim().toLowerCase();
      const sCpf = query.cpf.replace(/\D+/g, "");
      const iso = query.nasc.trim();

      const result = allClientes.filter((c) => {
        const hitNomeId =
          !sNomeId ||
          c.nome.toLowerCase().includes(sNomeId) ||
          String(c.id).includes(sNomeId);
        const hitCpf =
          !sCpf || (c.cpf || "").replace(/\D+/g, "").startsWith(sCpf);
        const hitNasc =
          !iso || (c.data_nascimento && c.data_nascimento.startsWith(iso));
        return hitNomeId && hitCpf && hitNasc;
      });
      setFiltered(result);
    };

    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(applyFilter, 250);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [query, allClientes]);

  const handlePick = (cliente: ClienteParaSelecao) => {
    onPick(cliente);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/60" onClick={onClose}>
      <div
        className="relative mx-auto my-8 w-[min(900px,92vw)] bg-white rounded-2xl shadow-xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 pb-3 border-b">
          <h3 className="text-lg font-semibold">Buscar Cliente</h3>
          <button
            className="px-3 py-1 text-sm bg-gray-200 rounded-md"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            type="text"
            value={query.nomeId}
            onChange={(e) =>
              setQuery((q) => ({ ...q, nomeId: e.target.value }))
            }
            placeholder="Nome ou ID..."
            className="w-full p-2 border rounded-md"
          />
          <input
            inputMode="numeric"
            value={query.cpf}
            onChange={(e) => setQuery((q) => ({ ...q, cpf: e.target.value }))}
            placeholder="CPF..."
            className="w-full p-2 border rounded-md"
          />
          <input
            type="date"
            value={query.nasc}
            onChange={(e) => setQuery((q) => ({ ...q, nasc: e.target.value }))}
            className="w-full p-2 border rounded-md"
          />
        </div>
        <div className="mt-4 max-h-[55vh] overflow-auto border rounded-md">
          {loading ? (
            <div className="p-4 text-sm">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-sm">Nenhum cliente encontrado.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Nome</th>
                  <th className="px-4 py-2 text-left">CPF</th>
                  <th className="px-4 py-2 text-left">Nascimento</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-4 py-2">{c.id}</td>
                    <td className="px-4 py-2">{c.nome}</td>
                    <td className="px-4 py-2">{c.cpf}</td>
                    <td className="px-4 py-2">{c.data_nascimento}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        className="px-3 py-1 text-xs text-white bg-green-600 rounded-md"
                        onClick={() => handlePick(c)}
                      >
                        Selecionar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---

export default function OrdensServico() {
  const idEmpresa = 1;

  const [refreshSignal, setRefreshSignal] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedOS, setSelectedOS] = useState<OrdemServico | null>(null);
  const [clientesOpen, setClientesOpen] = useState(false);

  const [modals, setModals] = useState({
    create: false,
    lentes: false,
    venda: false,
    delete: false,
    edit: false,
  });
  const [toast, setToast] = useState({ open: false, message: "" });

  const handleActionSuccess = (message: string) => {
    // Fecha todos os modais
    setModals({
      create: false,
      lentes: false,
      venda: false,
      delete: false,
      edit: false,
    });
    setRefreshSignal((prev) => prev + 1);
    setToast({ open: true, message });
    setTimeout(() => setToast({ open: false, message: "" }), 3000);
  };

  const openModal = (
    modalName: keyof typeof modals,
    os: OrdemServico | null = null
  ) => {
    setSelectedOS(os);
    setModals((prev) => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [modalName]: false }));
  };

  const columns: ColumnDef<OrdemServico>[] = [
    { accessorKey: "id_ordem_servico", header: "#" },
    {
      accessorKey: "id_cliente",
      header: "Cliente",
      cell: ({ row }) => (
        <NomeCell id={row.original.id_cliente} tipo="cliente" />
      ),
    },
    {
      accessorKey: "id_vendedor",
      header: "Vendedor",
      cell: ({ row }) => (
        <NomeCell id={row.original.id_vendedor} tipo="vendedor" />
      ),
    },
    {
      accessorKey: "valor_sub_total",
      header: "Subtotal",
      cell: ({ row }) =>
        `R$ ${parseFloat(String(row.original.valor_sub_total)).toFixed(2)}`,
    },
    {
      accessorKey: "created_at",
      header: "Data",
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
    },
    {
      accessorKey: "acoes",
      header: "Ações",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <button
            title="Gerenciar Lentes"
            className="p-2 text-white bg-purple-600 rounded-md"
            onClick={() => openModal("lentes", row.original)}
          >
            <FaWrench />
          </button>
          <button
            title="Gerar Venda"
            className="p-2 text-white bg-green-600 rounded-md"
            onClick={() => openModal("venda", row.original)}
          >
            <FaShoppingCart />
          </button>
          <button
            title="Editar OS"
            className="p-2 text-white bg-blue-600 rounded-md"
            onClick={() => openModal("edit", row.original)}
          >
            <FaEdit />
          </button>
          <button
            title="Excluir OS"
            className="p-2 text-white bg-red-600 rounded-md"
            onClick={() => openModal("delete", row.original)}
          >
            <FaTrash />
          </button>
        </div>
      ),
    },
  ];

  const fetchData = async (page: number, pageSize: number, s: string) => {
    try {
      const res = await fetch(
        ENDPOINTS.ordens_servico.list + `?id_empresa=${idEmpresa}`
      );
      if (!res.ok) throw new Error("Falha ao buscar dados.");

      const result = await res.json();
      const allData: OrdemServico[] = result.data || [];
      const filtered = allData.filter(
        (item) =>
          String(item.id_ordem_servico).includes(s) ||
          String(item.id_cliente).includes(s)
      );

      return {
        data: filtered.slice(page * pageSize, (page + 1) * pageSize),
        total: filtered.length,
      };
    } catch (error) {
      console.error("Erro em fetchData:", error);
      return { data: [], total: 0 };
    }
  };

  return (
    <div>
      <PageMeta title="Ordens de Serviço" />
      <PageBreadcrumb
        items={[{ label: "Home", to: "/" }, { label: "Ordens de Serviço" }]}
      />

      <div className="flex justify-end mb-4 gap-2">
        <button
          className="rounded-md bg-slate-600 py-2 px-4 text-sm text-white shadow-md hover:bg-slate-700 transition flex items-center gap-2"
          type="button"
          onClick={() => setClientesOpen(true)}
        >
          Clientes
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-green-700 rounded-md shadow-md"
          type="button"
          onClick={() => openModal("create")}
        >
          Cadastrar Ordem de Serviço
        </button>
      </div>

      <div className="min-h-screen px-5 py-7 rounded-2xl border bg-white dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <DataTable
          columns={columns}
          fetchData={fetchData}
          pageSize={10}
          search={search}
          setSearch={setSearch}
          refreshSignal={refreshSignal}
        />
      </div>

      <ModalCriarOrdemServico
        open={modals.create}
        onClose={() => closeModal("create")}
        onSuccess={() => handleActionSuccess("OS criada com sucesso!")}
        idEmpresa={idEmpresa}
      />
      <ModalGerenciarLentes
        open={modals.lentes}
        onClose={() => closeModal("lentes")}
        ordemServico={selectedOS}
      />
      <ModalGerarVenda
        open={modals.venda}
        onClose={() => closeModal("venda")}
        ordemServico={selectedOS}
        onSuccess={() => handleActionSuccess("Venda gerada com sucesso!")}
      />

      {/*Overlay para a página de Clientes */}
      <div
        className={`fixed inset-0 z-[70] ${
          clientesOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        } transition-opacity duration-300`}
        aria-hidden={!clientesOpen}
        onClick={() => setClientesOpen(false)}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div
          className="relative mx-auto my-4 h-[calc(100vh-2rem)] w-[min(1400px,95vw)] rounded-2xl bg-white shadow-xl dark:bg-slate-900 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                Clientes
              </h2>
              <p className="text-sm text-slate-500">Gerenciar clientes</p>
            </div>
            <button
              onClick={() => setClientesOpen(false)}
              className="rounded-md border dark:text-slate-200 border-slate-200 dark:border-slate-700 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Fechar
            </button>
          </div>

          {/* Conteúdo (carregado sob demanda) */}
          <div className="flex-1 overflow-hidden">
            <React.Suspense
              fallback={
                <div className="h-full grid place-items-center text-slate-500">
                  Carregando Clientes...
                </div>
              }
            >
              <ClientesPage />
            </React.Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
