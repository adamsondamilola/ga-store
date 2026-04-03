import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';
import Pagination from '../Pagination';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Activity, 
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Eye,
  BarChart3,
  FileText,
  Shield
} from 'lucide-react';

const AuditLogsPage = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    entityName: '',
    status: '',
    userId: '',
    startDate: '',
    endDate: ''
  });
  const [statistics, setStatistics] = useState(null);
  const [showStatistics, setShowStatistics] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        pageNumber: page,
        pageSize: pageSize,
        ...(filters.search && { search: filters.search }),
        ...(filters.action && { action: filters.action }),
        ...(filters.entityName && { entityName: filters.entityName }),
        ...(filters.status && { status: filters.status }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      const response = await requestHandler.get(
        `${endpointsPath.auditLog}?${params}`,
        true
      );

      if (response.statusCode === 200) {
        setAuditLogs(response.result.data || []);
        setTotalPages(response.result.totalPages || 1);
        setTotalRecords(response.result.totalRecords || 0);
      } else {
        throw new Error(response.message || 'Failed to fetch audit logs');
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error(error.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    setStatsLoading(true);
    try {
      const params = new URLSearchParams({
        ...(filters.startDate && { fromDate: filters.startDate }),
        ...(filters.endDate && { toDate: filters.endDate })
      });

      const response = await requestHandler.get(
        `${endpointsPath.auditLog}/statistics?${params}`,
        true
      );

      if (response.statusCode === 200) {
        setStatistics(response.result.data);
      }
    } catch (error) {
      console.error('Stats fetch failed:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Export audit logs
  const exportAuditLogs = async (format = 'csv') => {
    try {
      const params = new URLSearchParams({
        format: format,
        ...(filters.startDate && { fromDate: filters.startDate }),
        ...(filters.endDate && { toDate: filters.endDate })
      });

      const response = await requestHandler.get(
        `${endpointsPath.auditLog}/export?${params}`,
        true,
        { responseType: 'blob' }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Audit logs exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export audit logs');
    }
  };

  // Clear old logs
  const clearOldLogs = async () => {
    if (!window.confirm('Are you sure you want to clear audit logs older than 90 days?')) {
      return;
    }

    try {
      const response = await requestHandler.deleteReq(
        `${endpointsPath.auditLog}/clear-old?daysToKeep=90`,
        true
      );

      if (response.statusCode === 200) {
        toast.success(response.message || 'Old audit logs cleared successfully');
        fetchAuditLogs();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to clear old logs');
    }
  };

  // View log details
  const viewLogDetails = (log) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setPage(1);
    fetchAuditLogs();
    if (showStatistics) {
      fetchStatistics();
    }
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      action: '',
      entityName: '',
      status: '',
      userId: '',
      startDate: '',
      endDate: ''
    });
    setPage(1);
  };

  const toggleStatistics = () => {
    setShowStatistics(!showStatistics);
    if (!showStatistics && !statistics) {
      fetchStatistics();
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page]);

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      'Success': { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
      'Failed': { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle className="w-3 h-3" /> },
      'Error': { bg: 'bg-red-50', text: 'text-red-700', icon: <AlertCircle className="w-3 h-3" /> },
      'Processing': { bg: 'bg-blue-100', text: 'text-blue-800', icon: <RefreshCw className="w-3 h-3" /> }
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: null };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        {status}
      </span>
    );
  };

  // Action badge component
  const ActionBadge = ({ action }) => {
    const actionConfig = {
      'GET': { bg: 'bg-blue-50', text: 'text-blue-700' },
      'POST': { bg: 'bg-green-50', text: 'text-green-700' },
      'PUT': { bg: 'bg-yellow-50', text: 'text-yellow-700' },
      'DELETE': { bg: 'bg-red-50', text: 'text-red-700' },
      'Created': { bg: 'bg-teal-50', text: 'text-teal-700' },
      'Updated': { bg: 'bg-indigo-50', text: 'text-indigo-700' },
      'Deleted': { bg: 'bg-rose-50', text: 'text-rose-700' }
    };

    const config = actionConfig[action] || { bg: 'bg-gray-100', text: 'text-gray-800' };

    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium ${config.bg} ${config.text}`}>
        {action}
      </span>
    );
  };

  // Format duration
  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Truncate text
  const truncateText = (text, maxLength = 50) => {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">Monitor and track all system activities and changes</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleStatistics}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <BarChart3 className="w-4 h-4" />
            {showStatistics ? 'Hide Stats' : 'Show Stats'}
          </button>
          {/*<button
            onClick={() => exportAuditLogs('csv')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>*/}
          {/*<button
            onClick={clearOldLogs}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700"
          >
            <Shield className="w-4 h-4" />
            Cleanup
          </button>*/}
        </div>
      </div>

      {/* Statistics Panel */}
      {showStatistics && statistics && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Activity Statistics</h2>
            {statsLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Total Requests</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{statistics.totalRequests || 0}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">Successful</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{statistics.successfulRequests || 0}</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-red-700">Errors</span>
              </div>
              <p className="text-2xl font-bold text-red-900">{statistics.errorRequests || 0}</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">Avg Duration</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">{formatDuration(statistics.averageDurationMs || 0)}</p>
            </div>
          </div>

          {/* Top Entities */}
          {statistics.topEntities && statistics.topEntities.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Entities</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {statistics.topEntities.map((entity, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">{entity.entityName}</p>
                    <p className="text-xs text-gray-600">{entity.count} actions</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Filter Audit Logs</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by endpoint, user, IP, or error..."
                className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Action */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="Created">Created</option>
              <option value="Updated">Updated</option>
              <option value="Deleted">Deleted</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
              <option value="Error">Error</option>
              <option value="Processing">Processing</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Entity Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entity</label>
            <select
              name="entityName"
              value={filters.entityName}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Entities</option>
              <option value="User">User</option>
              <option value="Product">Product</option>
              <option value="Order">Order</option>
              <option value="Banner">Banner</option>
              <option value="Category">Category</option>
              <option value="Transaction">Transaction</option>
              <option value="Coupon">Coupon</option>
            </select>
          </div>

          {/* User ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="userId"
                value={filters.userId}
                onChange={handleFilterChange}
                placeholder="Enter user ID..."
                className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={resetFilters}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset Filters
          </button>
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Audit Logs</h3>
              <p className="text-sm text-gray-600">
                Showing {auditLogs.length} of {totalRecords} records
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-3 text-gray-600">Loading audit logs...</p>
            </div>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
            <p className="text-gray-600">Try adjusting your filters or search criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoint</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(log.requestTime).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.requestTime).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">
                        {truncateText(log.endpoint, 40)}
                      </div>
                      {log.httpMethod && (
                        <div className="text-xs text-gray-500">
                          {log.httpMethod} • {log.statusCode}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {log.userEmail || 'System'}
                      </div>
                      {log.userId && (
                        <div className="text-xs text-gray-500">
                          ID: {truncateText(log.userId, 15)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {log.entityName || 'N/A'}
                      </div>
                      {log.entityId && (
                        <div className="text-xs text-gray-500">
                          ID: {truncateText(log.entityId, 15)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(log.durationMs)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => viewLogDetails(log)}
                        className="inline-flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {auditLogs.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
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

      {/* Log Details Modal */}
      {isModalOpen && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Audit Log Details</h3>
                <p className="text-sm text-gray-600">
                  {new Date(selectedLog.requestTime).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto max-h-[70vh] p-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Endpoint</h4>
                    <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                      {selectedLog.endpoint}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Action</h4>
                    <div className="inline-block">
                      <ActionBadge action={selectedLog.action} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                    <div className="inline-block">
                      <StatusBadge status={selectedLog.status} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">User</h4>
                    <p className="text-sm text-gray-900">
                      {selectedLog.userEmail || 'System'}
                      {selectedLog.userId && (
                        <span className="text-gray-500 ml-2">(ID: {selectedLog.userId})</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Entity</h4>
                    <p className="text-sm text-gray-900">
                      {selectedLog.entityName || 'N/A'}
                      {selectedLog.entityId && (
                        <span className="text-gray-500 ml-2">(ID: {selectedLog.entityId})</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">IP Address</h4>
                    <p className="text-sm text-gray-900">{selectedLog.ipAddress || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Request & Response */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {selectedLog.request && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Request</h4>
                    <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto max-h-60">
                      {JSON.stringify(JSON.parse(selectedLog.request), null, 2)}
                    </pre>
                  </div>
                )}
                {selectedLog.response && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Response</h4>
                    <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto max-h-60">
                      {JSON.stringify(JSON.parse(selectedLog.response), null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Changes */}
              {selectedLog.changes && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Changes</h4>
                  <pre className="text-xs bg-amber-50 p-3 rounded-lg overflow-x-auto max-h-60">
                    {JSON.stringify(JSON.parse(selectedLog.changes), null, 2)}
                  </pre>
                </div>
              )}

              {/* Error Details */}
              {selectedLog.errorMessage && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Error Details</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-red-800 mb-1">
                      {selectedLog.errorMessage}
                    </p>
                    {selectedLog.errorDetails && (
                      <pre className="text-xs text-red-700 mt-2 overflow-x-auto">
                        {selectedLog.errorDetails}
                      </pre>
                    )}
                  </div>
                </div>
              )}

              {/* Technical Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Technical Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="ml-2 text-gray-900">{formatDuration(selectedLog.durationMs)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status Code:</span>
                    <span className="ml-2 text-gray-900">{selectedLog.statusCode || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Method:</span>
                    <span className="ml-2 text-gray-900">{selectedLog.httpMethod || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">User Agent:</span>
                    <span className="ml-2 text-gray-900 text-xs">
                      {truncateText(selectedLog.userAgent, 40)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;