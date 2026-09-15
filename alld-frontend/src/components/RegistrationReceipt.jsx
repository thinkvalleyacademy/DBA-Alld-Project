import {
  Printer,
  MapPin,
  Phone,
  Calendar,
  User,
} from "lucide-react";
import { useLocation } from "react-router-dom";

import logo from "../assets/images.jpg";
import { useCallback, useEffect, useRef, useState } from "react";
import apiService from "./apiService";
import { useParams } from "react-router-dom";
import ReceiptPrint from "./PrintReceipt";

import { useAuth } from "../context/AuthContext";
import { useReactToPrint } from "react-to-print";
import { getGuardianLabel } from "../utils/guardianLabel";

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

const formatMonthYear = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", { month: "short", year: "numeric" });
};

const formatSubscriptionRange = (noOfMonth, expiryDate) => {
  const monthsCount = Number(noOfMonth);
  if (!monthsCount || monthsCount <= 0 || !expiryDate) return "";
  const endDate = new Date(expiryDate);
  if (isNaN(endDate.getTime())) return "";
  const endLabel = formatMonthYear(endDate);
  if (monthsCount === 1) return endLabel;
  const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - (monthsCount - 1), 1);
  const startLabel = formatMonthYear(startDate);
  return startLabel && endLabel ? `${startLabel} - ${endLabel}` : "";
};

const Receipt = () => {
  const { memberId } = useParams();
  const [memberDetails, setMemberDetails] = useState(null);
  const location = useLocation();

  const params = new URLSearchParams(location.search);

  const isDuplicate = params.get("list") === "true";
  const receiptId = params.get("receiptId");

  const [receiptList, setReceiptList] = useState([]);
  const { user } = useAuth();
  const printRef = useRef();
  const fetchReceiptDetails = useCallback(async () => {
    try {
      const res = await apiService.receiptList(memberId);
      console.log("Receipt Details:", res.data.data.member.name);
      setReceiptList(res.data.data.receipts || []);
      setMemberDetails(res.data.data.member || null);
    } catch (error) {
      console.error("Error fetching receipt details:", error);
    }
  }, [memberId]);

  // If receiptId is provided, find that specific receipt, otherwise use the latest (first) one
  const selectedReceipt = receiptId
    ? receiptList.find((r) => String(r.id) === receiptId || String(r.orderId) === receiptId) || receiptList[0]
    : receiptList[0];
  const latestReceipt = selectedReceipt || null;
  const netAmount = latestReceipt?.amount || 0;
  const guardianLabel = getGuardianLabel(memberDetails);

  // Decide membership display based on the selected receipt
  let membershipLabel = "";
  let expiryLabel = "";

  if (latestReceipt) {
    if (latestReceipt.noOfMonth > 0) {
      membershipLabel =
        formatSubscriptionRange(latestReceipt.noOfMonth, latestReceipt.expiryDate) ||
        "Subscription";
      expiryLabel = formatDate(latestReceipt.expiryDate);
    } else if (memberDetails?.gmLmMemberType === 2) {
      membershipLabel = "LIFE MEMBERSHIP";
      expiryLabel = "LIFETIME";
    } else if (memberDetails?.gmLmMemberType === 3) {
      membershipLabel = "WELFARE MEMBERSHIP";
      expiryLabel = "LIFETIME";
    } else {
      membershipLabel = "REGISTRATION";
      expiryLabel = "\u2014";
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchReceiptDetails();
  }, [fetchReceiptDetails]);

  const handlePrintFunction = useReactToPrint({
    contentRef: printRef,
  });

  const handlePrint = async () => {
    try {
      apiService.receiptPrint(memberDetails.memberId, user.mobile);

      handlePrintFunction();
    } catch (err) {
      console.error("Error in print process:", err);
    }
  };

  return (
    <div className="w-full min-h-screen p-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 px-6 py-3 shadow rounded border border-gray-200 dark:border-gray-700 transition">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Registration Receipt
        </h1>

      
      </div>

      <div className="flex justify-between items-center mt-5 ">
        <img src={logo} alt="Logo" className="w-24 h-24 object-contain" />

        <div className="flex-1 text-center">
          <h2 className="text-3xl font-bold mb-1">
            जिला अधिवक्ता संघ इलाहाबाद
          </h2>
          <h3 className="text-lg font-semibold">
            {memberDetails?.gmLmMemberType === 1
              ? "General Member Receipt"
              : memberDetails?.gmLmMemberType === 2
              ? "Life Member Receipt"
              : memberDetails?.gmLmMemberType === 3
              ? "Welfare Member Receipt"
              : "General Member Receipt"}
          </h3>
        </div>

        <div className="w-40"></div>
      </div>

      <div className="flex justify-between items-start mt-6 text-gray-900 dark:text-gray-100">
        <div className="text-sm leading-6">
          <p className="flex items-center gap-2 font-semibold">
            <User className="w-4 h-4" />
            {memberDetails?.name} / {memberDetails?.memberId}
          </p>
          <p className="flex items-center gap-2 font-semibold">
            <User className="w-4 h-4" />
            {guardianLabel} – {memberDetails?.guardianName}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {memberDetails?.address}
          </p>
          <p className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            {memberDetails?.mobile}
          </p>
          <p className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {formatDate(memberDetails?.dob)}
          </p>
        </div>

        <div className="text-sm space-y-1 w-72 leading-6">
          <p>
            <span className="font-semibold">Order ID :</span>{" "}
            {latestReceipt?.orderId}
          </p>
          <p>
            <span className="font-semibold">Order Date:</span>{" "}
            {formatDate(latestReceipt?.txnDate)}
          </p>
          <p>
            <span className="font-semibold">Order Type:</span>{" "}
            {latestReceipt?.txnType}
          </p>
          <p>
            <span className="font-semibold">Reg. Type:</span> C.O.P No. -{" "}
            {memberDetails?.registrationNo}
          </p>
        </div>
      </div>

      <div className="mt-5"></div>

      <table className="w-full text-sm border-t border-gray-300 dark:border-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
          <tr>
            <th className="p-3 text-left w-20">Sr. No.</th>
            <th className="p-3 text-left">Subscription For</th>
            <th className="p-3 text-left">Validity Till</th>
            <th className="p-3 text-right">Total Amount</th>
          </tr>
        </thead>

        <tbody>
  {latestReceipt && (
    <tr className="border-b border-gray-300">
      <td className="p-2 border-r border-gray-300">1</td>
      <td className="p-2 border-r border-gray-300">{membershipLabel}</td>
      <td className="p-2 border-r border-gray-300">{expiryLabel}</td>
      <td className="p-2 text-right">₹ {latestReceipt.amount}</td>
    </tr>
  )}
</tbody>

      </table>

      <p className="mt-4 text-sm">This is a Computer Generated Invoice.</p>

      <div className="flex justify-between mt-2 text-sm font-semibold">
        <p>Net Amount : ₹ {netAmount}.00 </p>
        <p>
          User Info : {user.name} ({user.mobile})
        </p>
      </div>

      <div style={{ position: "absolute", top: "-9999px", left: "-9999px" }}>
        <ReceiptPrint
          ref={printRef}
          memberDetails={memberDetails}
          receiptList={receiptList}
          selectedReceipt={latestReceipt}
          userName={user.name}
          duplicate={isDuplicate}
          mobile={user.mobile}
        />
      </div>

      {/* Print Button */}
      <div className="flex justify-center mt-10">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition"
        >
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>
    </div>
  );
};

export default Receipt;
