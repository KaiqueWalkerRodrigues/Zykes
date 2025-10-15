import React, { useEffect, useMemo, useRef, useState } from "react";
import DataTable from "../../../components/tables/table";
import { ColumnDef } from "@tanstack/react-table";
import { FaGear, FaTrash } from "react-icons/fa6";
import { ENDPOINTS } from "../../../lib/endpoints";

/* ========================
   Tipos
   ======================== */
type Indice = { id_indice_lente: number; nome: string };
type Tratamento = { id_tratamento_lente: number; nome: string };

type Lente = {
  id_lente: number;
  id_familia: number;
  id_indice: number;
  id_tratamento: number | null;
  valor_venda?: number | string | null;
  valor_compra?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
};

type LentesProps = {
  familiaId: number;
  familiaNome?: string;
};

function isSameData(a: Lente[], b: Lente[]): boolean {
  if (a.length !== b.length) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

/* ========================
   Funções Auxiliares (Helpers)
   ======================== */
function toNumber(v: unknown): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const cleaned = s.replace(/[^\d.,-]/g, "");
  const normalized = cleaned.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function fmtBRL(v: unknown): string {
  const n = toNumber(v);
  return n == null
    ? "—"
    : n.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
      });
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

function CurrencyInput({
  value,
  onChange,
  placeholder = "0,00",
}: {
  value: string | number | null | undefined;
  onChange: (raw: string) => void;
  placeholder?: string;
}) {
  const val = (value ?? "").toString();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d.,-]/g, "");
    onChange(raw);
  };

  const handleBlur = () => {
    const n = toNumber(val);
    if (n !== null)
      onChange(
        n.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
  };

  return (
    <input
      inputMode="decimal"
      placeholder={placeholder}
      value={val}
      onChange={handleChange}
      onBlur={handleBlur}
      className="bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-300 rounded-md px-3 py-2 w-full dark:text-slate-200 dark:border-slate-600"
    />
  );
}

/* ========================
   Função para buscar dados da API
   ======================== */
const fetchData = async (
  page: number,
  pageSize: number,
  search: string,
  familiaId: number,
  indiceMap: Map<number, string>,
  tratamentoMap: Map<number, string>,
  etagRef?: React.MutableRefObject<string | null>
) => {
  const headers: Record<string, string> = {};
  if (etagRef?.current) {
    headers["If-None-Match"] = etagRef.current;
  }

  const res = await fetch(ENDPOINTS.lentes.list + `?id_familia=${familiaId}`, {
    method: "GET",
    headers,
    cache: "no-cache",
  });

  if (res.status === 304) {
    return { data: null, total: null, notModified: true };
  }

  if (!res.ok) {
    throw new Error(`Erro ao buscar lentes: ${res.status}`);
  }

  const etag = res.headers.get("etag");
  if (etagRef && etag) etagRef.current = etag;

  const data: Lente[] = await res.json();

  let filtered = data;
  if (search) {
    const s = search.toLowerCase();
    filtered = data.filter((item: Lente) => {
      const nomeIndice = indiceMap.get(item.id_indice)?.toLowerCase() || "";
      const nomeTratamento =
        tratamentoMap.get(item.id_tratamento)?.toLowerCase() || "";
      return nomeIndice.includes(s) || nomeTratamento.includes(s);
    });
  }

  const total = filtered.length;
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
  return { data: paginated, total, notModified: false };
};

/* ========================
   Página Lentes
   ======================== */
export default function Lentes({ familiaId, familiaNome }: LentesProps) {
  const etagRef = useRef<string | null>(null);
  const lastDataRef = useRef<Lente[]>([]);

  const [refreshSignal, setRefreshSignal] = useState(0);
  const [search, setSearch] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Lente | null>(null);
  const [massEditOpen, setMassEditOpen] = useState(false);

  const [indices, setIndices] = useState<Indice[]>([]);
  const [tratamentos, setTratamentos] = useState<Tratamento[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

  useEffect(() => {
    async function fetchLookups() {
      try {
        setLoadingLookups(true);
        const [indicesRes, tratamentosRes] = await Promise.all([
          fetch(ENDPOINTS.lente_indices.list),
          fetch(ENDPOINTS.lente_tratamentos.list),
        ]);
        if (!indicesRes.ok || !tratamentosRes.ok)
          throw new Error("Falha ao carregar dados de suporte.");

        setIndices(await indicesRes.json());
        setTratamentos(await tratamentosRes.json());
      } catch (error) {
        console.error(error);
        alert("Não foi possível carregar os dados para os formulários.");
      } finally {
        setLoadingLookups(false);
      }
    }
    fetchLookups();
  }, []);

  const indiceMap = useMemo(
    () => new Map(indices.map((i) => [i.id_indice_lente, i.nome])),
    [indices]
  );
  const tratamentoMap = useMemo(
    () => new Map(tratamentos.map((t) => [t.id_tratamento_lente, t.nome])),
    [tratamentos]
  );

  useEffect(() => {
    // Inicia um intervalo que será executado periodicamente
    const interval = setInterval(async () => {
      try {
        // Busca os dados em segundo plano para verificar se há alterações.
        // Usamos a página 0 e um tamanho de página fixo apenas para a verificação.
        const result = await fetchData(
          0,
          10,
          search,
          familiaId,
          indiceMap,
          tratamentoMap,
          etagRef
        );

        // Se o servidor respondeu 304 (Not Modified), o ETag é o mesmo. Não fazemos nada.
        if (result?.notModified) {
          return;
        }

        // Se recebemos novos dados (resposta 200 OK), comparamos com os que já temos.
        if (result?.data && !isSameData(result.data, lastDataRef.current)) {
          // Se os dados são realmente diferentes, atualizamos nossa referência de dados
          // e disparamos o sinal para a DataTable se redesenhar.
          lastDataRef.current = result.data;
          setRefreshSignal((k) => k + 1);
        }
      } catch (e) {
        console.error("Erro no polling de Lentes:", e);
      }
    }, 7000); // Define o intervalo de verificação para 7 segundos.

    // Função de limpeza: É executada quando o componente é desmontado (modal fechado).
    // Ela para o "timer" para evitar consumo de recursos em segundo plano.
    return () => clearInterval(interval);
  }, [familiaId, search, indiceMap, tratamentoMap]); // Dependências do useEffect

  // Callbacks de sucesso
  const onCreated = () => {
    setCreateOpen(false);
    setToastMsg("Lente cadastrada com sucesso.");
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 2500);
    setRefreshSignal((prev) => prev + 1);
  };

  const onUpdated = () => {
    setEditOpen(false);
    setMassEditOpen(false);
    setToastMsg("Lente(s) atualizada(s) com sucesso.");
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 2500);
    setRefreshSignal((prev) => prev + 1);
  };

  const onDeleted = () => {
    setDeleteOpen(false);
    setSelected(null);
    setToastMsg("Lente excluída com sucesso.");
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 2500);
    setRefreshSignal((prev) => prev + 1);
  };

  const columns = useMemo<ColumnDef<Lente>[]>(
    () => [
      { accessorKey: "id_lente", header: "#" },
      {
        header: "Nome Composto",
        cell: ({ row }) => {
          const lente = row.original;
          const nomeIndice = indiceMap.get(lente.id_indice) ?? `?`;
          const nomeTratamento = lente.id_tratamento
            ? tratamentoMap.get(lente.id_tratamento) ?? `?`
            : "";
          return [familiaNome, nomeIndice, nomeTratamento]
            .filter(Boolean)
            .join(" ");
        },
      },
      {
        accessorKey: "valor_venda",
        header: "Venda",
        cell: ({ row }) => fmtBRL(row.original.valor_venda),
      },
      {
        accessorKey: "valor_compra",
        header: "Compra",
        cell: ({ row }) => fmtBRL(row.original.valor_compra),
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
              title="Editar Lente"
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
              title="Excluir Lente"
              type="button"
            >
              <FaTrash />
            </button>
          </div>
        ),
      },
    ],
    [familiaNome, indiceMap, tratamentoMap]
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="text-sm text-slate-500">
          Família:{" "}
          <span className="font-medium">{familiaNome ?? `#${familiaId}`}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 py-2 px-4 text-sm text-white shadow hover:bg-blue-700"
            onClick={() => setMassEditOpen(true)}
            type="button"
          >
            Editar em Massa
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-md bg-green-700 py-2 px-4 text-sm text-white shadow hover:bg-green-800"
            onClick={() => setCreateOpen(true)}
            type="button"
          >
            Cadastrar Lente
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-6 dark:border-gray-800 dark:bg-slate-900">
          <DataTable
            columns={columns}
            fetchData={async (page, pageSize, s) => {
              const r = await fetchData(
                page,
                pageSize,
                s,
                familiaId,
                indiceMap,
                tratamentoMap,
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

      <ModalCreateLente
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        familiaId={familiaId}
        indices={indices}
        tratamentos={tratamentos}
        loadingLookups={loadingLookups}
        onSuccess={onCreated}
      />
      <ModalEditLente
        open={editOpen}
        onClose={() => setEditOpen(false)}
        lente={selected}
        indices={indices}
        tratamentos={tratamentos}
        loadingLookups={loadingLookups}
        onSuccess={onUpdated}
      />
      <ModalMassEditLente
        open={massEditOpen}
        onClose={() => setMassEditOpen(false)}
        familiaId={familiaId}
        indices={indices}
        tratamentos={tratamentos}
        loadingLookups={loadingLookups}
        familiaNome={familiaNome}
        onSuccess={onUpdated}
      />
      <ModalDeleteLente
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        lente={selected}
        familiaNome={familiaNome}
        indiceMap={indiceMap}
        tratamentoMap={tratamentoMap}
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
   Modais de Lente
   ========================= */
type ModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  indices: Indice[];
  tratamentos: Tratamento[];
  loadingLookups: boolean;
};

function ModalCreateLente({
  open,
  onClose,
  familiaId,
  onSuccess,
  indices,
  tratamentos,
  loadingLookups,
}: ModalProps & { familiaId: number }) {
  const [form, setForm] = useState<Partial<Lente>>({});
  const [loading, setLoading] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open)
      setForm({
        id_indice: undefined,
        id_tratamento: undefined,
        valor_venda: "",
        valor_compra: "",
      });
    setTimeout(() => {
      if (firstInputRef.current) {
        firstInputRef.current.focus();
      }
    }, 100);
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id_indice) return alert("Selecione um Índice de Refração.");

    try {
      setLoading(true);
      const resp = await fetch(ENDPOINTS.lentes.create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_familia: familiaId,
          id_indice: form.id_indice,
          id_tratamento: form.id_tratamento,
          valor_venda: toNumber(form.valor_venda),
          valor_compra: toNumber(form.valor_compra),
        }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Falha ao cadastrar a lente.");
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
        <form onSubmit={submit}>
          <div className="pb-4 text-xl font-medium text-slate-800 dark:text-slate-200">
            Cadastrar Lente
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-2 text-sm text-slate-800 dark:text-slate-200">
                  Índice de Refração *
                </label>
                <select
                  ref={firstInputRef}
                  value={form.id_indice ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      id_indice: Number(e.target.value),
                    }))
                  }
                  required
                  disabled={loadingLookups}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-500/40"
                >
                  <option value="">
                    {loadingLookups ? "Carregando..." : "Selecione..."}
                  </option>
                  {indices.map((i) => (
                    <option key={i.id_indice_lente} value={i.id_indice_lente}>
                      {i.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 text-sm text-slate-800 dark:text-slate-200">
                  Tratamento *
                </label>
                <select
                  value={form.id_tratamento ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      id_tratamento: Number(e.target.value),
                    }))
                  }
                  disabled={loadingLookups}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-500/40"
                >
                  {loadingLookups
                    ? "<option value=''>Carregando...</option>"
                    : ""}
                  <option value="">Nenhum</option>
                  {tratamentos.map((t) => (
                    <option
                      key={t.id_tratamento_lente}
                      value={t.id_tratamento_lente}
                    >
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 text-sm text-slate-800 dark:text-slate-200">
                  Valor de Venda
                </label>
                <CurrencyInput
                  value={form.valor_venda}
                  onChange={(raw) =>
                    setForm((f) => ({ ...f, valor_venda: raw }))
                  }
                />
              </div>
              <div>
                <label className="mb-2 text-sm text-slate-800 dark:text-slate-200">
                  Valor de Compra
                </label>
                <CurrencyInput
                  value={form.valor_compra}
                  onChange={(raw) =>
                    setForm((f) => ({ ...f, valor_compra: raw }))
                  }
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

function ModalEditLente({
  open,
  onClose,
  lente,
  onSuccess,
  indices,
  tratamentos,
  loadingLookups,
}: ModalProps & { lente: Lente | null }) {
  const [form, setForm] = useState<Partial<Lente>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setForm(lente ?? {});
  }, [open, lente]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lente) return;
    if (!form.id_indice) return alert("Selecione um Índice de Refração.");
    if (!form.id_tratamento) return alert("Selecione um Tratamento.");

    try {
      setLoading(true);
      const resp = await fetch(ENDPOINTS.lentes.update, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_lente: lente.id_lente,
          id_indice: form.id_indice,
          id_tratamento: form.id_tratamento,
          valor_venda: toNumber(form.valor_venda),
          valor_compra: toNumber(form.valor_compra),
        }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Falha ao atualizar a lente.");
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
        <form onSubmit={submit}>
          <div className="pb-4 text-xl font-medium text-slate-800 dark:text-slate-200">
            Editar Lente (ID: {lente?.id_lente})
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-2 text-sm text-slate-800 dark:text-slate-200">
                  Índice de Refração *
                </label>
                <select
                  value={form.id_indice ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      id_indice: Number(e.target.value),
                    }))
                  }
                  required
                  disabled={loadingLookups}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-500/40"
                >
                  <option value="">
                    {loadingLookups ? "Carregando..." : "Selecione..."}
                  </option>
                  {indices.map((i) => (
                    <option key={i.id_indice_lente} value={i.id_indice_lente}>
                      {i.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 text-sm text-slate-800 dark:text-slate-200">
                  Tratamento *
                </label>
                <select
                  value={form.id_tratamento ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      id_tratamento: Number(e.target.value),
                    }))
                  }
                  required
                  disabled={loadingLookups}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-500/40"
                >
                  {loadingLookups
                    ? "<option value=''>Carregando...</option>"
                    : ""}
                  <option value="">Nenhum</option>
                  {tratamentos.map((t) => (
                    <option
                      key={t.id_tratamento_lente}
                      value={t.id_tratamento_lente}
                    >
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 text-sm text-slate-800 dark:text-slate-200">
                  Valor de Venda
                </label>
                <CurrencyInput
                  value={form.valor_venda}
                  onChange={(raw) =>
                    setForm((f) => ({ ...f, valor_venda: raw }))
                  }
                />
              </div>
              <div>
                <label className="mb-2 text-sm text-slate-800 dark:text-slate-200">
                  Valor de Compra
                </label>
                <CurrencyInput
                  value={form.valor_compra}
                  onChange={(raw) =>
                    setForm((f) => ({ ...f, valor_compra: raw }))
                  }
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
              className="rounded-md bg-blue-600 py-2 px-4 text-sm text-white shadow-md hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalDeleteLente({
  open,
  onClose,
  lente,
  onSuccess,
  familiaNome,
  indiceMap,
  tratamentoMap,
}: Omit<ModalProps, "indices" | "tratamentos" | "loadingLookups"> & {
  lente: Lente | null;
  familiaNome?: string;
  indiceMap: Map<number, string>;
  tratamentoMap: Map<number, string>;
}) {
  const [loading, setLoading] = useState(false);

  const doDelete = async () => {
    if (!lente) return;
    try {
      setLoading(true);
      const resp = await fetch(ENDPOINTS.lentes.delete, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_lente: lente.id_lente }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Falha ao excluir a lente.");
    } finally {
      setLoading(false);
    }
  };

  const nomeComposto = useMemo(() => {
    if (!lente) return "";
    const nomeIndice = indiceMap.get(lente.id_indice) ?? `?`;
    const nomeTratamento = tratamentoMap.get(lente.id_tratamento) ?? `?`;
    return `${familiaNome} ${nomeIndice} ${nomeTratamento}`;
  }, [lente, familiaNome, indiceMap, tratamentoMap]);

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
          Excluir Lente
        </div>
        <div className="p-4 text-sm text-slate-700 dark:text-slate-200">
          <p className="mb-2">
            Tem certeza de que deseja{" "}
            <span className="font-semibold">excluir</span> a lente
            <span className="font-semibold"> "{nomeComposto}"</span> (ID{" "}
            {lente?.id_lente})?
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

function ModalMassEditLente({
  open,
  onClose,
  onSuccess,
  familiaId,
  indices,
  tratamentos,
  loadingLookups,
  familiaNome,
}: ModalProps & {
  familiaId: number;
  familiaNome?: string;
}) {
  const [editableLenses, setEditableLenses] = useState<Lente[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLenses, setLoadingLenses] = useState(false);

  // Buscar lentes quando o modal abrir
  useEffect(() => {
    if (open) {
      setLoadingLenses(true);
      fetch(ENDPOINTS.lentes.list + `?id_familia=${familiaId}`)
        .then((res) => res.json())
        .then((data) => {
          setEditableLenses(JSON.parse(JSON.stringify(data)));
        })
        .catch((err) => {
          console.error("Erro ao carregar lentes:", err);
          alert("Não foi possível carregar as lentes.");
        })
        .finally(() => {
          setLoadingLenses(false);
        });
    }
  }, [open, familiaId]);

  const handleLenseChange = (
    id_lente: number,
    field: keyof Lente,
    value: string | number
  ) => {
    setEditableLenses((currentLenses) =>
      currentLenses.map((l) =>
        l.id_lente === id_lente ? { ...l, [field]: value } : l
      )
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = editableLenses.map((l) => ({
        ...l,
        valor_venda: toNumber(l.valor_venda),
        valor_compra: toNumber(l.valor_compra),
      }));

      const resp = await fetch(ENDPOINTS.lentes.update_massa, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.message || "Falha ao salvar as alterações.");
      }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[85] grid place-items-center transition-opacity ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative m-4 flex h-[90vh] w-[min(1000px,95vw)] flex-col rounded-lg bg-white shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={submit} className="flex flex-col h-full">
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="text-xl font-medium text-slate-800 dark:text-slate-200">
              Edição em Massa — {familiaNome}
            </h2>
            <p className="text-sm text-slate-500">
              Altere múltiplas lentes de uma vez.
            </p>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {loadingLenses ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-slate-500">Carregando lentes...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-y-4">
                {editableLenses.map((lente) => (
                  <div
                    key={lente.id_lente}
                    className="grid grid-cols-12 gap-x-3 gap-y-2 items-center p-3 rounded-md bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="col-span-12 md:col-span-4 font-bold text-sm dark:text-slate-50">
                      ID: {lente.id_lente}
                    </div>

                    <div className="col-span-6 md:col-span-2">
                      <label className="text-xs text-slate-500">Índice</label>
                      <select
                        value={lente.id_indice}
                        onChange={(e) =>
                          handleLenseChange(
                            lente.id_lente,
                            "id_indice",
                            Number(e.target.value)
                          )
                        }
                        disabled={loadingLookups}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-500/40"
                      >
                        {indices.map((i) => (
                          <option
                            key={i.id_indice_lente}
                            value={i.id_indice_lente}
                          >
                            {i.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-6 md:col-span-2">
                      <label className="text-xs text-slate-500">
                        Tratamento
                      </label>
                      <select
                        value={lente.id_tratamento}
                        onChange={(e) =>
                          handleLenseChange(
                            lente.id_lente,
                            "id_tratamento",
                            Number(e.target.value)
                          )
                        }
                        disabled={loadingLookups}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-500/40"
                      >
                        {tratamentos.map((t) => (
                          <option
                            key={t.id_tratamento_lente}
                            value={t.id_tratamento_lente}
                          >
                            {t.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-6 md:col-span-2">
                      <label className="text-xs text-slate-500">
                        Venda (R$)
                      </label>
                      <CurrencyInput
                        value={lente.valor_venda}
                        onChange={(raw) =>
                          handleLenseChange(lente.id_lente, "valor_venda", raw)
                        }
                      />
                    </div>

                    <div className="col-span-6 md:col-span-2">
                      <label className="text-xs text-slate-500">
                        Compra (R$)
                      </label>
                      <CurrencyInput
                        value={lente.valor_compra}
                        onChange={(raw) =>
                          handleLenseChange(lente.id_lente, "valor_compra", raw)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 p-4 border-t dark:border-gray-700">
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
              disabled={loading || loadingLenses}
              className="rounded-md bg-blue-600 py-2 px-4 text-sm text-white shadow-md hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Salvar Todas as Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
