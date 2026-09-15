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

const extractFeeAmount = (res) => {
  const amount = res?.data?.data?.amount ?? res?.data?.amount;
  const numericAmount = Number(amount);
  return Number.isFinite(numericAmount) ? numericAmount : null;
};

const isNewFresherMember = (data) =>
  data.memberType === "New" &&
  String(data.registrationType).toLowerCase() === "fresher";

const RegisterMember = () => {
  const initialFormData = {
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
    affidavite: null,
    skipAffidavit: false,  // ✅ Skip checkbox for affidavit
  };

  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationFee, setRegistrationFee] = useState(null);
  const { user } = useAuth();
  const isCopRequired = !isNewFresherMember(formData);

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
              : value;

      // If memberType is changed to "New", set dates automatically
      if (name === "memberType" && value === "New") {
        const today = new Date();
        const currentDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const lastDateOfMonth = `${lastDayOfMonth.getFullYear()}-${String(lastDayOfMonth.getMonth() + 1).padStart(2, '0')}-${String(lastDayOfMonth.getDate()).padStart(2, '0')}`;

        return {
          ...prev,
          [name]: updatedValue,
          membershipDate: currentDate,
          lastSubscription: lastDateOfMonth,
        };
      }

      return {
        ...prev,
        [name]: updatedValue,
        ...(name === "registrationType" &&
          value === "fresher" &&
          prev.memberType === "New" && { copBciNo: "" }),
      };
    });
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setRegistrationFee(null);
  };

  const fetchRegistrationFeeQuote = async (memberType) => {
    try {
      const quoteRes = await apiService.memberRegistrationFeeQuote({
        memberType,
        gmLmMemberType: 1,
      });
      const amount = extractFeeAmount(quoteRes);
      if (amount !== null) {
        setRegistrationFee(amount);
        return amount;
      }
      throw new Error("Invalid registration fee quote response");
    } catch (error) {
      setRegistrationFee(null);
      console.error("Failed to fetch registration fee quote:", error);
      return null;
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

  useEffect(() => {
    fetchRegistrationFeeQuote(formData.memberType);
  }, [formData.memberType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      const computedRegistrationFee =
        registrationFee ??
        (await fetchRegistrationFeeQuote(formData.memberType));
      if (computedRegistrationFee === null) {
        showErrorToast("Unable to fetch registration fee. Please try again.");
        setIsLoading(false);
        return;
      }

      if (isCopRequired && !formData.copBciNo.trim()) {
        showErrorToast("COP No. is required unless Member Type is New and Registration Type is Fresher.");
        setIsLoading(false);
        return;
      }

      // ✅ Construct the JSON payload for 'member'
      const memberData = {
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
        expiryDate: formData.lastSubscription ,
        bcOfUpType: "Type1",
        voter: formData.voter,
        qrcodeDigit: "123456",
        gmLmMemberType: 1,
        status: "ACTIVE",
        ewalletBalance: computedRegistrationFee,
        designation: "Member",
        createdBy: user.mobile,
      };

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
      if (formData.affidavite && !formData.skipAffidavit) {
        formDataToSend.append("affidavite", formData.affidavite);
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

  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    startCamera();
  }, []);

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
            <p className="text-gray-700 dark:text-gray-200 font-medium text-lg">Registering Member...</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Please wait</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-4 text-gray-900 dark:text-gray-100">
        <h1 className="flex items-center text-xl font-semibold gap-2">
          <SquarePen className="w-5 h-5" />
          Add General Member
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
                  onChange={handleChange}
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
                  onChange={handleChange}
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

          <div>
            <label className="block text-sm font-medium mb-1 mt-3">
              Gender<span className="text-red-500">*</span>
            </label>

            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500"
            >
                  <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            <label className="block text-sm font-medium mb-1 mt-3">
              Choose Relation<span className="text-red-500">*</span>
            </label>

            <select
              name="relation"
              value={formData.relation}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="Son of">Son of</option>
              <option value="Wife of">Wife of</option>
              <option value="Daughter of">Daughter of</option>
            </select>
          </div>

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
              Blood Group<span className="text-red-500">*</span>
            </label>
            <select
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500"
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
            <label className="block text-sm font-medium mb-1 mt-3">
              Registration Type<span className="text-red-500">*</span>
            </label>

            <select
              name="registrationType"
              value={formData.registrationType}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="cop">C.O.P No</option>
              <option value="fresher">Fresher</option>
            </select>
          </div>

          <InputField
            label="COP No."
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
            required={true}
          />

          <InputField
            label="Last Subscription"
            name="lastSubscription"
            value={formData.lastSubscription}
            onChange={handleChange}
            type="date"
            required={true}
          />

          <div>
            <label className="block text-sm font-extrabold mb-1 text-gray-900 dark:text-gray-100">
              Amount <span className="text-red-500">*</span>
            </label>

            <p className="border rounded px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900  dark:text-gray-100 ">
              {registrationFee === null
                ? "Fetching fee..."
                : `₹${Number(registrationFee).toFixed(2)}`}
            </p>
          </div>
        </div>

        <h2 className="text-lg font-medium mb-4 text-blue-500 dark:text-gray-100 mt-8">
          Upload BC Of UP Documents{" "}
        </h2>

        <hr className="border-gray-300 dark:border-gray-700 mb-4" />

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

        {/* ✅ Document Type & File - Only show if NOT skipped */}
        {!formData.skipDocUpload && (
          <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-extrabold mb-1 text-gray-900 dark:text-gray-100">
                Type<span className="text-red-500">*</span>
              </label>
              <select
                name="documentType"
                value={formData.documentType}
                onChange={handleChange}
                required={!formData.skipDocUpload}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500"
              >
                <option value="">Select</option>
                <option value="ID">ID</option>
                <option value="COP">C.O.P</option>
                <option value="certificate">Certificate</option>
              </select>
            </div>

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
                className="
                w-full rounded px-3 py-2 border 
                border-gray-300 dark:border-gray-600 
                bg-white dark:bg-gray-800
                text-gray-900 dark:text-gray-100
                file:mr-4 file:py-2 file:px-4 
                file:rounded-md file:border-0 
                file:text-sm file:font-semibold 
                file:bg-indigo-600 file:text-white
                hover:file:bg-indigo-500 
                focus:outline-none focus:ring-2 focus:ring-indigo-500
              "
              />
            </div>
          </div>
        )}

        <h2 className="text-lg font-medium mb-4 text-blue-500 dark:text-gray-100 mt-8">
          Do You Want To Become Voter Member{" "}
        </h2>

        <hr className="border-gray-300 dark:border-gray-700 mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-extrabold mb-1 text-gray-900 dark:text-gray-100">
              Voter
            </label>
            <select
              name="voter"
              value={formData.voter}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        {/* ✅ Affidavit Section - Only show if voter="yes" */}
        {formData.voter === "yes" && (
          <>
            {/* ✅ Skip Checkbox */}
            <label className="flex items-center mb-3 space-x-2 mt-4">
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
                  name="affidavite"
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

        <h2 className="text-lg font-medium mb-4 text-blue-500 dark:text-gray-100 mt-8">
          Upload Photo
        </h2>

        <hr className="border-gray-300 dark:border-gray-700 mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div className="flex flex-col items-center">
            <h3 className="font-bold text-gray-800 mb-2">Captured Photo</h3>
            {capturedImage ? (
              <>
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-48 h-36 object-cover border rounded mb-2"
                />
                <p className="text-green-600 font-semibold">Image Uploaded</p>
              </>
            ) : (
              <p className="text-gray-500 mb-2">
                Your captured image will appear here…
              </p>
            )}
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

export default RegisterMember;
