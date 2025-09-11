import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import Toast from './Toast';

const EditAffiliateModal = ({ affiliate, isOpen, onClose, onSave }) => {
  const { toast, showToast, hideToast } = useToast();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mt5_rebate_account: '',
    contact_details: '',
    ox_ib_link: '',
    status: 'Pending'
  });

  useEffect(() => {
    if (affiliate && isOpen) {
      setFormData({
        full_name: affiliate.full_name || '',
        email: affiliate.email || '',
        mt5_rebate_account: affiliate.mt5_rebate_account || '',
        contact_details: affiliate.contact_details || '',
        ox_ib_link: affiliate.ox_ib_link || '',
        status: affiliate.status || 'Pending'
      });
    }
  }, [affiliate, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/affiliates/${affiliate.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        showToast('Affiliate updated successfully', 'success');
        onSave();
        onClose();
      } else {
        showToast('Failed to update affiliate', 'error');
      }
    } catch (error) {
      console.error('Failed to update affiliate:', error);
      showToast('Failed to update affiliate', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Edit Affiliate</h3>
        
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
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">MT5 Account</label>
            <input
              type="text"
              value={formData.mt5_rebate_account}
              onChange={(e) => setFormData({...formData, mt5_rebate_account: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Details</label>
            <textarea
              value={formData.contact_details}
              onChange={(e) => setFormData({...formData, contact_details: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              rows="2"
              placeholder="Enter contact details"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">OX IB Link</label>
            <input
              type="url"
              value={formData.ox_ib_link}
              onChange={(e) => setFormData({...formData, ox_ib_link: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Enter OX IB link"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Suspended">Suspended</option>
              <option value="Banned">Banned</option>
            </select>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Save Changes
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

export default EditAffiliateModal;