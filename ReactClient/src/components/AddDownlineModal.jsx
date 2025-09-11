import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import Toast from './Toast';

const AddDownlineModal = ({ isOpen, onClose, onSave }) => {
  const { toast, showToast, hideToast } = useToast();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    sub1_affiliate_code: ''
  });
  const [affiliates, setAffiliates] = useState([]);
  const [emailValidation, setEmailValidation] = useState({ isChecking: false, exists: false, details: null });

  useEffect(() => {
    if (isOpen) {
      loadAffiliates();
    }
  }, [isOpen]);

  const loadAffiliates = async () => {
    try {
      const response = await fetch('/api/admin/affiliates?status=Approved', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setAffiliates(data.affiliates);
    } catch (error) {
      console.error('Failed to load affiliates:', error);
      showToast('Failed to load affiliates', 'error');
    }
  };

  const checkEmailExists = async (email) => {
    if (!email || email.length < 3) {
      setEmailValidation({ isChecking: false, exists: false, details: null });
      return;
    }

    setEmailValidation({ isChecking: true, exists: false, details: null });
    
    try {
      // Check affiliates
      const affiliateResponse = await fetch(`/api/admin/affiliates?search=${encodeURIComponent(email)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const affiliateData = await affiliateResponse.json();
      const existingAffiliate = affiliateData.affiliates?.find(a => a.email.toLowerCase() === email.toLowerCase());
      
      if (existingAffiliate) {
        setEmailValidation({ 
          isChecking: false, 
          exists: true, 
          details: { type: 'affiliate', name: existingAffiliate.full_name, status: existingAffiliate.status }
        });
        return;
      }

      // Check downlines
      const downlineResponse = await fetch(`/api/admin/downlines?search=${encodeURIComponent(email)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const downlineData = await downlineResponse.json();
      const existingDownline = downlineData.downlines?.find(d => d.email.toLowerCase() === email.toLowerCase());
      
      if (existingDownline) {
        setEmailValidation({ 
          isChecking: false, 
          exists: true, 
          details: { type: 'downline', name: existingDownline.full_name }
        });
        return;
      }

      setEmailValidation({ isChecking: false, exists: false, details: null });
    } catch (error) {
      console.error('Email check failed:', error);
      setEmailValidation({ isChecking: false, exists: false, details: null });
    }
  };

  // Debounced email check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.email) {
        checkEmailExists(formData.email);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/downlines', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        showToast('Downline added successfully', 'success');
        onSave();
        onClose();
        setFormData({ full_name: '', email: '', sub1_affiliate_code: '' });
        setEmailValidation({ isChecking: false, exists: false, details: null });
      } else {
        const errorData = await response.json();
        if (response.status === 409) {
          showToast(errorData.message, 'warning');
        } else {
          showToast('Failed to add downline', 'error');
        }
      }
    } catch (error) {
      console.error('Failed to add downline:', error);
      showToast('Failed to add downline', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Add Downline Manually</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={`mt-1 block w-full border rounded-md px-3 py-2 pr-10 ${
                  emailValidation.exists 
                    ? 'border-red-300 bg-red-50' 
                    : emailValidation.isChecking 
                    ? 'border-yellow-300 bg-yellow-50'
                    : 'border-gray-300'
                }`}
                required
              />
              {emailValidation.isChecking && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            {emailValidation.exists && emailValidation.details && (
              <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                ⚠️ Email already exists as {emailValidation.details.type}: <strong>{emailValidation.details.name}</strong>
                {emailValidation.details.status && ` (${emailValidation.details.status})`}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Sub1 (Direct Referrer)</label>
            <select
              value={formData.sub1_affiliate_code}
              onChange={(e) => setFormData({...formData, sub1_affiliate_code: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            >
              <option value="">Select Sub1 Affiliate</option>
              {affiliates.map(affiliate => (
                <option key={affiliate.id} value={affiliate.affiliate_code}>
                  {affiliate.full_name} ({affiliate.affiliate_code})
                </option>
              ))}
            </select>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Sub2 (Upline) will be automatically determined based on who referred the Sub1 affiliate.
            </p>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={emailValidation.exists || emailValidation.isChecking}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Downline
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
        
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={hideToast}
        />
      </div>
    </div>
  );
};

export default AddDownlineModal;