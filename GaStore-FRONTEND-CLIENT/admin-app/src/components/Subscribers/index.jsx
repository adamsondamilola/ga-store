import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';
import Pagination from '../Pagination';
import { Link } from 'react-router-dom';
import dateTimeToWord from '../../utils/dateTimeToWord';

const SubscribersList = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchEmail, setSearchEmail] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const response = await requestHandler.get(
        `${endpointsPath.subscriber}?pageNumber=${page}&pageSize=${pageSize}` +
        `${searchEmail ? `&searchEmail=${searchEmail}` : ''}` +
        `${statusFilter !== 'all' ? `&isActive=${statusFilter === 'active'}` : ''}`,
        true
      );

      if (response.statusCode === 200) {
        setSubscribers(response.result.data || []);
        setTotalRecords(response.result.totalRecords || 0);
        setTotalPages(Math.ceil(response.result.totalRecords / pageSize) || 1);
      } else {
        throw new Error(response.result.message || 'Failed to fetch subscribers');
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error(error.message || 'Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1); // Reset to first page when searching
    fetchSubscribers();
  };

  const toggleSubscriptionStatus = async (subscriberId, currentStatus) => {
    try {
      const response = await requestHandler.put(
        `${endpointsPath.subscriber}/${subscriberId}`,
        { isActive: !currentStatus },
        true
      );

      if (response.statusCode === 200) {
        toast.success(`Subscription ${currentStatus ? 'deactivated' : 'reactivated'} successfully`);
        fetchSubscribers(); // Refresh the list
      } else {
        throw new Error(response.result.message || 'Failed to update subscription status');
      }
    } catch (error) {
      console.error('Update failed:', error);
      toast.error(error.message || 'Failed to update subscription status');
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [page, statusFilter]);

  return (
    <div className="container mx-auto md:px-4 px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        
        {/* Search Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-start block text-sm font-medium text-gray-700 mb-1">
              Total: {totalRecords} {statusFilter !== 'all' && `(${statusFilter})`}
            </label>
          </div>
          
          <div>
            <div className="flex">
              <input
                type="text"
                placeholder="Search by email..."
                className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-brand text-white rounded-r-md hover:bg-primary-dark"
              >
                Search
              </button>
            </div>
          </div>

          <div>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : subscribers.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No subscribers found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-start">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscribers.map((subscriber) => (
                  <tr key={subscriber?.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {subscriber?.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${subscriber?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {subscriber?.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dateTimeToWord(subscriber?.dateCreated)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subscriber?.subscriptionSource || 'Website'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => toggleSubscriptionStatus(subscriber.id, subscriber.isActive)}
                        className={`mr-2 px-3 py-1 text-xs rounded-md 
                          ${subscriber?.isActive 
                            ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                            : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                      >
                        {subscriber?.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      {/*<Link 
                        to={`/subscribers/${subscriber.id}`}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                      >
                        Details
                      </Link>*/}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {subscribers.length > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalRecords={totalRecords}
              onPageChange={setPage}
              pageSize={pageSize}
        onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscribersList;