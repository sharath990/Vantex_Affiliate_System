import { useState } from 'react';
import { affiliateAPI } from '../utils/api';
import { Users, User, Mail, CheckCircle, AlertCircle, UserPlus } from 'lucide-react';

const DownlineManagement = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    affiliate_code: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await affiliateAPI.addDownline(formData);
      setSuccess(true);
      setMessage('Downline added successfully!');
      setFormData({
        full_name: '',
        email: '',
        affiliate_code: ''
      });
    } catch (error) {
      setSuccess(false);
      setMessage(error.response?.data?.message || 'Failed to add downline');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-md w-full flex flex-col justify-center min-h-0">
        {/* Header */}
        <div className="text-center mb-4 flex-shrink-0">
          <div className="mx-auto h-12 w-12 bg-green-600 rounded-full flex items-center justify-center mb-3">
            <Users className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Add Downline
          </h2>
          <p className="text-gray-600 text-sm">
            Expand your affiliate network
          </p>
        </div>
        
        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex-shrink-0">
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
              success 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {success ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span className="text-sm font-medium">{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Affiliate Code Field */}
            <div>
              <label htmlFor="affiliate_code" className="block text-sm font-semibold text-gray-700 mb-2">
                Your Affiliate Code *
              </label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="affiliate_code"
                  name="affiliate_code"
                  type="text"
                  required
                  value={formData.affiliate_code}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="VTX00001"
                />
              </div>
            </div>

            {/* Full Name Field */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-semibold text-gray-700 mb-2">
                Downline Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter downline's full name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Downline Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="downline@email.com"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Adding Downline...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Add Downline</span>
                </div>
              )}
            </button>
          </form>
          
          {/* Footer */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              * Required fields • Downline will be notified via email
            </p>
          </div>
        </div>
        
        {/* Back to Registration Link */}
        <div className="text-center mt-3 flex-shrink-0">
          <a 
            href="/" 
            className="text-green-600 hover:text-green-700 text-sm font-medium transition-colors duration-200"
          >
            ← Back to Affiliate Registration
          </a>
        </div>
      </div>
    </div>
  );
};

export default DownlineManagement;