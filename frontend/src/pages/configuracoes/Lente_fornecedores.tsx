import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTable from "../../components/tables/table";
import { ColumnDef } from "@tanstack/react-table";
import { FaGear, FaTrash } from "react-icons/fa6";
import React, { useRef, useEffect, useState } from "react";

/* =========================
   Tipos e utilitários
========================= */
type Fornecedor = {
  id_fornecedor: number;
  nome: string;
  cnpj: string;
  acoes?: string;
};

function isSameData(a: Fornecedor[], b: Fornecedor[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D+/g, "");
}

function maskCNPJ(v: string) {
  const d = onlyDigits(v).slice(0, 14);
  let out = d;
  if (d.length > 2) out = d.slice(0, 2) + "." + d.slice(2);
  if (d.length > 5) out = out.slice(0, 6) + "." + d.slice(5);
  if (d.length > 8) out = out.slice(0, 10) + "/" + d.slice(8);
  if (d.length > 12) out = out.slice(0, 15) + "-" + d.slice(12);
  return out;
}

// Validação simples: 14 dígitos (se quiser, posso colocar a checagem completa dos dígitos verificadores)
function isValidCNPJ(v: string) {
  return onlyDigits(v).length === 14;
}

/* =========================
   Fetch da API com ETag
========================= */
const fetchData = async (
  page: number,
  pageSize: number,
  search: string,
  etagRef?: React.MutableRefObject<string | null>
) => {
  const headers: Record<string, string> = {};
  if (etagRef?.current) headers["If-None-Match"] = etagRef.current;

  const res = await fetch(
    "http://localhost:81/api/gets/get_lente_fornecedores.php",
    {
      method: "GET",
      headers,
      cache: "no-cache",
    }
  );

  if (res.status === 304) {
    return { data: null, total: null, notModified: true };
  }

  if (!res.ok) {
    throw new Error(`Erro ao buscar fornecedores: ${res.status}`);
  }

  const etag = res.headers.get("etag");
  if (etagRef && etag) etagRef.current = etag;

  const data: Fornecedor[] = await res.json();

  let filtered = data;
  if (search) {
    const s = search.toLowerCase();
    filtered = data.filter(
      (item) =>
        String(item.nome || "")
          .toLowerCase()
          .includes(s) ||
        String(item.cnpj || "")
          .toLowerCase()
          .includes(s) ||
        String(item.id_fornecedor || "")
          .toLowerCase()
          .includes(s)
    );
  }

  const total = filtered.length;
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
  return { data: paginated, total, notModified: false };
};

/* =========================
   Página principal
========================= */
export default function Lente_fornecedores() {
  const etagRef = useRef<string | null>(null);
  const lastDataRef = useRef<Fornecedor[]>([]);

  const [refreshSignal, setRefreshSignal] = useState(0);
  const [search, setSearch] = useState("");

  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);

  const [selectedFornecedor, setSelectedFornecedor] =
    useState<Fornecedor | null>(null);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("Ação realizada com sucesso.");

  // Polling com ETag
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const result = await fetchData(0, 10, search, etagRef);
        if (result?.notModified) return;

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

  const ack = (msg: string) => {
    setToastMsg(msg);
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 2500);
  };

  const onCreated = () => {
    setModalCreateOpen(false);
    setRefreshSignal((k) => k + 1);
    ack("Fornecedor cadastrado com sucesso.");
  };
  const onUpdated = () => {
    setModalEditOpen(false);
    setRefreshSignal((k) => k + 1);
    ack("Fornecedor atualizado com sucesso.");
  };
  const onDeleted = () => {
    setModalDeleteOpen(false);
    setSelectedFornecedor(null);
    setRefreshSignal((k) => k + 1);
    ack("Fornecedor excluído com sucesso.");
  };

  const columns: ColumnDef<Fornecedor>[] = [
    { accessorKey: "id_fornecedor", header: "#" },
    { accessorKey: "nome", header: "Nome" },
    {
      accessorKey: "cnpj",
      header: "CNPJ",
      cell: ({ getValue }) => {
        const v = String(getValue() ?? "");
        return <span className="font-mono">{maskCNPJ(v)}</span>;
      },
    },
    {
      accessorKey: "acoes",
      header: "Ações",
      cell: ({ row }) => (
        <div className="row flex">
          <button
            className="rounded-md rounded-r-none bg-slate-600 py-2 px-4 border-x border-slate-700 text-sm text-white"
            type="button"
            title="Editar"
            onClick={() => {
              setSelectedFornecedor(row.original);
              setModalEditOpen(true);
            }}
          >
            <FaGear />
          </button>
          <button
            className="rounded-md rounded-l-none bg-red-600 py-2 px-4 text-sm text-white"
            type="button"
            title="Excluir"
            onClick={() => {
              setSelectedFornecedor(row.original);
              setModalDeleteOpen(true);
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
      <PageMeta
        title="Configurações Fornecedores"
        description="Gerencie os fornecedores."
      />
      <PageBreadcrumb
        items={[
          { label: "Home", to: "/" },
          { label: "Configurações", to: "/" },
          { label: "Fornecedores", to: "/configuracoes/fornecedores" },
        ]}
      />

      <div className="flex justify-end mb-4">
        <button
          className="rounded-md bg-green-700 py-2 px-4 text-sm text-white shadow-md hover:bg-green-700 transition"
          type="button"
          onClick={() => setModalCreateOpen(true)}
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

      {/* Modais */}
      <ModalCadastrarFornecedor
        open={modalCreateOpen}
        onClose={() => setModalCreateOpen(false)}
        onSuccess={onCreated}
      />
      <ModalEditarFornecedor
        open={modalEditOpen}
        onClose={() => setModalEditOpen(false)}
        fornecedor={selectedFornecedor}
        onSuccess={onUpdated}
      />
      <ModalExcluirFornecedor
        open={modalDeleteOpen}
        onClose={() => setModalDeleteOpen(false)}
        fornecedor={selectedFornecedor}
        onSuccess={onDeleted}
      />

      <ToastSuccess
        open={toastOpen}
        message={toastMsg}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
}

/* =========================
   Modal: Cadastrar
========================= */
type ModalCadastrarFornecedorProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function ModalCadastrarFornecedor({
  open,
  onClose,
  onSuccess,
}: ModalCadastrarFornecedorProps) {
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setNome("");
      setCnpj("");
      setLoading(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { nome: nome.trim(), cnpj: onlyDigits(cnpj) };
    if (!payload.nome) return alert("Informe o nome.");
    if (!isValidCNPJ(payload.cnpj))
      return alert("CNPJ inválido (precisa ter 14 dígitos).");

    try {
      setLoading(true);
      const resp = await fetch(
        "http://localhost:81/api/creates/create_lente_fornecedor.php",
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
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Não foi possível cadastrar o fornecedor.");
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
        className="relative m-4 p-4 w-2/5 min-w-[320px] rounded-lg bg-white shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex items-center pb-4 text-xl font-medium text-slate-800 dark:text-slate-200">
            Cadastrar Fornecedor
          </div>
          <div className="p-4">
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
              <div className="col-span-12">
                <label
                  htmlFor="cad-cnpj"
                  className="mb-2 text-sm text-slate-800 dark:text-slate-200"
                >
                  CNPJ *
                </label>
                <input
                  id="cad-cnpj"
                  type="text"
                  inputMode="numeric"
                  className="bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-300 rounded-md px-3 py-2 w-full dark:text-slate-200 dark:border-slate-600 font-mono"
                  value={cnpj}
                  onChange={(e) => setCnpj(maskCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  required
                />
              </div>
            </div>
          </div>
          <hr className="mt-3 dark:border-gray-700" />
          <div className="flex items-center justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 dark:border-slate-600 py-2 px-4 text-sm transition-all text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-md bg-green-700 py-2 px-4 text-sm text-white shadow-md transition-all hover:bg-green-800 disabled:opacity-60"
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

/* =========================
   Modal: Editar
========================= */
type ModalEditarFornecedorProps = {
  open: boolean;
  onClose: () => void;
  fornecedor: Fornecedor | null;
  onSuccess: () => void;
};

export function ModalEditarFornecedor({
  open,
  onClose,
  fornecedor,
  onSuccess,
}: ModalEditarFornecedorProps) {
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (fornecedor && open) {
      setNome(fornecedor.nome || "");
      setCnpj(maskCNPJ(fornecedor.cnpj || ""));
    }
  }, [fornecedor, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fornecedor) return;
    const payload = {
      id_fornecedor: fornecedor.id_fornecedor,
      nome: nome.trim(),
      cnpj: onlyDigits(cnpj),
    };
    if (!payload.nome) return alert("Informe o nome.");
    if (!isValidCNPJ(payload.cnpj))
      return alert("CNPJ inválido (precisa ter 14 dígitos).");

    try {
      setLoading(true);
      const resp = await fetch(
        "http://localhost:81/api/updates/update_lente_fornecedor.php",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || "Falha ao atualizar.");
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Não foi possível atualizar o fornecedor.");
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
        className="relative m-4 p-4 w-2/5 min-w={[320]} rounded-lg bg-white shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex items-center pb-4 text-xl font-medium text-slate-800 dark:text-slate-200">
            Editar Fornecedor (
            <span id="editar-titulo">{fornecedor?.nome}</span>)
          </div>
          <div className="p-4">
            <div className="grid grid-cols-24 gap-4">
              <div className="col-span-3">
                <label
                  htmlFor="editar-id"
                  className="mb-2 text-sm text-slate-800 dark:text-slate-200"
                >
                  ID
                </label>
                <input
                  id="editar-id"
                  type="text"
                  value={fornecedor?.id_fornecedor ?? ""}
                  readOnly
                  className="bg-slate-200 dark:bg-slate-700 block placeholder:text-slate-400 text-slate-700 text-sm border border-slate-300 rounded-md px-3 py-2 w-full dark:text-slate-200 dark:border-slate-600"
                />
              </div>
              <div className="col-span-10">
                <label
                  htmlFor="editar-nome"
                  className="mb-2 text-sm text-slate-800 dark:text-slate-200"
                >
                  Nome *
                </label>
                <input
                  id="editar-nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-300 rounded-md px-3 py-2 w-full dark:text-slate-200 dark:border-slate-600"
                />
              </div>
              <div className="col-span-10">
                <label
                  htmlFor="editar-cnpj"
                  className="mb-2 text-sm text-slate-800 dark:text-slate-200"
                >
                  CNPJ *
                </label>
                <input
                  id="editar-cnpj"
                  type="text"
                  inputMode="numeric"
                  value={cnpj}
                  onChange={(e) => setCnpj(maskCNPJ(e.target.value))}
                  required
                  className="bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-300 rounded-md px-3 py-2 w-full dark:text-slate-200 dark:border-slate-600 font-mono"
                />
              </div>
            </div>
          </div>
          <hr className="mt-3 dark:border-gray-700" />
          <div className="flex items-center justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-md border border-slate-200 dark:border-slate-600 py-2 px-4 text-sm transition-all text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-slate-700 py-2 px-4 text-sm text-white shadow-md transition-all hover:bg-slate-700 disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================
   Modal: Excluir
========================= */
type ModalExcluirFornecedorProps = {
  open: boolean;
  onClose: () => void;
  fornecedor: Fornecedor | null;
  onSuccess: () => void;
};

export function ModalExcluirFornecedor({
  open,
  onClose,
  fornecedor,
  onSuccess,
}: ModalExcluirFornecedorProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!fornecedor) return;
    try {
      setLoading(true);
      const resp = await fetch(
        "http://localhost:81/api/deletes/delete_lente_fornecedor.php",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_fornecedor: fornecedor.id_fornecedor }),
        }
      );
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || "Falha ao excluir.");
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Não foi possível excluir o fornecedor.");
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
        className="relative m-4 p-4 w-2/5 min-w-[320px] rounded-lg bg-white shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center pb-4 text-xl font-medium text-slate-800 dark:text-slate-200">
          Excluir Fornecedor
        </div>

        <div className="p-4 text-sm text-slate-700 dark:text-slate-200">
          <p className="mb-2">
            Tem certeza de que deseja{" "}
            <span className="font-semibold">excluir</span> o fornecedor{" "}
            <span className="font-semibold">“{fornecedor?.nome}”</span> (ID{" "}
            {fornecedor?.id_fornecedor})?
          </p>
          <p className="text-slate-500 dark:text-slate-400">
            Esta ação não poderá ser desfeita.
          </p>
        </div>

        <hr className="mt-3 dark:border-gray-700" />

        <div className="flex items-center justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 dark:border-slate-600 py-2 px-4 text-sm transition-all text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="rounded-md bg-red-600 py-2 px-4 text-sm text-white shadow-md transition-all hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Toast
========================= */
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
