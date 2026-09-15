// services/studentService.js
import apiService from '../../../../components/apiService';

export const fetchStudents = async (grade, section) => {
  return await apiService.fetchStudents(grade, section);
};

export const fetchStudentDetails = async (registrationNumber) => {
  return await apiService.fetchStudentDetails(registrationNumber);
};

export const deleteStudent = async (registrationNumber) => {
  return await apiService.deleteStudent(registrationNumber);
};

export const editStudent = async (studentData) => {
  return await apiService.editStudent(studentData);
};
