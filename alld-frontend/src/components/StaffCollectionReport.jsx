import React, { useEffect, useState } from "react";
import { FaCalendarAlt, FaUser, FaEye, FaPrint } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import ReportTable from "./ui/ReportTable";
import Card from "./ui/Card";
import FormSelect from "./ui/FormSelect";
import FormDateInput from "./ui/FormDateInput";
import SummaryCell from "./ui/SummaryCell";
import apiService from "./apiService";

const StaffCollectionReport = () => {
  const [selectedStaff, setSelectedStaff] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [staffMembers, setStaffMembers] = useState([]);
  const [registrationData, setRegistrationData] = useState([]);
  const [subscriptionData, setSubscriptionData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const res = await apiService.listUsers();
      const activeUsers = res.data.data.filter(
        (user) => user.status === "ACTIVE" || user.status === "Active",
      );
      setStaffMembers(activeUsers);
    } catch (error) {
      console.error("Error fetching staff members:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const staffOptions = staffMembers.map((staff) => ({
    value: staff.mobile,
    label: `${staff.name}, ${staff.mobile}`,
  }));

  const selectedStaffData = staffMembers.find(
    (staff) => staff.userId === selectedStaff,
  );

  const calculateTotal = (data, field) =>
    data.reduce((sum, item) => sum + (item[field] || 0), 0);

  const formatTxnDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  };

  const handleGetData = async () => {
    if (!selectedStaff) {
      alert("Please select a staff member");
      return;
    }
    if (!startDate) {
      alert("Please select a start date");
      return;
    }
    if (!endDate) {
      alert("Please select an end date");
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.getStaffCollection({
        userId: selectedStaff,
        startDate,
        endDate,
      });
      const data = res.data.data;

      // Set registration data
      setRegistrationData(data.registrationRecords || []);

      // Set subscription data
      setSubscriptionData(data.subscriptionRecords || []);
    } catch (error) {
      console.error("Error fetching staff collection:", error);
      alert("Error fetching staff collection data");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const formatDate = (dateString) => {
    if (!dateString) return "DD/MM/YYYY";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  };

  // Column definitions for each report type
  const registrationColumns = [
    { header: "S.N.", render: (_item, index) => index + 1 },
    { header: "Member Id", key: "memberId" },
    { header: "Order Id", key: "orderId" },
    { header: "Date", render: (item) => formatTxnDate(item.txnDate) },
    { header: "Amount", render: (item) => `₹${(item.amount || 0).toFixed(2)}` },
  ];

  const subscriptionColumns = [
    { header: "S.N.", render: (_item, index) => index + 1 },
    { header: "Member Id", key: "memberId" },
    { header: "No Of Months", key: "noOfMonth" },
    {
      header: "Validity Till",
      render: (item) => formatTxnDate(item.expiryDate),
    },
    { header: "Order Id", key: "orderId" },
    { header: "Date", render: (item) => formatTxnDate(item.txnDate) },
    { header: "Amount", render: (item) => `₹${(item.amount || 0).toFixed(2)}` },
  ];

  // Total Amount = Registration + Subscription
  const totalAmount =
    calculateTotal(registrationData, "amount") +
    calculateTotal(subscriptionData, "amount");

  // Loading Overlay Component
  const LoadingOverlay = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 mb-4 relative">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Loading Report
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Fetching collection data...
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 text-gray-900 dark:text-gray-100 print:bg-white print:p-0">
      {/* Loading Overlay */}
      {loading && <LoadingOverlay />}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 print:text-black print:font-bold">
            Staff Collection Report
          </h1>
        </div>

        {/* Filters Section - Hidden in Print */}
        <Card className="p-4 mb-6 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <FormSelect
              label="Select Staff"
              icon={FaUser}
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              options={staffOptions}
              placeholder="Select Staff"
              required
            />
            <FormDateInput
              label="Start Date"
              icon={FaCalendarAlt}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <FormDateInput
              label="End Date"
              icon={FaCalendarAlt}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleGetData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaEye className="mr-2" />
              {loading ? "Loading..." : "Get Data"}
            </button>
          </div>
        </Card>

        {/* Summary Report Section */}
        <Card className="p-4 mb-6">
          <div className="mb-4">
            <div className="text-lg font-bold text-gray-800 dark:text-gray-100 print:text-black print:font-bold">
              Summary Report{" "}
              {selectedStaffData &&
                `[${selectedStaffData.mobile}/From-DATE - ${formatDate(startDate)} To-DATE - ${formatDate(endDate)}]`}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border border-gray-300 dark:border-gray-600 print:border-gray-400">
              <tbody>
                <tr>
                  <SummaryCell label="Registrations / Amount" isHeader />
                  <SummaryCell
                    value={`${registrationData.length} / ₹ ${calculateTotal(registrationData, "amount").toFixed(2)}`}
                  />
                  <SummaryCell label="Subscriptions / Amount" isHeader />
                  <SummaryCell
                    value={`${subscriptionData.length} / ₹ ${calculateTotal(subscriptionData, "amount").toFixed(2)}`}
                  />
                </tr>
                <tr>
                  <SummaryCell label="" isHeader />
                  <SummaryCell label="" isHeader />
                  <SummaryCell label="Total Amount" isHeader />
                  <SummaryCell value={`₹ ${totalAmount.toFixed(2)}`} />
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Detailed Report Section */}
        <Card className="p-4 mb-6">
          <div className="mb-4">
            <div className="text-lg font-bold text-gray-800 dark:text-gray-100 print:text-black print:font-bold">
              Detailed Report ({selectedStaffData?.mobile || "Staff Phone"})
              from DATE - {formatDate(startDate)} to DATE -{" "}
              {formatDate(endDate)}
            </div>
          </div>

          <ReportTable
            title="Registration Report"
            columns={registrationColumns}
            data={registrationData}
            totalLabel="Total Amount"
            totalField="amount"
            totalColSpan={4}
          />

          <ReportTable
            title="Subscription Report"
            columns={subscriptionColumns}
            data={subscriptionData}
            totalLabel="Total Amount"
            totalField="amount"
            totalColSpan={6}
          />

          {/* Print Button - Hidden in Print */}
          <div className="flex justify-center mt-8 print:hidden">
            <button
              onClick={handlePrint}
              className="px-6 py-3 bg-gray-600 dark:bg-gray-700 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center"
            >
              <FaPrint className="mr-2" />
              Print Report
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StaffCollectionReport;
