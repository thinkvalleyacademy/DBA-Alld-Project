import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../components/apiService';
import { getMemberStatusMeta, normalizeMemberStatus } from '../utility/memberStatus';

const DuplicateMembers = () => {
  const { user } = useAuth();
  const [allDuplicates, setAllDuplicates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('ACTIVE');
  const [mobileFilter, setMobileFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [memberTypeFilter, setMemberTypeFilter] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Filter duplicates based on selected filters
  const duplicates = useMemo(() => {
    return allDuplicates.filter(member => {
      const mobileMatch = !mobileFilter || member.mobile === mobileFilter.trim();
      const statusMatch = !statusFilter || normalizeMemberStatus(member.status) === statusFilter;
      const memberTypeMatch = !memberTypeFilter || String(member.gm_lm_member_type) === memberTypeFilter;
      return mobileMatch && statusMatch && memberTypeMatch;
    });
  }, [allDuplicates, mobileFilter, statusFilter, memberTypeFilter]);

  // Check admin access
  useEffect(() => {
    if (user?.roleId !== 1) {
      setError('Access denied. Only administrators can view this page.');
    }
  }, [user]);

  // Fetch duplicate members
  const fetchDuplicates = async () => {
    if (user?.roleId !== 1) return;

    setLoading(true);
    setError('');
    try {
      const response = await apiService.getDuplicateMembers(mobileFilter.trim() || null);

      if (response?.data?.status === 200) {
        setAllDuplicates(response.data.data || []);
        setSelectedMembers([]);
      } else {
        setError('Failed to fetch duplicate members');
      }
    } catch (err) {
      setError(`Error fetching duplicates: ${err.message}`);
      console.error('Fetch duplicates error:', err);
    }
    setLoading(false);
  };

  // Initial load
  useEffect(() => {
    if (user?.roleId === 1) {
      fetchDuplicates();
    }
  }, [user]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchDuplicates();
  };

  // Get unique values for dropdowns
  const uniqueStatuses = [...new Set(allDuplicates.map((m) => normalizeMemberStatus(m.status)))].sort();
  const uniqueMobiles = [...new Set(allDuplicates.map(m => m.mobile))].sort();

  // Check if all filtered members are selected
  const areAllFilteredSelected = () => {
    return duplicates.length > 0 && duplicates.every((m) => selectedMembers.includes(m.member_id));
  };

  // Toggle member selection
  const toggleMemberSelection = (memberId) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Select all members
  const selectAllMembers = (e) => {
    if (e.target.checked) {
      // Select all filtered members
      const allIds = duplicates.map((m) => m.member_id);
      setSelectedMembers([...new Set([...selectedMembers, ...allIds])]);
    } else {
      // Deselect all filtered members
      const filteredIds = new Set(duplicates.map((m) => m.member_id));
      setSelectedMembers(selectedMembers.filter((id) => !filteredIds.has(id)));
    }
  };

  // Bulk update status
  const handleBulkStatusUpdate = async () => {
    if (selectedMembers.length === 0) {
      setError('Please select at least one member');
      return;
    }

    if (!bulkStatus) {
      setError('Please select a status');
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.bulkUpdateMemberStatus(selectedMembers, bulkStatus);

      if (response?.data?.status === 200) {
        setSuccessMessage(`Successfully updated ${response.data.data?.successCount || 0} members`);
        setShowUpdateModal(false);
        setSelectedMembers([]);
        await fetchDuplicates();

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Failed to update member status');
      }
    } catch (err) {
      setError(`Error updating status: ${err.message}`);
      console.error('Bulk update error:', err);
    }
    setLoading(false);
  };

  // Render unauthorized message
  if (user?.roleId !== 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-600 text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p>Only administrators can access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Duplicate Members Management</h1>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {successMessage}
            </div>
          )}

          {/* Filter Section */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Mobile Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <select
                value={mobileFilter}
                onChange={(e) => setMobileFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All Mobiles</option>
                {uniqueMobiles.map((mobile) => (
                  <option key={mobile} value={mobile}>
                    {mobile}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All Status</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Member Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Member Type
              </label>
              <select
                value={memberTypeFilter}
                onChange={(e) => setMemberTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All Types</option>
                <option value="1">General Member</option>
                <option value="2">Life Member</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-end gap-2">
              <button
                onClick={fetchDuplicates}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
              <button
                onClick={() => {
                  setMobileFilter('');
                  setStatusFilter('');
                  setMemberTypeFilter('');
                  setSelectedMembers([]);
                }}
                className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Bulk Action Buttons */}
          {duplicates.length > 0 && (
            <div className="mb-6 flex gap-3 items-center bg-blue-50 p-4 rounded-lg flex-wrap">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  onChange={selectAllMembers}
                  checked={areAllFilteredSelected()}
                  className="w-4 h-4 text-blue-600 cursor-pointer"
                />
                <span className="font-medium">Select All</span>
              </label>

              <div className="h-6 w-px bg-gray-300" />

              <span className="text-sm text-gray-600 font-medium">
                Selected: <span className="text-blue-600">{selectedMembers.length}</span> / <span className="text-gray-900">{duplicates.length}</span> displayed
              </span>

              {selectedMembers.length > 0 && (
                <>
                  <div className="h-6 w-px bg-gray-300" />

                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    <option value="ACTIVE">Set to ACTIVE</option>
                    <option value="INACTIVE">Set to INACTIVE</option>
                    <option value="DELETED">Set to DELETED</option>
                  </select>

                  <button
                    onClick={() => setShowUpdateModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                  >
                    Update Status
                  </button>
                </>
              )}
            </div>
          )}

          {/* Confirmation Modal */}
          {showUpdateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Confirm Status Update</h3>
                <p className="text-gray-700 mb-6">
                  Update status for {selectedMembers.length} members to <strong>{bulkStatus}</strong>?
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowUpdateModal(false)}
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkStatusUpdate}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Duplicate Members Table */}
          {loading && !error ? (
            <div className="text-center py-8">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <p className="text-gray-600 mt-4">Loading duplicate members...</p>
            </div>
          ) : duplicates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No duplicate members found. Click Search to view.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200 border-b-2 border-gray-300">
                    <th className="px-4 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        onChange={selectAllMembers}
                        checked={areAllFilteredSelected()}
                        className="w-4 h-4 text-blue-600 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-sm">Member ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm">Mobile</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm">Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm">Reg. No</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm">Member Type</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm">Registration Type</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm">Updated By</th>
                    <th className="px-4 py-3 text-center font-semibold text-sm">Duplicates</th>
                  </tr>
                </thead>
                <tbody>
                  {duplicates.map((member, idx) => {
                    const statusMeta = getMemberStatusMeta(member.status);

                    return (
                    <tr
                      key={`${member.member_id}-${idx}`}
                      className={`border-b border-gray-200 transition-colors ${
                        selectedMembers.includes(member.member_id)
                          ? 'bg-blue-100'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.member_id)}
                          onChange={() => toggleMemberSelection(member.member_id)}
                          className="w-4 h-4 text-blue-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-blue-700">{member.member_id}</td>
                      <td className="px-4 py-3 font-semibold text-blue-600 text-sm">{member.mobile}</td>
                      <td className="px-4 py-3 text-sm">{member.name}</td>
                      <td className="px-4 py-3 text-sm font-medium">{member.registration_no}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            member.gm_lm_member_type === 1
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {member.gm_lm_member_type === 1 ? 'General Member' : 'Life Member'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{member.registration_type}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusMeta.pillClassName}`}
                        >
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{member.updated_by || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block bg-red-100 text-red-600 px-2.5 py-1 rounded-full text-xs font-semibold">
                          {member.duplicate_count}
                        </span>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DuplicateMembers;
