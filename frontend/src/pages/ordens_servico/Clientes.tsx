import { ColumnDef } from "@tanstack/react-table";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaGear, FaTrash } from "react-icons/fa6";
import DataTable from "../../components/tables/table";
import { ENDPOINTS } from "../../lib/endpoints";

/* ========================
    Tipos
    ======================== */
type Cliente = {
  id_cliente: number;
  nome: string;
  cpf: string;
  data_nascimento?: string | null;
  contato?: string | null;
  sexo?: "M" | "F" | "" | null;
  cep?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  numero?: string | null;
  acoes?: string;
};

/* ========================
    Funções Auxiliares (Helpers)
    ======================== */
function onlyDigits(v: string) {
  return (v || "").replace(/\D+/g, "");
}

function maskCPF(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function isValidCPF(v: string) {
  return onlyDigits(v).length === 11;
}

function isSameData(a: Cliente[], b: Cliente[]): boolean {
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

  const res = await fetch(ENDPOINTS.clientes.list, {
    method: "GET",
    headers,
    cache: "no-cache",
  });

  if (res.status === 304) {
    return { data: null, total: null, notModified: true as const };
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Erro ao buscar clientes: ${res.status} ${txt}`);
  }

  const etag = res.headers.get("etag");
  if (etagRef && etag) etagRef.current = etag;

  const raw = await res.json().catch(() => []);
  const data: Cliente[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
    ? raw.data
    : [];

  let filtered = data;
  if (search) {
    const s = search.toLowerCase();
    filtered = data.filter((item) =>
      [
        String(item.nome ?? "").toLowerCase(),
        String(item.cpf ?? "").toLowerCase(),
        String(item.id_cliente ?? "").toLowerCase(),
      ].some((v) => v.includes(s))
    );
  }

  const total = filtered.length;
  const start = page * pageSize;
  const end = start + pageSize;
  const paginated = filtered.slice(start, end);

  return { data: paginated, total, notModified: false as const };
};

/* ========================
    Página Clientes
    ======================== */
export default function Clientes() {
  const etagRef = useRef<string | null>(null);
  const lastDataRef = useRef<Cliente[]>([]);

  const [refreshSignal, setRefreshSignal] = useState(0);
  const [search, setSearch] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Cliente | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const result = await fetchData(0, 9999, "", etagRef);
        if (result?.notModified) return;

        if (result?.data) {
          if (!isSameData(result.data, lastDataRef.current)) {
            lastDataRef.current = result.data;
            setRefreshSignal((k) => k + 1);
          }
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const onCreated = () => {
    setCreateOpen(false);
    setToastMsg("Cliente cadastrado com sucesso.");
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 2500);
    setRefreshSignal((prev) => prev + 1);
  };

  const onUpdated = () => {
    setEditOpen(false);
    setToastMsg("Cliente atualizado com sucesso.");
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 2500);
    setRefreshSignal((prev) => prev + 1);
  };

  const onDeleted = () => {
    setDeleteOpen(false);
    setSelected(null);
    setToastMsg("Cliente excluído com sucesso.");
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 2500);
    setRefreshSignal((prev) => prev + 1);
  };

  const columns = useMemo<ColumnDef<Cliente>[]>(
    () => [
      { accessorKey: "id_cliente", header: "#" },
      { accessorKey: "nome", header: "Nome" },
      {
        accessorKey: "cpf",
        header: "CPF",
        cell: ({ getValue }) => {
          const v = String(getValue() ?? "");
          return <span className="font-mono">{maskCPF(v)}</span>;
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
              title="Editar Cliente"
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
              title="Excluir Cliente"
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
        <div className="text-sm text-slate-500">Gerenciamento de Clientes</div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-md bg-green-700 py-2 px-4 text-sm text-white shadow hover:bg-green-800"
            onClick={() => setCreateOpen(true)}
            type="button"
          >
            Cadastrar Cliente
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

      <ModalCreateCliente
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={onCreated}
      />
      <ModalEditCliente
        open={editOpen}
        onClose={() => setEditOpen(false)}
        cliente={selected}
        onSuccess={onUpdated}
      />
      <ModalDeleteCliente
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        cliente={selected}
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
    Modais de Cliente
    ========================= */
type ModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const initialFormState = {
  nome: "",
  cpf: "",
  data_nascimento: "",
  contato: "",
  sexo: "",
  cep: "",
  endereco: "",
  bairro: "",
  cidade: "",
  uf: "",
  numero: "",
};

// Hook customizado para busca de CEP
const useCepApi = (setForm: React.Dispatch<React.SetStateAction<any>>) => {
  const [cepLoading, setCepLoading] = useState(false);

  const handleCepBlur = async (cep: string) => {
    const cepDigits = onlyDigits(cep);
    if (cepDigits.length !== 8) return;

    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      if (!res.ok) throw new Error("CEP não encontrado.");
      const data = await res.json();
      if (data.erro) throw new Error("CEP inválido.");

      setForm((prev: any) => ({
        ...prev,
        endereco: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        uf: data.uf || "",
      }));
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setCepLoading(false);
    }
  };

  return { cepLoading, handleCepBlur };
};

function ModalCreateCliente({ open, onClose, onSuccess }: ModalProps) {
  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const { cepLoading, handleCepBlur } = useCepApi(setForm);

  useEffect(() => {
    if (open) {
      setForm(initialFormState);
      setLoading(false);
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === "cpf") finalValue = maskCPF(value);
    setForm((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nome.trim() || !form.data_nascimento || !form.contato.trim()) {
      return alert("Por favor, preencha todos os campos obrigatórios (*).");
    }
    if (form.cpf && !isValidCPF(form.cpf)) {
      return alert("CPF inválido (precisa ter 11 dígitos).");
    }

    const payload = { ...form, cpf: onlyDigits(form.cpf) };

    try {
      setLoading(true);
      const resp = await fetch(ENDPOINTS.clientes.create, {
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
      alert("Não foi possível cadastrar o cliente.");
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
        className="relative m-4 p-6 w-[min(800px,95vw)] rounded-lg bg-white shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="pb-4 text-xl font-medium text-slate-800 dark:text-slate-200">
            Cadastrar Cliente
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4">
            {/* Linha 1 */}
            <div className="md:col-span-4">
              <label className="text-sm dark:text-slate-200">
                Nome Completo *
              </label>
              <input
                ref={firstInputRef}
                name="nome"
                value={form.nome}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded-md dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
              />
            </div>
            {/* Linha 2 */}
            <div className="md:col-span-1">
              <label className="text-sm dark:text-slate-200">CPF</label>
              <input
                name="cpf"
                value={form.cpf}
                onChange={handleChange}
                placeholder="000.000.000-00"
                className="w-full p-2 border rounded-md dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-sm dark:text-slate-200">
                Data de Nascimento *
              </label>
              <input
                type="date"
                name="data_nascimento"
                value={form.data_nascimento}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded-md dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-sm dark:text-slate-200">Sexo</label>
              <select
                name="sexo"
                value={form.sexo}
                onChange={handleChange}
                className="w-full p-2 border rounded-md dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
              >
                <option value="">Selecione...</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="text-sm dark:text-slate-200">
                Contato (Celular) *
              </label>
              <input
                name="contato"
                value={form.contato}
                onChange={handleChange}
                required
                placeholder="(11) 9..."
                className="w-full p-2 border rounded-md dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
              />
            </div>
            {/* Linha 3 - Endereço */}
            <div className="md:col-span-1">
              <label className="text-sm dark:text-slate-200">CEP</label>
              <input
                name="cep"
                value={form.cep}
                onChange={handleChange}
                onBlur={(e) => handleCepBlur(e.target.value)}
                placeholder="00000-000"
                className="w-full p-2 border rounded-md dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
              />
              {cepLoading && (
                <small className="text-xs text-blue-500">Buscando...</small>
              )}
            </div>
            <div className="md:col-span-3">
              <label className="text-sm dark:text-slate-200">
                Endereço (Rua, Av.)
              </label>
              <input
                name="endereco"
                value={form.endereco}
                onChange={handleChange}
                className="w-full p-2 border rounded-md dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
              />
            </div>
            {/* Linha 4 - Endereço */}
            <div className="md:col-span-1">
              <label className="text-sm dark:text-slate-200">Número</label>
              <input
                name="numero"
                value={form.numero}
                onChange={handleChange}
                className="w-full p-2 border rounded-md dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-sm dark:text-slate-200">Bairro</label>
              <input
                name="bairro"
                value={form.bairro}
                onChange={handleChange}
                className="w-full p-2 border rounded-md dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-sm dark:text-slate-200">Cidade</label>
              <input
                name="cidade"
                value={form.cidade}
                onChange={handleChange}
                className="w-full p-2 border rounded-md dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-sm dark:text-slate-200">UF</label>
              <input
                name="uf"
                value={form.uf}
                onChange={handleChange}
                maxLength={2}
                className="w-full p-2 border rounded-md dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
              />
            </div>
          </div>
          <hr className="mt-3 dark:border-gray-700" />
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-700 dark:text-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || cepLoading}
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

function ModalEditCliente({
  open,
  onClose,
  cliente,
  onSuccess,
}: ModalProps & { cliente: Cliente | null }) {
  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const { cepLoading, handleCepBlur } = useCepApi(setForm);

  useEffect(() => {
    if (cliente && open) {
      setForm({
        nome: cliente.nome || "",
        cpf: maskCPF(cliente.cpf || ""),
        data_nascimento: cliente.data_nascimento?.split(" ")[0] || "", // Formato YYYY-MM-DD
        contato: cliente.contato || "",
        sexo: cliente.sexo || "",
        cep: cliente.cep || "",
        endereco: cliente.endereco || "",
        bairro: cliente.bairro || "",
        cidade: cliente.cidade || "",
        uf: cliente.uf || "",
        numero: cliente.numero || "",
      });
    }
  }, [cliente, open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === "cpf") finalValue = maskCPF(value);
    setForm((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;

    if (!form.nome.trim() || !form.data_nascimento || !form.contato.trim()) {
      return alert("Por favor, preencha todos os campos obrigatórios (*).");
    }
    if (form.cpf && !isValidCPF(form.cpf)) {
      return alert("CPF inválido (precisa ter 11 dígitos).");
    }

    const payload = {
      ...form,
      id_cliente: cliente.id_cliente,
      cpf: onlyDigits(form.cpf),
    };

    try {
      setLoading(true);
      const resp = await fetch(ENDPOINTS.clientes.update, {
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
      alert("Não foi possível atualizar o cliente.");
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
        className="relative m-4 p-6 w-[min(800px,95vw)] rounded-lg bg-white shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="pb-4 text-xl font-medium text-slate-800 dark:text-slate-200">
            Editar Cliente ({cliente?.nome})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4">
            {/* Linha 1 */}
            <div className="md:col-span-4">
              <label className="text-sm dark:text-slate-200">
                Nome Completo *
              </label>
              <input
                name="nome"
                value={form.nome}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded-md dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
              />
            </div>
            {/* Linha 2 */}
            <div className="md:col-span-1">
              <label className="text-sm dark:text-slate-200">CPF</label>
              <input
                name="cpf"
                value={form.cpf}
                onChange={handleChange}
                placeholder="000.000.000-00"
                className="w-full p-2 border rounded-md dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-sm dark:text-slate-200">
                Data de Nascimento *
              </label>
              <input
                type="date"
                name="data_nascimento"
                value={form.data_nascimento}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded-md dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-sm dark:text-slate-200">Sexo</label>
              <select
                name="sexo"
                value={form.sexo}
                onChange={handleChange}
                className="w-full p-2 border rounded-md dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
              >
                <option value="">Selecione...</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="text-sm dark:text-slate-200">
                Contato (Celular) *
              </label>
              <input
                name="contato"
                value={form.contato}
                onChange={handleChange}
                required
                placeholder="(11) 9..."
                className="w-full p-2 border rounded-md dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
              />
            </div>
            {/* Linha 3 - Endereço */}
            <div className="md:col-span-1">
              <label className="text-sm dark:text-slate-200">CEP</label>
              <input
                name="cep"
                value={form.cep}
                onChange={handleChange}
                onBlur={(e) => handleCepBlur(e.target.value)}
                placeholder="00000-000"
                className="w-full p-2 border rounded-md dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
              />
              {cepLoading && (
                <small className="text-xs text-blue-500">Buscando...</small>
              )}
            </div>
            <div className="md:col-span-3">
              <label className="text-sm dark:text-slate-200">
                Endereço (Rua, Av.)
              </label>
              <input
                name="endereco"
                value={form.endereco}
                onChange={handleChange}
                className="w-full p-2 border rounded-md dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
              />
            </div>
            {/* Linha 4 - Endereço */}
            <div className="md:col-span-1">
              <label className="text-sm dark:text-slate-200">Número</label>
              <input
                name="numero"
                value={form.numero}
                onChange={handleChange}
                className="w-full p-2 border rounded-md dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-sm dark:text-slate-200">Bairro</label>
              <input
                name="bairro"
                value={form.bairro}
                onChange={handleChange}
                className="w-full p-2 border rounded-md dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-sm dark:text-slate-200">Cidade</label>
              <input
                name="cidade"
                value={form.cidade}
                onChange={handleChange}
                className="w-full p-2 border rounded-md dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-sm dark:text-slate-200">UF</label>
              <input
                name="uf"
                value={form.uf}
                onChange={handleChange}
                maxLength={2}
                className="w-full p-2 border rounded-md dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600"
              />
            </div>
          </div>
          <hr className="mt-3 dark:border-gray-700" />
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-700 dark:text-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || cepLoading}
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

function ModalDeleteCliente({
  open,
  onClose,
  cliente,
  onSuccess,
}: ModalProps & { cliente: Cliente | null }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!cliente) return;

    try {
      setLoading(true);
      const resp = await fetch(ENDPOINTS.clientes.delete, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_cliente: cliente.id_cliente }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || "Falha ao excluir.");
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Não foi possível excluir o cliente.");
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
          Excluir Cliente
        </div>
        <div className="p-4 text-sm text-slate-700 dark:text-slate-200">
          <p className="mb-2">
            Tem certeza de que deseja{" "}
            <span className="font-semibold">excluir</span> o cliente{" "}
            <span className="font-semibold">"{cliente?.nome}"</span> (ID{" "}
            {cliente?.id_cliente})?
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
            className="px-4 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-700 dark:text-slate-200"
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
