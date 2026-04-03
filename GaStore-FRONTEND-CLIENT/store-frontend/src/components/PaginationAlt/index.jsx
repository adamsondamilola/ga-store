import React from 'react';

const PaginationAlt = ({ currentPage, totalPages, onPageChange }) => {
  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <div className="flex justify-center mt-4 space-x-2">
      <button onClick={handlePrevious} disabled={currentPage === 1} className="border px-3 py-1 rounded">
        Previous
      </button>
      <span className="px-3 py-1">{currentPage} / {totalPages}</span>
      <button onClick={handleNext} disabled={currentPage === totalPages} className="border px-3 py-1 rounded">
        Next
      </button>
    </div>
  );
};

export default PaginationAlt;
