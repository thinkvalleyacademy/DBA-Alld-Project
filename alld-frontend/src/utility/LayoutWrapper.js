function LayoutWrapper({ children }) {
    return (
      <div className="bg-gray-100 dark:bg-gray-950 text-gray-800 dark:text-gray-100 min-h-screen">
        {children}
      </div>
    );
  }
  
  export default LayoutWrapper;
  