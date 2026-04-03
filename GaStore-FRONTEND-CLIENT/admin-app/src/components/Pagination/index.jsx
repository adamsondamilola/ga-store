import React, { useState, useEffect } from 'react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  pageSize,          // Current number of records per page
  onPageSizeChange,  // Callback when records per page changes
  pageSizeOptions = [10, 25, 50, 100] // Default options
}) => {
  const [pageInput, setPageInput] = useState(currentPage);

  // Keep input in sync with currentPage
  useEffect(() => {
    setPageInput(currentPage);
  }, [currentPage]);

  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const handlePageInputChange = (e) => {
    const value = e.target.value;
    setPageInput(value);
    
    const pageNum = parseInt(value);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages && pageNum !== currentPage) {
      onPageChange(pageNum);
    }
  };

  const handleBlur = () => {
    if (isNaN(parseInt(pageInput))) {
      setPageInput(currentPage);
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    onPageSizeChange(newSize);
    // Reset to first page when changing page size
    onPageChange(1);
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
      <div className="flex items-center gap-2">
        <span>Show:</span>
        <select
          value={pageSize}
          onChange={handlePageSizeChange}
          className="border px-2 py-1 rounded"
        >
          {pageSizeOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span>records per page</span>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={handlePrevious} 
          disabled={currentPage === 1} 
          className="border px-3 py-1 rounded disabled:opacity-50 hover:bg-gray-100"
        >
          Previous
        </button>
        
        <div className="flex items-center">
          <span className="px-2">Page</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={pageInput}
            onChange={handlePageInputChange}
            onBlur={handleBlur}
            className="border px-2 py-1 rounded w-16 text-center"
          />
          <span className="px-2">of {totalPages}</span>
        </div>
        
        <button 
          onClick={handleNext} 
          disabled={currentPage === totalPages} 
          className="border px-3 py-1 rounded disabled:opacity-50 hover:bg-gray-100"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;