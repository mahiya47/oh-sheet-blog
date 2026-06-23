import { Flame } from "lucide-react";

export default function SortBar({ sort, setSort }) {
  return (
    <div className="sortbar">
      <span className="label">
        <Flame size={16} /> Sort
      </span>
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        aria-label="Sort sheets"
      >
        <option value="hot">Hot</option>
        <option value="new">New</option>
        <option value="top">Top</option>
      </select>
    </div>
  );
}
