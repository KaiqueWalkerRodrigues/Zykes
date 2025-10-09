import React, { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";

type DataTableProps<T> = {
  columns: ColumnDef<T, unknown>[];
  fetchData: (
    page: number,
    pageSize: number,
    search: string
  ) => Promise<{ data: T[]; total: number }>;
  pageSize?: number;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  refreshSignal?: number; // NOVO
};

function DataTable<T extends object>({
  columns,
  fetchData,
  pageSize = 10,
  search,
  setSearch,
  refreshSignal, // NOVO
}: DataTableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchData(page, pageSize, search).then((res) => {
      setData(res.data);
      setTotal(res.total);
      setLoading(false);
    });
  }, [page, pageSize, search, fetchData, refreshSignal]); // Adicione refreshSignal aqui

  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(total / pageSize),
    state: { pagination: { pageIndex: page, pageSize }, globalFilter: search },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    manualFiltering: true,
  });

  return (
    <div
      className="datatable-container"
      style={{
        background: "#fff",
        borderRadius: 8,
        padding: 24,
        boxShadow: "0 0 8px #eee",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ position: "relative" }}>
          <FaSearch
            style={{ position: "absolute", left: 8, top: 10, color: "#aaa" }}
          />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={search}
            onChange={(e) => {
              setPage(0);
              setSearch(e.target.value);
            }}
            style={{
              padding: "8px 8px 8px 32px",
              borderRadius: 4,
              border: "1px solid #ddd",
              minWidth: 220,
            }}
          />
        </div>
        <div>
          Página {page + 1} de {Math.ceil(total / pageSize)}
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  style={{
                    borderBottom: "2px solid #eee",
                    padding: "8px",
                    textAlign: "left",
                    background: "#f8f9fc",
                  }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{ textAlign: "center", padding: 24 }}
              >
                Carregando...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{ textAlign: "center", padding: 24 }}
              >
                Nenhum registro encontrado.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    style={{
                      padding: "8px",
                      borderBottom: "1px solid #f1f1f1",
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 16,
          gap: 8,
        }}
      >
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
          disabled={page === 0}
          style={{
            padding: "6px 12px",
            borderRadius: 4,
            border: "1px solid #ddd",
            background: "#f8f9fc",
          }}
        >
          <FaChevronLeft />
        </button>
        <button
          onClick={() =>
            setPage((p) => (p + 1 < Math.ceil(total / pageSize) ? p + 1 : p))
          }
          disabled={page + 1 >= Math.ceil(total / pageSize)}
          style={{
            padding: "6px 12px",
            borderRadius: 4,
            border: "1px solid #ddd",
            background: "#f8f9fc",
          }}
        >
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
}

export default DataTable;
