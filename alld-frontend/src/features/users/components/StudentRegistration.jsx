import { useEffect, useRef, useState } from "react";
import PageWrapper from "../../../utility/PageWrapper";
import apiService from '../../../components/apiService';
import Button from "../../../components/Button";
import GenericTable from "./tables/GenericTable";
import StudentRegistrationForm from "./StudentRegistrationForm";
import StudentEditForm from "./StudentEditForm";

import { showSuccessToast, showErrorToast } from "../../../utility/toast";

import {
  fetchStudentDetails,
  deleteStudent,
  editStudent
} from "./service/studentService"; // 👈 adjust path as needed

import ClassSelector from "./forms/ClassSelector";
import SectionSelector from "./forms/SectionSelector";

function StudentRegistration() {
  // console.log("DEBUG - StudentRegistration component rendered");

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const fetchOnce = useRef(false);

  useEffect(() => {
    // console.log("DEBUG - useEffect triggered");
    if (fetchOnce.current) return;

    const fetchAcademicData = async () => {
      try {
        const result = await apiService.listAcademic();
        // console.log("DEBUG - listAcademic API response:", result);
        const academicData = Array.isArray(result.data.data) ? result.data.data : [];
        setClasses(academicData);
        showSuccessToast("Academic data loaded successfully");
      } catch (err) {
        console.error("DEBUG - listAcademic API error:", err);
        showErrorToast(`Failed to load academic data: ${err.message}`);
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
    if (selectedClass) {
      const selected = classes.find((cls) => cls.id === parseInt(selectedClass));
      setSections(selected?.sections || []);
      setSelectedSection(""); // reset section on class change
    }
  }, [selectedClass, classes, sections]);

  useEffect(() => {
    const fetchStudents = async () => {
      const classObj = classes.find((cls) => cls.id === parseInt(selectedClass));
      const grade = classObj?.className;

      if (!grade || !selectedSection) return;

      try {
        const result = await apiService.fetchStudents(grade, selectedSection);
        // console.log("DEBUG - fetchStudents API response:", result);
        const studentData = Array.isArray(result.data.data) ? result.data.data : [];
        setStudents(studentData);
      } catch (err) {
        console.error("Failed to fetch students:", err.message);
      }
    };

    if (!showForm && selectedClass && selectedSection) {
      fetchStudents();
    }
  }, [showForm, selectedClass, selectedSection, classes]);

  const studentColumns = [
    { header: "Reg No.", key: "registrationNumber" },
    { header: "Name", key: "fullName" },
    { header: "Email", key: "emailId" },
    { header: "Grade", key: "grade" },
    { header: "Section", key: "section" },
  ];

  const formattedStudents = students.map((s) => ({
    ...s,
    fullName: `${s.firstName} ${s.lastName}`,
  }));

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);

  const handleViewDetails = async (student) => {
    try {
      const result = await fetchStudentDetails(student.registrationNumber);
      // console.log("DEBUG - fetchStudentDetails API response:", result);
      setSelectedStudentDetails(result.data.data); // Correctly set the student details
      setShowDetailsModal(true); // Open modal
      showSuccessToast(`Details loaded for ${student.fullName}`);
    } catch (err) {
      showErrorToast(`Failed to load details: ${err.message}`);
    }
  };

  const handleDelete = async (student) => {
    try {
      await deleteStudent(student.registrationNumber);
      showSuccessToast("Student deleted successfully");
      // Refresh list
      setStudents((prev) =>
        prev.filter((s) => s.registrationNumber !== student.registrationNumber)
      );
    } catch (err) {
      showErrorToast(`Delete failed: ${err.message}`);
    }
  };

  const handleEdit = async (updatedStudent) => {
    try {
      if (updatedStudent.registrationNumber) {
        // Call updateDetails API if registrationNumber exists
        await editStudent(updatedStudent);
        showSuccessToast("Student updated successfully");
      } else {
        // Call register API otherwise
        await apiService.registerStudent(updatedStudent);
        showSuccessToast("Student registered successfully");
      }

      setStudents((prev) =>
        prev.map((s) =>
          s.registrationNumber === updatedStudent.registrationNumber
            ? updatedStudent
            : s
        )
      );
    } catch (err) {
      showErrorToast(`Operation failed: ${err.message}`);
    }
  };

  useEffect(() => {
    // console.log("DEBUG - classes prop received in StudentRegistrationForm:", classes);
    // console.log("DEBUG - sections prop received in StudentRegistrationForm:", sections);
  }, [classes]);

  return (
    <PageWrapper>
      <div className="flex justify-between items-center mb-4 text-gray-900 dark:text-gray-100">
        <h1 className="text-xl font-semibold">Student Management</h1>
        <Button
          className="bg-green-600 text-white"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Check Registered List" : "Register New Student"}
        </Button>
      </div>

      {showForm ? (
        <div className="border p-4 mb-4 bg-gray-50 rounded">
          <StudentRegistrationForm 
            classes={classes} 
            editingStudent={showForm ? null : selectedStudentDetails} // Pass editingStudent when editing
          />
        </div>
      ) : (
        <div className="mt-6 border rounded bg-white dark:bg-gray-900 p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-3 border-b pb-1">
            Student Registration List
          </h2>

          {/* Class and Section Selectors */}
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

          <GenericTable
            columns={studentColumns}
            data={formattedStudents}
            noDataLabel="students"
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDetails={handleViewDetails} // ✅ Add this line
            itemsPerPage={5}
            classesData={classes} // 👈 pass this here
          />
        </div>
      )}

      {showDetailsModal && selectedStudentDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-xl relative">
            <button
              className="absolute top-2 right-2 text-red-600 text-xl"
              onClick={() => setShowDetailsModal(false)}
            >
              &times;
            </button>
            <h3 className="text-lg font-bold mb-4">Edit Student</h3>
            <StudentEditForm
              editingStudent={selectedStudentDetails}
              onSubmit={handleEdit}
            />
          </div>
        </div>
      )}

    </PageWrapper>
  );
}

export default StudentRegistration;
