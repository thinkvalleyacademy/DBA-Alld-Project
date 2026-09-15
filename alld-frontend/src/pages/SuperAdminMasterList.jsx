import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import apiService from "../components/apiService";
import { getMemberStatusMeta } from "../utility/memberStatus";

const getMemberTypeName = (member) => {
  if (member?.isWm) return "Welfare Member";
  if (member?.gmLmMemberType === 1) return "General Member";
  if (member?.gmLmMemberType === 2) return "Life Member";
  return "Unknown";
};

const SuperAdminMasterList = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchMembers = useCallback(async (pageNumber = 0, query = "") => {
    if (user?.roleId !== 1) return;

    setLoading(true);
    setError("");

    try {
      const response = await apiService.memberList({
        page: pageNumber,
        size: pageSize,
        query: query || undefined,
      });

      const data = response?.data?.data || {};
      setMembers(data.members || []);
      setTotalPages(data.totalPages || 1);
      setTotalMembers(data.totalMembers || 0);
    } catch (err) {
      console.error("Failed to fetch master members:", err);
      setError("Failed to fetch members");
    } finally {
      setLoading(false);
    }
  }, [pageSize, user]);

  useEffect(() => {
    fetchMembers(page, appliedQuery);
  }, [fetchMembers, page, appliedQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setAppliedQuery(searchQuery.trim());
  };

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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Super-Admin Master List</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSearch} className="mb-6 flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Member ID, Mobile, Name, or Reg. No"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
          </form>

          <div className="mb-4 text-sm text-gray-600">
            Total Members: <span className="font-semibold text-gray-900">{totalMembers}</span>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-sm">Member ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-sm">Mobile</th>
                  <th className="px-4 py-3 text-left font-semibold text-sm">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-sm">Reg. No</th>
                  <th className="px-4 py-3 text-left font-semibold text-sm">Member Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-sm">Registration Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-sm">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-sm">Updated By</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                      Loading members...
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                      No members found
                    </td>
                  </tr>
                ) : (
                  members.map((member) => {
                    const statusMeta = getMemberStatusMeta(member.status);

                    return (
                      <tr key={member.memberId} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-semibold text-blue-700">{member.memberId}</td>
                        <td className="px-4 py-3 text-sm">{member.mobile || "-"}</td>
                        <td className="px-4 py-3 text-sm">{member.name || "-"}</td>
                        <td className="px-4 py-3 text-sm">{member.registrationNo || "-"}</td>
                        <td className="px-4 py-3 text-sm">{getMemberTypeName(member)}</td>
                        <td className="px-4 py-3 text-sm">{member.registrationType || "-"}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusMeta.pillClassName}`}>
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{member.updatedBy || "-"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-6 gap-4">
            <button
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={page === 0 || loading}
              onClick={() => setPage((prev) => prev - 1)}
            >
              Previous
            </button>
            <span className="text-sm font-medium text-gray-700">
              Page {page + 1} of {totalPages}
            </span>
            <button
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={page + 1 >= totalPages || loading}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminMasterList;
