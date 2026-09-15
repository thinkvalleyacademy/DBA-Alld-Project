// src/components/Layout.js
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";
import { useState } from "react";

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  return (
    <div className="min-h-screen flex flex-col relative">
      <Header onToggleSidebar={() => setSidebarOpen((open) => !open)} />

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          showDetailsModal={showDetailsModal}
        />
        <main className="flex-1 overflow-auto p-6 z-10 relative">
          {/* Outlet को setShowDetailsModal prop pass करें */}
          <Outlet context={{ setShowDetailsModal }} />
        </main>
      </div>

      <Footer />
    </div>
  );
}

export default Layout;
