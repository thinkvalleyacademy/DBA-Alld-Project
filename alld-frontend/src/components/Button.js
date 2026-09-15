import React from "react";

function Button({ children, onClick, className, disabled }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default Button;