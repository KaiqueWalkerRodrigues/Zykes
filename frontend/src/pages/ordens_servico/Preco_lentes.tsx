import { ColumnDef } from "@tanstack/react-table";
import React, { useEffect, useMemo, useRef, useState } from "react";
import DataTable from "../../components/tables/table";
import { ENDPOINTS } from "../../lib/endpoints";

/* ========================
  Tipos
  ======================== */
type LenteDetalhada = {
  id_lente: number;
  valor_venda: number;
  nome_familia: string;
  nome_indice: string;
  nome_tratamento: string;
};

/* ========================
  Funções Auxiliares (Helpers)
  ======================== */
function isSameData(a: LenteDetalhada[], b: LenteDetalhada[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
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

  const res = await fetch(ENDPOINTS.lentes.list_todas, {
    method: "GET",
    headers,
    cache: "no-cache",
  });

  if (res.status === 304) {
    return { data: null, total: null, notModified: true as const };
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Erro ao buscar lentes: ${res.status} ${txt}`);
  }

  const etag = res.headers.get("etag");
  if (etagRef && etag) etagRef.current = etag;

  const data: LenteDetalhada[] = await res.json().catch(() => []);
  let filtered = data;
  if (search) {
    const s = search.toLowerCase();
    filtered = data.filter((item) =>
      [
        item.nome_familia.toLowerCase(),
        item.nome_indice.toLowerCase(),
        item.nome_tratamento.toLowerCase(),
        String(item.valor_venda ?? "").toLowerCase(),
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
  Página Preco Lentes
  ======================== */
export default function PrecoLentes() {
  const etagRef = useRef<string | null>(null);
  const lastDataRef = useRef<LenteDetalhada[]>([]);

  const [refreshSignal, setRefreshSignal] = useState(0);
  const [search, setSearch] = useState("");

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

  const columns = useMemo<ColumnDef<LenteDetalhada>[]>(
    () => [
      { accessorKey: "id_lente", header: "#" },
      {
        header: "Nome",
        id: "nome_completo",
        cell: ({ row }) => {
          const { nome_familia, nome_indice, nome_tratamento } = row.original;
          return `${nome_familia || ""} ${nome_indice || ""} ${
            nome_tratamento || ""
          }`.trim();
        },
      },
      {
        accessorKey: "valor_venda",
        header: "Preço de Venda",
        cell: ({ getValue }) => {
          const v = Number(getValue() ?? 0);
          const formatted = new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(v);
          return <span className="font-mono">{formatted}</span>;
        },
      },
    ],
    []
  );

  return (
    <div className="h-full flex flex-col">
      {" "}
      <div className="flex-1 overflow-auto px-6 pb-6">
        {" "}
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-6 dark:border-gray-800 dark:bg-slate-900">
          {" "}
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
          />{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
