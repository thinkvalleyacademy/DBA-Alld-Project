import { forwardRef } from "react";
import logo from "../assets/images.jpg";
import { User, Phone, Calendar } from "lucide-react";

const CompensationReceiptPrint = forwardRef(
  ({ compensation, userName, duplicate, mobile }, ref) => {

    if (!compensation) return null;

    const Block = () => (
      <div className="relative p-3 text-black">

        {/* DUPLICATE WATERMARK */}
        {duplicate && (
          <div
            className="absolute inset-0 flex justify-center items-center pointer-events-none select-none"
            style={{
              zIndex: 0,
              opacity: 0.12,
              transform: "rotate(-30deg)",
              fontSize: "9rem",
              fontWeight: "900",
              color: "#1E3A8A",
              letterSpacing: "10px",
              whiteSpace: "nowrap",
            }}
          >
            DUPLICATE
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mt-1">
          <img src={logo} alt="DBA logo" className="w-24 h-24 object-contain" />

          <div className="flex-1 text-center">
            <h2 className="text-3xl font-bold">
              जिला अधिवक्ता संघ इलाहाबाद
            </h2>
            <h3 className="text-lg font-semibold">
              Welfare Member Compensation
            </h3>
          </div>

          <div className="w-24"></div>
        </div>

        {/* Member + Receipt Details */}
        <div className="flex justify-between mt-6 text-sm leading-6">
          <div>
            <p>
              <User className="inline w-4 h-4" />{" "}
              {compensation.memberName} / {compensation.memberId}
            </p>
            <p>
              <Phone className="inline w-4 h-4" /> {compensation.userPhone}
            </p>
            <p>
              <Calendar className="inline w-4 h-4" /> Compensation Date –{" "}
              {compensation.compensationDate}
            </p>
          </div>

          <div>
            <p>
              <b>Receipt ID:</b> {compensation.compensationId}
            </p>
            <p>
              <b>Created On:</b>{" "}
              {compensation.createdDate?.slice(0, 10)}
            </p>
            <p>
              <b>Type:</b> Welfare Assistance
            </p>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-sm mt-6 border border-gray-300">
          <thead className="bg-gray-100 border-b border-gray-300">
            <tr>
              <th className="p-2 text-left w-16 border-r border-gray-300">
                Sr. No.
              </th>
              <th className="p-2 text-left border-r border-gray-300">
                Description
              </th>
              <th className="p-2 text-right">
                Amount
              </th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-b border-gray-300">
              <td className="p-2 border-r border-gray-300">1</td>
              <td className="p-2 border-r border-gray-300">
                {compensation.description}
              </td>
              <td className="p-2 text-right">
                ₹ {compensation.amount}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <p className="mt-4 text-sm">
          This is a Computer Generated Compensation Receipt.
        </p>

        <div className="flex justify-between mt-2 text-sm font-semibold">
          <p>
            Net Compensation Amount : ₹ {compensation.amount}
          </p>
          <p>
            User Info : {userName} ({mobile})
          </p>
        </div>
      </div>
    );

    return (
      <div ref={ref} className="p-6">
        {/* Office Copy */}
        <div className="pb-6 mb-10 border-b border-dashed border-gray-400">
          <h2 className="text-center font-bold text-xl mb-4">
            Office Copy
          </h2>
          <Block />
        </div>

        {/* Member Copy */}
        <div>
          <h2 className="text-center font-bold text-xl mb-4">
            Member’s Copy
          </h2>
          <Block />
        </div>
      </div>
    );
  }
);

export default CompensationReceiptPrint;
