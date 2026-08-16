/**
 * Reusable Pagination Component
 * Module 2 - Assigned to: Ariful Islam Bijoy (ID: 22101504)
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
}) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const delta = 2; // number of pages around current page

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 bg-base-100 rounded-lg border border-base-200 mt-4 text-xs sm:text-sm">
      {/* Information text */}
      <div className="text-base-content/70">
        Showing <span className="font-semibold text-base-content">{startItem}</span> to{" "}
        <span className="font-semibold text-base-content">{endItem}</span> of{" "}
        <span className="font-semibold text-base-content">{totalItems}</span> entries
      </div>

      {/* Pagination Buttons & Page Size Selector */}
      <div className="flex items-center gap-3">
        {/* Page size dropdown */}
        {onItemsPerPageChange && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-base-content/70">Per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="select select-bordered select-xs"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}

        {/* Page Buttons */}
        <div className="join">
          <button
            className="join-item btn btn-xs sm:btn-sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous Page"
          >
            «
          </button>

          {getPageNumbers().map((page, idx) =>
            page === "..." ? (
              <button key={`dots-${idx}`} className="join-item btn btn-xs sm:btn-sm btn-disabled">
                ...
              </button>
            ) : (
              <button
                key={`page-${page}`}
                onClick={() => onPageChange(page)}
                className={`join-item btn btn-xs sm:btn-sm ${
                  currentPage === page ? "btn-primary font-bold" : ""
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            className="join-item btn btn-xs sm:btn-sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Next Page"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
