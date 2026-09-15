const Card = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 print:shadow-none print:border-gray-300 ${className}`}>
    {children}
  </div>
);

export default Card;
