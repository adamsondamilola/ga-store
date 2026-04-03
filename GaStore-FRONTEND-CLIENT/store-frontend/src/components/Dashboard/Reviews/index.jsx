"use client"
import endpointsPath from '@/constants/EndpointsPath';
import AppStrings from '@/constants/Strings';
import requestHandler from '@/utils/requestHandler';
import { stringToSLug } from '@/utils/stringToSlug';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiStar, FiUser, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const ReviewsByUser = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [name, setName] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Number of reviews per page

  const [userId, setUserId] = useState(null);
  useEffect(() => {
      const loggedInUser =  async () => { 
        const resp = await requestHandler.get(`${endpointsPath.auth}/logged-in-user`, true);
        if(resp.statusCode === 200){
          setUserId(resp.result.data[0]?.userId);
        }
        else {
            
        }
    }
    loggedInUser();
    },[]);

    useEffect(() => {
    if (!userId) return;
    async function fetchProductReviews() {
      try {
        setLoading(true);
        
        const response = await requestHandler.getServerSide(
          `${endpointsPath.productReview}?userId=${userId}`, 
          true
        );
        if (response?.statusCode <= 201) {
          setReviews(response.result.data);
        } else {

        }
      } catch (err) {
        setLoading(false);
//        console.error('Product fetch error:', err);
  //      setError('An error occurred while loading the product');
      } finally {
        setLoading(false);
      }
    }
    fetchProductReviews();
  }, [userId]);
  

  useEffect(() => {
    const loggedInUser = async () => { 
      const resp = await requestHandler.get(`${endpointsPath.auth}/logged-in-user-details`, true);
      if(resp.statusCode === 200){
        setIsLoggedIn(true);
        setName(`${resp.result.data.firstName} ${resp.result.data.lastName}`);
      }
      else {
        localStorage.setItem("redirect_url", `/customer/reviews`);
      }
    }
    loggedInUser();
  }, []);

  // Pagination logic
  const indexOfLastReview = currentPage * itemsPerPage;
  const indexOfFirstReview = indexOfLastReview - itemsPerPage;
  const currentReviews = reviews?.slice(indexOfFirstReview, indexOfLastReview);
  const totalPages = Math.ceil(reviews?.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Pagination component
  const Pagination = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

      if (loading) return <Spinner loading={loading} />;

    return (
      <div className="flex justify-center items-center mt-5">
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

  return (
    <div className="mt-5 pt-8 p-5 rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Reviews</h2>
      {/* Reviews List */}
      <div className="space-y-8">
        {currentReviews?.length === 0 ? (
          <p className="text-gray-500">No reviews yet.</p>
        ) : (
          currentReviews?.map((review) => (
            <div key={review.id} className="border-b border-gray-300 pb-6">
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                  <FiUser className="text-gray-600" />
                </div>
                <div>
                  <h4 className="font-medium">{`${review?.user?.firstName || name} ${review?.user?.lastName || ''}`  || 'New Comment'}</h4>
                  <div className="flex items-center">
                    <div className="flex mr-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FiStar
                          key={star}
                          className={`w-4 h-4 ${star <= review?.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review?.date || review?.dateCreated).toLocaleDateString()}
                    </span>
                    {/*<Link href={`/product/${stringToSLug(review?.product?.name)}?id=${review?.product?.id}`} className='ml-2 text-sm text-blue-500'>
                      View Product
                    </Link>*/}
                  </div>
                  <div className='flex w-full justify-between'><div className='font-bold'>{review?.product?.name}</div>
                  <Link href={`/product/${stringToSLug(review?.product?.name)}?id=${review?.product?.id}`} className='ml-2 text-sm text-blue-500'>
                      View Product
                    </Link>
                  </div>
                </div>
              </div>
              <h5 className="font-semibold text-lg mb-1">{review.title}</h5>
              <p className="text-gray-700 whitespace-pre-line">{review.comment}</p>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {reviews.length > itemsPerPage && <Pagination />}
    </div>
  );
};

export default ReviewsByUser;