import React, { useEffect, useMemo, useRef, useState } from "react";
import DataTable from "../../components/tables/table";
import { ColumnDef } from "@tanstack/react-table";
import { FaGear, FaTrash } from "react-icons/fa6";

/* ========================
   Tipos
   ======================== */
type Fornecedor = {
  id_fornecedor: number;
  nome: string;
  cnpj: string;
  acoes?: string;
};

/* ========================
   Funções Auxiliares (Helpers)
   ======================== */
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

function isValidCNPJ(v: string) {
  return onlyDigits(v).length === 14;
}

function isSameData(a: Fornecedor[], b: Fornecedor[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/* ========================
   Componentes Auxiliares
   ======================== */
function Toast({
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
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[90] transition-all duration-300 ${
        open
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-5 pointer-events-none"
      }`}
      role="alert"
    >
      <div className="flex items-center w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow-sm dark:text-gray-400 dark:bg-gray-800">
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
        </div>
        <div className="ms-3 text-sm font-normal">{message}</div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="ms-auto -mx-1.5 -my-1.5 bg-transparent text-gray-400 hover:text-gray-900 rounded-lg p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700"
        >
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

/* ========================
   Função para buscar dados da API
   ======================== */
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

/* ========================
   Página Fornecedores
   ======================== */
export default function Lente_fornecedores() {
  const etagRef = useRef<string | null>(null);
  const lastDataRef = useRef<Fornecedor[]>([]);

  const [refreshSignal, setRefreshSignal] = useState(0);
  const [search, setSearch] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Fornecedor | null>(null);

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

  // Callbacks de sucesso
  const onCreated = () => {
    setCreateOpen(false);
    setToastMsg("Fornecedor cadastrado com sucesso.");
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 2500);
    setRefreshSignal((prev) => prev + 1);
  };

  const onUpdated = () => {
    setEditOpen(false);
    setToastMsg("Fornecedor atualizado com sucesso.");
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 2500);
    setRefreshSignal((prev) => prev + 1);
  };

  const onDeleted = () => {
    setDeleteOpen(false);
    setSelected(null);
    setToastMsg("Fornecedor excluído com sucesso.");
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 2500);
    setRefreshSignal((prev) => prev + 1);
  };

  const columns = useMemo<ColumnDef<Fornecedor>[]>(
    () => [
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
          <div className="flex">
            <button
              className="rounded-md rounded-r-none bg-slate-700 py-2 px-3 text-sm text-white"
              onClick={() => {
                setSelected(row.original);
                setEditOpen(true);
              }}
              title="Editar Fornecedor"
              type="button"
            >
              <FaGear />
            </button>
            <button
              className="rounded-md rounded-l-none bg-red-600 py-2 px-3 text-sm text-white"
              onClick={() => {
                setSelected(row.original);
                setDeleteOpen(true);
              }}
              title="Excluir Fornecedor"
              type="button"
            >
              <FaTrash />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="text-sm text-slate-500">
          Gerenciamento de Fornecedores
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-md bg-green-700 py-2 px-4 text-sm text-white shadow hover:bg-green-800"
            onClick={() => setCreateOpen(true)}
            type="button"
          >
            Cadastrar Fornecedor
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-6 dark:border-gray-800 dark:bg-slate-900">
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
      </div>

      <ModalCreateFornecedor
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={onCreated}
      />
      <ModalEditFornecedor
        open={editOpen}
        onClose={() => setEditOpen(false)}
        fornecedor={selected}
        onSuccess={onUpdated}
      />
      <ModalDeleteFornecedor
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        fornecedor={selected}
        onSuccess={onDeleted}
      />
      <Toast
        open={toastOpen}
        message={toastMsg}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
}
/* =========================
   Modais de Fornecedor
   ========================= */
type ModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

function ModalCreateFornecedor({ open, onClose, onSuccess }: ModalProps) {
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
      className={`fixed inset-0 z-[80] grid place-items-center transition-opacity ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative m-4 p-4 w-[min(600px,95vw)] rounded-lg bg-white shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="pb-4 text-xl font-medium text-slate-800 dark:text-slate-200">
            Cadastrar Fornecedor
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="mb-2 text-sm text-slate-800 dark:text-slate-200">
                  Nome *
                </label>
                <input
                  type="text"
                  className="bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-300 rounded-md px-3 py-2 w-full dark:text-slate-200 dark:border-slate-600"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="col-span-1">
                <label className="mb-2 text-sm text-slate-800 dark:text-slate-200">
                  CNPJ *
                </label>
                <input
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
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-md border border-slate-200 dark:border-slate-600 py-2 px-4 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-green-700 py-2 px-4 text-sm text-white shadow-md hover:bg-green-800 disabled:opacity-60"
            >
              {loading ? "Cadastrando..." : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalEditFornecedor({
  open,
  onClose,
  fornecedor,
  onSuccess,
}: ModalProps & { fornecedor: Fornecedor | null }) {
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
      className={`fixed inset-0 z-[81] grid place-items-center transition-opacity ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative m-4 p-4 w-[min(600px,95vw)] rounded-lg bg-white shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="pb-4 text-xl font-medium text-slate-800 dark:text-slate-200">
            Editar Fornecedor ({fornecedor?.nome})
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="mb-2 text-sm text-slate-800 dark:text-slate-200">
                  Nome *
                </label>
                <input
                  type="text"
                  className="bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-300 rounded-md px-3 py-2 w-full dark:text-slate-200 dark:border-slate-600"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
              <div className="col-span-1">
                <label className="mb-2 text-sm text-slate-800 dark:text-slate-200">
                  CNPJ *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-300 rounded-md px-3 py-2 w-full dark:text-slate-200 dark:border-slate-600 font-mono"
                  value={cnpj}
                  onChange={(e) => setCnpj(maskCNPJ(e.target.value))}
                  required
                />
              </div>
            </div>
          </div>
          <hr className="mt-3 dark:border-gray-700" />
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-md border border-slate-200 dark:border-slate-600 py-2 px-4 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-slate-700 py-2 px-4 text-sm text-white shadow-md hover:bg-slate-700 disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalDeleteFornecedor({
  open,
  onClose,
  fornecedor,
  onSuccess,
}: ModalProps & { fornecedor: Fornecedor | null }) {
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
      className={`fixed inset-0 z-[82] grid place-items-center transition-opacity ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative m-4 p-4 w-[min(520px,95vw)] rounded-lg bg-white shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pb-4 text-xl font-medium text-slate-800 dark:text-slate-200">
          Excluir Fornecedor
        </div>
        <div className="p-4 text-sm text-slate-700 dark:text-slate-200">
          <p className="mb-2">
            Tem certeza de que deseja{" "}
            <span className="font-semibold">excluir</span> o fornecedor{" "}
            <span className="font-semibold">"{fornecedor?.nome}"</span> (ID{" "}
            {fornecedor?.id_fornecedor})?
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
            disabled={loading}
            className="rounded-md border border-slate-200 dark:border-slate-600 py-2 px-4 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="rounded-md bg-red-600 py-2 px-4 text-sm text-white shadow-md hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
