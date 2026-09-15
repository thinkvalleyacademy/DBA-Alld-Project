import React, { useState } from "react";

const IconButton = ({
  title,
  icon: Icon,
  iconColor = "white",
  backgroundColor = "#2563EB", // default blue-600
  hoverColor = "#1D4ED8",      // default blue-700
  onClick,
}) => {
  const [isHover, setIsHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      style={{
        backgroundColor: isHover ? hoverColor : backgroundColor,
        color: "white",
      }}
      className="flex items-center gap-1 px-3 py-1 rounded transition-colors duration-200"
    >
      <Icon className="w-4 h-4" style={{ color: iconColor }} />
      {title}
    </button>
  );
};

export default IconButton;
