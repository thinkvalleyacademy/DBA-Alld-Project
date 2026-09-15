import PageWrapper from "../../../utility/PageWrapper";
import { useUserReport } from "../../../context/UserReportContext";

function UserReport() {
  const { users, loading } = useUserReport();

  return (
    <PageWrapper>
      <h2 className="text-xl font-bold mb-4">User Report</h2>
      {loading ? (
        <p>Loading user data...</p>
      ) : (
        <ul className="space-y-2">
          {users.map((user) => (
            <li
              key={user.id}
              className="border p-3 rounded shadow-sm bg-white dark:bg-gray-800 dark:text-white"
            >
              <p><strong>{user.name}</strong></p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
            </li>
          ))}
        </ul>
      )}
    </PageWrapper>
  );
}

export default UserReport;