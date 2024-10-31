import React from "react";

const HeaderTitle = ({
  title,
  subtitle,
  centered = true,
  size = "default",
}) => {
  // Size variants mapping
  const sizeClasses = {
    small: "text-lg md:text-xl",
    default: "text-xl md:text-2xl",
    large: "text-2xl md:text-3xl",
  };

  return (
    <header className={`space-y-2 ${centered ? "text-center" : "text-left"}`}>
      <h1
        className={`
        font-medium
        tracking-wide
        text-black
        ${sizeClasses[size]}
      `}
      >
        {title}
      </h1>

      {subtitle && (
        <p
          className={`
          text-sm md:text-base
          text-gray-600
          leading-relaxed
        `}
        >
          {subtitle}
        </p>
      )}
    </header>
  );
};

export default HeaderTitle;
