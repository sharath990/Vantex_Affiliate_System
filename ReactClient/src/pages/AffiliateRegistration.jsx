import { useState, useEffect } from 'react';
import { affiliateAPI } from '../utils/api';
import { UserPlus, Mail, User, CreditCard, Phone, Link, CheckCircle, AlertCircle, BookOpen, Users, Shield } from 'lucide-react';



const AffiliateRegistration = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mt5_rebate_account: '',
    contact_details: '',
    ox_ib_link: '',
    referrer_code: ''
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
      const response = await affiliateAPI.register(formData);
      setSuccess(true);
      
      if (response.data.requiresVerification) {
        setMessage(`Registration successful! Your affiliate code is: ${response.data.affiliate_code}\n\nPlease check your email to verify your account.`);
      } else {
        setMessage(`Registration successful! Your affiliate code is: ${response.data.affiliate_code}`);
      }
      
      if (response.data.flagged) {
        setMessage(prev => prev + '\n\nNote: Your registration is under review due to security checks.');
      }
      
      setFormData({
        full_name: '',
        email: '',
        mt5_rebate_account: '',
        contact_details: '',
        ox_ib_link: '',
        referrer_code: ''
      });
    } catch (error) {
      setSuccess(false);
      if (error.response?.status === 429) {
        setMessage('Too many registration attempts. Please try again later.');
      } else {
        setMessage(error.response?.data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Vantex Affiliate</h1>
                <p className="text-sm text-gray-600">Registration Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a 
                href="/downlines" 
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors duration-200"
              >
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Manage Downlines</span>
              </a>
              <a 
                href="/admin/login" 
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Admin Login</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-screen flex">
        {/* Left Side - Hero Section */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-green-600 p-8 flex-col justify-center">
          <div className="text-white">
            <div className="h-14 w-14 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-3">
              Join Our Affiliate Program
            </h2>
            <p className="text-lg mb-6 text-blue-100">
              Start earning commissions by referring clients to our trading platform
            </p>
            
            {/* Benefits */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">High Commissions</h3>
                  <p className="text-blue-100 text-sm">Earn competitive rebates on every trade</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Multi-Level System</h3>
                  <p className="text-blue-100 text-sm">Build your network with Sub1 & Sub2 levels</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Full Support</h3>
                  <p className="text-blue-100 text-sm">Training materials and dedicated support</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md">
            {/* Mobile Hero */}
            <div className="lg:hidden text-center mb-6">
              <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mb-3">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Join Our Affiliate Program
              </h2>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Create Your Account</h3>
                <p className="text-gray-600 text-sm">Fill out the form below to get started</p>
              </div>

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
                {/* Full Name & Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        name="full_name"
                        required
                        value={formData.full_name}
                        onChange={handleChange}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                        placeholder="Your name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                </div>

                {/* MT5 Account */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">MT5 Rebate Account *</label>
                  <div className="relative">
                    <CreditCard className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="mt5_rebate_account"
                      required
                      value={formData.mt5_rebate_account}
                      onChange={handleChange}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                      placeholder="MT5 account number"
                    />
                  </div>
                </div>

                {/* Contact Details */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Details</label>
                  <div className="relative">
                    <Phone className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                    <textarea
                      name="contact_details"
                      value={formData.contact_details}
                      onChange={handleChange}
                      rows={2}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none text-sm"
                      placeholder="Phone, WhatsApp, Telegram, etc."
                    />
                  </div>
                </div>

                {/* OX IB Link */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">OX IB Link</label>
                  <div className="relative">
                    <Link className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="url"
                      name="ox_ib_link"
                      value={formData.ox_ib_link}
                      onChange={handleChange}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                      placeholder="https://your-ib-link.com"
                    />
                  </div>
                </div>

                {/* Referrer Code */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Referrer Code (Optional)</label>
                  <div className="relative">
                    <Users className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="referrer_code"
                      value={formData.referrer_code}
                      onChange={(e) => setFormData({...formData, referrer_code: e.target.value.toUpperCase()})}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                      placeholder="VTX00001"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing Registration...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <UserPlus className="h-5 w-5" />
                    <span>Register as Affiliate</span>
                  </div>
                )}
              </button>
            </form>

              {/* Footer Info */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">
                  <strong>Important:</strong> Apply for IB account via Ox Securities first.
                </p>
                <p className="text-xs text-gray-500">
                  * Required fields • Secure & encrypted
                </p>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateRegistration;