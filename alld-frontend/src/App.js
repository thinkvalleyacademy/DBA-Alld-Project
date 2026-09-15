import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import React, { Suspense, lazy, useState } from "react"; // useState import किया
import Layout from "./components/Layout";
import LayoutWrapper from "./utility/LayoutWrapper";
import ErrorBoundary from "./components/ErrorBoundary";

import { useAuth } from "./context/AuthContext";
import { UserReportProvider } from "./context/UserReportContext";
import { ToastContainer } from "react-toastify"; // Importing Toastify
import 'react-toastify/dist/ReactToastify.css'; // Import Toastify styles
import RegistrationReceipt from './components/RegistrationReceipt';
import StaffCollectionReport from "./components/StaffCollectionReport";

// Lazy loading components
const Dashboard = lazy(() => import("./features/dashboard/components/Dashboard"));
const Reports = lazy(() => import("./features/reports/components/Reports"));
const Login = lazy(() => import("./features/auth/components/Login"));
const Register = lazy(() => import("./features/auth/components/Register"));
const ChangePassword = lazy(() => import("./features/auth/components/ChangePassword"));
const SalesReport = lazy(() => import("./features/reports/components/SalesReport"));
const UserReport = lazy(() => import("./features/reports/components/UserReport"));
const UserManagement = lazy(() => import("./features/users/components/UserRegistration"));
const UserList = lazy(() => import("./features/users/components/Userlist"));
const RegisterMember = lazy(() => import("./features/users/components/RegisterMember"));
const AffidavitList = lazy(() => import("./features/users/components/AffidavitList"))
const LifeMemberRegister = lazy(() => import("./features/users/components/LifeMemberRegister"));
const GeneralMemberList = lazy(() => import("./features/users/components/GenralMemList"));
const LifeMemList = lazy(() => import("./features/users/components/LifeMemList"));
const GeneralMemberSearch = lazy(() => import("./features/users/components/GenMemSearch"));
const LifeMemberSearch = lazy(() => import("./features/users/components/LifeMemSearch"));
const WelfareMemberSearch = lazy(() => import("./features/users/components/WelfareMemSearch"));
const WelfareMemRegister = lazy(() => import("./features/users/components/WelfareMemRegister"));
const WelfareMemList = lazy(() => import("./features/users/components/WelfareMemList"));
const EditDetails = lazy(() => import("./components/editdetails")); // Path correct किया
const LMVoterList = lazy(() => import("./features/users/components/LMVoterList"));
const GMVoterList = lazy(() => import("./features/users/components/GMVoterList"));
const PrintStyledVoterList  = lazy(()=> import("./components/PrintStyledVoterList"));
const MemberRenewSubscription =  lazy(()=>import("./features/users/components/MemberRenewSubscription"));
const PrintWelfareMember =  lazy(()=>import("./components/PrintWelfareMember.jsx"));
const Compensation  = lazy(() => import("./features/users/components/Compensation"));
const CompensationReceipt  = lazy(() => import("./components/CompensationReceipt"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const PublicNoticeManager = lazy(() => import("./features/users/components/PublicNoticeManager"));
const DuplicateMembers = lazy(() => import("./pages/DuplicateMembers"));
const SuperAdminMemberEdit = lazy(() => import("./pages/SuperAdminMemberEdit"));
const SuperAdminMasterList = lazy(() => import("./pages/SuperAdminMasterList"));

function App() {
  const { isAuthenticated } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);


  return (
    <Router>
      <ErrorBoundary>
        <LayoutWrapper>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/welcome" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {isAuthenticated ? (
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="reports/sales" element={<SalesReport />} />
                  <Route
                    path="reports/users"
                    element={
                      <UserReportProvider>
                        <UserReport />
                      </UserReportProvider>
                    }
                  />
                  <Route path="/user/registration" element={<UserManagement />} />
                  <Route path="/user/list" element={<UserList />} />
                  <Route path="/change-password" element={<ChangePassword />} />


                  <Route path="/genmember/add" element={<RegisterMember />} />
                  <Route path="/member/list" element={<GeneralMemberList />} />
                  <Route path="/member/search" element={<GeneralMemberSearch />} />
                  <Route path="/member/renew" element={<MemberRenewSubscription/>}/>
                  <Route path="/receipt/:memberId" element={<RegistrationReceipt />} />
                  <Route path="/lifemember/add" element={<LifeMemberRegister />} />
                  <Route path="/lifemember/list" element={<LifeMemList />} />
                  <Route path="/lifemember/search" element={<LifeMemberSearch />} />

                  <Route path="/welfmember/add" element={<WelfareMemRegister />} />
                  <Route path="/welfmember/list" element={<WelfareMemList />} />
                  <Route path="/welfmember/search" element={<WelfareMemberSearch />} />
                  <Route path="/welfmember/compensation" element={<Compensation />} />
                  <Route path="/compensation/:entryId" element={<CompensationReceipt />} />
                  

                  <Route path="/voter/LMVoter" element={<LMVoterList />} />
                  <Route path="/voter/GMVoter" element={<GMVoterList />} />

                  <Route path="/Affidavit/list" element={<AffidavitList />} />
                  <Route path="/components/staff-collection" element={<StaffCollectionReport />} />
                  <Route path="/public-notices/manage" element={<PublicNoticeManager />} />
                  <Route path="/admin/duplicates" element={<DuplicateMembers />} />
                  <Route path="/admin/member-edit" element={<SuperAdminMemberEdit />} />
                  <Route path="/admin/master-list" element={<SuperAdminMasterList />} />

                </Route>
              ) : (
                <>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="*" element={<Navigate to="/welcome" replace />} />
                </>
              )}
            <Route path="/voter/print-styled/:type" element={<PrintStyledVoterList />} />
            <Route path="/welfare/list/download" element={<PrintWelfareMember />} />

            </Routes>
            {isEditModalOpen && (
              <EditDetails
                memberData={null} // यहाँ appropriate member data pass करें
                onClose={() => setIsEditModalOpen(false)}
                onUpdateSuccess={() => {
                  setIsEditModalOpen(false);
                  // Additional success actions
                }}
                isEditMode={true}
              />
            )}
          </Suspense>
        </LayoutWrapper>
      </ErrorBoundary>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored" // Or "dark" / "light"
        toastClassName="custom-toast" // Optional for styling below

      />
    </Router>
  );
}

export default App;
