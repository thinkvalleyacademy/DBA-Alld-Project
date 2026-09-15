import { useEffect, useRef, useState } from "react";
import PageWrapper from "../../../utility/PageWrapper";
import TeacherRegistration from "./TeacherRegistration";
import Button from "../../../components/Button";
import apiService from "../../../components/apiService";

import GenericTable from "./tables/GenericTable"; // ✅ Correct import
import ClassSelector from "./forms/ClassSelector";
import SectionSelector from "./forms/SectionSelector";

// React-Toastify imports
import { toast, ToastContainer } from "react-toastify"; // Correct toast and ToastContainer import
import "react-toastify/dist/ReactToastify.css";

function Teacher() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const fetchOnce = useRef(false);

  useEffect(() => {
    if (fetchOnce.current) return;

    const fetchAcademicData = async () => {
      try {
        const result = await apiService.listAcademic();
        setClasses(result.data || []);
      } catch (err) {
        console.error("Failed to load academic data:", err.message);
      }
    };

    fetchAcademicData();
    fetchOnce.current = true;
  }, []);

  const handleClassChange = (e) => {
    const selectedId = parseInt(e.target.value);
    const selected = classes.find((cls) => cls.id === selectedId);
    setSelectedClass(selectedId);
    setSections(selected?.sections || []);
    setSelectedSection("");
  };

  useEffect(() => {
    const fetchTeachers = async () => {
      const classObj = classes.find((cls) => cls.id === parseInt(selectedClass));
      const grade = classObj?.className;

      if (!grade || !selectedSection) return;

      const token = localStorage.getItem("authToken");
      if (!token) {
        console.warn("authToken not available");
        return;
      }

      try {
        const result = await apiService.listUsers({
          userType: "student",
          grade,
          section: selectedSection,
        });
        setTeachers(result.data || []);
      } catch (err) {
        console.error("Failed to fetch teachers:", err.message);
      }
    };

    if (selectedClass && selectedSection) {
      fetchTeachers();
    }
  }, [selectedClass, selectedSection, classes]);

  const handleEditTeacher = async (updatedTeacher) => {
    try {
      await apiService.updateUser(updatedTeacher.id, updatedTeacher);
      setTeachers((prev) =>
        prev.map((teacher) =>
          teacher.id === updatedTeacher.id ? updatedTeacher : teacher
        )
      );
      toast.success("Teacher updated successfully!"); // Success Toast
    } catch (err) {
      console.error("Failed to update teacher:", err.message);
      toast.error("Failed to update teacher."); // Error Toast
    }
  };

  const handleDeleteTeacher = async (teacher) => {
    if (!window.confirm(`Are you sure you want to delete ${teacher.name}?`)) return;

    try {
      await apiService.deleteUser(teacher.id);
      setTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
      toast.success("Teacher deleted successfully!"); // Success Toast
    } catch (err) {
      console.error("Failed to delete teacher:", err.message);
      toast.error("Failed to delete teacher."); // Error Toast
    }
  };

  const teacherColumns = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "contactNumber", header: "Contact Number" },
    { key: "grade", header: "Grade" },
    { key: "section", header: "Section" },
  ];

  return (
    <PageWrapper>
      {/* Class and Section Selection */}
      <div className="flex justify-between items-center mb-4 text-gray-900 dark:text-gray-100">
        <div className="flex gap-4">
          <ClassSelector
            classes={classes}
            selectedClass={selectedClass}
            onChange={handleClassChange}
          />

          <SectionSelector
            sections={sections}
            selectedSection={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          />
        </div>

        {/* Add Teacher Button */}
        <Button
          className="bg-green-600 text-white"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Hide Form" : "Add Teacher"}
        </Button>
      </div>

      {/* Registration Form */}
      {showForm && (
        <div className="border p-4 mb-4 bg-gray-50 rounded">
          <TeacherRegistration />
        </div>
      )}

      {/* Teacher List */}
      <div className="mt-6 border rounded bg-white dark:bg-gray-900 p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3 border-b pb-1">
          Teacher List
        </h2>

        <GenericTable
          columns={teacherColumns}
          data={teachers}
          noDataLabel="Teachers"
          onEdit={handleEditTeacher}
          onDelete={handleDeleteTeacher}
        />
      </div>

      {/* Toast Container */}
      <ToastContainer />
    </PageWrapper>
  );
}

export default Teacher;
