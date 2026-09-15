import { useState, useRef } from "react";
import PageWrapper from "../../../utility/PageWrapper";
import { MdPrint } from "react-icons/md";
import apiService from "../../../components/apiService";
import WakalatnamaPayDetails from "./WakalatnamaPayDetails";

import { showErrorToast, showSuccessToast } from "../../../utility/toast";

const Wakalatnama = () => {
  const handleReset = () => {
    console.log("Reset Form");
    setFormData({
      memberID: "",
      name: "",
      amount: "150",
      mobile: "",
    });
    setIsClient("yes");
  };

  const [formData, setFormData] = useState({
    memberID: "",
    name: "",
    amount: "150",
    mobile: "",
  });



  const pdfRef = useRef();
  const [isClient, setIsClient] = useState("yes");
  const [direct, setDirect] = useState("no");
  const [memberSuggestions, setMemberSuggestions] = useState([]);
  const [advocateSuggestions, setAdvocateSuggestions] = useState([]);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showAdvocateDropdown, setShowAdvocateDropdown] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchSuggestions = async (query, setSuggestions) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await apiService.memberSearch({ query });
      console.log("Raw response:", res);

      // Axios stores data in res.data
      setSuggestions(res.data.data || []);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setSuggestions([]);
    }
  };

  const handleIsClientChange = (value) => {
    setIsClient(value);
    setFormData((prev) => ({
      ...prev,
      amount: value === "yes" ? 150 : 50,
    }));
  };


  
  const handleSubmit = (e) => {
    e.preventDefault();
    

    const payload = {
      orderId: "ORD" + Date.now(),
      memberId: formData.memberID, 
      name: formData.name || "", 
      mobile: formData.mobile || "", 
      amount: 2500.75,
      memberAmount: 2000.5, 
      paymentStatus: "PAID", 
      paymentDate: new Date().toISOString(),
      status: "ACTIVE",
      createdDate: new Date().toISOString(),
      createdBy: "admin_user",
      updatedDate: new Date().toISOString(),
      updatedBy: "admin_user", 
      isClient: isClient === "yes",
    };

    const today = new Date();

    const options = { day: "2-digit", month: "short", year: "numeric" };
    const formattedDate = today.toLocaleDateString("en-GB", options);

    console.log(formattedDate); 

    const optionss = { hour: "2-digit", minute: "2-digit", hour12: true };
    const formattedTime = today.toLocaleTimeString("en-US", optionss);

    console.log(formattedTime); 

    try {
      const res = apiService.wekalatnamaGenerate(payload);
      console.log("Response from backend:", res.data);
      showSuccessToast("Wakalatnama generated successfully!");
      handleReset();
    } catch (error) {
      console.error("Error generating Wakalatnama:", error);
      showErrorToast("Failed to generate Wakalatnama. Please try again")
    }
  };

  return (
    <PageWrapper>
            <div ref={pdfRef} style={{ display: "none" }} />

      {/* Header */}
      <div className="flex justify-between items-center mb-6 text-gray-900 dark:text-gray-100">
        <h1 className="flex items-center text-xl font-semibold gap-2">
          <MdPrint className="w-5 h-5" />
          Generate Wakalatnama
        </h1>
      
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700"
      >
        <h2 className=" flex items-center gap-2  text-lg font-medium mb-4 text-blue-600 dark:text-gray-100">
          <MdPrint className="w-5 h-5" /> Generate Wakalatnama
        </h2>
        <div className="h-0.5 bg-blue-600 mb-4"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-2 gap-8">
          {direct === "no" ? (
            <div className="relative">
              <label className="block text-sm font-medium mb-1 ">
                Search/Select Member
              </label>
              <input
                type="text"
                name="memberID"
                value={formData.memberID}
                onChange={(e) => {
                  handleChange(e);
                  fetchSuggestions(e.target.value, setMemberSuggestions);
                  setShowMemberDropdown(true);
                }}
                placeholder="Search/Select Member"
                required
                autoComplete="off"
                className="w-full border rounded px-3 py-2 mr-5 focus:outline-none focus:ring focus:ring-blue-500"
                onBlur={() =>
                  setTimeout(() => setShowMemberDropdown(false), 100)
                }
              />
              {showMemberDropdown && memberSuggestions.length > 0 && (
                <ul className="absolute z-10 bg-white border w-full mt-1 rounded shadow">
                  {memberSuggestions.map((s) => (
                    <li
                      key={s.id}
                      className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                      onMouseDown={() => {
                        setFormData((prev) => ({
                          ...prev,
                          memberID: s.memberId,
                          name: s.name,
                          mobile: s.mobile || "",
                        }));
                        setShowMemberDropdown(false);
                      }}
                    >
                      {s.name} ({s.memberId})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <>
              <div className="relative">
                <label className="block text-sm font-medium mb-1 ">
                  Advocate Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  required
                  onChange={(e) => {
                    handleChange(e);
                    fetchSuggestions(e.target.value, setAdvocateSuggestions);
                    setShowAdvocateDropdown(true);
                  }}
                  placeholder="Advocate Name"
                  autoComplete="off"
                  className="w-full border rounded px-3 py-2 mr-5 focus:outline-none focus:ring focus:ring-blue-500"
                  onBlur={() =>
                    setTimeout(() => setShowAdvocateDropdown(false), 100)
                  }
                />
                {showAdvocateDropdown && advocateSuggestions.length > 0 && (
                  <ul className="absolute z-10 bg-white border w-full mt-1 rounded shadow">
                    {advocateSuggestions.map((s) => (
                      <li
                        key={s.id}
                        className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                        onMouseDown={() => {
                          setFormData((prev) => ({
                            ...prev,
                            memberID: s.memberId,
                            name: s.name,
                            mobile: s.mobile || "",
                          }));
                          setShowAdvocateDropdown(false);
                        }}
                      >
                        {s.name} ({s.memberId})
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 ">
                  Advocate Phone number
                </label>
                <input
                  type="number"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="Search/Select Member"
                  className="w-full border rounded px-3 py-2 mr-5 focus:outline-none focus:ring focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <div className="flex gap-8">
            <div>
              <label className="block text-sm font-medium mb-1">
                Is client<span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4 ">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="isClient"
                    value="yes"
                    checked={isClient === "yes"}
                    onChange={() => handleIsClientChange("yes")}
                  />
                  <span>Yes</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="isClient"
                    value="no"
                    checked={isClient === "no"}
                    onChange={() => handleIsClientChange("no")}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {/* Second group */}
            <div className="ml-4">
              <label className="block text-sm font-medium mb-1 ">
                Direct<span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="direct"
                    value="yes"
                    checked={direct === "yes"}
                    onChange={() => setDirect("yes")}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Yes</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              No. Of Wakalatnama
            </label>
            <input
              type="number"
              name="wakalatnamaCount"
              value="1"
              onChange={handleChange}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              readOnly
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none"
            />
          </div>
        </div>

        {/* Centered Buttons */}
        <div className="flex justify-center gap-3 mt-8">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded shadow-sm"
          >
            Reset
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm"
          >
            Save
          </button>
        </div>
      </form>


      <WakalatnamaPayDetails />

      
    </PageWrapper>
  );
};

export default Wakalatnama;
