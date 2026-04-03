"use client"
import React, { useEffect, useState } from 'react';
import requestHandler from '@/utils/requestHandler';
import endpointsPath from '@/constants/EndpointsPath';
import Link from 'next/link';
import toast from 'react-hot-toast';
import PaginationAlt from '@/components/PaginationAlt';
import formatNumberToCurrency from '@/utils/numberToMoney';

const TransactionsList = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filters, setFilters] = useState({
    transactionType: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const limit = 10;

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

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        pageNumber: page,
        pageSize: limit,
        userId: userId,
        ...(filters.transactionType && { transactionType: filters.transactionType }),
        ...(filters.status && { status: filters.status }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      const response = await requestHandler.get(
        `${endpointsPath.transaction}?${params}`,
        true
      );

      if (response.statusCode === 200) {
        setTransactions(response.result.data || []);
        setTotalPages(response.result.totalPages || 1);
        setTotalRecords(response.result.totalRecords || 0);
      } else {
        //throw new Error(response.message || 'Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error(error.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setPage(1); // Reset to first page when filters change
    fetchTransactions();
  };

  const resetFilters = () => {
    setFilters({
      transactionType: '',
      status: '',
      startDate: '',
      endDate: ''
    });
    setPage(1);
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, userId]);


  const statusBadge = (status) => {
    const statusClasses = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      processing: 'bg-blue-100 text-blue-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const typeBadge = (type) => {
    const typeClasses = {
      deposit: 'bg-purple-100 text-purple-800',
      withdrawal: 'bg-indigo-100 text-indigo-800',
      payment: 'bg-teal-100 text-teal-800',
      refund: 'bg-amber-100 text-amber-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeClasses[type.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="container mx-auto md:px-4 px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Transaction History</h1>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
            <select
              name="transactionType"
              value={filters.transactionType}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Types</option>
              <option value="Purchase">Purchase</option>
              <option value="Commission">Commission</option>
              <option value="Deposit">Deposit</option>
              <option value="Withdrawal">Withdrawal</option>
              <option value="Payment">Payment</option>
              <option value="Refund">Refund</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Processing">Processing</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end space-x-3">
          <button
            onClick={resetFilters}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset Filters
          </button>
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-primary-dark"
          >
            Apply Filters
          </button>
        </div>
        </div>
        
        

        {/* Transactions Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No transactions found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                  {/*<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>*/}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  {/*<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>*/}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.transactionId} className="hover:bg-gray-50">
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
  {transaction.transactionId ? 
    (typeof transaction.transactionId === 'string' ? 
      transaction.transactionId.substring(0, 10) : 
      String(transaction.transactionId).substring(0, 10)
    ) + '...' : 
    'N/A'}
</td>

{/*<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
  transaction.orderId ? (
    <a 
      href={`/orders/${transaction.orderId}`} 
      className="text-primary hover:underline"
    >
      {typeof transaction.orderId === 'string' ?
        transaction.orderId.substring(0, 8) :
        String(transaction.orderId).substring(0, 8)
      }...
    </a>
  ) : 'N/A'
</td>*/}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {typeBadge(transaction.transactionType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {formatNumberToCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {statusBadge(transaction.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.dateCreated).toLocaleDateString()}
                    </td>
                    {/*<td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {transaction.description}
                      <Link href={`/orders/${transaction?.orderId}`} className="">
                          View
                        </Link>
                    </td>*/}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {transactions.length > 0 && (
          <div className="mt-6">
            <PaginationAlt
              currentPage={page}
              totalPages={totalPages}
              totalRecords={totalRecords}
              pageSize={limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsList;