import { useState, useEffect } from "react";
import Button from "../../../components/Button";

function StudentEditForm({ editingStudent, onSubmit }) {
  const [formData, setFormData] = useState({
    registrationNumber: "",
    firstName: "",
    lastName: "",
    email: "",
    grade: "",
    section: "",
  });
  const [isEditable, setIsEditable] = useState(false);

  useEffect(() => {
    if (editingStudent) {
      setFormData((prev) => ({
        registrationNumber: editingStudent.registrationNumber || "",
        firstName: editingStudent.firstName || "",
        lastName: editingStudent.lastName || "",
        email: editingStudent.emailId || "", // Map emailId to email
        grade: editingStudent.grade || "",
        section: editingStudent.section || "",
      }));
    }
  }, [editingStudent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-end">
        <label className="flex items-center gap-2">
          <span>Edit Mode</span>
          <input
            type="checkbox"
            checked={isEditable}
            onChange={() => setIsEditable((prev) => !prev)}
            className="toggle-checkbox"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          name="registrationNumber"
          value={formData.registrationNumber}
          readOnly
          className="border px-3 py-2 rounded w-full bg-gray-100"
        />
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          value={formData.firstName}
          onChange={handleChange}
          readOnly={!isEditable}
          required
          className="border px-3 py-2 rounded"
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={handleChange}
          readOnly={!isEditable}
          required
          className="border px-3 py-2 rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          readOnly={!isEditable}
          required
          className="border px-3 py-2 rounded"
        />
        <input
          type="text"
          name="grade"
          placeholder="Grade"
          value={formData.grade}
          onChange={handleChange}
          readOnly={!isEditable}
          className="border px-3 py-2 rounded"
        />
        <input
          type="text"
          name="section"
          placeholder="Section"
          value={formData.section}
          onChange={handleChange}
          readOnly={!isEditable}
          className="border px-3 py-2 rounded"
        />
      </div>
      {isEditable && (
        <Button type="submit" className="bg-blue-600 text-white">
          Update
        </Button>
      )}
    </form>
  );
}

export default StudentEditForm;