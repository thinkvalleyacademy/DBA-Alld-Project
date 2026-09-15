function PageWrapper({ children }) {
    return (
      <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
        {children}
      </div>
    );
  }
  
  export default PageWrapper;
  