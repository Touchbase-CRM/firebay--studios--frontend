// CustomDropdown.js
import React from "react";
import { Dropdown } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";

const CustomDropdown = ({ items }) => {
  return (
    <Dropdown>
      <Dropdown.Toggle
        variant="secondary"
        id="dropdown-basic"
        className="custom-dropdown-toggle"
        style={{
          fontSize: "20px",
          backgroundColor: "transparent", // Makes the background transparent
          color: "inherit", // Inherits the text color from the parent
          border: "none", // Removes the border
          boxShadow: "none", // Removes the shadow
          padding: "0",
        }}
      >
        <FontAwesomeIcon icon={faBars} />
      </Dropdown.Toggle>

      {/* Apply inline styling to the Dropdown.Menu */}
      <Dropdown.Menu style={{ left: "auto", right: 0 }}>
        {items.map((item, index) => (
          <Dropdown.Item key={index} onClick={item.handler}>
            {item.text}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default CustomDropdown;
