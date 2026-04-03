import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

  // Pagination component
  const Pagination = ({totalPages}) => {

      //const totalPages = Math.ceil(reviews.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  

    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center items-center mt-8">
        <button
          onClick={() => paginate(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`p-2 rounded-full ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <FiChevronLeft size={20} />
        </button>

        <div className="flex mx-2">
          {pageNumbers.map(number => (
            <button
              key={number}
              onClick={() => paginate(number)}
              className={`w-10 h-10 mx-1 rounded-full ${currentPage === number ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              {number}
            </button>
          ))}
        </div>

        <button
          onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-full ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <FiChevronRight size={20} />
        </button>
      </div>
    );
  };

  export default Pagination;