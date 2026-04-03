import { useState } from 'react';
import { toast } from 'react-toastify';
import requestHandler from '../../utils/requestHandler';
import endpointsPath from '../../constants/EndpointsPath';
import ClassStyle from '../../class-styles';
import { useParams } from 'react-router-dom';

const UpdateUserPassword = () => {
    const { userId } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e, setter) => {
    setter(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsLoading(true);


    const data = {
        "newPassword": newPassword,
        "confirmPassword": confirmNewPassword
      } 

    try {
      const response = await requestHandler.put(`${endpointsPath.profile}/${userId}/update-password`, data, true);

      if (response.statusCode !== 200) {
        toast.error(response.result.message || 'Error updating password');
      } else {
        toast.success(response.result.message);
        setNewPassword('')
        setConfirmNewPassword('')
      }
    } catch (error) {
      console.log('Error:', error);
      toast.error('Error updating password');
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4 p-6 bg-white rounded-2xl shadow-sm">
        {/*<h2 className="text-lg font-semibold text-gray-700">Update Password</h2>*/}
      <div className="mb-4">
        <label className={ClassStyle.label1} htmlFor="newPassword">New Password</label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => handleChange(e, setNewPassword)}
          className={ClassStyle.input}
        />
      </div>
      <div className="mb-4">
        <label className={ClassStyle.label1} htmlFor="confirmNewPassword">Confirm New Password</label>
        <input
          id="confirmNewPassword"
          name="confirmNewPassword"
          type="password"
          value={confirmNewPassword}
          onChange={(e) => handleChange(e, setConfirmNewPassword)}
          className={ClassStyle.input}
        />
      </div>
      <div className="flex items-center justify-between">
        <button
          className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isLoading ? 'opacity-50 cursor-not-allowed w-full' : 'w-full'}`}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Updating...' : 'Update Password'}
        </button>
      </div>
      </div>
    </form>
  );
};

export default UpdateUserPassword;