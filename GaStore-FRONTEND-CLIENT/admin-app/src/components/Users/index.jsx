import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';
import Pagination from '../Pagination';
import { Link } from 'react-router-dom';
import { Menu, MenuItem, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControlLabel, Checkbox } from '@mui/material';
import { MoreVert, Block, LockOpen, Delete, Update, Password, AdminPanelSettings } from '@mui/icons-material';
import { User } from 'lucide-react';

const UserProfilesList = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchName, setSearchName] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  // Add state for admin dialog
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [updatingAdmin, setUpdatingAdmin] = useState(false);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const response = await requestHandler.get(
        `${endpointsPath.user}?pageNumber=${page}&pageSize=${pageSize}` +
        `${searchEmail ? `&searchEmail=${searchEmail}` : ''}` +
        `${searchName ? `&searchName=${searchName}` : ''}`,
        true
      );

      if (response.statusCode === 200) {
        setProfiles(response.result.data || []);
        setTotalRecords(response.result.totalRecords || 0);
        setTotalPages(response.result.totalPages || 1);
      } else {
        throw new Error(response.message || 'Failed to fetch profiles');
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      toast.error(error.message || 'Failed to load user profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  // Open admin update dialog
  const handleOpenAdminDialog = () => {
    if (!selectedUser) return;
    
    setIsAdmin(selectedUser?.isAdmin || false);
    setIsSuperAdmin(selectedUser?.isSuperAdmin || false);
    setAdminDialogOpen(true);
  };

  // Close admin dialog
  const handleCloseAdminDialog = () => {
    setAdminDialogOpen(false);
    setIsAdmin(false);
    setIsSuperAdmin(false);
  };

  // Handle updating admin status
  const handleUpdateAdminStatus = async () => {
    if (!selectedUser) return;
    
    setUpdatingAdmin(true);
    try {
      const response = await requestHandler.put(
        `${endpointsPath.user}/make-admin`,
        {
          id: selectedUser.id,
          isAdmin: isAdmin,
          isSuperAdmin: isSuperAdmin
        },
        true
      );

      if (response.statusCode === 200) {
        toast.success(`Admin status updated successfully`);
        fetchProfiles();
        handleCloseAdminDialog();
        handleMenuClose();
      } else {
        throw new Error(response.message || 'Failed to update admin status');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update admin status');
    } finally {
      setUpdatingAdmin(false);
    }
  };

  const handleBlockUser = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await requestHandler.put(
        `${endpointsPath.auth}/block-or-unblock-user/${selectedUser.id}`,
        {},
        true
      );

      if (response.statusCode === 200) {
        toast.success(`User ${selectedUser.isBlocked ? 'unblocked' : 'blocked'} successfully`);
        fetchProfiles();
      } else {
        throw new Error(response.message || 'Failed to update user status');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update user status');
    } finally {
      handleMenuClose();
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedUser.email}? This action cannot be undone.`)) {
      handleMenuClose();
      return;
    }

    try {
      const response = await requestHandler.delete(
        `${endpointsPath.user}/${selectedUser.id}`,
        true
      );

      if (response.statusCode === 200) {
        toast.success('User deleted successfully');
        fetchProfiles();
      } else {
        throw new Error(response.message || 'Failed to delete user');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete user');
    } finally {
      handleMenuClose();
    }
  };

  const handleSearch = () => {
    setPage(1); // Reset to first page when searching
    fetchProfiles();
  };

  useEffect(() => {
    fetchProfiles();
  }, [page]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto md:px-4 px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        {/* Search Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-start block text-sm font-medium text-gray-700 mb-1">Total ({totalRecords})</label>
          </div>
          
          <div>
            <div className="flex">
              <input
                type="text"
                placeholder="Email, Phone, Name, country, etc."
                className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-brand text-white rounded-r-md hover:bg-primary-dark"
              >
                Search
              </button>
              <Link
                to={'/users/new'}
                className="px-4 py-2 bg-green-500 text-white rounded-r-md hover:bg-green-dark ml-2"
              >
                Add New
              </Link>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No user profiles found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-start">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referrals</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {profiles.map((user) => (
                  <tr key={user?.id} className={`hover:bg-gray-50 ${user?.isBlocked ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={user?.profile? `/profile/${user?.id}` : `#`}
                      onClick={()=>user?.profile? {} : toast.error("User is yet to setup profile")}
                      >
                      <div className="flex items-center">
                        {user?.profile?.profilePictureUrl ? (
                          <img
                            className="h-10 w-10 rounded-full mr-3"
                            src={user?.profile?.profilePictureUrl}
                            alt={`${user?.firstName} ${user?.lastName}`}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <span className="text-gray-500">
                              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {user?.firstName} {user?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user?.profile?.middleName}
                          </div>
                        </div>
                      </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user?.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user?.profile?.phoneNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user?.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user?.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user?.isSuperAdmin? 'Super Admin' : user?.isAdmin? 'Admin' : 'User'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user?.referrals.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <IconButton
                        aria-label="more"
                        aria-controls="user-actions-menu"
                        aria-haspopup="true"
                        onClick={(e) => handleMenuOpen(e, user)}
                      >
                        <MoreVert />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {profiles.length > 0 && (
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

        {/* User Actions Menu */}
        <Menu
          id="user-actions-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleBlockUser}>
            {selectedUser?.isBlocked ? (
              <>
                <LockOpen fontSize="small" className="mr-2" />
                Unblock User
              </>
            ) : (
              <>
                <Block fontSize="small" className="mr-2" />
                Block User
              </>
            )}
          </MenuItem>
          <MenuItem onClick={()=>window.location.href=`/profile/${selectedUser.id}`}>
            <User fontSize="small" className="mr-2" />
            View Profile
          </MenuItem>
          <MenuItem onClick={handleOpenAdminDialog}>
            <AdminPanelSettings fontSize="small" className="mr-2" />
            Update Account Type
          </MenuItem>
          <MenuItem onClick={()=>window.location.href=`/profile/${selectedUser.id}/password-update`}>
            <Password fontSize="small" className="mr-2" />
            Update Password
          </MenuItem>
          {/*<MenuItem onClick={handleDeleteUser}>
            <Delete fontSize="small" className="mr-2" />
            Delete User
          </MenuItem>*/}
        </Menu>

        {/* Update Account Type Dialog */}
        <Dialog open={adminDialogOpen} onClose={handleCloseAdminDialog}>
          <DialogTitle>Update Account Type for {selectedUser?.firstName} {selectedUser?.lastName}</DialogTitle>
          <DialogContent>
            <div className="space-y-4 pt-4">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                    color="primary"
                  />
                }
                label="Make Admin"
              />
              <div className="text-sm text-gray-500 ml-4">
                Admin users have access to administrative features
              </div>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isSuperAdmin}
                    onChange={(e) => setIsSuperAdmin(e.target.checked)}
                    color="primary"
                    disabled={!isAdmin} // Super Admin should only be selectable if Admin is checked
                  />
                }
                label="Make Super Admin"
              />
              <div className="text-sm text-gray-500 ml-4">
                Super Admin users have full system access and can manage other admins
              </div>
              
              {selectedUser && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <div className="text-sm font-medium">Current Status:</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {selectedUser?.isSuperAdmin ? 'Super Admin' : selectedUser?.isAdmin ? 'Admin' : 'Regular User'}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAdminDialog} color="secondary">
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateAdminStatus} 
              color="primary" 
              variant="contained"
              disabled={updatingAdmin}
            >
              {updatingAdmin ? 'Updating...' : 'Update Account Type'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default UserProfilesList;