import {
  RotateCcw,
  Printer,
  Phone,
  Calendar,
  User,
} from "lucide-react";
import { useLocation } from "react-router-dom";

import logo from "../assets/images.jpg";
import { useCallback, useEffect, useRef, useState } from "react";
import apiService from "./apiService";
import { useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useReactToPrint } from "react-to-print";
import CompensationReceiptPrint from "./CompensationReceiptPrint";

const CompensationReceipt = () => {
  const { entryId } = useParams();
  const location = useLocation();

  const params = new URLSearchParams(location.search);

  const isDuplicate = params.get("list") === "true";

  const [compensation, setCompensation] = useState(null);
  const { name, username, authToken } = useAuth();
  const printRef = useRef();
  const fetchData = useCallback(async () => {
    try {
      const res = await apiService.getCompensationEntry(entryId);
      const entry = res?.data?.data?.[0] || null;
      setCompensation(entry);
    } catch (error) {
      console.error("Error fetching receipt details:", error);
    }
  }, [entryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePrintFunction = useReactToPrint({
    contentRef: printRef,
  });

  const handlePrint = async () => {
    try {
      apiService.receiptPrint(compensation.memberId, username);

      handlePrintFunction();
    } catch (err) {
      console.error("Error in print process:", err);
    }
  };

  if (!compensation) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading compensation receipt...
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition">
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 px-6 py-3 shadow rounded border border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-semibold">Welfare Compensation Receipt</h1>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition"
        >
          <RotateCcw className="w-4 h-4" />
          Reload
        </button>
      </div>

      {/* Organization Header */}
      <div className="flex justify-between items-center mt-6">
        <img src={logo} alt="Logo" className="w-24 h-24 object-contain" />

        <div className="flex-1 text-center">
          <h2 className="text-3xl font-bold mb-1">
            जिला अधिवक्ता संघ इलाहाबाद
          </h2>
          <h3 className="text-lg font-semibold">Welfare Member Compensation</h3>
        </div>

        <div className="w-24"></div>
      </div>

      {/* Member & Receipt Info */}
      <div className="flex justify-between items-start mt-8 gap-6">
        {/* Member Info */}
        <div className="text-sm leading-6">
          <p className="flex items-center gap-2 font-semibold">
            <User className="w-4 h-4" />
            {compensation.memberName} ({compensation.memberId})
          </p>

          <p className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            {compensation.userPhone}
          </p>

          <p className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Compensation Date: {compensation.compensationDate}
          </p>
        </div>

        {/* Receipt Info */}
        <div className="text-sm space-y-1 w-72">
          <p>
            <span className="font-semibold">Receipt ID :</span>{" "}
            {compensation.compensationId}
          </p>
          <p>
            <span className="font-semibold">Created On :</span>{" "}
            {compensation.createdDate?.slice(0, 19)}
          </p>
          <p>
            <span className="font-semibold">Type :</span> Welfare Assistance
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="mt-6 border-t border-gray-300 dark:border-gray-700"></div>

      {/* Compensation Table */}
      <table className="w-full mt-4 text-sm border border-gray-300 dark:border-gray-700 rounded overflow-hidden">
        <thead className="bg-gray-100 dark:bg-gray-800 border-b">
          <tr>
            <th className="p-3 text-left w-20">Sr. No.</th>
            <th className="p-3 text-left">Description</th>
            <th className="p-3 text-right">Amount</th>
          </tr>
        </thead>

        <tbody>
          <tr className="border-b">
            <td className="p-3">1.</td>
            <td className="p-3">{compensation.description}</td>
            <td className="p-3 text-right font-semibold">
              ₹ {compensation.amount}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <p className="mt-4 text-sm">
        This is a computer-generated compensation receipt.
      </p>

      <div className="flex justify-between mt-2 text-sm font-semibold">
        <p>Net Compensation Amount : ₹ {compensation.amount}</p>
        <p>Issued For Welfare Purpose</p>
      </div>
      <div style={{ position: "absolute", top: "-9999px", left: "-9999px" }}>
        <CompensationReceiptPrint
          ref={printRef}
          compensation={compensation}
          userName={name}
          mobile={authToken}
          duplicate={isDuplicate}
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
export default CompensationReceipt;
