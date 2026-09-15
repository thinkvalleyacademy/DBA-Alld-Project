import { useEffect, useState, useRef } from "react";
import PageWrapper from "../../../utility/PageWrapper";
import { List, SquarePen, RefreshCcw } from "lucide-react";
import IconButton from "../../../components/IconButton";
import { InputField } from "../../../components/InputField";
import apiService from "../../../components/apiService";
import { showErrorToast, showSuccessToast } from "../../../utility/toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import qrImage from "../../../assets/tempqr.png";

const normalizeRegistrationType = (registrationType) => {
  const normalizedType = String(registrationType).toLowerCase();
  if (normalizedType === "fresher") return "fresher";
  if (normalizedType === "cop" || normalizedType.includes("c.o.p")) return "cop";
  return registrationType || "";
};

const isNewFresherMember = (data) =>
  data.memberType === "New" &&
  String(data.registrationType).toLowerCase() === "fresher";

const LifeMemberRegister = () => {
  const initialFormData = {
    // Basic Details
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
    skipDocUpload: false,  // ✅ Skip checkbox for BC document

    // Voter Section
    voter: "",
    affidavit: null,
    skipAffidavit: false,  // ✅ Skip checkbox for affidavit
  };

  const [memberId, setMemberId] = useState("");
  const [memberSuggestions, setMemberSuggestions] = useState([]);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const { user } = useAuth();

  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const isCopRequired = !isNewFresherMember(formData);

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, files, checked } = e.target;
    
    setFormData((prev) => {
      const updatedValue =
        type === "checkbox"
          ? checked                    // ✅ for skip checkboxes
          : type === "file"
            ? files[0]                 // for file inputs
            : name === "dob"
              ? new Date(value).toISOString().split("T")[0]
              : value;                 // for text/select

      return {
        ...prev,
        [name]: updatedValue,
        ...(name === "registrationType" &&
          value === "fresher" &&
          prev.memberType === "New" && { copBciNo: "" }),
      };
    });
  };

  // ✅ Handle Reset - Clears all fields
  const handleReset = () => {
    setFormData(initialFormData);
  };

  // const handleSubmit = async (e) => {}

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formDataToSend = new FormData();

      if (isCopRequired && !formData.copBciNo.trim()) {
        showErrorToast("COP No. is required unless Member Type is New and Registration Type is Fresher.");
        setIsLoading(false);
        return;
      }

      // ✅ Construct the JSON payload for 'member'
      const memberData = {
        ...(memberId && { memberId: memberId }),
        memberType: formData.memberType || "Regular",
        name: formData.name,
        gender: formData.gender,
        relation: formData.relation,
        guardianName: formData.guardianName,
        dob: formData.dob,
        bloodGroup: formData.bloodGroup,
        registrationType: formData.registrationType || "TypeA",
        registrationNo: formData.copBciNo.trim() || null,
        enNo: formData.enNo,
        address: formData.residentialAddress,
        city: formData.city,
        zip: formData.zip,
        state: "Uttar Pradesh",
        ksAddress: formData.officeAddress || "KS Address",
        mobile: formData.mobile,
        ...(formData.email && { email: formData.email }),
        nomineeName: formData.nomineeName,
        nomineeMobile: formData.nomineeMobile,
        membershipDate: formData.membershipDate,
        expiryDate: null,
        bcOfUpType: "Type1",
        voter: formData.voter,
        qrcodeDigit: "123456",
        gmLmMemberType: 2,
        status: "ACTIVE",
        ewalletBalance: formData.amount,
        designation: "Member",
        createdBy: "admin",
      };

      // ✅ Append JSON as a Blob (type must be application/json)
      formDataToSend.append(
        "member",
        new Blob([JSON.stringify(memberData)], { type: "application/json" })
      );

      // ✅ Append files
      if (capturedImage) {
        const response = await fetch(capturedImage);
        const blob = await response.blob();
        formDataToSend.append("photo", blob, "captured_photo.png");
      }

      // ✅ Only append affidavit if user selected a file AND didn't skip
      if (formData.affidavit && !formData.skipAffidavit) {
        formDataToSend.append("affidavite", formData.affidavit);
      }

      // ✅ Only append BC document if user selected a file AND didn't skip
      if (formData.documentFile && !formData.skipDocUpload) {
        formDataToSend.append("bcOfUpPhoto", formData.documentFile);
      }

      if (formData.qrFile) {
        formDataToSend.append("qrcode", formData.qrFile);
      } else {
        const tempQrFile = await fetch(qrImage).then((res) => res.blob());

        formDataToSend.append("qrcode", tempQrFile, "temp-qrcode.png");
      }

      formDataToSend.append("userId", user.mobile);

      const res = await apiService.memberRegister(formDataToSend);
      if (res.data.status === 200) {
        showSuccessToast("Member registered successfully");
        const data = res.data.data.member;

        stopCamera();
        handleReset();
        navigate(`/receipt/${data.memberId}`);
      } else showErrorToast("Failed to register member");
    } catch (error) {
      console.error("❌ Error submitting form:", error);
      alert("Something went wrong");
    } finally {
      setIsLoading(false);
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
      const res = await apiService.memberSearch({ query, type: 1 });
      setSuggestions(res.data.data || []);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setSuggestions([]);
    }
  };

  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);

  const fetchMemberDetails = async (memberId) => {
    const res = await apiService.memberDetails(memberId);
    const member = res.data.data.member;
    console.log("👉 Fetched Member Details:", member);

    setFormData((prev) => ({
      ...prev,
      name: member.name || "",
      gender: member.gender || "",
      relation: member.relation || "",
      guardianName: member.guardianName || "",
      dob: member.dob || "",
      bloodGroup: member.bloodGroup || "",
      registrationType: normalizeRegistrationType(member.registrationType),
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
  };

  useEffect(() => {
    if (formData.memberType === "Old") {
      startCamera();
    } else {
      stopCamera();
    }
  }, [formData.memberType]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    const video = videoRef.current;

    if (video && video.srcObject) {
      const stream = video.srcObject;

      // Stop each track
      const tracks = stream.getTracks();
      tracks.forEach((track) => {
        track.stop();
        stream.removeTrack(track);
      });

      video.srcObject = null;

      video.pause();
      video.removeAttribute("src");
      video.load();
    }
  };

  const handleMemberSelect = (member) => {
    setShowMemberDropdown(false);
    setMemberId(member.memberId);

    // Extract createdDate from API result
    const createdDateStr = member.membershipDate; // e.g. "2018-11-01T00:00:00"
    const createdDate = new Date(createdDateStr);

    const today = new Date();
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(today.getFullYear() - 5);

    const isOlderThan5Years = createdDate < fiveYearsAgo;

    if (!isOlderThan5Years) {
      alert("This member is not older than 5 years.");
      setMemberId("");
    } else fetchMemberDetails(member.memberId);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const context = canvas.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, 320, 240);
    const imageData = canvas.toDataURL("image/png");
    setCapturedImage(imageData);
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
            <p className="text-gray-700 dark:text-gray-200 font-medium text-lg">Registering Life Member...</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Please wait</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-4 text-gray-900 dark:text-gray-100">
        <h1 className="flex items-center text-xl font-semibold gap-2">
          <SquarePen className="w-5 h-5" />
          Add Life Member
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

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-10"
      >
        <h2 className="text-lg font-medium mb-4 text-blue-500 dark:text-gray-100">
          Personal Information
        </h2>

        <hr className="border-gray-300 dark:border-gray-700 mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-extrabold mb-1 text-gray-900 dark:text-gray-100">
              Member Type<span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-4 mt-1">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="memberType"
                  value="New"
                  checked={formData.memberType === "New"}
                  onChange={(e) => {
                    handleReset();
                    handleChange(e);
                    setFormData((prev) => ({ ...prev, amount: "5050" }));
                  }}
                  className="form-radio text-blue-500"
                />
                <span>New</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="memberType"
                  value="Old"
                  checked={formData.memberType === "Old"}
                  onChange={(e) => {
                    handleReset();
                    handleChange(e);
                    setFormData((prev) => ({ ...prev, amount: "50" }));
                  }}
                  className="form-radio text-blue-500"
                />
                <span>Old</span>
              </label>
            </div>
          </div>

          <InputField
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Name"
            required={true}
          />

          {formData.memberType === "New" && (
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
                onBlur={() =>
                  setTimeout(() => setShowMemberDropdown(false), 150)
                }
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
          )}

          <div>
            <label className="block text-sm font-extrabold mb-1 text-gray-900 dark:text-gray-100">
              Gender<span className="text-red-500">*</span>
            </label>

            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="w-full h-[40px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {formData.memberType === "Old" && (
            <div>
              <label className="block text-sm font-extrabold mb-1 text-gray-900 dark:text-gray-100">
                Choose Relation<span className="text-red-500">*</span>
              </label>

              <select
                name="relation"
                value={formData.relation}
                onChange={handleChange}
                required
                className="w-full h-[40px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500"
              >
                <option value="">Select</option>
                <option value="Son of">Son of</option>
                <option value="Wife of">Wife of</option>
                <option value="Daughter of">Daughter of</option>
              </select>
            </div>
          )}

          <InputField
            label="Guardian Name"
            name="guardianName"
            value={formData.guardianName}
            onChange={handleChange}
            placeholder="Name"
            required={true}
          />

          <InputField
            label="DOB"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            placeholder="Date of birth"
            type="date"
            required={true}
          />

          <div>
            <label className="block text-sm font-extrabold mb-1 text-gray-900 dark:text-gray-100">
              Blood Group
            </label>
            <select
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              className="w-full h-[40px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>

          <InputField
            label="En.No."
            name="enNo"
            value={formData.enNo}
            onChange={handleChange}
            placeholder="En.No."
            required={true}
          />

          <div>
            <label className="block text-sm font-extrabold mb-1 text-gray-900 dark:text-gray-100">
              Registration Type<span className="text-red-500">*</span>
            </label>

            <select
              name="registrationType"
              value={formData.registrationType}
              onChange={handleChange}
              required
              className="w-full h-[40px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="cop">C.O.P No</option>
              <option value="fresher">Fresher</option>
            </select>
          </div>

          <InputField
            label="COP"
            name="copBciNo"
            value={formData.copBciNo}
            onChange={handleChange}
            placeholder={
              isCopRequired
                ? "COP"
                : "Optional for new fresher"
            }
            required={isCopRequired}
          />
        </div>

        {/*Registration Address  */}
        <h2 className="text-lg font-medium mb-4 text-blue-500 dark:text-gray-100 mt-8">
          Residential Address
        </h2>

        <hr className="border-gray-300 dark:border-gray-700 mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 gap-6">
          <InputField
            label="Address"
            name="residentialAddress"
            value={formData.residentialAddress}
            onChange={handleChange}
            placeholder="Address"
            type="textfield"
            required={true}
          />

          <InputField
            label="City"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="City"
            required={true}
          />

          <InputField
            label="ZIP"
            name="zip"
            value={formData.zip}
            onChange={handleChange}
            placeholder="ZIP code"
            required={true}
          />
        </div>

        {/* Office Sitting Address  */}
        <h2 className="text-lg font-medium mb-4 text-blue-500 dark:text-gray-100 mt-8">
          Office sitting address
        </h2>

        <hr className="border-gray-300 dark:border-gray-700 mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-1 gap-1">
          <label className="block text-sm font-extrabold mb-1 text-gray-900 dark:text-gray-100">
            Address
            <span className="text-red-500">*</span>
          </label>

          <textarea
            name={"officeAddress"}
            value={formData.officeAddress}
            onChange={handleChange}
            placeholder="Office sitting Address"
            rows={3}
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500 resize-none"
          />
        </div>

        <h2 className="text-lg font-medium mb-4 text-blue-500 dark:text-gray-100 mt-8">
          Contact Detail
        </h2>

        <hr className="border-gray-300 dark:border-gray-700 mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 gap-6">
          <InputField
            label="Mobile"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            type="number"
            placeholder="Mobile"
            required={true}
          />

          <InputField
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            type="email"
            required={false}
          />
        </div>

        <h2 className="text-lg font-medium mb-4 text-blue-500 dark:text-gray-100 mt-8">
          Nominee Details
        </h2>

        <hr className="border-gray-300 dark:border-gray-700 mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 gap-6">
          <InputField
            label="Name"
            name="nomineeName"
            value={formData.nomineeName}
            onChange={handleChange}
            placeholder="Nominee Name"
            required={true}
          />

          <InputField
            label="Mobile"
            name="nomineeMobile"
            value={formData.nomineeMobile}
            onChange={handleChange}
            type="number"
            placeholder=" Nominee Mobile"
            required={true}
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
            required={false}
          />

          <InputField
            label="Last Subscription"
            name="lastSubscription"
            value={formData.lastSubscription}
            onChange={handleChange}
            type="date"
            required={false}
          />

          <div>
            <label className="block text-sm font-extrabold mb-1 text-gray-900 dark:text-gray-100">
              Amount <span className="text-red-500">*</span>
            </label>

            <p className="border rounded px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900  dark:text-gray-100 ">
              {formData.memberType === "Old" ? "₹50/" : "₹5000/ + ₹50"}
            </p>
          </div>
        </div>

        <h2 className="text-lg font-medium mb-4 text-blue-500 dark:text-gray-100 mt-8">
          Upload BC Of UP Documents{" "}
        </h2>

        <hr className="border-gray-300 dark:border-gray-700 mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-extrabold mb-1 text-gray-900 dark:text-gray-100">
              Type<span className="text-red-500">*</span>
            </label>
            <select
              name="documentType"
              value={formData.documentType}
              onChange={handleChange}
              required
              className="w-full h-[40px] border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="ID">ID</option>
              <option value="C.O.P">C.O.P</option>
              <option value="Certificate">Certificate</option>
            </select>
          </div>

          {formData.memberType === "Old" && (
            <>
              {/* ✅ Skip Checkbox */}
              <label className="flex items-center mb-3 space-x-2">
                <input
                  type="checkbox"
                  name="skipDocUpload"
                  checked={formData.skipDocUpload}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Skip upload (keep existing document)
                </span>
              </label>

              {/* ✅ File Input - Only required if NOT skipped */}
              {!formData.skipDocUpload && (
                <div>
                  <label className="block text-sm font-extrabold mb-1 text-gray-900 dark:text-gray-100">
                    File<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="documentFile"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleChange}
                    required={!formData.skipDocUpload}
                    className=" w-full rounded px-3 py-2 border 
                  border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-800
                  text-gray-900 dark:text-gray-100
                  file:mr-4 file:py-2 file:px-4 
                  file:rounded-md file:border-0 
                  file:text-sm file:font-semibold 
                  file:bg-indigo-600 file:text-white
                  hover:file:bg-indigo-500 
                  focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </>
          )}
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
              className="w-full  border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {formData.memberType === "Old" && (
            <>
              {/* ✅ Skip Checkbox */}
              <label className="flex items-center mb-3 space-x-2">
                <input
                  type="checkbox"
                  name="skipAffidavit"
                  checked={formData.skipAffidavit}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Skip upload (keep existing affidavit)
                </span>
              </label>

              {/* ✅ File Input - Only required if NOT skipped */}
              {!formData.skipAffidavit && (
                <div>
                  <label className="block text-sm font-extrabold mb-1 text-gray-900 dark:text-gray-100">
                    Affidavit<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="affidavit"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleChange}
                    required={!formData.skipAffidavit}
                    className=" w-full rounded px-3 py-2 border 
                  border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-800
                  text-gray-900 dark:text-gray-100
                  file:mr-4 file:py-2 file:px-4 
                  file:rounded-md file:border-0 
                  file:text-sm file:font-semibold 
                  file:bg-indigo-600 file:text-white
                  hover:file:bg-indigo-500 
                  focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </>
          )}
        </div>
        {formData.memberType === "Old" && (
          <>
            <h2 className="text-lg font-medium mb-4 text-blue-500 dark:text-gray-100 mt-8">
              Upload Photo
            </h2>

            <hr className="border-gray-300 dark:border-gray-700 mb-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Live Camera Feed */}
              <div className="flex flex-col items-center">
                <h3 className="font-bold text-gray-800 mb-2">Photo</h3>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="border rounded mb-2 w-48 h-36 object-cover"
                  width="320"
                  height="240"
                />
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-3 py-1 border rounded bg-blue-500 text-white hover:bg-blue-600"
                >
                  Take Snapshot
                </button>
              </div>

              {/* Captured Snapshot */}
              <div className="flex flex-col items-center">
                <h3 className="font-bold text-gray-800 mb-2">Captured Photo</h3>
                {capturedImage ? (
                  <>
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="w-48 h-36 object-cover border rounded mb-2"
                    />
                    <p className="text-green-600 font-semibold">
                      Image Uploaded
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500 mb-2">
                    Your captured image will appear here…
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Centered Buttons */}
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

export default LifeMemberRegister;
