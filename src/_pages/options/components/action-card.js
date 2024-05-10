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
    width: "346px",
    height: "296px",
    backgroundColor: "#FFA500",
    color: "#000000",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-start",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
    padding: "20px",
  };

  const iconStyles = {
    fontSize: "30px",
    color: "#000000",
  };

  const titleStyles = {
    margin: "0",
    fontSize: "1.5em",
    fontWeight: "bold",
    textAlign: "left",
    color: "#000000",
  };

  const descriptionStyles = {
    margin: "15px 0",
    fontSize: "1em",
    textAlign: "left",
    color: "#000000",
  };

  const linkStyles = {
    fontSize: "1em",
    color: "#000000",
    textDecoration: "none",
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
        style={linkStyles}
        onMouseOver={(e) =>
          (e.target.style.textDecoration = linkHoverStyles.textDecoration)
        }
        onMouseOut={(e) => (e.target.style.textDecoration = "none")}
        onClick={(e) => {
          e.preventDefault();
          onLinkClick(e);
        }}
      >
        {linkLabel} &rarr;
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
