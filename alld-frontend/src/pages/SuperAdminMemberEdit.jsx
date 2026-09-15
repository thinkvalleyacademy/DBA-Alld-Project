import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../components/apiService';
import { showSuccessToast, showErrorToast } from '../utility/toast';
import { Upload, Camera, RefreshCcw } from 'lucide-react';

const SuperAdminMemberEdit = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    gender: '',
    dob: '',
    bloodGroup: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    ksAddress: '',
    registrationType: '',
    copNumber: '',
    enNo: '',
    nomineeName: '',
    nomineeMobile: '',
    voter: '',
    bcOfUpType: '',
    status: 'ACTIVE',
    gmLmMemberType: 1,
    photo: null,
  });

  const resetEditor = () => {
    setSelectedMember(null);
    setFormData({
      name: '', fatherName: '', gender: '', dob: '', bloodGroup: '', mobile: '',
      email: '', address: '', city: '', state: '', zip: '', ksAddress: '',
      registrationType: '', copNumber: '', enNo: '', nomineeName: '', nomineeMobile: '',
      voter: '', bcOfUpType: '', status: 'ACTIVE', gmLmMemberType: 1, photo: null,
    });
    setPhotoPreview(null);
    setCapturedImage(null);
    stopCamera();
  };

  // Check admin access
  useEffect(() => {
    if (user?.roleId !== 1) {
      showErrorToast('Access denied. Only Super-admins can access this page.');
    }
  }, [user]);

  // Search for members
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      showErrorToast('Please enter a search query');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.memberSearch({ query: searchQuery.trim() });
      if (response?.data?.status === 200 || response?.data?.statusCode === 200) {
        setSearchResults(response.data.data || []);
        if (!response.data.data || response.data.data.length === 0) {
          showErrorToast('No members found');
        }
      } else {
        showErrorToast('Failed to search members');
      }
    } catch (error) {
      console.error('Search error:', error);
      showErrorToast('Error searching members');
    } finally {
      setLoading(false);
    }
  };

  // Select a member to edit
  const handleSelectMember = async (member) => {
    setLoading(true);
    try {
      const response = await apiService.memberDetails(member.memberId);
      const detailData = response?.data?.data || {};
      const detailMember = detailData.member;

      if (!detailMember) {
        showErrorToast('Unable to load member details');
        return;
      }

      setSelectedMember({ ...detailMember, photoUrl: detailData.photoUrl || null });
      setFormData({
        name: detailMember.name || '',
        fatherName: detailMember.guardianName || '',
        gender: detailMember.gender || '',
        dob: detailMember.dob || '',
        bloodGroup: detailMember.bloodGroup || '',
        mobile: detailMember.mobile || '',
        email: detailMember.email || '',
        address: detailMember.address || '',
        city: detailMember.city || '',
        state: detailMember.state || '',
        zip: detailMember.zip || '',
        ksAddress: detailMember.ksAddress || '',
        registrationType: detailMember.registrationType || '',
        copNumber: detailMember.registrationNo || '',
        enNo: detailMember.enNo || '',
        nomineeName: detailMember.nomineeName || '',
        nomineeMobile: detailMember.nomineeMobile || '',
        voter: detailMember.voter || '',
        bcOfUpType: detailMember.bcOfUpType || '',
        status: detailMember.status || 'ACTIVE',
        gmLmMemberType: detailMember.gmLmMemberType || 1,
        photo: null,
      });
      setPhotoPreview(detailData.photoUrl || null);
      setCapturedImage(null);
      setSearchResults([]);
      setSearchQuery('');
      stopCamera();
    } catch (error) {
      console.error('Member details error:', error);
      showErrorToast('Error loading member details');
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    const video = videoRef.current;

    if (video?.srcObject) {
      const stream = video.srcObject;
      stream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
      video.pause();
      video.removeAttribute('src');
      video.load();
    }

    setCameraActive(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (error) {
      console.error('Camera error:', error);
      showErrorToast('Unable to access camera. Please check permissions.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const context = canvas.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 320, 240);
    const imageData = canvas.toDataURL('image/png');
    setCapturedImage(imageData);
    setPhotoPreview(imageData);
    setFormData((prev) => ({ ...prev, photo: null }));
    stopCamera();
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'file' ? files[0] : value,
    }));

    // Handle photo preview
    if (name === 'photo' && files && files[0]) {
      setCapturedImage(null);
      stopCamera();
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember) {
      showErrorToast('No member selected');
      return;
    }

    if (user?.roleId !== 1) {
      showErrorToast('You do not have permission to edit members');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        memberId: selectedMember.memberId,
        name: formData.name,
        fatherName: formData.fatherName,
        gender: formData.gender,
        dob: formData.dob,
        bloodGroup: formData.bloodGroup,
        mobile: formData.mobile,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        ksAddress: formData.ksAddress,
        registrationType: formData.registrationType,
        copNumber: formData.copNumber,
        enNo: formData.enNo,
        nomineeName: formData.nomineeName,
        nomineeMobile: formData.nomineeMobile,
        voter: formData.voter,
        bcOfUpType: formData.bcOfUpType,
        status: formData.status,
        gmLmMemberType: formData.gmLmMemberType,
        updatedBy: user?.id || 'admin',
      };

      let result;
      if (formData.photo || capturedImage) {
        const formDataToSend = new FormData();
        formDataToSend.append('member', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

        if (capturedImage) {
          const response = await fetch(capturedImage);
          const blob = await response.blob();
          formDataToSend.append('photo', blob, 'captured_photo.png');
        } else if (formData.photo) {
          formDataToSend.append('photo', formData.photo);
        }

        result = await apiService.memberUpdateWithFile(formDataToSend);
      } else {
        result = await apiService.memberUpdate(payload);
      }

      if (result?.data?.status === 200 || result?.data?.statusCode === 200) {
        showSuccessToast('Member details updated successfully');
        resetEditor();
      } else {
        showErrorToast('Failed to update member');
      }
    } catch (error) {
      console.error('Update error:', error);
      showErrorToast('Error updating member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const genderOptions = ['Male', 'Female', 'Other'];
  const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const statusOptions = ['ACTIVE', 'INACTIVE', 'DELETED'];

  useEffect(() => () => stopCamera(), []);

  if (user?.roleId !== 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-600 text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p>Only super-admins can access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Super-Admin: Member Edit</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search Section */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Member</h2>
                <form onSubmit={handleSearch} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Search by name, mobile, or POR number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </form>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                    {searchResults.map((member, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectMember(member)}
                        className="w-full text-left p-3 bg-white border border-gray-300 rounded hover:bg-blue-50 transition-colors"
                      >
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.memberId}</p>
                        <p className="text-sm text-gray-600">{member.mobile}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Edit Form Section */}
            <div className="lg:col-span-2">
              {selectedMember ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Member ID Display */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-600">Member ID (POR)</p>
                    <p className="text-xl font-bold text-blue-700">{selectedMember.memberId}</p>
                  </div>

                  {/* Photo Upload */}
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Member Photo</h3>
                    <div className="flex gap-4">
                      <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                        {photoPreview ? (
                          <img src={typeof photoPreview === 'string' ? photoPreview : photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-3">
                          <label className="block">
                            <input
                              type="file"
                              name="photo"
                              accept="image/*"
                              onChange={handleChange}
                              className="hidden"
                            />
                            <div className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer flex items-center gap-2 w-fit">
                              <Upload className="w-4 h-4" />
                              Choose Image
                            </div>
                          </label>
                          <button
                            type="button"
                            onClick={startCamera}
                            className="px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                          >
                            <Camera className="w-4 h-4" />
                            Open Camera
                          </button>
                          {(capturedImage || cameraActive) && (
                            <button
                              type="button"
                              onClick={() => {
                                setCapturedImage(null);
                                setFormData((prev) => ({ ...prev, photo: null }));
                                setPhotoPreview(selectedMember?.photoUrl || null);
                                stopCamera();
                              }}
                              className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
                            >
                              <RefreshCcw className="w-4 h-4" />
                              Reset Photo
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 5MB, or capture directly from camera</p>
                        {cameraActive && (
                          <div className="mt-4">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full max-w-sm rounded-lg border border-gray-300 bg-black"
                            />
                            <div className="mt-3 flex gap-3">
                              <button
                                type="button"
                                onClick={capturePhoto}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                              >
                                Capture Photo
                              </button>
                              <button
                                type="button"
                                onClick={stopCamera}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                              >
                                Close Camera
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Name</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Father Name</label>
                        <input
                          type="text"
                          name="fatherName"
                          value={formData.fatherName}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Gender</label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="">Select</option>
                          {genderOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Date of Birth</label>
                        <input
                          type="date"
                          name="dob"
                          value={formData.dob}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Blood Group</label>
                        <select
                          name="bloodGroup"
                          value={formData.bloodGroup}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="">Select</option>
                          {bloodGroupOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Mobile</label>
                        <input
                          type="text"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Address</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Address</label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">City</label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">State</label>
                          <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">ZIP Code</label>
                          <input
                            type="text"
                            name="zip"
                            value={formData.zip}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Registration Details */}
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Registration Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">COP Number</label>
                        <input
                          type="text"
                          name="copNumber"
                          value={formData.copNumber}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">EN Number</label>
                        <input
                          type="text"
                          name="enNo"
                          value={formData.enNo}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Registration Type</label>
                        <input
                          type="text"
                          name="registrationType"
                          value={formData.registrationType}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Voter</label>
                        <select
                          name="voter"
                          value={formData.voter}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Member Status</label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                    >
                      {isSubmitting ? 'Updating...' : 'Update Member'}
                    </button>
                    <button
                      type="button"
                      onClick={resetEditor}
                      className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                    >
                      Clear
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-lg">Search and select a member to edit</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminMemberEdit;
