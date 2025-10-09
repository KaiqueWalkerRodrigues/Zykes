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
  refreshSignal?: number;
};

function DataTable<T extends object>({
  columns,
  fetchData,
  pageSize = 10,
  search,
  setSearch,
  refreshSignal,
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
  }, [page, pageSize, search, fetchData, refreshSignal]);

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
      className="
        datatable-container
        rounded-xl p-6
        shadow-sm ring-1 ring-gray-200
        bg-white text-slate-700
        dark:bg-gray-900 dark:text-slate-200 dark:ring-gray-800
      "
    >
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative">
          <FaSearch className="absolute left-2 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={search}
            onChange={(e) => {
              setPage(0);
              setSearch(e.target.value);
            }}
            className="
              pl-8 pr-3 py-2 min-w-[220px]
              rounded-md border border-gray-300
              bg-white text-slate-700 placeholder:text-slate-400
              focus:outline-none focus:border-gray-400
              dark:bg-gray-800 dark:text-slate-200 dark:border-gray-700 dark:placeholder:text-slate-400
            "
          />
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          Página {page + 1} de {Math.ceil(total / pageSize)}
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="
                    text-left px-3 py-2
                    border-b-2 border-gray-100 bg-gray-50
                    text-slate-700
                    dark:border-gray-800 dark:bg-gray-800 dark:text-slate-200
                  "
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
                className="text-center p-6 text-slate-600 dark:text-slate-300"
              >
                Carregando...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center p-6 text-slate-600 dark:text-slate-300"
              >
                Nenhum registro encontrado.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row, i) => (
              <tr
                key={row.id}
                className="
                  border-b border-gray-100
                  hover:bg-gray-50
                  dark:border-gray-800 dark:hover:bg-gray-800/60
                "
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-end mt-4 gap-2">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
          disabled={page === 0}
          className="
            inline-flex items-center justify-center
            px-3 py-2 rounded-md border
            border-gray-300 bg-gray-50
            disabled:opacity-50
            dark:border-gray-700 dark:bg-gray-800
          "
        >
          <FaChevronLeft />
        </button>
        <button
          onClick={() =>
            setPage((p) => (p + 1 < Math.ceil(total / pageSize) ? p + 1 : p))
          }
          disabled={page + 1 >= Math.ceil(total / pageSize)}
          className="
            inline-flex items-center justify-center
            px-3 py-2 rounded-md border
            border-gray-300 bg-gray-50
            disabled:opacity-50
            dark:border-gray-700 dark:bg-gray-800
          "
        >
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
}

export default DataTable;
