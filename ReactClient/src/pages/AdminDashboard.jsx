import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../utils/api';
import { Users, UserCheck, UserX, Clock, Download, Trash2, Edit, Plus, Settings, GitBranch, Workflow, Search, Filter } from 'lucide-react';
import EditAffiliateModal from '../components/EditAffiliateModal';
import AddDownlineModal from '../components/AddDownlineModal';
import EditDownlineModal from '../components/EditDownlineModal';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import VisualTree from '../components/VisualTree';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingAffiliates, setPendingAffiliates] = useState([]);
  const [allAffiliates, setAllAffiliates] = useState([]);
  const [downlines, setDownlines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState(null);
  const [showAddDownline, setShowAddDownline] = useState(false);
  const [editingDownline, setEditingDownline] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [affiliateFilter, setAffiliateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm('');
    setStatusFilter('');
    setAffiliateFilter('');
    loadData(1);
  }, [activeTab]);
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeTab === 'affiliates' || activeTab === 'downlines') {
        setCurrentPage(1);
        loadData(1);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, affiliateFilter]);

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (affiliateFilter && activeTab === 'downlines') params.append('sub1_affiliate', affiliateFilter);
      
      switch (activeTab) {
        case 'pending':
          const pendingResponse = await adminAPI.getPendingAffiliates();
          setPendingAffiliates(pendingResponse.data.affiliates);
          break;
        case 'affiliates':
          const affiliatesResponse = await fetch(`/api/admin/affiliates?${params}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          const affiliatesData = await affiliatesResponse.json();
          setAllAffiliates(affiliatesData.affiliates || []);
          setTotalPages(affiliatesData.totalPages || 1);
          setCurrentPage(affiliatesData.page || 1);
          setTotalRecords(affiliatesData.total || 0);
          break;
        case 'downlines':
          const downlinesResponse = await fetch(`/api/admin/downlines?${params}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          const downlinesData = await downlinesResponse.json();
          setDownlines(downlinesData.downlines || []);
          setTotalPages(downlinesData.totalPages || 1);
          setCurrentPage(downlinesData.page || 1);
          setTotalRecords(downlinesData.total || 0);
          break;
        case 'visual':
          // Visual tree component loads its own data
          break;
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      console.error('Active tab:', activeTab);
      // Set empty arrays to prevent white pages
      if (activeTab === 'affiliates') {
        setAllAffiliates([]);
      } else if (activeTab === 'downlines') {
        console.log('Setting empty downlines array');
        setDownlines([]);
      }
      setTotalPages(1);
      setCurrentPage(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await adminAPI.approveAffiliate(id);
      showToast('Affiliate approved successfully', 'success');
      loadData();
    } catch (error) {
      console.error('Failed to approve affiliate:', error);
      showToast('Failed to approve affiliate', 'error');
    }
  };

  const handleReject = async (id) => {
    try {
      await adminAPI.rejectAffiliate(id);
      showToast('Affiliate rejected successfully', 'success');
      loadData();
    } catch (error) {
      console.error('Failed to reject affiliate:', error);
      showToast('Failed to reject affiliate', 'error');
    }
  };

  const handleRemoveAffiliate = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Affiliate',
      message: 'This will permanently remove the affiliate and compress their downlines up one level.\n\nThis action cannot be undone. Continue?',
      type: 'danger',
      confirmText: 'Remove',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/affiliates/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason: 'Admin removal' })
          });
          const result = await response.json();
          loadData();
          showToast(`${result.message}\nCompressed downlines: ${result.compressedCount || 0}`, 'success');
        } catch (error) {
          console.error('Failed to remove affiliate:', error);
          showToast('Failed to remove affiliate', 'error');
        }
      }
    });
  };

  const handleCleanupTree = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cleanup Referral Tree',
      message: 'This will clean up orphaned downlines, fix broken hierarchy links, and remove duplicates.\n\nContinue?',
      type: 'warning',
      confirmText: 'Cleanup',
      onConfirm: async () => {
        try {
          const response = await fetch('/api/admin/cleanup-tree', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          const result = await response.json();
          
          showToast(`Cleanup Results:\n${result.message}\n\nOrphaned downlines removed: ${result.orphanedRemoved}\nBroken links fixed: ${result.brokenLinksFixed}`, 'success');
          loadData();
        } catch (error) {
          console.error('Cleanup failed:', error);
          showToast('Cleanup failed', 'error');
        }
      }
    });
  };

  const exportData = (type, filter = '') => {
    const token = localStorage.getItem('token');
    const url = `/api/admin/reports/${type}?format=csv${filter}`;
    
    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report.csv`;
      a.click();
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Unverified': 'bg-orange-100 text-orange-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Suspended': 'bg-gray-100 text-gray-800',
      'Banned': 'bg-red-200 text-red-900',
      'User Only': 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard V2.0 <span className="text-sm text-green-600">v2.0</span></h1>
              <p className="text-gray-600">Welcome back, {user?.username}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowReports(!showReports)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Reports</span>
              </button>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Panel */}
      {showReports && (
        <div className="bg-blue-50 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

            <h3 className="text-lg font-semibold mb-3">📊 Export Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => exportData('affiliates')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
              >
                📋 All Affiliates
              </button>
              <button
                onClick={() => exportData('affiliates', `&registrationMonth=${new Date().getMonth() + 1}`)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
              >
                📅 This Month
              </button>
              <button
                onClick={() => exportData('downlines')}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm"
              >
                👥 All Downlines
              </button>

            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <button
                onClick={() => setShowAddDownline(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Downline Manually</span>
              </button>
              <button
                onClick={handleCleanupTree}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm flex items-center justify-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Cleanup Referral Tree</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
            {[
              { id: 'pending', name: 'Pending Approvals', icon: Clock },
              { id: 'affiliates', name: 'All Affiliates', icon: Users },
              { id: 'downlines', name: 'Downlines', icon: UserCheck },
              { id: 'visual', name: 'Visual Tree', icon: Workflow }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-3 sm:px-1 border-b-2 font-medium text-sm flex items-center space-x-2 flex-shrink-0`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : (
            <>
              {/* Pending Affiliates */}
              {activeTab === 'pending' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Pending Affiliate Approvals
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Review and approve new affiliate registrations
                    </p>
                  </div>
                  {pendingAffiliates.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No pending affiliates</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {pendingAffiliates.map((affiliate) => (
                        <li key={affiliate.id} className="px-4 py-4 sm:px-6">
                          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                                <p className="text-sm font-medium text-blue-600 truncate">
                                  {affiliate.full_name}
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                  {!affiliate.email_verified && (
                                    <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full whitespace-nowrap">
                                      Email Unverified
                                    </span>
                                  )}
                                  {getStatusBadge(affiliate.status)}
                                </div>
                              </div>
                              <div className="mt-2 space-y-1 sm:space-y-0">
                                <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-6">
                                  <p className="text-sm text-gray-500 break-all">
                                    {affiliate.email}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    MT5: {affiliate.mt5_rebate_account}
                                  </p>
                                </div>
                                <p className="text-sm text-gray-500">
                                  Registered: {formatDate(affiliate.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 sm:ml-4">
                              <button
                                onClick={() => handleApprove(affiliate.id)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(affiliate.id)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleRemoveAffiliate(affiliate.id)}
                                className="bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded text-sm font-medium flex items-center justify-center space-x-1"
                                title="Remove & Compress Downlines"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* All Affiliates */}
              {activeTab === 'affiliates' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <div className="px-4 py-5 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        All Affiliates
                      </h3>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Search affiliates..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">All Status</option>
                          <option value="Approved">Approved</option>
                          <option value="Pending">Pending</option>
                          <option value="Unverified">Unverified</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Suspended">Suspended</option>
                          <option value="Banned">Banned</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Affiliate Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Registered
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {allAffiliates.map((affiliate) => (
                          <tr key={affiliate.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {affiliate.full_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {affiliate.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {affiliate.affiliate_code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(affiliate.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(affiliate.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setEditingAffiliate(affiliate)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Edit Affiliate"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRemoveAffiliate(affiliate.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Remove & Compress"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination for Affiliates */}
                  <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-sm text-gray-700">
                      Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalRecords)} of {totalRecords} affiliates
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => loadData(1)}
                          disabled={currentPage === 1}
                          className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          First
                        </button>
                        <button
                          onClick={() => loadData(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1 text-sm text-gray-700">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => loadData(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Next
                        </button>
                        <button
                          onClick={() => loadData(totalPages)}
                          disabled={currentPage === totalPages}
                          className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Last
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Downlines */}
              {activeTab === 'downlines' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <div className="px-4 py-5 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        All Downlines
                      </h3>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Search downlines..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">All Status</option>
                          <option value="User Only">User Only</option>
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Suspended">Suspended</option>
                          <option value="Banned">Banned</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Filter by affiliate code..."
                          value={affiliateFilter}
                          onChange={(e) => setAffiliateFilter(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sub1 (Direct)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sub2 (Upline)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {downlines.map((downline) => (
                          <tr key={downline.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {downline.full_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {downline.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {downline.sub1_name} ({downline.sub1_code})
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {downline.sub2_name ? `${downline.sub2_name} (${downline.sub2_code})` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(downline.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() => setEditingDownline(downline)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit Downline"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination for Downlines */}
                  <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-sm text-gray-700">
                      Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalRecords)} of {totalRecords} downlines
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => loadData(1)}
                          disabled={currentPage === 1}
                          className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          First
                        </button>
                        <button
                          onClick={() => loadData(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1 text-sm text-gray-700">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => loadData(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Next
                        </button>
                        <button
                          onClick={() => loadData(totalPages)}
                          disabled={currentPage === totalPages}
                          className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Last
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Visual Tree */}
              {activeTab === 'visual' && (
                <div>
                  {console.log('Rendering Visual Tree')}
                  <VisualTree />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <EditAffiliateModal
        affiliate={editingAffiliate}
        isOpen={!!editingAffiliate}
        onClose={() => setEditingAffiliate(null)}
        onSave={loadData}
      />
      
      <AddDownlineModal
        isOpen={showAddDownline}
        onClose={() => setShowAddDownline(false)}
        onSave={loadData}
      />
      
      <EditDownlineModal
        isOpen={!!editingDownline}
        onClose={() => setEditingDownline(null)}
        onSave={loadData}
        downline={editingDownline}
      />
      
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText}
      />
      
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
};

export default AdminDashboard;