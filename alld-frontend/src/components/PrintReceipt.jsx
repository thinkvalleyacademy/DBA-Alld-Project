import  { forwardRef } from "react";
import logo from "../assets/images.jpg";
import { User, MapPin, Phone, Calendar } from "lucide-react";
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

const ReceiptPrint = forwardRef(
  ({ memberDetails, receiptList, selectedReceipt, userName, duplicate, mobile }, ref) => {
    // Use selectedReceipt if provided, otherwise fall back to first receipt
    const latest = selectedReceipt || receiptList[0] || null;

    const totalAmount = latest?.amount || 0;
    const guardianLabel = getGuardianLabel(memberDetails);

    // Decide membership display based on the selected receipt
    let membershipLabel = "";
    let expiryLabel = "";

    if (latest) {
      if (latest.noOfMonth > 0) {
        membershipLabel =
          formatSubscriptionRange(latest.noOfMonth, latest.expiryDate) ||
          "Subscription";
        expiryLabel = formatDate(latest.expiryDate);
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

    const Block = () => (
      <div className="p-3 relative overflow-hidden">
         {duplicate && (
      <div
        className="absolute inset-0 flex justify-center items-center pointer-events-none select-none"
        style={{
          zIndex: 0,
          opacity: 0.15,
          transform: "rotate(-30deg)",
          fontSize: "6rem",
          fontWeight: "900",
          color: "#1E3A8A", 
          letterSpacing: "10px",
          textShadow: "0px 0px 4px rgba(30,58,138,0.4)",
          userSelect: "none",
          whiteSpace: "nowrap",
        }}
      >
        DUPLICATE
      </div>
    )}
        <div className="flex justify-between items-center mt-1">
          <img src={logo} alt="DBA logo" className="w-24 h-24" />

          <div className="flex-1 text-center">
            <h2 className="text-3xl font-bold">जिला अधिवक्ता संघ इलाहाबाद</h2>
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

          <div className="w-24"></div>
        </div>

        {/* Member + Order Details */}
        <div className="flex justify-between mt-6">
          <div>
            <p><User className="inline w-4 h-4" /> {memberDetails?.name} / {memberDetails?.memberId}</p>
            <p><User className="inline w-4 h-4" /> {guardianLabel} – {memberDetails?.guardianName}</p>
            <p><MapPin className="inline w-4 h-4" /> {memberDetails?.address}</p>
            <p><Phone className="inline w-4 h-4" /> {memberDetails?.mobile}</p>
            <p><Calendar className="inline w-4 h-4" /> {formatDate(memberDetails?.dob)}</p>
          </div>

          <div>
            <p><b>Order ID:</b> {latest?.orderId}</p>
            <p><b>Order Date:</b> {formatDate(latest?.txnDate)}</p>
            <p><b>Order Type:</b> {latest?.txnType}</p>
            <p><b>Reg. Type:</b> {memberDetails?.registrationNo}</p>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-sm mt-6 border border-gray-300">
  <thead className="bg-gray-100 border-b border-gray-300">
    <tr>
      <th className="p-2 text-left w-16 border-r border-gray-300">Sr. No.</th>
      <th className="p-2 text-left border-r border-gray-300">Subscription For</th>
      <th className="p-2 text-left border-r border-gray-300">Validity Till</th>
      <th className="p-2 text-right">Total Amount</th>
    </tr>
  </thead>

  <tbody>
  {latest && (
    <tr className="border-b border-gray-300">
      <td className="p-2 border-r border-gray-300">1</td>
      <td className="p-2 border-r border-gray-300">{membershipLabel}</td>
      <td className="p-2 border-r border-gray-300">{expiryLabel}</td>
      <td className="p-2 text-right">
        ₹ {latest.amount}
      </td>
    </tr>
  )}
</tbody>

</table>

        {/* Footer */}
        <p className="mt-4">This is a Computer Generated Invoice.</p>

        <div className="flex justify-between">
          <p><b>Net Amount:</b> ₹ {totalAmount}</p>
          <p><b>User Info:</b> {userName} ({mobile})</p>
        </div>
      </div>
    );

    return (
      <div ref={ref} className="p-6">
        <div className="pb-2 mb-3 border-b border-dashed">
          <h2 className="text-center font-bold text-xl mb-4">Office Copy</h2>
          <Block />
        </div>

        <div>
          <h2 className="text-center font-bold text-xl mb-4">Member's Copy</h2>
          <Block />
        </div>
      </div>
    );
  }
);

export default ReceiptPrint;
