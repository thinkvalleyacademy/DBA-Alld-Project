import { useEffect, useRef, useState } from "react";
import PageWrapper from "../../../utility/PageWrapper";
import { callApi } from "../../../components/ApiUtil";
import { BASE_URLS, API_ENDPOINTS } from '../../../constants/apiConfig';
import StudentRegistration from "./StudentRegistration";
import Button from "../../../components/Button";

import GenericTable from "./tables/GenericTable"; // <-- updated import
import ClassSelector from "./forms/ClassSelector";
import SectionSelector from "./forms/SectionSelector";

function Student() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const fetchOnce = useRef(false);

  useEffect(() => {
    if (fetchOnce.current) return;

    const fetchAcademicData = async () => {
      try {
        const result = await callApi({
          url: `${BASE_URLS.SCHOOL}${API_ENDPOINTS.LIST_ACADEMIC}`,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });
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
    const fetchStudents = async () => {
      const classObj = classes.find((cls) => cls.id === parseInt(selectedClass));
      const grade = classObj?.className;

      if (!grade || !selectedSection) return;

      const token = localStorage.getItem("authToken");
      if (!token) {
        console.warn("authToken not available");
        return;
      }

      try {
        const result = await callApi({
          url: `${BASE_URLS.USER}${API_ENDPOINTS.LIST_USERS}?userType=student&grade=${grade}&section=${selectedSection}`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setStudents(result.data || []);
      } catch (err) {
        console.error("Failed to fetch students:", err.message);
      }
    };

    if (selectedClass && selectedSection) {
      fetchStudents();
    }
  }, [selectedClass, selectedSection, classes]);

  // Define columns for student table
  const studentColumns = [
    { header: "Reg No.", key: "registrationNumber" },
    { header: "Name", key: "fullName" },
    { header: "Email", key: "emailId" },
    { header: "Grade", key: "grade" },
    { header: "Section", key: "section" },
  ];

  // Format students for displaying fullName
  const formattedStudents = students.map((s) => ({
    ...s,
    fullName: `${s.firstName} ${s.lastName}`,
  }));

  return (
    <PageWrapper>
      <div className="flex justify-between items-center mb-4 text-gray-900 dark:text-gray-100">
        {/* Class and Section Selection */}
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

        {/* Add Student Button */}
        <Button
          className="bg-green-600 text-white"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Hide Form" : "Add Student"}
        </Button>
      </div>

      {/* Registration Form */}
      {showForm && (
        <div className="border p-4 mb-4 bg-gray-50 rounded">
          <StudentRegistration />
        </div>
      )}

      {/* Student Table */}
      <div className="mt-6 border rounded bg-white dark:bg-gray-900 p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3 border-b pb-1">
          Student List
        </h2>
        <GenericTable
          columns={studentColumns}
          data={formattedStudents}
          noDataLabel="students"
          onEdit={(student) => console.log("Edit student", student)}
          onDelete={(student) => console.log("Delete student", student)}
          itemsPerPage={5}
        />
      </div>
    </PageWrapper>
  );
}

export default Student;
