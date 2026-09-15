import { Search, Loader2, FileText } from "lucide-react";
import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

import apiService from "./apiService";
import EditDetails from "./editdetails";
import DocumentViewer from "./DocumentViewer";
import { useAuth } from "../context/AuthContext";
import defaultAdvocate from "../assets/default_advocate.png";
import { getFileServerBaseUrl } from "../constants/fileServer";
import { getMemberStatusMeta } from "../utility/memberStatus";

const FILE_SERVER_URL = getFileServerBaseUrl();

// Format date as DD MM YYYY
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const MemberSearch = ({ type, title }) => {
  const [memberId, setMemberId] = useState("");
  const [memberSuggestions, setMemberSuggestions] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const navigate = useNavigate();

  const [selectedMember, setSelectedMember] = useState(null);
  const [memberDetails, setMemberDetails] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [documentPath, setDocumentPath] = useState(null);
  const [documentName, setDocumentName] = useState(null);
  const { user } = useAuth();

  // Function to fetch photo with auth header and return blob URL
  const fetchPhotoWithAuth = async (photoPath) => {
    if (!photoPath) return null;
    const token = localStorage.getItem("accessToken");
    const path = photoPath.startsWith("upload/")
      ? photoPath
      : `upload/photos/${photoPath}`;
    const url = `${FILE_SERVER_URL}/${path}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        mode: "cors",
        credentials: "include",
      });

      if (response.ok) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }

      console.error("Photo fetch failed:", response.status);
      return null;
    } catch (err) {
      console.error("Error fetching photo:", err);
      return null;
    }
  };

  const context = useOutletContext();
  const setShowDetailsModal = context?.setShowDetailsModal;
  const statusMeta = getMemberStatusMeta(memberDetails?.status);

  const handleChange = (e) => {
    const { value } = e.target;
    setMemberId(value);
  };

  const handleEditClick = () => {
    setShowEditPopup(true);
    if (setShowDetailsModal) {
      setShowDetailsModal(true);
    }
  };

  const handleCloseEditPopup = () => {
    setShowEditPopup(false);
    if (setShowDetailsModal) {
      setShowDetailsModal(false);
    }
  };

  const handleViewDocument = (path, name) => {
    setDocumentPath(path);
    setDocumentName(name);
    setShowDocumentViewer(true);
  };

  const handleCloseDocumentViewer = () => {
    setShowDocumentViewer(false);
    setDocumentPath(null);
    setDocumentName(null);
  };

  const fetchSuggestions = async (query, setSuggestions) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await apiService.memberSearch({ query, type });
      setSuggestions(res.data.data || []);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setSuggestions([]);
    }
  };

  const fetchMemberDetails = async (memberId) => {
    setLoadingDetails(true);
    try {
      const res = await apiService.memberDetails(memberId);
      if (res.data.status === 200) {
        const member = res.data.data.member;
        setMemberDetails(member);
        // Fetch photo with auth header
        const photo = await fetchPhotoWithAuth(member.photo);
        setPhotoUrl(photo);
      }
    } catch (err) {
      console.error("Error fetching member details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleMemberSelect = (member) => {
    setMemberId(`${member.name} (${member.memberId})`);
    setSelectedMember(member);
    setShowSearchDropdown(false);
    fetchMemberDetails(member.memberId);
  };

  return (
    <div className="text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="flex items-center text-xl font-semibold gap-2">
          <Search className="w-5 h-5" />
          {title}
        </h1>
      </div>

      <form className="bg-white dark:bg-gray-900 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
            Search by Name, Father’s Name, Enrollment, COP, or Mobile{" "}
          </label>
          <input
            type="text"
            name="memberID"
            value={memberId}
            onChange={(e) => {
              handleChange(e);
              fetchSuggestions(e.target.value, setMemberSuggestions);
              setShowSearchDropdown(true);
            }}
            placeholder="Name / Father’s Name / Enrollment / COP / Mobile"
            required
            autoComplete="off"
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500"
            onBlur={() => setTimeout(() => setShowSearchDropdown(false), 150)}
          />

          {/* Dropdown */}
          {showSearchDropdown && memberSuggestions.length > 0 && (
            <ul className="absolute z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-full mt-1 rounded shadow max-h-60 overflow-y-auto">
              {memberSuggestions.map((s) => (
                <li
                  key={s.id}
                  className="px-3 py-2 hover:bg-blue-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  onMouseDown={() => handleMemberSelect(s)}
                >
                  <p className="font-semibold text-sm">{s.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Father: {s.fatherName || "-"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    EN: {s.enNo || "-"} | COP: {s.registrationNo || "-"} | ID:{" "}
                    {s.memberId}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </form>

      {/* Loading State */}
      {loadingDetails && (
        <div className="flex justify-center items-center mt-6 py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            Loading member details...
          </span>
        </div>
      )}

      {/* Member Details Card */}
      {selectedMember && memberDetails && !loadingDetails && (
        <div className="mt-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          {/* Header with Status and Actions */}
          <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">Member Details</h2>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusMeta.pillClassName}`}
              >
                {statusMeta.label}
              </span>
            </div>
            {user.roleId === 1 && (
              <div className="relative">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActionDropdown((prev) => !prev);
                  }}
                >
                  Actions ▼
                </button>
                {showActionDropdown && (
                  <div className="absolute right-0 mt-2 w-44 rounded-lg shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-20 overflow-hidden">
                    <button
                      className="block w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() =>
                        navigate(
                          `/receipt/${selectedMember.memberId}?list=true`,
                        )
                      }
                    >
                      🖨️ Print Receipt
                    </button>
                    {user?.roleId === 1 && (
                      <button
                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={handleEditClick}
                      >
                        ✏️ Edit Details
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-col md:flex-row p-6 gap-6">
            {/* Photo Section */}
            <div className="flex-shrink-0">
              <img
                src={photoUrl || defaultAdvocate}
                onError={(e) => (e.target.src = defaultAdvocate)}
                alt={memberDetails.name}
                className="w-40 h-48 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-md"
              />
              <p className="text-center mt-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {memberDetails.memberId}
              </p>
            </div>

            {/* Details Grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  Name
                </p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {memberDetails.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  Father/Guardian
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {memberDetails.guardianName || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  Member Type
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {memberDetails.memberType || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  Gender
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {memberDetails.gender || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  Date of Birth
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(memberDetails.dob)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  Blood Group
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {memberDetails.bloodGroup || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  Registration Type
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {memberDetails.registrationType || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  Registration No
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {memberDetails.registrationNo || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  EN No
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {memberDetails.enNo || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  Mobile
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {memberDetails.mobile || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  Email
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {memberDetails.email || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  City
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {memberDetails.city || "-"}
                </p>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  Address
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {memberDetails.address}, {memberDetails.city},{" "}
                  {memberDetails.state} - {memberDetails.zip}
                </p>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  KS Address
                </p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {memberDetails.ksAddress || "-"}
                </p>
              </div>

              {/* Membership Info */}
              <div className="sm:col-span-2 lg:col-span-3 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Membership Information
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                      Membership Date
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(memberDetails.membershipDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                      Expiry Date
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(memberDetails.expiryDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                      E-Wallet Balance
                    </p>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      ₹{memberDetails.ewalletBalance || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                      Voter
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {memberDetails.voter || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Nominee Info */}
              <div className="sm:col-span-2 lg:col-span-3 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Nominee Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                      Nominee Name
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {memberDetails.nomineeName || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                      Nominee Mobile
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {memberDetails.nomineeMobile || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 lg:col-span-3 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Documents
                </h3>
                <div className="flex flex-wrap gap-3">
                  {memberDetails.bcOfUpPhoto && (
                    <button
                      onClick={() =>
                        handleViewDocument(
                          memberDetails.bcOfUpPhoto,
                          `BC Document (${memberDetails.bcOfUpType || "Uploaded"})`,
                        )
                      }
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium transition"
                    >
                      <FileText className="w-4 h-4" />
                      View BC Document
                    </button>
                  )}
                  {memberDetails.affidavite && (
                    <button
                      onClick={() =>
                        handleViewDocument(
                          memberDetails.affidavite,
                          "Affidavit Document",
                        )
                      }
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium transition"
                    >
                      <FileText className="w-4 h-4" />
                      View Affidavit
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="relative">
              <button
                onClick={handleCloseEditPopup}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 z-10 bg-white dark:bg-gray-800 rounded-full p-1"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <EditDetails
                memberId={selectedMember?.memberId}
                memberData={memberDetails}
                onClose={handleCloseEditPopup}
                onUpdateSuccess={() =>
                  fetchMemberDetails(selectedMember?.memberId)
                }
              />
            </div>
          </div>
        </div>
      )}

      <DocumentViewer
        isOpen={showDocumentViewer}
        onClose={handleCloseDocumentViewer}
        documentPath={documentPath}
        documentName={documentName}
      />
    </div>
  );
};

export default MemberSearch;
