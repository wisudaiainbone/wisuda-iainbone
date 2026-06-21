import type { ProdiItem } from "@/actions/prodi";
import { Pencil, GripVertical } from "lucide-react";
import ProdiDialog from "./ProdiDialog";
import DeleteProdiButton from "./DeleteProdiButton";

interface Props {
  prodi: ProdiItem;
  index: number;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export default function ProdiTableRow({ prodi, index, onDragStart, onDragOver, onDragEnd }: Props) {
  return (
    <tr 
      className="hover:bg-[var(--color-bg-secondary)] transition-colors group cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <td className="px-4 py-4 text-center text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors">
        <div className="flex items-center justify-center gap-1">
          <GripVertical size={16} className="opacity-30 group-hover:opacity-100 transition-opacity" />
          <span className="font-medium text-xs bg-[var(--color-bg)] px-1.5 py-0.5 rounded-md border border-[var(--color-border)] min-w-[20px] text-center">
            {index + 1}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-[var(--color-text-muted)]">
        {prodi.fakultas}
      </td>
      <td className="px-6 py-4 text-sm font-semibold text-[var(--color-text)]">
        {prodi.prodi}
      </td>
      <td className="px-6 py-4 text-sm font-medium text-[var(--color-text)]">
        {prodi.singkatan}
      </td>
      <td className="px-6 py-4 text-sm font-medium text-[var(--color-text-muted)]">
        {prodi.gelar}
      </td>
      <td className="px-6 py-4 text-sm text-[var(--color-text-muted)]">
        {prodi.sesi ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
            {prodi.sesi}
          </span>
        ) : "-"}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <ProdiDialog
            prodi={prodi}
            trigger={
              <button
                title="Edit Prodi"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                <Pencil size={14} />
              </button>
            }
          />
          <DeleteProdiButton id={prodi.id} prodiName={prodi.prodi} />
        </div>
      </td>
    </tr>
  );
}
