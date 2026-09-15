// src/pages/student/StudentRegistrationForm.js
import { useState, useEffect } from "react";
import Button from "../../../components/Button";
import { callApi } from "../../../components/ApiUtil";
import { BASE_URLS, API_ENDPOINTS } from '../../../constants/apiConfig';
import { showSuccessToast, showErrorToast } from "../../../utility/toast";

function StudentRegistrationForm({ classes, editingStudent = null, onSubmit }) {
  const [formData, setFormData] = useState({
    registrationNumber: "",
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    grade: "",
    section: "",
    studentMob: "",
    fatherName: "",
    motherName: "",
    otherParents: "",
    address: "",
    image: null,
  });

  useEffect(() => {
    // console.log("DEBUG - editingStudent prop received:", editingStudent);
    if (editingStudent) {
      setFormData((prev) => ({
        ...prev,
        ...editingStudent,
        image: null, // Prevent preloading image files
      }));
    }
  }, [editingStudent]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSubmit) {
      await onSubmit(formData);
    }

    const token = localStorage.getItem("authToken");
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null) data.append(key, value);
    });
    data.append("userType", "student");

    try {
      await callApi({
        url: `${BASE_URLS.STUDENT}${API_ENDPOINTS.STUDENT.REGISTER}`,
        method: "POST",
        data,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      showSuccessToast("Student registered successfully!");
    } catch (err) {
      showErrorToast(`Registration failed: ${err.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {editingStudent && (
          <input
            type="text"
            name="registrationNumber"
            value={formData.registrationNumber}
            readOnly
            className="border px-3 py-2 rounded w-full bg-gray-100"
          />
        )}
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          value={formData.firstName}
          onChange={handleChange}
          required
          className="border px-3 py-2 rounded"
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={handleChange}
          required
          className="border px-3 py-2 rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="border px-3 py-2 rounded"
        />
        <input
          type="date"
          name="dateOfBirth"
          placeholder="DOB"
          value={formData.dateOfBirth}
          onChange={handleChange}
          required
          className="border px-3 py-2 rounded"
        />
        <input
          type="text"
          name="studentMob"
          placeholder="Student Mobile"
          value={formData.studentMob}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
        />
        <input
          type="text"
          name="gender"
          placeholder="Gender"
          value={formData.gender}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
        />
        <input
          type="text"
          name="bloodGroup"
          placeholder="Blood Group"
          value={formData.bloodGroup}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
        />
        
        {/* Grade select */}
        <select
          name="grade"
          value={formData.grade}
          onChange={handleChange}
          required
          className="border px-3 py-2 rounded"
        >
          <option value="">Select Class</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.className}>
              {cls.className}
            </option>
          ))}
        </select>


        {/* Section select */}          
        <select
          name="section"
          value={formData.section}
          onChange={handleChange}
          required
          className="border px-3 py-2 rounded"
        >
          <option value="">Select Section</option>
          {(classes.find((cls) => cls.className === formData.grade)?.sections || []).map(
            (s) => (
              <option key={s.id} value={s.sectionName}>
                {s.sectionName}
              </option>
            )
          )}
        </select>


        <input
          type="text"
          name="fatherName"
          placeholder="Father Name"
          value={formData.fatherName}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
        />
        <input
          type="text"
          name="motherName"
          placeholder="Mother Name"
          value={formData.motherName}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
        />
        <input
          type="text"
          name="otherParents"
          placeholder="Other Parents"
          value={formData.otherParents}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
        />
        <input
          type="text"
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
          className="border px-3 py-2 rounded"
        />
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleChange}
          className="border px-3 py-2 rounded"
        />
      </div>
      <Button type="submit" className="bg-blue-600 text-white">
        Submit
      </Button>
    </form>
  );
}

export default StudentRegistrationForm;
