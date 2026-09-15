import { useState  } from "react";
import PageWrapper from "../../../utility/PageWrapper";
import { List, SquarePen, RefreshCcw } from "lucide-react";
import IconButton from "../../../components/IconButton";
import { InputField } from "../../../components/InputField";
import apiService from "../../../components/apiService";
import { showErrorToast, showSuccessToast } from "../../../utility/toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const RegisterWelfareMember = () => {
  const initialFormData = {
    // Basic Details
    memberId: "",
    memberType: "Old",
    name: "",
    gender: "",
    relation: "",
    guardianName: "",
    dob: "",
    bloodGroup: "",
    registrationType: "",
    copBciNo: "",
    enNo: "",

    // Address
    residentialAddress: "",
    city: "",
    zip: "",
    officeAddress: "",

    // Contact Details
    mobile: "",
    email: "",

    // Nominee Details
    nomineeName: "",
    nomineeMobile: "",

    // DBA (Membership) Details
    membershipDate: "",
    lastSubscription: "",
    amount: "50",

    // Document Uploads
    documentType: "",
    documentFile: null,

    // Voter Section
    voter: "",
    affidavit: null,
  };

  const [memberId, setMemberId] = useState("");
  const [memberSuggestions, setMemberSuggestions] = useState([]);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === "file" ? files[0] : value,
    });

    if (name === "dob") {
      const isoDate = new Date(value).toISOString().split("T")[0];
      setFormData((prev) => ({ ...prev, [name]: isoDate }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
    const formDataToSend = {

        
        memberId: formData.memberId,
        
        registrationNo: formData.copBciNo,
        
        mobile: formData.mobile,
      
        amount: 500.0,
        userPhone: user.mobile,
        monthsNo:1

      };
    

      const res = await apiService.welfareRegister(formDataToSend);
      if (res.data.status === 200) {
        showSuccessToast("Member registered successfully");
      } else showErrorToast("Failed to register member");


      handleReset();
      navigate(`/receipt/${formData.memberId}`);
    } catch (error) {
      console.error("❌ Error submitting form:", error);
      alert("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMemberDetails = async (memberId) => {
    try {
      const res = await apiService.memberDetails(memberId);
      const member = res.data.data.member;

      if (!member) {
        console.error("No member data returned");
        showErrorToast("Failed to fetch member details");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        memberId: member.memberId || "",
        name: member.name || "",
        gender: member.gender || "",
        relation: member.relation || "",
        guardianName: member.guardianName || "",
        dob: member.dob || "",
        bloodGroup: member.bloodGroup || "",
        registrationType: member.registrationType || "",
        copBciNo: member.registrationNo || "",
        enNo: member.enNo || "",
        residentialAddress: member.address || "",
        city: member.city || "",
        zip: member.zip || "",
        officeAddress: member.ksAddress || "",
        mobile: member.mobile || "",
        email: member.email || "",
        nomineeName: member.nomineeName || "",
        nomineeMobile: member.nomineeMobile || "",
        membershipDate: member.membershipDate || "",
        lastSubscription: member.expiryDate || "",
        voter: member.voter || "",
        documentType: member.bcOfUpType || "",
      }));
    } catch (error) {
      console.error("❌ Error fetching member details:", error);
      showErrorToast("Failed to fetch member details");
    }
  };

  const handleChangee = (e) => {
    const { value } = e.target;
    setMemberId(value);
  };

  const fetchSuggestions = async (query, setSuggestions) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await apiService.gmlmSearch({ query});
      setSuggestions(res.data.data || []);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setSuggestions([]);
    }
  };

  const handleMemberSelect = (member) => {
    console.log("👉 Selected Member:", member);
    setShowMemberDropdown(false);
    setMemberId(member.memberId);

    fetchMemberDetails(member.memberId);
  };

  return (
    <PageWrapper>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="text-gray-700 dark:text-gray-200 font-medium text-lg">Registering Welfare Member...</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Please wait</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-4 text-gray-900 dark:text-gray-100">
        <h1 className="flex items-center text-xl font-semibold gap-2">
          <SquarePen className="w-5 h-5" />
          Add Welfare Member
        </h1>
        <div className="flex gap-2">
          <IconButton
            title="List"
            icon={List}
            backgroundColor="#615CA8"
            hoverColor="#16A34A"
            onClick={() => navigate("/member/list")}
          />
          <IconButton
            title="Refresh"
            icon={RefreshCcw}
            backgroundColor="grey"
            hoverColor="bg-green-600"
            onClick={() => handleReset()}
          />
        </div>
      </div>


      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-10"
      >
        <h2 className="text-lg font-medium mb-4 text-blue-500 dark:text-gray-100">
          Personal Information
        </h2>

        <hr className="border-gray-300 dark:border-gray-700 mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 gap-6">
          <div className="relative">
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
              Search/Select Member
            </label>
            <input
              type="text"
              name="memberID"
              value={memberId}
              onChange={(e) => {
                handleChangee(e);
                fetchSuggestions(e.target.value, setMemberSuggestions);
                setShowMemberDropdown(true);
              }}
              placeholder="Search/Select Member"
              required
              autoComplete="off"
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500"
              onBlur={() => setTimeout(() => setShowMemberDropdown(false), 150)}
            />

            {/* Dropdown */}
            {showMemberDropdown && memberSuggestions.length > 0 && (
              <ul className="absolute z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-full mt-1 rounded shadow max-h-60 overflow-y-auto">
                {memberSuggestions.map((s) => (
                    <li
                      key={s.id}
                      className="px-3 py-2 hover:bg-blue-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-gray-100"
                      onMouseDown={() => {
                        setMemberId(`${s.name} (${s.memberId})`);
                        setShowMemberDropdown(false);
                        handleMemberSelect(s);
                      }}
                  >
                    {s.name} ({s.memberId})
                  </li>
                ))}
              </ul>
            )}
          </div>

          <InputField
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Name"
            disabled={true}
          />

          <div>
            <label className="block text-sm font-medium mb-1 mt-3">
              Gender<span className="text-red-500">*</span>
            </label>

            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              disabled={true}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-70  text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <InputField
            label="Guardian Name"
            disabled={true}
            name="guardianName"
            value={formData.guardianName}
            onChange={handleChange}
            placeholder="Name"
          />

          <InputField
            label="DOB"
            name="dob"
            value={formData.dob}
            disabled={true}
            onChange={handleChange}
            placeholder="Date of birth"
            type="date"
          />


          <InputField
          required={true}
          disabled={true}
            label="COP"
            name="copBciNo"
            value={formData.copBciNo}
            onChange={handleChange}
            placeholder="COP"
          />

          <InputField
            label="En.No."
            name="enNo"
            value={formData.enNo}
            onChange={handleChange}
            placeholder="En.No."
            disabled={true}
          />

          <div>
            <label className="block text-sm font-medium mb-1 mt-3">
              Registration Type<span className="text-red-500">*</span>
            </label>

            <select
              name="registrationType"
              value={formData.registrationType}
              disabled={true}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-70 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="C.O.P No.">C.O.P No</option>
              <option value="Fresher">Fresher</option>
            </select>
          </div>
        </div>

      
        <h2 className="text-lg font-medium mb-4 text-blue-500 dark:text-gray-100 mt-8">
          Contact Detail
        </h2>

        <hr className="border-gray-300 dark:border-gray-700 mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 gap-6">
          <InputField
            label="Mobile"
            required={true}
            name="mobile"
            disabled={true}
            value={formData.mobile}
            onChange={handleChange}
            type="number"
            placeholder="Mobile"
          />


        </div>

        <h2 className="text-lg font-medium mb-4 text-blue-500 dark:text-gray-100 mt-8">
          DBA Detail{" "}
        </h2>

        <hr className="border-gray-300 dark:border-gray-700 mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 gap-6">
          <InputField
            label="Date of Membership"
            name="membershipDate"
            value={formData.membershipDate}
            onChange={handleChange}
            type="date"
            disabled={true}
          />

          <InputField
            label="Last Subscription"
            name="lastSubscription"
            value={formData.lastSubscription}
            onChange={handleChange}
            disabled={true}
            type="date"
          />

          <div>
            <label className="block text-sm font-extrabold mb-1 text-gray-900 dark:text-gray-100">
              Amount <span className="text-red-500">*</span>
            </label>

            <p className="border rounded px-3 py-2 bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-70 text-gray-900  dark:text-gray-100 ">
                ₹500/
            </p>
          </div>
        </div>

        <h2 className="text-lg font-medium mb-4 text-blue-500 dark:text-gray-100 mt-8">
          Do You Want To Become Voter Member{" "}
        </h2>

        <hr className="border-gray-300 dark:border-gray-700 mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-extrabold mb-1 text-gray-900 dark:text-gray-100">
              Voter<span className="text-red-500">*</span>
            </label>
            <select
              name="voter"
              value={formData.voter}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-70 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-8">
          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </form>
    </PageWrapper>
  );
};

export default RegisterWelfareMember;
