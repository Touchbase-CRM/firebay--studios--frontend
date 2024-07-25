import React from "react";
import PropTypes from "prop-types";
import "bootstrap-icons/font/bootstrap-icons.css";

const ActionCard = ({
  icon,
  title,
  description,
  link,
  onLinkClick,
  linkLabel,
}) => {
  const cardStyles = {
    width: "100%",
    height: "100%",
    maxWidth: "250px", // Adjusted max width for better responsiveness
    maxHeight: "220px", // Adjusted max height for better responsiveness
    backgroundColor: "#EB621D",
    color: "#FFFFFF",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-start",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
    padding: "20px",
    margin: "10px",
  };

  const iconStyles = {
    fontSize: "24px", // Reduced font size for the icon
    color: "#FFFFFF",
  };

  const titleStyles = {
    margin: "0",
    fontSize: "1.25em", // Reduced font size for the title
    fontWeight: "bold",
    textAlign: "left",
    color: "#FFFFFF",
  };

  const descriptionStyles = {
    margin: "10px 0", // Reduced margin for the description
    fontSize: "0.9em", // Reduced font size for the description
    textAlign: "left",
    color: "#FFFFFF",
  };

  const linkContainerStyles = {
    display: "flex",
    alignItems: "center",
    fontSize: "0.9em", // Reduced font size for the link
    fontWeight: "bold",
    color: "#FFFFFF",
    textDecoration: "none",
  };

  const arrowIconStyles = {
    marginLeft: "5px",
    fontSize: "0.9em", // Reduced font size for the arrow icon
    fontWeight: "bold",
  };

  const linkHoverStyles = {
    textDecoration: "underline",
  };

  return (
    <div style={cardStyles}>
      <div style={iconStyles}>
        <i className={`bi ${icon}`} />
      </div>
      <h3 style={titleStyles}>{title}</h3>
      <p style={descriptionStyles}>{description}</p>
      <a
        href={link}
        style={linkContainerStyles}
        onMouseOver={(e) =>
          (e.target.style.textDecoration = linkHoverStyles.textDecoration)
        }
        onMouseOut={(e) => (e.target.style.textDecoration = "none")}
        onClick={(e) => {
          e.preventDefault();
          onLinkClick(e);
        }}
      >
        {linkLabel}
        <i className="bi bi-chevron-right" style={arrowIconStyles} />
      </a>
    </div>
  );
};

ActionCard.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  onLinkClick: PropTypes.func.isRequired,
  linkLabel: PropTypes.string,
};

ActionCard.defaultProps = {
  linkLabel: "Get Started",
};

export default ActionCard;
