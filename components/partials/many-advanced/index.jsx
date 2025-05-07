import { DataTable } from "./data-table";
import { DataTableVirtualized } from "./data-table-virtualized";
import { DataTableColumnHeader } from "./data-table-column-header";
import { Checkbox } from "@/components/ui/checkbox";
import { firstUpperLetter } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function AdvancedTable({
  ifSelect = false,
  ifSearch = false,
  ifHide = false,
  ifVirtualized = false,
  ifPagination = true,
  dataList = [],
  ignoreList = [],
  actionList = [],
  styleColumnList = [],
  searchList = [],
  styleRowList = [],
  treeList = [],
  pickers = null,
  groups = null,
  actions = null,
  totals = null,
  exports = null,
  options = null,
  bulk = null,
  label = null,
  onSelectedRowsChange = undefined,
  getRowClassName = undefined,
  optionsFirst = false,
}) {
  const { t } = useTranslation();
  const generateColumns = (data) => {
    if (data.length === 0) return [];

    const allKeys = data.reduce((keys, obj) => {
      Object.keys(obj).forEach((key) => {
        if (!ignoreList.find((item) => item.title === key)) {
          keys.add(key);
        }
      });
      return keys;
    }, new Set());

    const columns = Array.from(allKeys).map((key) => {
      const actionItem = actionList.find((item) => item.title === t(`general.${key}`));
      let cellContent;

      if (actionList.some((item) => item.title === t(`general.${key}`)) && actions) {
        cellContent = ({ row }) => (
          <div className="flex space-x-2">
            <span className="truncate font-medium">{actions(row, t(`general.${key}`))}</span>
          </div>
        );
      } else if (typeof data[0][key] === "boolean") {
        cellContent = ({ row }) => (
          <div className="flex space-x-2">
            {row.getValue(key) === true ? (
              <span className="inline-block px-3 py-[2px] rounded-2xl bg-success/10 text-xs text-success">
                {t("general.years")}
              </span>
            ) : (
              <span className="inline-block px-3 py-[2px] rounded-2xl bg-red-400/10 text-xs text-red-800">
                {t("general.no")}
              </span>
            )}
          </div>
        );
      } else if (
        typeof data[0][key] === "string" ||
        typeof data[0][key] === "number"
      ) {
        cellContent = ({ row }) => (
          <div className="flex space-x-2">
            <span className="max-w-[500px] truncate font-medium">
              {row.getValue(key)}
            </span>
          </div>
        );
      } else {
        cellContent = ({ row }) => (
          <div className="flex space-x-2">
            <span className="max-w-[500px] truncate font-medium">
              {String(row.getValue(key))}
            </span>
          </div>
        );
      }

      return {
        accessorKey: key,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={
              actionItem
                ? t(`general.${actionItem.title}`)
                : firstUpperLetter(t(`general.${key}`))
            }
          />
        ),
        cell: cellContent,
      };
    });

    return columns;
  };
  let columns = generateColumns(dataList);

  if (options) {
    const optionsColumn = {
      id: "options",
      cell: ({ row }) => options(row),
    };
    if (optionsFirst) {
      columns.unshift(optionsColumn);
    } else {
      columns.push(optionsColumn);
    }
  }

  if (ifSelect) {
    const selectColumn = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px] mr-4"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: true,
      enableHiding: true,
    };
    columns.unshift(selectColumn);
  }

  return (
    <>
       <DataTable
        columns={columns}
        ifSearch={ifSearch}
        ifHide={ifHide}
        dataList={dataList}
        styleColumnList={styleColumnList}
        searchList={searchList}
        pickers={pickers}
        exports={exports}
        groups={groups}
        totals={totals}
        bulk={bulk}
        ifSelect={ifSelect}
        ifPagination={ifPagination}
        styleRowList={styleRowList}
        onSelectedRowsChange={onSelectedRowsChange}
        getRowClassName={getRowClassName}
        label={label}
        treeList={treeList}
      />
    </>
  );
}
