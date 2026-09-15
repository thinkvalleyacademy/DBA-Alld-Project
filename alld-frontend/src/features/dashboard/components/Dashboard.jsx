import PageWrapper from "../../../utility/PageWrapper";
import Dashboardcards from "../../../components/dashboardcards"; 

function Dashboard() {
  return (
    <PageWrapper>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">  
        {/* Dashboard Content - Takes remaining space */}
        <div className="flex-1 overflow-auto">
          <Dashboardcards />
        </div>
      </div>
    </PageWrapper>
  );
}

export default Dashboard;