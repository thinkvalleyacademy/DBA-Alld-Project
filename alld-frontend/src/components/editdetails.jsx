import { useState, useEffect } from "react";
import { X } from "lucide-react";
import IconButton from "./IconButton";
import { InputField } from "./InputField";
import { showSuccessToast, showErrorToast } from "../utility/toast";
import apiService from "./apiService";
import { useAuth } from "../context/AuthContext";

const EditContactDetails = ({ memberId, memberData, onClose, onUpdateSuccess }) => {
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        fatherName: "",
        gender: "",
        dob: "",
        bloodGroup: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        ksAddress: "",
        mobile: "",
        email: "",
        registrationType: "",
        copNumber: "",
        enNo: "",
        nomineeName: "",
        nomineeMobile: "",
        documentType: "",
        documentFile: null,
        skipDocUpload: false,  // ✅ Skip checkbox for BC document
        voter: "",
        affidavite: null,
        skipAffidavit: false,  // ✅ Skip checkbox for affidavit
    });

    useEffect(() => {
        // Use passed memberData directly instead of fetching again
        if (memberData) {
            setFormData({
                name: memberData.name || "",
                fatherName: memberData.guardianName || "",
                gender: memberData.gender || "",
                dob: memberData.dob || "",
                bloodGroup: memberData.bloodGroup || "",
                address: memberData.address || "",
                city: memberData.city || "",
                state: memberData.state || "",
                zip: memberData.zip || "",
                ksAddress: memberData.ksAddress || "",
                mobile: memberData.mobile || "",
                email: memberData.email || "",
                registrationType: memberData.registrationType || "",
                copNumber: memberData.registrationNo || "",
                enNo: memberData.enNo || "",
                nomineeName: memberData.nomineeName || "",
                nomineeMobile: memberData.nomineeMobile || "",
                documentType: memberData.bcOfUpType || "",
                documentFile: null,
                skipDocUpload: false,  // ✅ Don't skip by default
                voter: memberData.voter || "",
                affidavite: null,
                skipAffidavit: false,  // ✅ Don't skip by default
            });
        }
    }, [memberData]);

    const handleChange = (e) => {
        const { name, value, type, files, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            // ✅ Handle checkboxes separately
            [name]: type === "checkbox" 
                ? checked                    // for skip checkboxes
                : type === "file" 
                    ? files[0]               // for file inputs
                    : value,                 // for text/email/select
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Only allow roleId 1 to edit member details
        if (user?.roleId !== 1) {
            showErrorToast("You do not have permission to edit member details");
            return;
        }

        if (!memberId) {
            showErrorToast("Invalid Member ID");
            return;
        }

        try {
            setIsSubmitting(true);
            const payload = {
                memberId: memberId,
                name: formData.name,
                gender: formData.gender,
                dob: formData.dob,
                bloodGroup: formData.bloodGroup,
                fatherName: formData.fatherName,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                zip: formData.zip,
                ksAddress: formData.ksAddress,
                mobile: formData.mobile,
                email: formData.email,
                registrationType: formData.registrationType,
                copNumber: formData.copNumber,
                enNo: formData.enNo,
                nomineeName: formData.nomineeName,
                nomineeMobile: formData.nomineeMobile,
                voter: formData.voter,
                bcOfUpType: formData.documentType || undefined,
                updatedBy: "Admin"
            };

            let result;
            // ✅ Only prepare FormData if there are files to upload (not skipped)
            if ((formData.documentFile && !formData.skipDocUpload) || (formData.affidavite && !formData.skipAffidavit)) {
                const formDataToSend = new FormData();
                formDataToSend.append(
                    "member",
                    new Blob([JSON.stringify(payload)], { type: "application/json" })
                );
                // ✅ Only append BC document if user selected a file AND didn't skip
                if (formData.documentFile && !formData.skipDocUpload) {
                    formDataToSend.append("bcOfUpPhoto", formData.documentFile);
                }
                // ✅ Only append affidavit if user selected a file AND didn't skip
                if (formData.affidavite && !formData.skipAffidavit) {
                }
                result = await apiService.memberUpdateWithFile(formDataToSend);
            } else {
                result = await apiService.memberUpdate(payload);
            }


            if ( result.data.status === 200) {
                showSuccessToast("Contact details updated successfully");
                if (onUpdateSuccess) onUpdateSuccess();
                onClose();
            } else {
                showErrorToast(result.message || "Failed to update contact details");
            }
        } catch (error) {
            console.error("Update contact error:", error);
            showErrorToast("Error updating contact details");
        } finally {
            setIsSubmitting(false);
        }
    };

    const genderOptions = ["Male", "Female", "Other"];
    const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl p-6 relative max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-4 sticky top-0 bg-white dark:bg-gray-800 pb-2">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Update Member Details
                    </h2>

                    <IconButton
                        title="Close"
                        icon={X}
                        backgroundColor="gray"
                        hoverColor="#6B7280"
                        onClick={onClose}
                        size="sm"
                    />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Personal Information Section */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                        <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField
                                label="Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter full name"
                                textColor="text-gray-900 dark:text-gray-100"
                                inputTextColor="text-gray-900 dark:text-gray-100"
                            />

                            <InputField
                                label="Father Name"
                                name="fatherName"
                                value={formData.fatherName}
                                onChange={handleChange}
                                placeholder="Enter father name"
                                textColor="text-gray-900 dark:text-gray-100"
                                inputTextColor="text-gray-900 dark:text-gray-100"
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                                    Gender
                                </label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                >
                                    <option value="">Select Gender</option>
                                    {genderOptions.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>

                            <InputField
                                label="Date of Birth"
                                name="dob"
                                value={formData.dob}
                                onChange={handleChange}
                                type="date"
                                textColor="text-gray-900 dark:text-gray-100"
                                inputTextColor="text-gray-900 dark:text-gray-100"
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                                    Blood Group
                                </label>
                                <select
                                    name="bloodGroup"
                                    value={formData.bloodGroup}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                >
                                    <option value="">Select Blood Group</option>
                                    {bloodGroupOptions.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Address Section */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                        <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">Address Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <InputField
                                    label="Address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Enter address"
                                    textColor="text-gray-900 dark:text-gray-100"
                                    inputTextColor="text-gray-900 dark:text-gray-100"
                                />
                            </div>

                            <InputField
                                label="City"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="Enter city"
                                textColor="text-gray-900 dark:text-gray-100"
                                inputTextColor="text-gray-900 dark:text-gray-100"
                            />

                            <InputField
                                label="State"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                placeholder="Enter state"
                                textColor="text-gray-900 dark:text-gray-100"
                                inputTextColor="text-gray-900 dark:text-gray-100"
                            />

                            <InputField
                                label="ZIP Code"
                                name="zip"
                                value={formData.zip}
                                onChange={handleChange}
                                placeholder="Enter ZIP code"
                                textColor="text-gray-900 dark:text-gray-100"
                                inputTextColor="text-gray-900 dark:text-gray-100"
                            />

                            <div className="md:col-span-2">
                                <InputField
                                    label="KS Address"
                                    name="ksAddress"
                                    value={formData.ksAddress}
                                    onChange={handleChange}
                                    placeholder="Enter KS address"
                                    textColor="text-gray-900 dark:text-gray-100"
                                    inputTextColor="text-gray-900 dark:text-gray-100"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Information Section */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                        <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField
                                label="Mobile Number"
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleChange}
                                type="tel"
                                placeholder="Enter mobile number"
                                textColor="text-gray-900 dark:text-gray-100"
                                inputTextColor="text-gray-900 dark:text-gray-100"
                            />

                            <InputField
                                label="Email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                type="email"
                                placeholder="Enter email address"
                                textColor="text-gray-900 dark:text-gray-100"
                                inputTextColor="text-gray-900 dark:text-gray-100"
                            />
                        </div>
                    </div>

                    {/* Official Information Section */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                        <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">Official Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                                    Registration Type
                                </label>
                                <select
                                    name="registrationType"
                                    value={formData.registrationType}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                >
                                    <option value="">Select Registration Type</option>
                                    <option value="C.O.P No.">C.O.P No.</option>
                                    <option value="Fresher">Fresher</option>
                                </select>
                            </div>

                            <InputField
                                label="COP Number"
                                name="copNumber"
                                value={formData.copNumber}
                                onChange={handleChange}
                                placeholder="Enter COP number"
                                textColor="text-gray-900 dark:text-gray-100"
                                inputTextColor="text-gray-900 dark:text-gray-100"
                            />

                            <InputField
                                label="EN Number"
                                name="enNo"
                                value={formData.enNo}
                                onChange={handleChange}
                                placeholder="Enter EN number"
                                textColor="text-gray-900 dark:text-gray-100"
                                inputTextColor="text-gray-900 dark:text-gray-100"
                            />
                        </div>

                        <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mt-6 mb-4">Upload BC Of UP Documents</h3>
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-extrabold mb-1 text-gray-900 dark:text-gray-100">
                                    Type
                                </label>
                                <select
                                    name="documentType"
                                    value={formData.documentType}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-500"
                                >
                                    <option value="">Select</option>
                                    <option value="ID">ID</option>
                                    <option value="COP">C.O.P</option>
                                    <option value="certificate">Certificate</option>
                                </select>
                            </div>

                            {/* ✅ File Input - Only required if NOT skipped */}
                            {!formData.skipDocUpload && (
                                <div>
                                    <label className="block text-sm font-extrabold mb-1 text-gray-900 dark:text-gray-100">
                                        File
                                    </label>
                                    <input
                                        type="file"
                                        name="documentFile"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleChange}
                                        className="w-full rounded px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Voter Section */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                        <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">
                            Do You Want To Become Voter Member
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                        {/* ✅ Affidavit - Only show if voter="yes" */}
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
                                            className="w-full rounded px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Nominee Information Section */}
                    <div className="pb-4">
                        <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">Nominee Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField
                                label="Nominee Name"
                                name="nomineeName"
                                value={formData.nomineeName}
                                onChange={handleChange}
                                placeholder="Enter nominee name"
                                textColor="text-gray-900 dark:text-gray-100"
                                inputTextColor="text-gray-900 dark:text-gray-100"
                            />

                            <InputField
                                label="Nominee Mobile"
                                name="nomineeMobile"
                                value={formData.nomineeMobile}
                                onChange={handleChange}
                                type="tel"
                                placeholder="Enter nominee mobile"
                                textColor="text-gray-900 dark:text-gray-100"
                                inputTextColor="text-gray-900 dark:text-gray-100"
                            />
                        </div>
                    </div>

                    {user?.roleId === 1 ? (
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm font-medium"
                        >
                            {isSubmitting ? "Updating..." : "Update"}
                        </button>
                    ) : (
                        <div className="w-full px-4 py-3 bg-amber-100 dark:bg-amber-900 border border-amber-300 dark:border-amber-700 rounded-lg text-center">
                            <p className="text-amber-800 dark:text-amber-200 font-medium">
                                ⚠️ You do not have permission to edit member details
                            </p>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default EditContactDetails;
