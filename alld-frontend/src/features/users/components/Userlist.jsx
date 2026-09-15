import { useEffect, useState } from "react";
import { useMemo } from "react";

import { SquareCheckBig, ThumbsUp, List } from "lucide-react";

import IconButton from "../../../components/IconButton";
import PageWrapper from "../../../utility/PageWrapper";
import apiService from "../../../components/apiService";

const Userlist = () => {
  const [userList, setUserList] = useState([]);
  const [roleList, setRoleList] = useState([]);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return userList.slice(start, start + pageSize);
  }, [userList, page]);

  const totalPages = Math.ceil(userList.length / pageSize);

  const fetchData = async () => {
    const response = await apiService.listUsers();
    setUserList(response.data.data);

    const rolesResponse = await apiService.listRoles();
    setRoleList(rolesResponse.data.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <PageWrapper>
      <div className="flex justify-between items-center mb-4 text-gray-900 dark:text-gray-100">
        <h1 className="flex items-center text-xl font-semibold gap-2">
          <List className="w-5 h-5" />
          User List
        </h1>
      </div>
      

      <div className="text-sm text-gray-600 mb-4">
        Showing {userList.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, userList.length)} of {userList.length} entries
      </div>

      <div className="overflow-x-auto">
      <table className="min-w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                Sr No.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                User Id
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th> */}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedUsers.map((user, index) => (
              <tr key={user.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {(page - 1) * pageSize + index + 1}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {user.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {user.userId}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {user.email}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {roleList.length > 0 && roleList[user.roleId - 1]
  ? roleList[user.roleId - 1].name
  : "—"}

                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.status === "ACTIVE" ? (
                    <IconButton
                      title="ACTIVE"
                      icon={SquareCheckBig}
                      backgroundColor="green"
                      hoverColor="#16A34A"
                      onClick={() => {}}
                    />
                  ) : (
                    <IconButton
                      title="DEACTIVE"
                      icon={ThumbsUp}
                      backgroundColor="grey"
                      hoverColor="#16A34A"
                      onClick={() => {}}
                    />
                  )}
                </td>

                {/* <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 relative">
                  <div className="relative inline-block text-left">
                    <button
                      type="button"
                      className="inline-flex justify-center w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-500 focus:outline-none transition"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDropdownOpen(
                          dropdownOpen === user.id ? null : user.id
                        );
                      }}
                    >
                      Action
                      <svg
                        className="-mr-1 ml-2 h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {dropdownOpen === user.id && (
                      <div
                        className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-600 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-1">
                          <button
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            onClick={() => handleEdit(user)}
                          >
                            Edit
                          </button>
                          <button
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            onClick={() => handleDelete(user)}
                          >
                            Delete
                          </button>
                          <button
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            onClick={() => handleView(user)}
                          >between
                            View
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center mt-6 gap-4">


        <div className="flex gap-2">
          <button
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span className="px-2 py-2 text-sm font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Userlist;
