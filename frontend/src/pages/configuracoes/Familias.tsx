import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTable from "../../components/tables/table";
import { ColumnDef } from "@tanstack/react-table";
import { FaGear, FaTrash, FaNewspaper } from "react-icons/fa6";
import React, { useRef, useEffect, useState } from "react";

// Definição do tipo Familia
type Familia = {
  id_familia: number;
  nome: string;
  acoes?: string;
};

// Função auxiliar para comparar dados
function isSameData(a: Familia[], b: Familia[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// Função para buscar dados da API
const fetchData = async (
  page: number,
  pageSize: number,
  search: string,
  etagRef?: React.MutableRefObject<string | null>
) => {
  const headers: Record<string, string> = {};
  if (etagRef?.current) {
    headers["If-None-Match"] = etagRef.current;
  }

  const res = await fetch("http://localhost:81/api/gets/get_familias.php", {
    method: "GET",
    headers,
    cache: "no-cache",
  });

  if (res.status === 304) {
    return { data: null, total: null, notModified: true };
  }

  if (!res.ok) {
    throw new Error(`Erro ao buscar famílias: ${res.status}`);
  }

  const etag = res.headers.get("etag");
  if (etagRef && etag) etagRef.current = etag;

  const data = await res.json();

  let filtered = data;
  if (search) {
    const s = search.toLowerCase();
    filtered = data.filter((item: Familia) =>
      String(item.nome || "")
        .toLowerCase()
        .includes(s)
    );
  }

  const total = filtered.length;
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
  return { data: paginated, total, notModified: false };
};

// Componente principal da página
export default function Familias() {
  const etagRef = useRef<string | null>(null);
  const lastDataRef = useRef<Familia[]>([]);

  const [refreshSignal, setRefreshSignal] = useState(0);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFamilia, setSelectedFamilia] = useState<Familia | null>(null);

  // NOVO: modal de cadastro
  const [createOpen, setCreateOpen] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("Item atualizado com sucesso.");
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Polling para atualização automática da tabela
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const result = await fetchData(0, 10, search, etagRef);

        if (result?.notModified) {
          return;
        }

        if (result?.data) {
          if (!isSameData(result.data, lastDataRef.current)) {
            lastDataRef.current = result.data;
            setRefreshSignal((k) => k + 1);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [search]);

  // NOVO: callback de sucesso do cadastro
  const handleCreateSuccess = () => {
    setCreateOpen(false);
    setRefreshSignal((prev) => prev + 1);

    setToastMsg("Família cadastrada com sucesso.");
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 2500);
  };

  const handleDeleteSuccess = () => {
    setDeleteOpen(false);
    setSelectedFamilia(null);
    setRefreshSignal((prev) => prev + 1);

    setToastMsg("Família excluída com sucesso.");
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 2500);
  };

  const handleUpdateSuccess = () => {
    setModalOpen(false);
    setRefreshSignal((prev) => prev + 1);

    setToastMsg("Família atualizada com sucesso.");
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 2500);
  };

  const columns: ColumnDef<Familia>[] = [
    { accessorKey: "id_familia", header: "#" },
    { accessorKey: "nome", header: "Nome" },
    {
      accessorKey: "acoes",
      header: "Ações",
      cell: ({ row }) => (
        <div className="row flex">
          <button
            className="rounded-md rounded-r-none bg-blue-600 py-2 px-4 text-sm text-white"
            type="button"
          >
            <FaNewspaper />
          </button>
          <button
            className="rounded-none bg-slate-600 py-2 px-4 border-x border-slate-700 text-sm text-white"
            type="button"
            onClick={() => {
              setSelectedFamilia(row.original);
              setModalOpen(true);
            }}
          >
            <FaGear />
          </button>
          <button
            className="rounded-md rounded-l-none bg-red-600 py-2 px-4 text-sm text-white"
            type="button"
            onClick={() => {
              setSelectedFamilia(row.original);
              setDeleteOpen(true);
            }}
          >
            <FaTrash />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageMeta title="Configurações Familias" description="..." />
      <PageBreadcrumb
        items={[
          { label: "Home", to: "/" },
          { label: "Configurações", to: "/" },
          { label: "Familias", to: "/configuracoes/familias" },
        ]}
      />
      <div className="flex justify-end mb-4">
        <button
          className="rounded-md bg-green-700 py-2 px-4 text-sm text-white shadow-md hover:bg-green-700 transition"
          type="button"
          onClick={() => setCreateOpen(true)} // NOVO
        >
          Cadastrar
        </button>
      </div>
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <DataTable
          columns={columns}
          fetchData={async (page, pageSize, s) => {
            const r = await fetchData(page, pageSize, s, etagRef);
            if (r?.data && !r.notModified) {
              lastDataRef.current = r.data;
            }
            return r?.notModified ? { data: [], total: 0 } : r;
          }}
          pageSize={10}
          search={search}
          setSearch={setSearch}
          refreshSignal={refreshSignal}
        />
      </div>
      {/* Modal cadastrar */}
      <ModalCadastrarFamilia
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />
      {/* Modal editar */}
      <ModalEditarFamilia
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        familia={selectedFamilia}
        onSuccess={handleUpdateSuccess}
      />
      {/* Modal excluir */}
      <ModalExcluirFamilia
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        familia={selectedFamilia}
        onSuccess={handleDeleteSuccess}
      />
      <ToastSuccess
        open={toastOpen}
        message={toastMsg}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
}

// Props do modal editar
type ModalEditarFamiliaProps = {
  open: boolean;
  onClose: () => void;
  familia: Familia | null;
  onSuccess: () => void;
};

// Componente do modal de edição
export function ModalEditarFamilia({
  open,
  onClose,
  familia,
  onSuccess,
}: ModalEditarFamiliaProps) {
  const [editedName, setEditedName] = useState("");

  useEffect(() => {
    if (familia) {
      setEditedName(familia.nome || "");
    }
  }, [familia]);

  const [loading, setLoading] = useState(false);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!familia) return;

    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:81/api/updates/update_familia.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_familia: familia.id_familia,
            nome: editedName.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Falha ao atualizar: ${errorData}`);
      }

      onSuccess();
    } catch (error) {
      console.error("Erro ao enviar o formulário:", error);
      alert("Não foi possível atualizar a família.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[2] grid h-screen w-screen place-items-center transition-opacity duration-300 ${
        open
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <div
        className="relative m-4 p-4 w-2/5 min-w-[300px] rounded-lg bg-white shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex shrink-0 items-center pb-4 text-xl font-medium text-slate-800 dark:text-slate-200">
            Editar (<span id="editar-titulo">{familia?.nome}</span>)
          </div>
          <div className="relative p-4">
            <div className="grid grid-cols-24 gap-4">
              <div className="col-span-3">
                <label
                  htmlFor="editar-id_familia"
                  className="mb-2 text-sm text-slate-800 dark:text-slate-200"
                >
                  ID
                </label>
                <input
                  type="text"
                  id="editar-id_familia"
                  className="bg-slate-200 dark:bg-slate-700 block placeholder:text-slate-400 text-slate-700 text-sm border border-slate-300 rounded-md px-3 py-2 w-full dark:text-slate-200 dark:border-slate-600"
                  value={familia?.id_familia ?? ""}
                  readOnly
                />
              </div>
              <div className="col-span-12">
                <label
                  htmlFor="editar-nome"
                  className="mb-2 text-sm text-slate-800 dark:text-slate-200"
                >
                  Nome *
                </label>
                <input
                  type="text"
                  id="editar-nome"
                  className="bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-300 rounded-md px-3 py-2 w-full dark:text-slate-200 dark:border-slate-600"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          <hr className="mt-3 dark:border-gray-700" />
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 pt-4">
            <button
              className="rounded-md border border-slate-200 dark:border-slate-600 py-2 px-4 text-center text-sm transition-all text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              className="rounded-md bg-slate-700 py-2 px-4 text-center text-sm text-white shadow-md transition-all hover:bg-slate-700 disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ======================
// Modal de Cadastro
// ======================
type ModalCadastrarFamiliaProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function ModalCadastrarFamilia({
  open,
  onClose,
  onSuccess,
}: ModalCadastrarFamiliaProps) {
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);

  // Sempre que abrir o modal, limpa o estado
  useEffect(() => {
    if (open) {
      setNome("");
      setLoading(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { nome: nome.trim() };
    if (!payload.nome) return alert("Informe o nome da família.");

    try {
      setLoading(true);
      const resp = await fetch(
        "http://localhost:81/api/creates/create_familia.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || "Falha ao cadastrar.");
      }

      onSuccess(); // fecha modal, atualiza tabela e mostra toast
    } catch (err) {
      console.error(err);
      alert("Não foi possível cadastrar a família.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[3] grid h-screen w-screen place-items-center transition-opacity duration-300 ${
        open
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <div
        className="relative m-4 p-4 w-2/5 min-w-[300px] rounded-lg bg-white shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex shrink-0 items-center pb-4 text-xl font-medium text-slate-800 dark:text-slate-200">
            Cadastrar Família
          </div>
          <div className="relative p-4">
            <div className="grid grid-cols-24 gap-4">
              <div className="col-span-12">
                <label
                  htmlFor="cad-nome"
                  className="mb-2 text-sm text-slate-800 dark:text-slate-200"
                >
                  Nome *
                </label>
                <input
                  id="cad-nome"
                  type="text"
                  className="bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-300 rounded-md px-3 py-2 w-full dark:text-slate-200 dark:border-slate-600"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>
          </div>
          <hr className="mt-3 dark:border-gray-700" />
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 dark:border-slate-600 py-2 px-4 text-center text-sm transition-all text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-md bg-green-700 py-2 px-4 text-center text-sm text-white shadow-md transition-all hover:bg-green-800 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Cadastrando..." : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Toast de sucesso
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
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300 ${
        open
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-5 pointer-events-none"
      }`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        id="toast-success"
        className="flex items-center w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow-sm dark:text-gray-400 dark:bg-gray-800"
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
type ModalExcluirFamiliaProps = {
  open: boolean;
  onClose: () => void;
  familia: Familia | null;
  onSuccess: () => void;
};

export function ModalExcluirFamilia({
  open,
  onClose,
  familia,
  onSuccess,
}: ModalExcluirFamiliaProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!familia) return;
    try {
      setLoading(true);
      const resp = await fetch(
        "http://localhost:81/api/deletes/delete_familia.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_familia: familia.id_familia }),
        }
      );

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || "Falha ao excluir.");
      }

      onSuccess(); // fecha modal, atualiza tabela e mostra toast
    } catch (err) {
      console.error(err);
      alert("Não foi possível excluir a família.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[4] grid h-screen w-screen place-items-center transition-opacity duration-300 ${
        open
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <div
        className="relative m-4 p-4 w-2/5 min-w-[300px] rounded-lg bg-white shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center pb-4 text-xl font-medium text-slate-800 dark:text-slate-200">
          Excluir Família
        </div>

        <div className="p-4 text-sm text-slate-700 dark:text-slate-200">
          <p className="mb-2">
            Tem certeza de que deseja{" "}
            <span className="font-semibold">excluir</span> a família
            {` `}
            <span className="font-semibold">“{familia?.nome}”</span> (ID{" "}
            {familia?.id_familia})?
          </p>
          <p className="text-slate-500 dark:text-slate-400">
            Esta ação não poderá ser desfeita.
          </p>
        </div>

        <hr className="mt-3 dark:border-gray-700" />

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 dark:border-slate-600 py-2 px-4 text-center text-sm transition-all text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="rounded-md bg-red-600 py-2 px-4 text-center text-sm text-white shadow-md transition-all hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
