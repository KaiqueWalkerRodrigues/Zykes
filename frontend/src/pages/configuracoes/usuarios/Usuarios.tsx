import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import DataTable from "../../../components/tables/table";
import { ColumnDef } from "@tanstack/react-table";
import { FaGear, FaTrash } from "react-icons/fa6";
import React, { useRef, useEffect, useState } from "react";

// Lazy loading para componentes de gerenciamento
const Cargos = React.lazy(() => import("./Cargos"));
const Setores = React.lazy(() => import("./Setores"));
const Empresas = React.lazy(() => import("./Empresas"));

// --- INÍCIO: Definição de Tipos ---
type Cargo = { id_cargo: number; nome: string };
type Setor = { id_setor: number; nome: string };
type Empresa = { id_empresa: number; nome: string };

type Usuario = {
  id_usuario: number;
  ativo: 0 | 1;
  nome: string;
  usuario: string;
  cargos: Cargo[];
  setores: Setor[];
  empresas: Empresa[];
  acoes?: string;
};
// --- FIM: Definição de Tipos ---

function isSameData(a: Usuario[], b: Usuario[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id_usuario !== b[i].id_usuario) return false;
  }
  return true;
}

// --- INÍCIO: Funções de API ---
const fetchData = async (
  page: number,
  pageSize: number,
  search: string,
  etagRef?: React.MutableRefObject<string | null>,
  signal?: AbortSignal
) => {
  const headers: Record<string, string> = {};
  if (etagRef?.current) {
    headers["If-None-Match"] = etagRef.current;
  }

  const res = await fetch("http://localhost:81/api/gets/get_usuarios.php", {
    method: "GET",
    headers,
    cache: "no-cache",
    signal,
  });

  if (res.status === 304) {
    return { data: null, total: null, notModified: true };
  }

  if (!res.ok) {
    throw new Error(`Erro ao buscar usuários: ${res.status}`);
  }

  const etag = res.headers.get("etag");
  if (etagRef && etag) etagRef.current = etag;

  const data = await res.json();

  let filtered = data;
  if (search) {
    const s = search.toLowerCase();
    filtered = data.filter(
      (item: Usuario) =>
        String(item.nome || "")
          .toLowerCase()
          .includes(s) ||
        String(item.usuario || "")
          .toLowerCase()
          .includes(s)
    );
  }

  const total = filtered.length;
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
  return { data: paginated, total, notModified: false };
};

async function getRelatedData<T>(endpoint: string): Promise<T[]> {
  const res = await fetch(`http://localhost:81/api/gets/${endpoint}.php`, {
    method: "GET",
    cache: "no-cache",
  });
  if (!res.ok) {
    throw new Error(`Erro ao buscar dados de ${endpoint}: ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

const getCargos = () => getRelatedData<Cargo>("get_cargos");
const getSetores = () => getRelatedData<Setor>("get_setores");
const getEmpresas = () => getRelatedData<Empresa>("get_empresas");

// --- FIM: Funções de API ---

function isAbortError(err: unknown): boolean {
  if (err instanceof DOMException) return err.name === "AbortError";
  if (err instanceof Error) return err.name === "AbortError";
  return false;
}

// --- INÍCIO: Componente Principal ---
export default function Usuarios() {
  const etagRef = useRef<string | null>(null);
  const lastDataRef = useRef<Usuario[]>([]);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [cargosOpen, setCargosOpen] = useState(false);
  const [setoresOpen, setSetoresOpen] = useState(false);
  const [empresasOpen, setEmpresasOpen] = useState(false);

  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    if (!toastOpen) return;
    const t = setTimeout(() => setToastOpen(false), 3000);
    return () => clearTimeout(t);
  }, [toastOpen]);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const tick = async () => {
      try {
        const result = await fetchData(
          0,
          10,
          search,
          etagRef,
          controller.signal
        );
        if (!mounted) return;
        if (
          !result?.notModified &&
          result?.data &&
          !isSameData(result.data, lastDataRef.current)
        ) {
          lastDataRef.current = result.data;
          setRefreshSignal((k) => k + 1);
        }
      } catch (e: unknown) {
        if (!isAbortError(e)) console.error("Falha no polling:", e); // ✅ sem any
      }
    };

    const interval = setInterval(tick, 5000);
    tick();

    return () => {
      mounted = false;
      controller.abort();
      clearInterval(interval);
    };
  }, [search]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 3000);
  };

  const handleCreateSuccess = () => {
    setCreateOpen(false);
    setRefreshSignal((prev) => prev + 1);
    showToast("Usuário cadastrado com sucesso.");
  };

  const handleDeleteSuccess = () => {
    setDeleteOpen(false);
    setSelectedUsuario(null);
    setRefreshSignal((prev) => prev + 1);
    showToast("Usuário excluído com sucesso.");
  };

  const handleUpdateSuccess = () => {
    setEditOpen(false);
    setSelectedUsuario(null);
    setRefreshSignal((prev) => prev + 1);
    showToast("Usuário atualizado com sucesso.");
  };

  const columns = React.useMemo<ColumnDef<Usuario>[]>(
    () => [
      { accessorKey: "id_usuario", header: "#" },
      { accessorKey: "nome", header: "Nome" },
      { accessorKey: "usuario", header: "Usuário" },
      {
        accessorKey: "ativo",
        header: "Status",
        cell: ({ row }) =>
          row.original.ativo ? (
            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
              Ativo
            </span>
          ) : (
            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
              Inativo
            </span>
          ),
      },
      {
        header: "Cargos",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.cargos.map((c) => (
              <span
                key={c.id_cargo}
                className="text-xs bg-slate-200 dark:bg-slate-700 rounded px-1.5 py-0.5"
              >
                {c.nome}
              </span>
            ))}
          </div>
        ),
      },
      {
        header: "Setores",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.setores.map((s) => (
              <span
                key={s.id_setor}
                className="text-xs bg-blue-100 dark:bg-blue-900 rounded px-1.5 py-0.5"
              >
                {s.nome}
              </span>
            ))}
          </div>
        ),
      },
      {
        header: "Empresas",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.empresas.map((e) => (
              <span
                key={e.id_empresa}
                className="text-xs bg-purple-100 dark:bg-purple-900 rounded px-1.5 py-0.5"
              >
                {e.nome}
              </span>
            ))}
          </div>
        ),
      },
      {
        accessorKey: "acoes",
        header: "Ações",
        cell: ({ row }) => (
          <div className="flex flex-row">
            <button
              className="rounded-md rounded-r-none bg-slate-600 py-2 px-4 border-r border-slate-700 text-sm text-white"
              type="button"
              title="Editar Usuário"
              onClick={() => {
                setSelectedUsuario(row.original);
                setEditOpen(true);
              }}
            >
              <FaGear />
            </button>
            <button
              className="rounded-md rounded-l-none bg-red-600 py-2 px-4 text-sm text-white"
              type="button"
              title="Excluir Usuário"
              onClick={() => {
                setSelectedUsuario(row.original);
                setDeleteOpen(true);
              }}
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
    <div>
      <PageMeta title="Gerenciamento de Usuários" description="..." />
      <PageBreadcrumb
        items={[
          { label: "Home", to: "/" },
          { label: "Configurações", to: "/" },
          { label: "Usuários", to: "/configuracoes/usuarios" },
        ]}
      />
      <div className="flex justify-end gap-2 mb-4">
        <button
          className="rounded-md bg-slate-600 py-2 px-4 text-sm text-white shadow-md hover:bg-slate-700 transition"
          type="button"
          onClick={() => setCargosOpen(true)}
        >
          Gerenciar Cargos
        </button>
        <button
          className="rounded-md bg-slate-600 py-2 px-4 text-sm text-white shadow-md hover:bg-slate-700 transition"
          type="button"
          onClick={() => setSetoresOpen(true)}
        >
          Gerenciar Setores
        </button>
        <button
          className="rounded-md bg-slate-600 py-2 px-4 text-sm text-white shadow-md hover:bg-slate-700 transition"
          type="button"
          onClick={() => setEmpresasOpen(true)}
        >
          Gerenciar Empresas
        </button>
        <button
          className="rounded-md bg-green-700 py-2 px-4 text-sm text-white shadow-md hover:bg-green-800 transition flex items-center gap-2"
          type="button"
          onClick={() => setCreateOpen(true)}
        >
          Cadastrar Usuário
        </button>
      </div>
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <DataTable
          columns={columns}
          fetchData={async (page, pageSize, s) => {
            const r = await fetchData(page, pageSize, s, etagRef);
            if (r?.notModified) {
              return {
                data: lastDataRef.current,
                total: lastDataRef.current.length,
              };
            }
            if (r?.data) {
              lastDataRef.current = r.data;
              return r;
            }
            return { data: [], total: 0 };
          }}
          pageSize={10}
          search={search}
          setSearch={setSearch}
          refreshSignal={refreshSignal}
        />
      </div>

      {/* --- Modais --- */}
      <ModalCadastrarUsuario
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />
      <ModalEditarUsuario
        open={editOpen}
        onClose={() => setEditOpen(false)}
        usuario={selectedUsuario}
        onSuccess={handleUpdateSuccess}
      />
      <ModalExcluirUsuario
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        usuario={selectedUsuario}
        onSuccess={handleDeleteSuccess}
      />

      {/* Modais de Gerenciamento */}
      <ManagementModal
        title="Gerenciar Cargos"
        open={cargosOpen}
        onClose={() => setCargosOpen(false)}
      >
        <Cargos />
      </ManagementModal>
      <ManagementModal
        title="Gerenciar Setores"
        open={setoresOpen}
        onClose={() => setSetoresOpen(false)}
      >
        <Setores />
      </ManagementModal>
      <ManagementModal
        title="Gerenciar Empresas"
        open={empresasOpen}
        onClose={() => setEmpresasOpen(false)}
      >
        <Empresas />
      </ManagementModal>

      <ToastSuccess
        open={toastOpen}
        message={toastMsg}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
}
// --- FIM: Componente Principal ---

// --- INÍCIO: Componentes de Modal ---

function ManagementModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`fixed inset-0 z-[70] ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      } transition-opacity duration-300`}
      aria-hidden={!open}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative mx-auto my-4 h-[calc(100vh-2rem)] w-[min(1200px,95vw)] rounded-2xl bg-white shadow-xl dark:bg-slate-900 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md border dark:text-slate-200 border-slate-200 dark:border-slate-700 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Fechar
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <React.Suspense
            fallback={
              <div className="h-full grid place-items-center text-slate-500">
                Carregando...
              </div>
            }
          >
            {children}
          </React.Suspense>
        </div>
      </div>
    </div>
  );
}

type ModalCadastrarUsuarioProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

function ModalCadastrarUsuario({
  open,
  onClose,
  onSuccess,
}: ModalCadastrarUsuarioProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    usuario: "",
    senha: "",
    ativo: 1,
    cargos: [] as number[],
    setores: [] as number[],
    empresas: [] as number[],
  });

  const [allCargos, setAllCargos] = useState<Cargo[]>([]);
  const [allSetores, setAllSetores] = useState<Setor[]>([]);
  const [allEmpresas, setAllEmpresas] = useState<Empresa[]>([]);

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setFormData({
        nome: "",
        usuario: "",
        senha: "",
        ativo: 1,
        cargos: [],
        setores: [],
        empresas: [],
      });

      Promise.all([getCargos(), getSetores(), getEmpresas()])
        .then(([cargos, setores, empresas]) => {
          setAllCargos(cargos);
          setAllSetores(setores);
          setAllEmpresas(empresas);
        })
        .catch((e) => {
          console.error("Erro ao carregar dados para o modal:", e);
          alert(
            "Não foi possível carregar os dados necessários para o cadastro."
          );
        });

      setTimeout(() => {
        if (firstInputRef.current) {
          firstInputRef.current.focus();
        }
      }, 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const handleMultiCheckboxChange = (
    category: "cargos" | "setores" | "empresas",
    id: number
  ) => {
    setFormData((prev) => {
      const currentList = prev[category];
      const newList = currentList.includes(id)
        ? currentList.filter((itemId) => itemId !== id)
        : [...currentList, id];
      return { ...prev, [category]: newList };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.nome || !formData.usuario || !formData.senha) {
      alert(
        "Por favor, preencha todos os campos obrigatórios: Nome, Usuário e Senha."
      );
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(
        "http://localhost:81/api/creates/create_usuario.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(`Falha ao cadastrar: ${errorData}`);
      }
      onSuccess();
    } catch (error) {
      console.error("Erro ao enviar o formulário:", error);
      alert(`Não foi possível cadastrar o usuário. ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-500/40";
  const checkboxClasses =
    "h-4 w-4 rounded border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-900 focus:ring-2";

  return (
    <div
      className={`fixed inset-0 z-[80] grid place-items-center transition-opacity duration-300 ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative m-4 p-6 w-3/5 min-w-[300px] max-w-4xl rounded-lg bg-white shadow-xl dark:bg-slate-900 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-6">
          Cadastrar Novo Usuário
        </h2>
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto -mr-2 pr-4 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nome *
              </label>
              <input
                ref={firstInputRef}
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                required
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Usuário *
              </label>
              <input
                type="text"
                name="usuario"
                value={formData.usuario}
                onChange={handleInputChange}
                required
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Senha *
              </label>
              <input
                type="password"
                name="senha"
                value={formData.senha}
                onChange={handleInputChange}
                required
                className={inputClasses}
              />
            </div>
            <div className="flex items-center self-end mb-1">
              <input
                type="checkbox"
                name="ativo"
                id="ativo-create"
                checked={formData.ativo === 1}
                onChange={handleInputChange}
                className={checkboxClasses}
              />
              <label
                htmlFor="ativo-create"
                className="ml-2 block text-sm text-slate-900 dark:text-slate-200"
              >
                Usuário Ativo
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2 text-slate-800 dark:text-slate-200">
                Cargos
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto p-3 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50/50 dark:bg-slate-800/50">
                {allCargos.map((cargo) => (
                  <div key={cargo.id_cargo} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`cargo-${cargo.id_cargo}`}
                      checked={formData.cargos.includes(cargo.id_cargo)}
                      onChange={() =>
                        handleMultiCheckboxChange("cargos", cargo.id_cargo)
                      }
                      className={checkboxClasses}
                    />
                    <label
                      htmlFor={`cargo-${cargo.id_cargo}`}
                      className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      {cargo.nome}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-slate-800 dark:text-slate-200">
                Setores
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto p-3 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50/50 dark:bg-slate-800/50">
                {allSetores.map((setor) => (
                  <div key={setor.id_setor} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`setor-${setor.id_setor}`}
                      checked={formData.setores.includes(setor.id_setor)}
                      onChange={() =>
                        handleMultiCheckboxChange("setores", setor.id_setor)
                      }
                      className={checkboxClasses}
                    />
                    <label
                      htmlFor={`setor-${setor.id_setor}`}
                      className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      {setor.nome}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-slate-800 dark:text-slate-200">
                Empresas
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto p-3 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50/50 dark:bg-slate-800/50">
                {allEmpresas.map((empresa) => (
                  <div key={empresa.id_empresa} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`empresa-${empresa.id_empresa}`}
                      checked={formData.empresas.includes(empresa.id_empresa)}
                      onChange={() =>
                        handleMultiCheckboxChange(
                          "empresas",
                          empresa.id_empresa
                        )
                      }
                      className={checkboxClasses}
                    />
                    <label
                      htmlFor={`empresa-${empresa.id_empresa}`}
                      className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      {empresa.nome}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:ring-offset-slate-900 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center rounded-md border border-transparent bg-green-700 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:ring-offset-slate-900 disabled:opacity-50"
            >
              {loading ? "Cadastrando..." : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type ModalEditarUsuarioProps = {
  open: boolean;
  onClose: () => void;
  usuario: Usuario | null;
  onSuccess: () => void;
};

function ModalEditarUsuario({
  open,
  onClose,
  usuario,
  onSuccess,
}: ModalEditarUsuarioProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id_usuario: 0,
    nome: "",
    usuario: "",
    senha: "",
    ativo: 1,
    cargos: [] as number[],
    setores: [] as number[],
    empresas: [] as number[],
  });

  const [allCargos, setAllCargos] = useState<Cargo[]>([]);
  const [allSetores, setAllSetores] = useState<Setor[]>([]);
  const [allEmpresas, setAllEmpresas] = useState<Empresa[]>([]);

  useEffect(() => {
    if (open && usuario) {
      // CORREÇÃO: Garantir que todos os IDs sejam números
      setFormData({
        id_usuario: usuario.id_usuario,
        nome: usuario.nome,
        usuario: usuario.usuario,
        senha: "",
        ativo: usuario.ativo,
        cargos: usuario.cargos.map((c) => Number(c.id_cargo)),
        setores: usuario.setores.map((s) => Number(s.id_setor)),
        empresas: usuario.empresas.map((e) => Number(e.id_empresa)),
      });

      Promise.all([getCargos(), getSetores(), getEmpresas()])
        .then(([cargos, setores, empresas]) => {
          setAllCargos(cargos);
          setAllSetores(setores);
          setAllEmpresas(empresas);
        })
        .catch((e) => {
          console.error("Erro ao carregar dados para o modal:", e);
          alert(
            "Não foi possível carregar os dados necessários para a edição."
          );
        });
    }
  }, [open, usuario]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const handleMultiCheckboxChange = (
    category: "cargos" | "setores" | "empresas",
    id: number
  ) => {
    setFormData((prev) => {
      const currentList = prev[category];
      const newList = currentList.includes(id)
        ? currentList.filter((itemId) => itemId !== id)
        : [...currentList, id];
      return { ...prev, [category]: newList };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.nome || !formData.usuario) {
      alert("Os campos Nome e Usuário são obrigatórios.");
      return;
    }
    try {
      setLoading(true);
      const { senha, ...rest } = formData;
      const payload = senha ? { ...rest, senha } : rest;

      const res = await fetch(
        "http://localhost:81/api/updates/update_usuario.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(`Falha ao atualizar: ${errorData}`);
      }
      onSuccess();
    } catch (error) {
      console.error("Erro ao enviar o formulário:", error);
      alert(`Não foi possível atualizar o usuário. ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-500/40";
  const checkboxClasses =
    "h-4 w-4 rounded border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-900 focus:ring-2";

  return (
    <div
      className={`fixed inset-0 z-[80] grid place-items-center transition-opacity duration-300 ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative m-4 p-6 w-3/5 min-w-[300px] max-w-4xl rounded-lg bg-white shadow-xl dark:bg-slate-900 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-6">
          Editar Usuário: {usuario?.nome}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto -mr-2 pr-4 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nome *
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                required
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Usuário *
              </label>
              <input
                type="text"
                name="usuario"
                value={formData.usuario}
                onChange={handleInputChange}
                required
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nova Senha
              </label>
              <input
                type="password"
                name="senha"
                value={formData.senha}
                onChange={handleInputChange}
                placeholder="Deixe em branco para não alterar"
                className={inputClasses}
              />
            </div>
            <div className="flex items-center self-end mb-1">
              <input
                type="checkbox"
                name="ativo"
                id="ativo-edit"
                checked={formData.ativo === 1}
                onChange={handleInputChange}
                className={checkboxClasses}
              />
              <label
                htmlFor="ativo-edit"
                className="ml-2 block text-sm text-slate-900 dark:text-slate-200"
              >
                Usuário Ativo
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2 text-slate-800 dark:text-slate-200">
                Cargos
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto p-3 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50/50 dark:bg-slate-800/50">
                {allCargos.map((cargo) => (
                  <div key={cargo.id_cargo} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`edit-cargo-${cargo.id_cargo}`}
                      checked={formData.cargos.includes(Number(cargo.id_cargo))}
                      onChange={() =>
                        handleMultiCheckboxChange(
                          "cargos",
                          Number(cargo.id_cargo)
                        )
                      }
                      className={checkboxClasses}
                    />
                    <label
                      htmlFor={`edit-cargo-${cargo.id_cargo}`}
                      className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      {cargo.nome}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-slate-800 dark:text-slate-200">
                Setores
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto p-3 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50/50 dark:bg-slate-800/50">
                {allSetores.map((setor) => (
                  <div key={setor.id_setor} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`edit-setor-${setor.id_setor}`}
                      checked={formData.setores.includes(
                        Number(setor.id_setor)
                      )}
                      onChange={() =>
                        handleMultiCheckboxChange(
                          "setores",
                          Number(setor.id_setor)
                        )
                      }
                      className={checkboxClasses}
                    />
                    <label
                      htmlFor={`edit-setor-${setor.id_setor}`}
                      className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      {setor.nome}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-slate-800 dark:text-slate-200">
                Empresas
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto p-3 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50/50 dark:bg-slate-800/50">
                {allEmpresas.map((empresa) => (
                  <div key={empresa.id_empresa} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`edit-empresa-${empresa.id_empresa}`}
                      checked={formData.empresas.includes(
                        Number(empresa.id_empresa)
                      )}
                      onChange={() =>
                        handleMultiCheckboxChange(
                          "empresas",
                          Number(empresa.id_empresa)
                        )
                      }
                      className={checkboxClasses}
                    />
                    <label
                      htmlFor={`edit-empresa-${empresa.id_empresa}`}
                      className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      {empresa.nome}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 py-2 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:ring-offset-slate-900 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:ring-offset-slate-900 disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
type ModalExcluirUsuarioProps = {
  open: boolean;
  onClose: () => void;
  usuario: Usuario | null;
  onSuccess: () => void;
};

function ModalExcluirUsuario({
  open,
  onClose,
  usuario,
  onSuccess,
}: ModalExcluirUsuarioProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!usuario) return;
    try {
      setLoading(true);
      const resp = await fetch(
        "http://localhost:81/api/deletes/delete_usuario.php",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_usuario: usuario.id_usuario }),
        }
      );

      if (!resp.ok) {
        throw new Error((await resp.text()) || "Falha ao excluir.");
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      alert(`Não foi possível excluir o usuário. ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[90] grid place-items-center transition-opacity duration-300 ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative m-4 p-4 w-2/5 min-w-[300px] rounded-lg bg-white shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center pb-4 text-xl font-medium text-slate-800 dark:text-slate-200">
          Excluir Usuário
        </div>
        <div className="p-4 text-sm text-slate-700 dark:text-slate-200">
          <p>
            Tem certeza de que deseja excluir o usuário{" "}
            <span className="font-semibold">“{usuario?.nome}”</span>?
          </p>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Esta ação marcará o usuário como inativo e não poderá ser desfeita
            diretamente por esta interface.
          </p>
        </div>
        <hr className="mt-3 dark:border-gray-700" />
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 dark:border-slate-600 py-2 px-4 text-sm dark:text-slate-200 dark:hover:bg-slate-700"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="rounded-md bg-red-600 py-2 px-4 text-sm text-white hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${
        open
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-5 pointer-events-none"
      }`}
    >
      <div className="flex items-center w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow-sm dark:text-gray-400 dark:bg-gray-800">
        <div className="inline-flex items-center justify-center shrink-0 w-8 h-8 text-green-500 bg-green-100 rounded-lg dark:bg-green-800 dark:text-green-200">
          <svg
            className="w-5 h-5"
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
          onClick={onClose}
          className="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg p-1.5 h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <svg
            className="w-3 h-3"
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
// --- FIM: Componentes de Modal ---
