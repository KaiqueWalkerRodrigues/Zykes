import React, { useEffect, useMemo, useRef, useState } from "react";
import DataTable from "../../components/tables/table";
import { ColumnDef } from "@tanstack/react-table";
import { FaGear, FaTrash } from "react-icons/fa6";

/* ========================
   Tipos
   ======================== */
type Empresa = {
  id_empresa: number;
  nome: string;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
};

/* ========================
   Funções Auxiliares (Helpers)
   ======================== */
function isSameData<T>(a: T[], b: T[]): boolean {
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
const fetchData = async <T,>(
  url: string,
  page: number,
  pageSize: number,
  search: string,
  etagRef?: React.MutableRefObject<string | null>
) => {
  const headers: Record<string, string> = {};
  if (etagRef?.current) {
    headers["If-None-Match"] = etagRef.current;
  }

  const res = await fetch(url, { method: "GET", headers, cache: "no-cache" });

  if (res.status === 304) {
    return { data: null, total: null, notModified: true };
  }
  if (!res.ok) {
    throw new Error(`Erro ao buscar dados: ${res.status}`);
  }

  const etag = res.headers.get("etag");
  if (etagRef && etag) etagRef.current = etag;

  const data: T[] = await res.json();
  let filtered = data;
  if (search) {
    const s = search.toLowerCase();
    filtered = data.filter((item: any) =>
      String(item.nome || "")
        .toLowerCase()
        .includes(s)
    );
  }

  const total = filtered.length;
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
  return { data: paginated, total, notModified: false };
};

/* ========================
   Seção Genérica para Entidades Simples (CRUD)
   ======================== */
type SectionProps<T> = {
  title: string;
  fetchUrl: string;
  createUrl: string;
  updateUrl: string;
  deleteUrl: string;
  idKey: keyof T;
};

function Section<T extends { nome: string }>({
  title,
  fetchUrl,
  createUrl,
  updateUrl,
  deleteUrl,
  idKey,
}: SectionProps<T>) {
  const etagRef = useRef<string | null>(null);
  const lastDataRef = useRef<T[]>([]);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [search, setSearch] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<T | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const result = await fetchData<T>(fetchUrl, 0, 10, search, etagRef);
        if (result?.notModified) return;
        if (result?.data && !isSameData(result.data, lastDataRef.current)) {
          lastDataRef.current = result.data;
          setRefreshSignal((k) => k + 1);
        }
      } catch (e) {
        console.error(e);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchUrl, search]);

  const onCreated = () => {
    setCreateOpen(false);
    setToastMsg(`${title} cadastrada com sucesso.`);
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 2500);
    setRefreshSignal((prev) => prev + 1);
  };
  const onUpdated = () => {
    setEditOpen(false);
    setToastMsg(`${title} atualizada com sucesso.`);
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 2500);
    setRefreshSignal((prev) => prev + 1);
  };
  const onDeleted = () => {
    setDeleteOpen(false);
    setSelected(null);
    setToastMsg(`${title} excluída com sucesso.`);
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 2500);
    setRefreshSignal((prev) => prev + 1);
  };

  const columns = useMemo<ColumnDef<T>[]>(
    () => [
      { accessorKey: idKey as string, header: "#" },
      { accessorKey: "nome", header: "Nome" },
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
              title={`Editar ${title}`}
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
              title={`Excluir ${title}`}
              type="button"
            >
              <FaTrash />
            </button>
          </div>
        ),
      },
    ],
    [title, idKey]
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Gerenciar {title}
        </h3>
        <button
          className="inline-flex items-center gap-2 rounded-md bg-green-700 py-2 px-4 text-sm text-white shadow hover:bg-green-800"
          onClick={() => setCreateOpen(true)}
          type="button"
        >
          Cadastrar {title}
        </button>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-slate-900">
          <DataTable
            columns={columns}
            fetchData={async (page, pageSize, s) => {
              const r = await fetchData<T>(
                fetchUrl,
                page,
                pageSize,
                s,
                etagRef
              );
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

      <ModalCreate
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={onCreated}
        title={title}
        createUrl={createUrl}
      />
      <ModalEdit
        open={editOpen}
        onClose={() => setEditOpen(false)}
        entity={selected}
        onSuccess={onUpdated}
        title={title}
        updateUrl={updateUrl}
        idKey={idKey}
      />
      <ModalDelete
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        entity={selected}
        onSuccess={onDeleted}
        title={title}
        deleteUrl={deleteUrl}
        idKey={idKey}
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
   Modais
   ========================= */
type ModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: string;
};

function ModalCreate({
  open,
  onClose,
  onSuccess,
  title,
  createUrl,
}: ModalProps & { createUrl: string }) {
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setNome("");
      setLoading(false);
    }
    setTimeout(() => {
      if (firstInputRef.current) {
        firstInputRef.current.focus();
      }
    }, 100);
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return alert("Informe o nome.");
    try {
      setLoading(true);
      const resp = await fetch(createUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim() }),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || "Falha ao cadastrar.");
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Não foi possível cadastrar.");
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
        className="relative m-4 p-4 w-[min(500px,95vw)] rounded-lg bg-white shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={submit}>
          <div className="pb-4 text-xl font-medium text-slate-800 dark:text-slate-200">
            Cadastrar {title}
          </div>
          <div className="p-4">
            <label className="mb-2 text-sm text-slate-800 dark:text-slate-200">
              Nome *
            </label>
            <input
              ref={firstInputRef}
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              autoFocus
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-500/40"
            />
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

function ModalEdit<T extends { nome: string }>({
  open,
  onClose,
  entity,
  onSuccess,
  title,
  updateUrl,
  idKey,
}: ModalProps & { entity: T | null; updateUrl: string; idKey: keyof T }) {
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entity && open) {
      setNome(entity.nome || "");
    }
  }, [entity, open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entity || !nome.trim()) return;
    try {
      setLoading(true);
      const payload = { [idKey]: (entity as any)[idKey], nome: nome.trim() };
      const resp = await fetch(updateUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        throw new Error((await resp.text()) || "Falha ao atualizar.");
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Não foi possível atualizar.");
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
        className="relative m-4 p-4 w-[min(500px,95vw)] rounded-lg bg-white shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={submit}>
          <div className="pb-4 text-xl font-medium text-slate-800 dark:text-slate-200">
            Editar {title} (ID: {entity ? (entity as any)[idKey] : ""})
          </div>
          <div className="p-4">
            <label className="mb-2 text-sm text-slate-800 dark:text-slate-200">
              Nome *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-500/40"
            />
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

function ModalDelete<T extends { nome: string }>({
  open,
  onClose,
  entity,
  onSuccess,
  title,
  deleteUrl,
  idKey,
}: ModalProps & { entity: T | null; deleteUrl: string; idKey: keyof T }) {
  const [loading, setLoading] = useState(false);

  const doDelete = async () => {
    if (!entity) return;
    try {
      setLoading(true);
      const resp = await fetch(deleteUrl, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [idKey]: (entity as any)[idKey] }),
      });
      if (!resp.ok) {
        throw new Error((await resp.text()) || "Falha ao excluir.");
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Não foi possível excluir.");
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
        className="relative m-4 p-4 w-[min(500px,95vw)] rounded-lg bg-white shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pb-4 text-xl font-medium text-slate-800 dark:text-slate-200">
          Excluir {title}
        </div>
        <div className="p-4 text-sm text-slate-700 dark:text-slate-200">
          <p className="mb-2">
            Tem certeza de que deseja{" "}
            <span className="font-semibold">excluir</span>{" "}
            <span className="font-semibold">"{entity?.nome}"</span>?
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
            onClick={doDelete}
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

/* ========================
   Página Principal
   ======================== */
export default function Empresas() {
  return (
    <div className="h-full">
      <Section<Empresa>
        title="Empresa"
        fetchUrl="http://localhost:81/api/gets/get_empresas.php"
        createUrl="http://localhost:81/api/creates/create_empresa.php"
        updateUrl="http://localhost:81/api/updates/update_empresa.php"
        deleteUrl="http://localhost:81/api/deletes/delete_empresa.php"
        idKey="id_empresa"
      />
    </div>
  );
}
