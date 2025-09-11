import { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';

const VisualTree = () => {
  const [affiliates, setAffiliates] = useState([]);
  const [downlines, setDownlines] = useState([]);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [affiliatesRes, downlinesRes] = await Promise.all([
        fetch('/api/admin/affiliates', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/admin/downlines', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const affiliatesData = await affiliatesRes.json();
      const downlinesData = await downlinesRes.json();
      
      setAffiliates(affiliatesData.affiliates);
      setDownlines(downlinesData.downlines);
      
      if (affiliatesData.affiliates.length > 0) {
        setSelectedAffiliate(affiliatesData.affiliates[0]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAffiliateDownlines = (affiliateId) => {
    return downlines.filter(d => d.sub1_affiliate_id === affiliateId);
  };

  const getAffiliateTree = (affiliateId) => {
    const directDownlines = getAffiliateDownlines(affiliateId);
    const subAffiliates = affiliates.filter(a => 
      downlines.some(d => d.sub2_affiliate_id === affiliateId && d.sub1_affiliate_id === a.id)
    );
    
    return {
      direct: directDownlines.filter(d => !subAffiliates.some(a => a.id === d.sub1_affiliate_id)),
      subAffiliates: subAffiliates.map(subAffiliate => ({
        ...subAffiliate,
        downlines: getAffiliateDownlines(subAffiliate.id)
      }))
    };
  };



  const renderTree = () => {
    if (!selectedAffiliate) return null;
    
    const tree = getAffiliateTree(selectedAffiliate.id);
    const totalDirectDownlines = tree.direct.length;
    const totalSubAffiliates = tree.subAffiliates.length;
    const totalSubDownlines = tree.subAffiliates.reduce((sum, sub) => sum + (sub.downlines?.length || 0), 0);
    
    // Debug: Check data structure
    if (tree.direct.length > 0) {
      console.log('Direct downlines data:', tree.direct[0]);
    }
    
    return (
      <div className="space-y-4">
        {/* Root Affiliate */}
        <div className="flex justify-center">
          <div className="bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg text-center min-w-[200px]">
            <div className="font-bold text-lg">{selectedAffiliate.full_name}</div>
            <div className="text-sm opacity-90">{selectedAffiliate.affiliate_code}</div>
            <div className="text-xs mt-2 bg-blue-500 px-2 py-1 rounded">Root Affiliate</div>
          </div>
        </div>

        {/* Connection Line */}
        <div className="flex justify-center">
          <div className="w-0.5 h-8 bg-gray-400"></div>
        </div>

        {/* Level 1: Direct Children */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Direct Downlines */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-semibold text-green-800 flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                Direct Downlines
              </h5>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                {totalDirectDownlines}
              </span>
            </div>
            
            {totalDirectDownlines > 0 ? (
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-green-100 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-medium">Name</th>
                      <th className="text-left p-2 font-medium">MT5 Account</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tree.direct.map((downline, index) => (
                      <tr key={downline.id} className={index % 2 === 0 ? 'bg-white' : 'bg-green-25'}>
                        <td className="p-2 border-b border-green-100">
                          {downline.name || downline.full_name || downline.client_name || 'Unknown'}
                        </td>
                        <td className="p-2 border-b border-green-100">
                          {downline.mt5_rebate_account || downline.mt5_account || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-green-600 py-4 text-sm">No direct downlines</div>
            )}
          </div>

          {/* Sub-Affiliates */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-semibold text-blue-800 flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                Sub-Affiliates
              </h5>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                {totalSubAffiliates}
              </span>
            </div>
            
            {totalSubAffiliates > 0 ? (
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-blue-100 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-medium">Name</th>
                      <th className="text-left p-2 font-medium">Code</th>
                      <th className="text-left p-2 font-medium">Downlines</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tree.subAffiliates.map((subAffiliate, index) => (
                      <tr key={subAffiliate.id} className={index % 2 === 0 ? 'bg-white' : 'bg-blue-25'}>
                        <td className="p-2 border-b border-blue-100">{subAffiliate.full_name}</td>
                        <td className="p-2 border-b border-blue-100">{subAffiliate.affiliate_code}</td>
                        <td className="p-2 border-b border-blue-100">{subAffiliate.downlines?.length || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-blue-600 py-4 text-sm">No sub-affiliates</div>
            )}
          </div>
        </div>

        {/* Level 2: Sub-Downlines (if any) */}
        {totalSubDownlines > 0 && (
          <>
            <div className="flex justify-center">
              <div className="w-0.5 h-6 bg-gray-300"></div>
            </div>
            
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-semibold text-purple-800 flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                  Sub-Downlines (Level 2)
                </h5>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-medium">
                  {totalSubDownlines}
                </span>
              </div>
              
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-purple-100 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-medium">Name</th>
                      <th className="text-left p-2 font-medium">MT5 Account</th>
                      <th className="text-left p-2 font-medium">Under Affiliate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tree.subAffiliates.map(subAffiliate => 
                      subAffiliate.downlines?.map((downline, index) => (
                        <tr key={`${subAffiliate.id}-${downline.id}`} className={index % 2 === 0 ? 'bg-white' : 'bg-purple-25'}>
                          <td className="p-2 border-b border-purple-100">
                            {downline.name || downline.full_name || 'Unknown'}
                          </td>
                          <td className="p-2 border-b border-purple-100">
                            {downline.mt5_rebate_account || 'N/A'}
                          </td>
                          <td className="p-2 border-b border-purple-100">
                            {subAffiliate.full_name}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Summary */}
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalSubAffiliates}</div>
              <div className="text-xs text-gray-600">Sub-Affiliates</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{totalDirectDownlines}</div>
              <div className="text-xs text-gray-600">Direct Downlines</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{totalSubDownlines}</div>
              <div className="text-xs text-gray-600">Sub-Downlines</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{totalSubAffiliates + totalDirectDownlines + totalSubDownlines}</div>
              <div className="text-xs text-gray-600">Total Network</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading visual tree...</span>
      </div>
    );
  }

  const approvedAffiliates = affiliates.filter(a => a.status === 'Approved');
  const filteredAffiliates = approvedAffiliates.filter(a => 
    a.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.affiliate_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            🌳 Affiliate Tree Visualization
          </h3>
          
          {/* Search */}
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
        </div>
      </div>

      {/* Affiliate List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <span className="text-sm text-gray-600">
            {filteredAffiliates.length} of {approvedAffiliates.length} affiliates
          </span>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left p-3 font-medium text-gray-700">Affiliate</th>
                <th className="text-left p-3 font-medium text-gray-700">Code</th>
                <th className="text-center p-3 font-medium text-gray-700">Downlines</th>
                <th className="text-center p-3 font-medium text-gray-700">Sub-Affiliates</th>
                <th className="text-center p-3 font-medium text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAffiliates.map(affiliate => {
                const downlineCount = getAffiliateDownlines(affiliate.id).length;
                const subAffiliateCount = affiliates.filter(a => 
                  downlines.some(d => d.sub2_affiliate_id === affiliate.id && d.sub1_affiliate_id === a.id)
                ).length;
                
                return (
                  <tr 
                    key={affiliate.id}
                    className={`border-b hover:bg-gray-50 ${
                      selectedAffiliate?.id === affiliate.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="p-3">
                      <div className="font-medium text-gray-900">{affiliate.full_name}</div>
                    </td>
                    <td className="p-3 text-gray-600">{affiliate.affiliate_code}</td>
                    <td className="p-3 text-center">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                        {downlineCount}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {subAffiliateCount}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedAffiliate(affiliate)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        View Tree
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hierarchy View */}
      {selectedAffiliate && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">
              {selectedAffiliate.full_name}'s Tree
            </h4>
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-600 rounded mr-1"></div>
                <span>Affiliates</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
                <span>Downlines</span>
              </div>
            </div>
          </div>
          
          {renderTree()}
        </div>
      )}
    </div>
  );
};

export default VisualTree;