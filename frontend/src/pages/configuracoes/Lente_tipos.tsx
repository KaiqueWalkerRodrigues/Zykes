// src/pages/configuracoes/lente_tipos.tsx
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTable from "../../components/tables/table";
import { ColumnDef } from "@tanstack/react-table";
import { FaGear, FaTrash } from "react-icons/fa6";
import React, { useRef, useEffect, useState } from "react";

/* =========================
   Utilitários
   ========================= */
function isSameData<T>(a: T[], b: T[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

type FetchResult<T> = {
  data: T[];
  total: number;
  notModified?: boolean;
};

type FetcherArgs = {
  page: number;
  pageSize: number;
  search: string;
  etagRef?: React.MutableRefObject<string | null>;
};

async function fetchList<T>(
  url: string,
  { page, pageSize, search, etagRef }: FetcherArgs,
  filterKeys: (keyof T)[]
): Promise<FetchResult<T>> {
  const headers: Record<string, string> = {};
  if (etagRef?.current) headers["If-None-Match"] = etagRef.current;

  const res = await fetch(url, { method: "GET", headers, cache: "no-cache" });

  if (res.status === 304) {
    return { data: [], total: 0, notModified: true };
  }
  if (!res.ok) {
    throw new Error(`Erro ao buscar dados: ${res.status}`);
  }

  const etag = res.headers.get("etag");
  if (etagRef && etag) etagRef.current = etag;

  const data: T[] = await res.json();

  // busca local
  let filtered = data;
  if (search) {
    const s = search.toLowerCase();
    filtered = data.filter((item) =>
      filterKeys.some((k) =>
        String((item as any)[k] ?? "")
          .toLowerCase()
          .includes(s)
      )
    );
  }

  const total = filtered.length;
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
  return { data: paginated, total };
}

/* =========================
   Tipos
   ========================= */
type LenteIndice = {
  id_indice_lente: number;
  nome: string;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
  acoes?: string;
};

type LenteTratamento = {
  id_tratamento_lente: number;
  nome: string;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
  acoes?: string;
};

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

/* =========================
   Modais genéricos (Cadastro/Edicão/Exclusão)
   ========================= */
type BaseEntity = { [k: string]: any; nome: string };

function ModalCadastrar<T extends BaseEntity>({
  open,
  onClose,
  onSuccess,
  title,
  createUrl,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: string;
  createUrl: string;
}) {
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setNome("");
      setLoading(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { nome: nome.trim() };
    if (!payload.nome) return alert("Informe o nome.");
    try {
      setLoading(true);
      const resp = await fetch(createUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      className={`fixed inset-0 z-[30] grid h-screen w-screen place-items-center transition-opacity duration-300 ${
        open
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <div
        className="relative m-4 p-4 w-[520px] min-w-[320px] rounded-lg bg-white shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex items-center pb-4 text-xl font-medium text-slate-800 dark:text-slate-200">
            {title}
          </div>
          <div className="p-4">
            <label className="mb-2 block text-sm text-slate-800 dark:text-slate-200">
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

function ModalEditar<T extends BaseEntity>({
  open,
  onClose,
  entity,
  onSuccess,
  title,
  idLabel,
  updateUrl,
  idKey,
}: {
  open: boolean;
  onClose: () => void;
  entity: T | null;
  onSuccess: () => void;
  title: string;
  idLabel: string;
  updateUrl: string;
  idKey: keyof T;
}) {
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entity && open) {
      setNome(entity.nome || "");
    }
  }, [entity, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entity) return;

    const payload: any = {
      [idKey as string]: (entity as any)[idKey],
      nome: nome.trim(),
    };
    if (!payload.nome) return alert("Informe o nome.");

    try {
      setLoading(true);
      const resp = await fetch(updateUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || "Falha ao atualizar.");
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
      className={`fixed inset-0 z-[30] grid h-screen w-screen place-items-center transition-opacity duration-300 ${
        open
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <div
        className="relative m-4 p-4 w-[600px] min-w-[320px] rounded-lg bg-white shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex items-center pb-4 text-xl font-medium text-slate-800 dark:text-slate-200">
            {title}{" "}
            <span className="ml-2 text-sm text-slate-500">
              ({entity?.nome})
            </span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-24 gap-4">
              <div className="col-span-5">
                <label className="mb-2 block text-sm text-slate-800 dark:text-slate-200">
                  {idLabel}
                </label>
                <input
                  type="text"
                  value={entity ? (entity as any)[idKey] : ""}
                  readOnly
                  className="bg-slate-200 dark:bg-slate-700 block placeholder:text-slate-400 text-slate-700 text-sm border border-slate-300 rounded-md px-3 py-2 w-full dark:text-slate-200 dark:border-slate-600"
                />
              </div>
              <div className="col-span-19">
                <label className="mb-2 block text-sm text-slate-800 dark:text-slate-200">
                  Nome *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-300 rounded-md px-3 py-2 w-full dark:text-slate-200 dark:border-slate-600"
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

function ModalExcluir<T extends BaseEntity>({
  open,
  onClose,
  entity,
  onSuccess,
  title,
  deleteUrl,
  idKey,
}: {
  open: boolean;
  onClose: () => void;
  entity: T | null;
  onSuccess: () => void;
  title: string;
  deleteUrl: string;
  idKey: keyof T;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!entity) return;
    try {
      setLoading(true);
      const resp = await fetch(deleteUrl, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [idKey as string]: (entity as any)[idKey] }),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || "Falha ao excluir.");
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
      className={`fixed inset-0 z-[30] grid h-screen w-screen place-items-center transition-opacity duration-300 ${
        open
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <div
        className="relative m-4 p-4 w-[520px] min-w-[320px] rounded-lg bg-white shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center pb-4 text-xl font-medium text-slate-800 dark:text-slate-200">
          {title}
        </div>
        <div className="p-4 text-sm text-slate-700 dark:text-slate-200">
          <p className="mb-2">
            Tem certeza de que deseja{" "}
            <span className="font-semibold">excluir</span>{" "}
            <span className="font-semibold">“{entity?.nome}”</span>?
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
   Seção genérica com DataTable + CRUD
   ========================= */
function SectionWithTable<T extends BaseEntity>({
  title,
  listUrl,
  createUrl,
  updateUrl,
  deleteUrl,
  idKey,
  idHeader,
}: {
  title: string;
  listUrl: string;
  createUrl: string;
  updateUrl: string;
  deleteUrl: string;
  idKey: keyof T;
  idHeader: string;
}) {
  const etagRef = useRef<string | null>(null);
  const lastDataRef = useRef<T[]>([]);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [search, setSearch] = useState("");
  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<T | null>(null);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("Ação realizada com sucesso.");

  const ack = (msg: string) => {
    setToastMsg(msg);
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 2500);
  };

  // polling com ETag
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const result = await fetchList<T>(
          listUrl,
          { page: 0, pageSize: 10, search, etagRef },
          [idKey, "nome" as keyof T]
        );
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
  }, [listUrl, search, idKey]);

  const onCreated = () => {
    setModalCreateOpen(false);
    setRefreshSignal((k) => k + 1);
    ack("Cadastro realizado com sucesso.");
  };
  const onUpdated = () => {
    setModalEditOpen(false);
    setRefreshSignal((k) => k + 1);
    ack("Registro atualizado com sucesso.");
  };
  const onDeleted = () => {
    setModalDeleteOpen(false);
    setSelected(null);
    setRefreshSignal((k) => k + 1);
    ack("Registro excluído com sucesso.");
  };

  const columns: ColumnDef<T>[] = [
    { accessorKey: idKey as string, header: idHeader },
    { accessorKey: "nome", header: "Nome" },
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
              setSelected(row.original);
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
              setSelected(row.original);
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
    <div className="flex-1 rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold dark:text-slate-200">{title}</h3>
        <button
          className="rounded-md bg-green-700 py-2 px-4 text-sm text-white shadow-md hover:bg-green-700 transition"
          type="button"
          onClick={() => setModalCreateOpen(true)}
        >
          Cadastrar
        </button>
      </div>

      <DataTable<T>
        columns={columns}
        fetchData={async (page, pageSize, s) => {
          const r = await fetchList<T>(
            listUrl,
            { page, pageSize, search: s, etagRef },
            [idKey, "nome" as keyof T]
          );
          if (!r.notModified) {
            // guarda último snapshot paginado (apenas para dif rápido)
            lastDataRef.current = r.data;
          }
          return r.notModified ? { data: [], total: 0 } : r;
        }}
        pageSize={10}
        search={search}
        setSearch={setSearch}
        refreshSignal={refreshSignal}
      />

      {/* Modais */}
      <ModalCadastrar
        open={modalCreateOpen}
        onClose={() => setModalCreateOpen(false)}
        onSuccess={onCreated}
        title={`Cadastrar ${title.slice(
          0,
          title.indexOf(" ") > -1 ? title.indexOf(" ") : undefined
        )}`}
        createUrl={createUrl}
      />
      <ModalEditar
        open={modalEditOpen}
        onClose={() => setModalEditOpen(false)}
        entity={selected}
        onSuccess={onUpdated}
        title={`Editar ${title.slice(
          0,
          title.indexOf(" ") > -1 ? title.indexOf(" ") : undefined
        )}`}
        idLabel="ID"
        updateUrl={updateUrl}
        idKey={idKey}
      />
      <ModalExcluir
        open={modalDeleteOpen}
        onClose={() => setModalDeleteOpen(false)}
        entity={selected}
        onSuccess={onDeleted}
        title={`Excluir ${title.slice(
          0,
          title.indexOf(" ") > -1 ? title.indexOf(" ") : undefined
        )}`}
        deleteUrl={deleteUrl}
        idKey={idKey}
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
   Página principal
   ========================= */
export default function Lente_Tipos() {
  return (
    <div>
      <PageMeta
        title="Configurações - Tipos de Lente"
        description="Gerencie índices e tratamentos de lentes."
      />
      <PageBreadcrumb
        items={[
          { label: "Home", to: "/" },
          { label: "Configurações", to: "/" },
          { label: "Tipos de Lente", to: "/configuracoes/lente_tipos" },
        ]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-4">
        {/* Esquerda: Índices */}
        <SectionWithTable<LenteIndice>
          title="Índices de Lente"
          listUrl="http://localhost:81/api/gets/get_lente_indices.php"
          createUrl="http://localhost:81/api/creates/create_lente_indice.php"
          updateUrl="http://localhost:81/api/updates/update_lente_indice.php"
          deleteUrl="http://localhost:81/api/deletes/delete_lente_indice.php"
          idKey={"id_indice_lente"}
          idHeader="#"
        />

        {/* Direita: Tratamentos */}
        <SectionWithTable<LenteTratamento>
          title="Tratamentos de Lente"
          listUrl="http://localhost:81/api/gets/get_lente_tratamentos.php"
          createUrl="http://localhost:81/api/creates/create_lente_tratamento.php"
          updateUrl="http://localhost:81/api/updates/update_lente_tratamento.php"
          deleteUrl="http://localhost:81/api/deletes/delete_lente_tratamento.php"
          idKey={"id_tratamento_lente"}
          idHeader="#"
        />
      </div>
    </div>
  );
}
