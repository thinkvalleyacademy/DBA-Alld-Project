import { useEffect, useState } from "react";
import PageWrapper from "../../../utility/PageWrapper";
import { List, SquarePen, RefreshCcw } from "lucide-react";
import IconButton from "../../../components/IconButton";
import { showSuccessToast } from "../../../utility/toast";
import apiService from "../../../components/apiService";
import { useNavigate } from "react-router-dom"; // import navigate


const UserRegistration = () => {

    const navigate = useNavigate(); // initialize navigate
    const [roleList, setRoleList] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    roleId: "",
    password:""
  });

  const fetchData = async () => {

    const rolesResponse = await apiService.listRoles();
    setRoleList(rolesResponse.data.data);

  };

  useEffect(() => {
    fetchData();
  }, []);



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData({ name: "", mobile: "", email: "", roleId: "" });
  };

  const generateUserId = () => {
  return Math.floor(1000 + Math.random() * 9000); 
};

  const handleSubmit = async(e) => {
    e.preventDefault();

    const payload = {
    id: null, // you can leave null if backend auto-generates
    userId: `user${generateUserId()}`, // could also be generated server-side
    sessionId: null,
    name: formData.name,
    mobile: formData.mobile,
    password: formData.password, // backend will hash it
    email: formData.email,
    status: "Active",
    roleId: parseInt(formData.roleId),
    rememberMeToken: null,
    branchCode: "DEFAULT",
    regDate: new Date().toISOString(),
    createdDate: new Date().toISOString(),
    createdBy: "SYSTEM",
    lastLoginAttempt: null,
    wrongAttempts: 0,
    lastWrongAttempt: null,
    activationHash: Math.random().toString(36).substring(2), // random token
    passwordResetHash: null,
    lastPasswordResetDate: null,
    updatedDate: null,
    updatedBy: null,
    domain: "example.com",
    providerType: "local",
    userPasswordResetTimestamp: null,
  };


   try {
      const response = await apiService.register(payload);

      // Check response status
      if (response.status === 200) {
        showSuccessToast("Student registered successfully");

        // Redirect to /user/list
        navigate("/user/list");
      } else {
        console.error("Registration failed:", response);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  
    // Add your API call or other logic here
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex justify-between items-center mb-4 text-gray-900 dark:text-gray-100">
        <h1 className="flex items-center text-xl font-semibold gap-2">
          <SquarePen className="w-5 h-5" />
          User Registration
        </h1>
        <div className="flex gap-2">
          <IconButton
            title="List"
            icon={List}
            backgroundColor="#615CA8"
            hoverColor="#16A34A"
            onClick={() => alert("List clicked!")}
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
        className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-100">
          Personal Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="name"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Mobile No.<span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="Mobile No."
              required
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email Id</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Id"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Role<span className="text-red-500">*</span>
            </label>
            <select
              name="roleId"
              value={formData.roleId}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-500"
            >
              <option value="">Select</option>{
              roleList.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))
            }

              
             
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="password"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-500"
            />
          </div>
        </div>

       {/* Centered Buttons */}
        <div className="flex justify-center gap-3 mt-8">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded shadow-sm"
          >
            Reset
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm"
          >
            Save
          </button>
        </div>
      </form>
    </PageWrapper>
  );
};

export default UserRegistration;
