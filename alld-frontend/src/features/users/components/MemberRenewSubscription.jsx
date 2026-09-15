import {
  RotateCcw,
  User,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ChevronDown,
  ChevronUp,
  Receipt,
  Printer,
} from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import apiService from "../../../components/apiService";
import { useAuth } from "../../../context/AuthContext";
import { showErrorToast, showSuccessToast } from "../../../utility/toast";
import { getMemberStatusMeta } from "../../../utility/memberStatus";
import defaultAdvocate from "../../../assets/default_advocate.png";
import { getFileServerBaseUrl } from "../../../constants/fileServer";

const FILE_SERVER_URL = getFileServerBaseUrl();

const extractRenewQuote = (res) => {
  const data = res?.data?.data || {};
  const rawAmount = data.amount ?? res?.data?.amount;
  const amount = Number(rawAmount);
  return {
    amount: Number.isFinite(amount) ? amount : null,
    expiryDate: data.expiryDate || data.validTill || null,
  };
};

// Format date as DD-MM-YYYY
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

const MemberRenewSubscription = () => {
  const [memberId, setMemberId] = useState("");
  const [memberSuggestions, setMemberSuggestions] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const navigate = useNavigate();
  const [memberDetails, setMemberDetails] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const { user } = useAuth();
  const context = useOutletContext();
  const setShowDetailsModal = context?.setShowDetailsModal;
  const [receiptHistory, setReceiptHistory] = useState([]);
  const [receiptHistoryOpen, setReceiptHistoryOpen] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [renewQuote, setRenewQuote] = useState(null);
  const [renewQuoteLoading, setRenewQuoteLoading] = useState(false);
  const memberStatusMeta = getMemberStatusMeta(memberDetails?.status);
  const lastProfileUpdate = memberDetails?.updatedDate || null;
  const latestTxnUpdate = receiptHistory?.[0]?.txnDate || null;
  const [lastUpdatedAt, lastUpdatedSource] = useMemo(() => {
    const profileDate = lastProfileUpdate ? new Date(lastProfileUpdate) : null;
    const txnDate = latestTxnUpdate ? new Date(latestTxnUpdate) : null;
    const isProfileValid = profileDate && !isNaN(profileDate.getTime());
    const isTxnValid = txnDate && !isNaN(txnDate.getTime());

    if (isProfileValid && isTxnValid) {
      return profileDate >= txnDate
        ? [lastProfileUpdate, "Profile"]
        : [latestTxnUpdate, "Transaction"];
    }
    if (isProfileValid) return [lastProfileUpdate, "Profile"];
    if (isTxnValid) return [latestTxnUpdate, "Transaction"];
    return [null, null];
  }, [lastProfileUpdate, latestTxnUpdate]);

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
      });
      if (response.ok) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch (err) {
      console.error("Error fetching photo:", err);
    }
    return null;
  };

  const parseDate = (s) => {
    if (!s) return null;
    const t = Date.parse(s);
    if (!isNaN(t)) return new Date(t);
    const parts = s.split(/[./-]/).map((p) => p.trim());
    if (parts.length === 3) {
      if (parts[0].length === 4)
        return new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
    return null;
  };

  const [validity, setValidity] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState(null);
  const [calendarYear, setCalendarYear] = useState(() => {
    const exp = parseDate(memberDetails?.expiryDate);
    const startDate = exp && exp > new Date() ? exp : new Date();
    return startDate.getFullYear();
  });

  const calendarMonths = useMemo(() => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const exp = parseDate(memberDetails?.expiryDate);

    if (!exp) {
      return [];
    }

    const today = new Date();

    let startMonth = exp.getMonth() + 1;
    let startYear = exp.getFullYear();

    if (startMonth > 11) {
      startMonth = 0;
      startYear += 1;
    }

    const months = [];
    // Generate months up to 4 years ahead from the current year
    const maxYear = today.getFullYear() + 4;
    const maxMonth = 11; // December of max year

    let i = 0;

    while (true) {
      const monthIndex = (startMonth + i) % 12;
      const yearOffset = Math.floor((startMonth + i) / 12);
      const year = startYear + yearOffset;

      // Stop if we've exceeded 4 years ahead from current year
      if (year > maxYear || (year === maxYear && monthIndex > maxMonth)) {
        break;
      }

      const monthsFromStart = i + 1; // 1 = first month, 2 = second month, etc.

      // Calculate expiry date (end of the selected month)
      const expiryMonth = monthIndex;
      const expiryYear = year;
      const lastDayOfMonth = new Date(expiryYear, expiryMonth + 1, 0).getDate();
      const expiryDate = new Date(expiryYear, expiryMonth, lastDayOfMonth);

      months.push({
        monthIndex,
        year,
        monthName: monthNames[monthIndex],
        monthsFromStart,
        label: `${monthNames[monthIndex]} ${year}`,
        expiryDate: expiryDate,
        expiryLabel: `${lastDayOfMonth} ${monthNames[monthIndex]} ${expiryYear}`,
      });

      i++;
    }
    return months;
  }, [memberDetails?.expiryDate]);

  const calendarYears = useMemo(() => {
    const years = new Set(calendarMonths.map((m) => m.year));
    return Array.from(years).sort();
  }, [calendarMonths]);

  // Update calendar year to first available year when member details change
  useEffect(() => {
    if (calendarYears.length > 0) {
      setCalendarYear(calendarYears[0]);
    }
  }, [calendarYears]);

  const selectedMonthData = useMemo(() => {
    if (!validity) return null;
    return calendarMonths.find((m) => m.monthsFromStart === Number(validity));
  }, [validity, calendarMonths]);

  const quotedAmount =
    renewQuote?.amount !== null && renewQuote?.amount !== undefined
      ? renewQuote.amount
      : null;

  const handleChange = (e) => {
    const { value } = e.target;
    setMemberId(value);
  };

  const fetchSuggestions = async (query, setSuggestions) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await apiService.memberSearch({ query, type: 1 });
      setSuggestions(res.data.data || []);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setSuggestions([]);
    }
  };

  const fetchMemberDetails = async (memberId) => {
    if (!memberId) return;
    try {
      setImageLoading(true);
      setPhotoUrl(null);

      const res = await apiService.memberDetails(memberId);

      const apiData = res?.data?.data;
      if (!apiData) {
        console.warn("❌ apiData is empty");
        setMemberDetails(null);
        return;
      }

      setMemberDetails(apiData.member);
      setRenewQuote(null);

      // Fetch photo with auth header
      const photo = await fetchPhotoWithAuth(apiData.member.photo);
      setPhotoUrl(photo);
      setImageLoading(false);

      // Fetch receipt history
      fetchReceiptHistory(memberId);
    } catch (err) {
      console.error("❌ Error fetching member details:", err);
      setMemberDetails(null);
    }
  };

  const fetchReceiptHistory = async (memberId) => {
    try {
      setReceiptLoading(true);
      const res = await apiService.receiptList(memberId);
      setReceiptHistory(res.data.data.receipts || []);
    } catch (err) {
      console.error("Error fetching receipt history:", err);
      setReceiptHistory([]);
    } finally {
      setReceiptLoading(false);
    }
  };

  const fetchRenewQuote = useCallback(async (memberID, monthsNo) => {
    if (!memberID || !monthsNo) return null;
    try {
      setRenewQuoteLoading(true);
      const quoteRes = await apiService.memberRenewQuote({
        memberID,
        monthsNo: Number(monthsNo),
        userPhone: user?.mobile,
      });
      const parsedQuote = extractRenewQuote(quoteRes);
      if (parsedQuote.amount !== null) {
        setRenewQuote(parsedQuote);
        return parsedQuote;
      }
      setRenewQuote(null);
      return null;
    } catch {
      setRenewQuote(null);
      return null;
    } finally {
      setRenewQuoteLoading(false);
    }
  }, [user?.mobile]);

  useEffect(() => {
    const quoteForSelection = async () => {
      if (!memberDetails?.memberId || !validity) {
        setRenewQuote(null);
        setRenewQuoteLoading(false);
        return;
      }
      await fetchRenewQuote(memberDetails.memberId, validity);
    };
    quoteForSelection();
  }, [fetchRenewQuote, memberDetails?.memberId, validity]);

  const handleUpdateSubscription = async (e) => {
    e?.preventDefault?.();
    if (!memberDetails?.memberId) return;
    if (!validity) {
      setUpdateMessage({ type: "error", text: "Please select validity." });
      return;
    }
    try {
      setUpdating(true);
      setUpdateMessage(null);
      const selectedMonth = calendarMonths.find(
        (m) => m.monthsFromStart === Number(validity),
      );
      const monthsNo = selectedMonth
        ? selectedMonth.monthsFromStart
        : Number(validity);
      const quote =
        renewQuote?.amount !== null && renewQuote?.amount !== undefined
          ? renewQuote
          : await fetchRenewQuote(memberDetails.memberId, monthsNo);
      if (!quote || quote.amount === null || quote.amount === undefined) {
        setUpdateMessage({
          type: "error",
          text: "Unable to fetch renewal amount. Please try again.",
        });
        return;
      }
      const payload = {
        memberID: memberDetails.memberId,
        amount: Number(quote.amount),
        monthsNo: Number(monthsNo),
        userPhone: user.mobile,
      };
      console.log("Payload for subscription update:", payload);
      const res = await apiService.memberRenew(payload);
      if (res.data.status === 200) {
        showSuccessToast("Member registered successfully");
        const data = res.data.data.member;
        navigate(`/receipt/${data.memberId}`);
      } else showErrorToast("Failed to register member");
    } catch (err) {
      console.error(err);
      setUpdateMessage({
        type: "error",
        text: "Server error while updating subscription.",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="text-gray-900 dark:text-gray-100">
      {memberDetails && (
        <>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-6 shadow-sm">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700">
              <h3 className="flex items-center gap-2 text-md font-semibold">
                <User className="w-4 h-4" />
                Member Info
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
                  onClick={() => {
                    setMemberDetails(null);
                    setValidity("");
                    setMemberId("");
                    setUpdateMessage(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-40 flex-shrink-0 relative">
                  {imageLoading && (
                    <div className="w-40 h-40 flex items-center justify-center rounded border bg-gray-100 dark:bg-gray-700 absolute inset-0">
                      <svg
                        className="animate-spin h-8 w-8 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </div>
                  )}

                  <img
                    src={photoUrl || defaultAdvocate}
                    onError={(e) => {
                      e.currentTarget.src = defaultAdvocate;
                    }}
                    alt={memberDetails.name || "member"}
                    className={`w-40 h-40 object-cover rounded border ${imageLoading ? "opacity-0" : "opacity-100"}`}
                  />
                </div>

                <div className="flex-1">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="bg-gray-50 dark:bg-gray-700">
                        <td className="px-3 py-2 font-semibold">Member Id :</td>
                        <td className="px-3 py-2">
                          {memberDetails.memberId || "-"}
                        </td>
                        <td className="px-3 py-2 font-semibold">
                          Member Name :
                        </td>
                        <td className="px-3 py-2">
                          {memberDetails.name || "-"}
                        </td>
                      </tr>

                      <tr>
                        <td className="px-3 py-2 font-semibold">C/O :</td>
                        <td className="px-3 py-2">
                          {memberDetails.guardianName || "-"}
                        </td>
                        <td className="px-3 py-2 font-semibold">C.O.P No :</td>
                        <td className="px-3 py-2">
                          {memberDetails.registrationNo || "-"}
                        </td>
                      </tr>

                      <tr className="bg-gray-50 dark:bg-gray-700">
                        <td className="px-3 py-2 font-semibold">Mobile No.</td>
                        <td className="px-3 py-2">
                          {memberDetails.mobile || "-"}
                        </td>
                        <td className="px-3 py-2 font-semibold">
                          Member Status :
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded ${
                              memberStatusMeta.pillClassName
                            }`}
                          >
                            {memberStatusMeta.label}
                          </span>
                        </td>
                      </tr>

                      <tr>
                        <td className="px-3 py-2 font-semibold">
                          Membership Date
                        </td>
                        <td className="px-3 py-2">
                          {formatDate(memberDetails.membershipDate)}
                        </td>
                        <td className="px-3 py-2 font-semibold">
                          Expiry Date :
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded ${
                              memberDetails.expiryDate &&
                              new Date(memberDetails.expiryDate) < new Date()
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {formatDate(memberDetails.expiryDate)}
                          </span>
                        </td>
                      </tr>

                      <tr className="bg-gray-50 dark:bg-gray-700">
                        <td className="px-3 py-2 font-semibold">
                          Ewallet Balance :
                        </td>
                        <td className="px-3 py-2 text-green-600">
                          ₹ {memberDetails.ewalletBalance ?? "0.00"}
                        </td>
                        <td className="px-3 py-2 font-semibold">
                          Registration Date
                        </td>
                        <td className="px-3 py-2">
                          {formatDate(
                            memberDetails.registrationDate ||
                              memberDetails.createdDate,
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-semibold">
                          Last Updated :
                        </td>
                        <td className="px-3 py-2">
                          {lastUpdatedAt
                            ? `${formatDate(lastUpdatedAt)} (${lastUpdatedSource})`
                            : "-"}
                        </td>
                        <td className="px-3 py-2 font-semibold">
                          Updated By :
                        </td>
                        <td className="px-3 py-2">
                          {memberDetails.updatedBy || "-"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-6">
            {/* request recived from click button */}
            <form onSubmit={handleUpdateSubscription}>
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Select Subscription Duration
                </label>

                {/* Year Navigation */}
                <div className="flex items-center justify-center gap-4 mb-3">
                  <button
                    type="button"
                    onClick={() => setCalendarYear((y) => y - 1)}
                    disabled={calendarYear <= calendarYears[0]}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-lg font-semibold min-w-[60px] text-center">
                    {calendarYear}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCalendarYear((y) => y + 1)}
                    disabled={
                      calendarYear >= calendarYears[calendarYears.length - 1]
                    }
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Month Grid - Shows expiry months */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ].map((monthName, idx) => {
                    const monthData = calendarMonths.find(
                      (m) => m.monthIndex === idx && m.year === calendarYear,
                    );
                    const isDisabled = !monthData;
                    const isSelected =
                      monthData &&
                      Number(validity) === monthData.monthsFromStart;

                    return (
                      <button
                        key={`${calendarYear}-${idx}`}
                        type="button"
                        disabled={isDisabled}
                        onClick={() =>
                          monthData &&
                          setValidity(String(monthData.monthsFromStart))
                        }
                        className={`
                          p-2 rounded-lg border text-center transition-all
                          ${
                            isDisabled
                              ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border-gray-200 dark:border-gray-700"
                              : isSelected
                                ? "bg-purple-600 text-white border-purple-600 shadow-md"
                                : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer"
                          }
                        `}
                      >
                        <div className="font-medium text-sm">{monthName}</div>
                        {monthData && (
                          <>
                            <div
                              className={`text-xs ${isSelected ? "text-purple-200" : "text-gray-500 dark:text-gray-400"}`}
                            >
                              {monthData.monthsFromStart} mo
                            </div>
                            <div
                              className={`text-xs ${isSelected ? "text-purple-200" : "text-gray-500 dark:text-gray-400"}`}
                            >
                              {isSelected && quotedAmount !== null
                                ? `Rs. ${Number(quotedAmount).toFixed(2)}`
                                : "Select"}
                            </div>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Info */}
                {selectedMonthData && (
                  <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="text-sm text-purple-800 dark:text-purple-200">
                      <span className="font-semibold">Duration:</span>{" "}
                      {selectedMonthData.monthsFromStart} month
                      {selectedMonthData.monthsFromStart > 1 ? "s" : ""}
                    </div>
                    <div className="text-sm text-purple-800 dark:text-purple-200 mt-1">
                      <span className="font-semibold">Valid till:</span> End of{" "}
                      {selectedMonthData.expiryLabel}
                    </div>
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-1">
                      Total:{" "}
                      {quotedAmount !== null
                        ? `Rs. ${Number(quotedAmount).toFixed(2)}`
                        : "Fetching backend quote..."}
                    </div>
                    {renewQuoteLoading && (
                      <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                        Fetching backend quote...
                      </div>
                    )}
                  </div>
                )}
              </div>

              {updateMessage && (
                <div
                  className={`mb-4 text-sm ${updateMessage.type === "success" ? "text-green-600" : "text-red-600"}`}
                >
                  {updateMessage.text}
                </div>
              )}

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded shadow-sm flex items-center gap-2"
                >
                  {updating ? (
                    "Updating..."
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M5 12h14"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span> Update Subscription</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Collapsible Receipt History Section */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
            <button
              type="button"
              onClick={() => setReceiptHistoryOpen(!receiptHistoryOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
            >
              <h3 className="flex items-center gap-2 text-md font-semibold">
                <Receipt className="w-4 h-4" />
                Receipt History ({receiptHistory.length})
              </h3>
              {receiptHistoryOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {receiptHistoryOpen && (
              <div className="px-4 pb-4">
                {receiptLoading ? (
                  <div className="flex justify-center py-4">
                    <svg
                      className="animate-spin h-6 w-6 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                ) : receiptHistory.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm py-2">
                    No receipt history found.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                        <tr>
                          <th className="px-3 py-2 text-left">Order ID</th>
                          <th className="px-3 py-2 text-left">Type</th>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Created Date</th>
                          <th className="px-3 py-2 text-left">Duration</th>
                          <th className="px-3 py-2 text-left">Expiry</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                          <th className="px-3 py-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receiptHistory.map((receipt, index) => (
                          <tr
                            key={receipt.id}
                            className={`border-b border-gray-200 dark:border-gray-600 ${
                              index % 2 === 0
                                ? "bg-white dark:bg-gray-800"
                                : "bg-gray-50 dark:bg-gray-700"
                            }`}
                          >
                            <td className="px-3 py-2">{receipt.orderId}</td>
                            <td className="px-3 py-2">
                              <span
                                className={`inline-block px-2 py-0.5 text-xs rounded ${
                                  receipt.txnType === "REGISTRATION"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                }`}
                              >
                                {receipt.txnType}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              {formatDate(receipt.txnDate)}
                            </td>
                            <td className="px-3 py-2">
                              {formatDate(receipt.createdDate)}
                            </td>
                            <td className="px-3 py-2">
                              {receipt.noOfMonth === 0
                                ? "General Member"
                                : `${receipt.noOfMonth} Month${receipt.noOfMonth > 1 ? "s" : ""}`}
                            </td>
                            <td className="px-3 py-2">
                              {formatDate(receipt.expiryDate)}
                            </td>
                            <td className="px-3 py-2 text-right font-medium">
                              ₹ {receipt.amount}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/receipt/${memberDetails?.memberId}?list=true&receiptId=${receipt.id}`,
                                  )
                                }
                                className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Print Receipt"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {!memberDetails && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h1 className="flex items-center text-xl font-semibold gap-2">
              <RotateCcw className="w-5 h-5" />
              Renew Member Subscription
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
                placeholder="Name / Father’s Name / Enrollment / COP / Mobile
"
                required
                autoComplete="off"
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500"
                onBlur={() =>
                  setTimeout(() => setShowSearchDropdown(false), 150)
                }
              />

              {showSearchDropdown && memberSuggestions.length > 0 && (
                <ul className="absolute z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-full mt-1 rounded shadow max-h-60 overflow-y-auto">
                  {memberSuggestions.map((s) => (
                    <li
                      key={s.id || s.memberId}
                      className="px-3 py-2 hover:bg-blue-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      onMouseDown={() => {
                        setMemberId(`${s.name} (${s.memberId})`);
                        setShowSearchDropdown(false);
                        fetchMemberDetails(s.memberId);
                        if (setShowDetailsModal) {
                          setShowDetailsModal(true);
                        }
                      }}
                    >
                      <p className="font-semibold text-sm">{s.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Father: {s.fatherName || "-"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        EN: {s.enNo || "-"} | COP: {s.registrationNo || "-"} |
                        ID: {s.memberId}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default MemberRenewSubscription;
