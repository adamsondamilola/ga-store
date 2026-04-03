"use client"
import endpointsPath from '@/constants/EndpointsPath';
import AppStrings from '@/constants/Strings';
import requestHandler from '@/utils/requestHandler';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiStar, FiUser, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const ProductReviews = ({ productId, initialReviews = [], reviewsPerPage }) => {
  const [reviews, setReviews] = useState(initialReviews.data || []);
  const [reviews_, setReviews_] = useState(initialReviews);
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    title: '',
    comment: '',
    name: ''
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [name, setName] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(reviewsPerPage || 5); // Number of reviews per page

  useEffect(() => {
    const loggedInUser = async () => { 
      const resp = await requestHandler.get(`${endpointsPath.auth}/logged-in-user-details`, true);
      if(resp.statusCode === 200){
        setIsLoggedIn(true);
        setName(`${resp.result.data.firstName} ${resp.result.data.lastName}`);
      }
      else {
        localStorage.setItem("redirect_url", `/product/reviews/${productId}`);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewReview(prev => ({ ...prev, [name]: value }));
  };

  const handleRatingClick = (rating) => {
    setNewReview(prev => ({ ...prev, rating }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (newReview.rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    const reviewToAdd = {
      ...newReview,
      id: Date.now(),
      date: new Date().toISOString(),
      productId
    };

    setReviews(prev => [reviewToAdd, ...prev]);
    setNewReview({
      rating: 0,
      title: '',
      comment: '',
      name: ''
    });

    setShowForm(false);

    try {
      const data = {
        title: newReview.title,
        comment: newReview.comment,
        rating: newReview.rating,
        productId: productId
      }
      const response = await requestHandler.post(`${endpointsPath.productReview}`, data, true);
      if(response.statusCode < 202){
        //toast.success(response.result.message)
      }else{
        toast.error(response.result.message || AppStrings.somethingWentWrong)
      }
    } catch (error) {
      toast.error(AppStrings.internalServerError);
    }
  };

  const averageRating = reviews?.length > 0 
    ? (reviews_.metadata.AverageRating || (reviews.reduce((sum, review) => sum + review?.rating, 0) / reviews.length).toFixed(1))
    : 0;

  // Pagination component
  const Pagination = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

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
      <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

      {/* Rating Summary */}
      <div className="flex items-center mb-8">
        <div className="text-4xl font-bold mr-4">{averageRating}</div>
        <div className="mr-6">
          <div className="flex mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <FiStar 
                key={star}
                className={`w-5 h-5 ${star <= averageRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <div className="text-sm text-gray-600">
            Based on {reviews_.totalRecords} review{reviews?.length !== 1 ? 's' : ''}
          </div>
        </div>
        {/*<button 
          onClick={() => isLoggedIn? setShowForm(true) : location.href="/login"}
          className="ml-auto px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
        >
          Write a Review
        </button>*/}
      </div>

      {/* Review Form */}
      {showForm && (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Write a Review</h3>
          <form onSubmit={handleSubmitReview}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Rating</label>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none"
                  >
                    <FiStar
                      className={`w-8 h-8 ${star <= (hoverRating || newReview.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="title" className="block text-gray-700 mb-2">Review Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={newReview.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="comment" className="block text-gray-700 mb-2">Your Review</label>
              <textarea
                id="comment"
                name="comment"
                value={newReview.comment}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                required
              ></textarea>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
              >
                Submit Review
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-8">
        {currentReviews?.length === 0 && !showForm ? (
          <p className="text-gray-500">No reviews yet. Be the first to review!</p>
        ) : (
          currentReviews?.map((review) => (
            <div key={review?.id} className="border-b border-gray-300 pb-6">
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
                  </div>
                </div>
              </div>
              <h5 className="font-semibold text-lg mb-1">{review?.title}</h5>
              <p className="text-gray-700 whitespace-pre-line">{review?.comment}</p>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {reviews.length > itemsPerPage && <Pagination />}
    </div>
  );
};

export default ProductReviews;