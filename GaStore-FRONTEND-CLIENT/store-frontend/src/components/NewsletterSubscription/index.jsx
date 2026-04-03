"use client"
import { useState } from 'react';
import toast from 'react-hot-toast';
import requestHandler from '@/utils/requestHandler';
import endpointsPath from '@/constants/EndpointsPath';

const NewsletterSubscription = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await requestHandler.post(`${endpointsPath.subscriber}/subscribe`, {
        email,
        subscriptionSource: 'website-footer' // or wherever this component is placed
      }, false);

      if (response.statusCode === 201) {
        toast.success(response.result.message);
        setIsSubscribed(true);
        setEmail('');
      } else if (response.statusCode === 200) {
        toast.success(response.result.message);
        setIsSubscribed(true);
        setEmail('');
      } else {
        toast.error(response.result.message);
      }
    } catch (error) {
      if (error.response?.status === 400) {
        toast.info('You are already subscribed');
      } else {
        toast.error('Subscription failed. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className="mb-6">
        <h3 className="text-white text-lg font-semibold mb-4">Newsletter</h3>
        <p className="text-green-400 mb-4">Thank you for subscribing!</p>
        <button 
          onClick={() => setIsSubscribed(false)}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          Subscribe another email
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-white text-lg font-semibold mb-4">Newsletter</h3>
      <p className="mb-4">Subscribe to get updates on new arrivals and special offers.</p>
      
      <form onSubmit={handleSubmit} className="flex">
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address" 
          className="bg-gray-800 text-white px-4 py-2 w-full rounded-l focus:outline-none"
          required
        />
        <button 
          type="submit"
          disabled={isLoading}
          className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Subscribing...' : 'Subscribe'}
        </button>
      </form>
      
      <p className="text-xs mt-2 text-gray-500">
        We respect your privacy. Unsubscribe at any time.
      </p>
    </div>
  );
};

export default NewsletterSubscription;