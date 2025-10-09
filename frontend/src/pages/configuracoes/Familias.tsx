import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTable from "../../components/tables/table";
import { ColumnDef } from "@tanstack/react-table";
import { FaGear, FaTrash, FaNewspaper } from "react-icons/fa6";
import React, { useRef } from "react";

type Familia = {
  id_familia: number;
  nome: string;
  acoes: string;
};

export default function Familias() {
  const etagRef = useRef<string | null>(null);
  const [refreshSignal, setRefreshSignal] = React.useState(0);
  const [search, setSearch] = React.useState(""); // controle de busca
  const [modalOpen, setModalOpen] = React.useState(false); // controle do modal
  const [selectedFamilia, setSelectedFamilia] = React.useState<Familia | null>(
    null
  );
  const [lastData, setLastData] = React.useState<any[]>([]); // para comparar

  // Polling inteligente: só ativa se não estiver buscando
  React.useEffect(() => {
    const interval = setInterval(async () => {
      const result = await fetchData(0, 10, search, etagRef);
      if (result && !isSameData(result.data, lastData)) {
        setLastData(result.data);
        setRefreshSignal((k) => k + 1);
      }
    }, 5000); // 5 segundos, ajuste conforme necessário
    return () => clearInterval(interval);
  }, [search, lastData]);

  // Coloque columns aqui para acessar setModalOpen
  const columns: ColumnDef<Familia>[] = [
    { accessorKey: "id_familia", header: "#" },
    { accessorKey: "nome", header: "Nome" },
    {
      accessorKey: "acoes",
      header: "Ações",
      cell: ({ row }) => (
        <div className="row flex">
          <button
            className="rounded-md rounded-r-none bg-blue-600 py-2 px-4 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-blue-500 focus:shadow-none active:bg-blue-500 hover:bg-blue-500 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
            type="button"
          >
            <FaNewspaper />
          </button>
          <button
            className="rounded-none bg-slate-600 py-2 px-4 border-l border-r border-slate-700 text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-slate-500 focus:shadow-none active:bg-slate-500 hover:bg-slate-500 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
            type="button"
            onClick={() => {
              setSelectedFamilia(row.original);
              setModalOpen(true);
            }}
          >
            <FaGear />
          </button>
          <button
            className="rounded-md rounded-l-none bg-red-600 py-2 px-4 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-red-500 focus:shadow-none active:bg-red-500 hover:bg-red-500 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
            type="button"
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
        title="Configurações Familias"
        description="This is React.js Blank Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb
        items={[
          { label: "Home", to: "/" },
          { label: "Configurações", to: "/" },
          { label: "Familias", to: "/configuracoes/familias" },
        ]}
      />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full max-w-[630px] text-center"></div>
        <DataTable
          columns={columns}
          fetchData={(page, pageSize, s) =>
            fetchData(page, pageSize, s, etagRef)
          }
          pageSize={10}
          search={search}
          setSearch={setSearch}
          refreshSignal={refreshSignal}
        />
      </div>
      <ModalEditarFamilia
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        nomeFamilia={selectedFamilia?.nome || ""}
      />
    </div>
  );
}

type ModalEditarFamiliaProps = {
  open: boolean;
  onClose: () => void;
  nomeFamilia: string;
};

export function ModalEditarFamilia({
  open,
  onClose,
  nomeFamilia,
}: ModalEditarFamiliaProps) {
  return (
    <div
      id="modal-editar-familia"
      data-dialog-backdrop="modal-md"
      data-dialog-backdrop-close="true"
      className={`fixed inset-0 z-[9999999] grid h-screen w-screen place-items-center transition-opacity duration-300 ${
        open
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      {/* BACKDROP ESCURO ESTILO BOOTSTRAP */}
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <div
        id="modal-editar-familia"
        data-dialog="modal-md"
        className="relative m-4 p-4 w-2/5 rounded-lg bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center pb-4 text-xl font-medium text-slate-800">
          Editar (<span id="editar-titulo">{nomeFamilia}</span>)
        </div>
        <div className="relative border-t border-slate-200 py-4 leading-normal text-slate-600 font-light">
          <form action="">
            <div className="flex">
              <div className="w-1/2">
                <label htmlFor="" className="block mb-2 text-sm text-slate-800">
                  Nome
                </label>
                <input
                  type="text"
                  className="bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-300 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow w-full"
                  value={nomeFamilia}
                  readOnly
                />
              </div>
            </div>
          </form>
        </div>
        <hr className="mt-3" />
        <div className="flex shrink-0 flex-wrap items-center pt-4 justify-end">
          <button
            className="rounded-md border border-transparent py-2 px-4 text-center text-sm transition-all text-slate-600 hover:bg-slate-100 focus:bg-slate-100 active:bg-slate-100 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded-md bg-slate-600 py-2 px-4 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-slate-500 focus:shadow-none active:bg-slate-500 hover:bg-slate-500 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none ml-2"
            type="button"
            onClick={onClose}
          >
            Editar
          </button>
        </div>
      </div>
    </div>
  );
}

const fetchData = async (
  page: number,
  pageSize: number,
  search: string,
  etagRef?: React.MutableRefObject<string | null>
) => {
  const headers: Record<string, string> = {};
  if (etagRef && etagRef.current) {
    headers["If-None-Match"] = etagRef.current;
  }
  const res = await fetch("http://localhost:81/api/gets/get_familias.php", {
    headers,
  });

  if (res.status === 304) {
    // Nada mudou, retorna null para indicar que não precisa atualizar
    return null;
  }
  const data = await res.json();
  const etag = res.headers.get("etag");
  if (etagRef) etagRef.current = etag;

  let filtered = data;
  if (search) {
    filtered = data.filter((item: Familia) =>
      item.nome.toLowerCase().includes(search.toLowerCase())
    );
  }
  const total = filtered.length;
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
  return { data: paginated, total };
};

// Função para comparar arrays de objetos
function isSameData(a: any[], b: any[]) {
  return JSON.stringify(a) === JSON.stringify(b);
}
