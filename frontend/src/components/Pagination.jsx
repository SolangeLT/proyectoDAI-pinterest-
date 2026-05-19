import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, totalPages, hasNext, hasPrevious, onPageChange }) {
  return (
    <div className="pagination-bar">
      <button
        className="btn btn-outline-dark btn-sm"
        type="button"
        disabled={!hasPrevious}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft size={16} />
        Anterior
      </button>
      <span className="page-count">
        Pagina {page} de {totalPages}
      </span>
      <button
        className="btn btn-outline-dark btn-sm"
        type="button"
        disabled={!hasNext}
        onClick={() => onPageChange(page + 1)}
      >
        Siguiente
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
