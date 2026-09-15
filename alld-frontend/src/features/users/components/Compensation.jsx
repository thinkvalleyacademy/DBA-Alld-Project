import {
  HandHeart,
} from "lucide-react";
import { useEffect, useState } from "react";
import apiService from "../../../components/apiService";
import PageWrapper from "../../../utility/PageWrapper";
import { useAuth } from "../../../context/AuthContext";
import { showErrorToast, showSuccessToast } from "../../../utility/toast";
import { getMemberStatusMeta } from "../../../utility/memberStatus";

const Compensation = () => {
  const [memberId, setMemberId] = useState("");
  const [memberSuggestions, setMemberSuggestions] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [listData, setListData] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberCompensationList, setMemberCompensationList] = useState([]);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const { user } = useAuth();
  const selectedMemberStatusMeta = getMemberStatusMeta(selectedMember?.status);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!memberId || !amount || !description) {
      showErrorToast("All fields are required.");
      return;
    }
    try {
      const dataToLog = {
        memberId: memberId,
        amount: Number(amount),
        compensationDate: new Date().toISOString().split("T")[0], // ✅ yyyy-MM-dd
        description: description,
      };

      const res = await apiService.createCompensation(dataToLog, user.userId);
      if (res.data.status === 200) {
        showSuccessToast("Compensation Added successfully");
        fetchMemberCompensationList(memberId);
        setAmount("");
        setDescription("");
        fetchData();
      } else showErrorToast("Something went wrong, please try again.");
    } catch (err) {
      console.error(err);
      showErrorToast("Something went wrong, please try again.");
    }
  };

  const fetchData = async () => {
    const response = await apiService.getCompensationList();
    setListData(response.data.data);
  };

  useEffect(() => {
    fetchData();
  }, []);


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
      const res = await apiService.memberSearch({ query, type: 3 });
      setSuggestions(res.data.data || []);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setSuggestions([]);
    }
  };

  const fetchMemberCompensationList = async (memberID) => {
    try {
      const res = await apiService.getCompensationMemberList(memberID);
      if (res.data.status === 200) {
        setMemberCompensationList(res.data.data || []);
      } else {
        setMemberCompensationList([]);
      }
    } catch (err) {
      console.error("Error fetching member compensation list:", err);
      setMemberCompensationList([]);
    }
  };

  return (
    <PageWrapper>
      {/* Center Page Title */}
      <div className="flex justify-center mb-6 border-b pb-3">
        <h1 className=" flex items-center justify-between gap-2 text-2xl font-semibold ">
          <HandHeart className="w-5 h-5 text-rose-600" />
          Welfare Member Compensation
        </h1>
      </div>

      <form className="bg-white dark:bg-gray-900 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
            Search/Select Member<span className="text-red-500">*</span>
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
            placeholder="Search/Select Member"
            required
            autoComplete="off"
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500"
            onBlur={() => setTimeout(() => setShowSearchDropdown(false), 150)}
          />

          {showSearchDropdown && memberSuggestions.length > 0 && (
            <ul className="absolute z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-full mt-1 rounded shadow max-h-60 overflow-y-auto">
              {memberSuggestions.map((s) => (
                <li
                  key={s.id || s.memberId}
                  className="px-3 py-2 hover:bg-blue-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-gray-100"
                  onMouseDown={() => {
                    setMemberId(`${s.memberId}`);
                    setSelectedMember(s);
                    setShowSearchDropdown(false);
                    fetchMemberCompensationList(s.memberId);
                  }}
                >
                  {s.name} ({s.memberId})
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Member Details Card */}
        {selectedMember && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200">Member Details</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                selectedMemberStatusMeta.softPillClassName
              }`}>
                {selectedMemberStatusMeta.label}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Name</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{selectedMember.name}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Member ID</p>
                <p className="font-medium text-blue-600 dark:text-blue-400">{selectedMember.memberId}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Registration No</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{selectedMember.registrationNo}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Member Type</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{selectedMember.memberTypeName}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Mobile</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{selectedMember.mobile}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">En. No</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{selectedMember.enNo}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">City</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{selectedMember.city}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Created At</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedMember.createdAt ? new Date(selectedMember.createdAt).toLocaleDateString() : "-"}
                </p>
              </div>
            </div>

            {/* Member Compensation History */}
            {memberCompensationList.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Compensation History ({memberCompensationList.length} records)
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Comp ID</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberCompensationList.map((comp) => (
                        <tr key={comp.compensationId} className="border-b border-gray-200 dark:border-gray-600">
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{comp.compensationId}</td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/40 px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-300">
                              ₹{comp.amount}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{comp.compensationDate}</td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{comp.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Amount & Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
              Compensation Amount<span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
              Description<span className="text-red-500">*</span>
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              rows={3}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
        <div className="flex justify-center mt-4">
          <button
            type="submit"
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Add Compensation
          </button>
        </div>
      </form>

      {/* Compensation List */}
      <div className="mt-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Last 10 Compensation Entries
          </h2>
        </div>

        {listData.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No compensation records found
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-sm">
              {/* Table Head */}
              <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800">
                <tr>
                  {[
                    "Comp ID",
                    "Member ID",
                    "Name",
                    "Amount",
                    "Date",
                    "Description",
                    "Phone",
                  ].map((head) => (
                    <th
                      key={head}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {listData.map((item) => (
                  <tr
                    key={item.compensationId}
                    className="group transition bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {item.compensationId}
                    </td>

                    <td className="px-4 py-3 font-mono text-blue-600 dark:text-blue-400">
                      {item.memberId}
                    </td>

                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      {item.memberName}
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/40 px-3 py-1 text-sm font-semibold text-green-700 dark:text-green-300">
                        ₹{item.amount}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {item.compensationDate}
                    </td>

                    <td className="px-4 py-3 max-w-xs truncate text-gray-600 dark:text-gray-300">
                      {item.description}
                    </td>

                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {item.userPhone}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default Compensation;
