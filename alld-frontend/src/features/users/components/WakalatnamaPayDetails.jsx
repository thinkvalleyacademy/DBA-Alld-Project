import { useState } from "react";
import PageWrapper from "../../../utility/PageWrapper";
import { MdSearch } from "react-icons/md";
import { Menu } from "@headlessui/react";

const WakalatnamaPayDetails = () => {
  const [search, setSearch] = useState("");
  const [data, setData] = useState([
    {
      id: 1,
      wakalatnamaNo: "0028294",
      clientName: "",
      clientMobile: "",
      amountToBePaid: 0,
      paymentStatus: "PAID",
      isClient: "NO"
    }
  ]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const filteredData = data.filter((item) =>
    item.wakalatnamaNo.includes(search)
  );

  return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border mt-6 mb-5 border-gray-200 dark:border-gray-700">
        
        <h2 className=" flex items-center gap-2  text-lg font-medium mb-4 text-blue-600 dark:text-gray-100">
                  <MdSearch className="w-6 h-6" /> Search Wakatalnama Payment Details
                </h2>
                <div className="h-0.5 bg-blue-600 mb-4"></div>
        <div className="flex items-center mb-4 gap-2">
          <MdSearch className="text-blue-600 w-5 h-5" />
          <input
            type="text"
            placeholder="Enter wakalatnama Number"
            value={search}
            onChange={handleSearch}
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring focus:ring-blue-500"
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Search
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border border-gray-200 dark:border-gray-700">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-4 py-2 border">S.N.</th>
                <th className="px-4 py-2 border">Wakalatnama No</th>
                <th className="px-4 py-2 border">Client Name</th>
                <th className="px-4 py-2 border">Client Mobile</th>
                <th className="px-4 py-2 border">Amount to be Paid</th>
                <th className="px-4 py-2 border">Payment Status</th>
                <th className="px-4 py-2 border">Is Client</th>
                <th className="px-4 py-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={item.id} className="text-center">
                    <td className="px-4 py-2 border">{index + 1}</td>
                    <td className="px-4 py-2 border">{item.wakalatnamaNo}</td>
                    <td className="px-4 py-2 border">{item.clientName}</td>
                    <td className="px-4 py-2 border">{item.clientMobile}</td>
                    <td className="px-4 py-2 border">{item.amountToBePaid}</td>
                    <td className="px-4 py-2 border">
                      <span
                        className={`px-2 py-1 rounded text-white ${
                          item.paymentStatus === "PAID"
                            ? "bg-green-600"
                            : "bg-red-600"
                        }`}
                      >
                        {item.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2 border">{item.isClient}</td>
                    <td className="px-4 py-2 border">
                      <Menu as="div" className="relative inline-block text-left">
                        <Menu.Button className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700">
                          Action
                        </Menu.Button>
                        <Menu.Items className="absolute right-0 mt-2 w-28 bg-white border border-gray-200 rounded shadow-lg">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                className={`${
                                  active ? "bg-gray-100" : ""
                                } w-full px-2 py-1 text-left`}
                              >
                                Edit
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                className={`${
                                  active ? "bg-gray-100" : ""
                                } w-full px-2 py-1 text-left`}
                              >
                                Delete
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Menu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination placeholder */}
        <div className="flex justify-between items-center mt-4">
          <span>
            Showing 1 to {filteredData.length} of {data.length} entries
          </span>
          <div className="flex gap-2">
            <button className="px-2 py-1 border rounded">Previous</button>
            <button className="px-2 py-1 border rounded">Next</button>
          </div>
        </div>
      </div>
  );
};

export default WakalatnamaPayDetails;
