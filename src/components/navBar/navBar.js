import React from "react";
import { Navbar, Nav } from "react-bootstrap";
import CustomDropdown from "../CustomDropdown";

export const NavBar = ({ dropdownItems }) => {
  return (
    <Navbar
      expand="lg"
      style={{ marginBottom: "5px", backgroundColor: "#e4e4e4" }}
    >
      <Navbar.Brand style={{ marginLeft: "10px" }}>
        <img
          src="/fire.png"
          alt="Firebay Studios"
          width="50"
          height="50"
          className="d-inline-block align-top"
        />
      </Navbar.Brand>

      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse
        id="basic-navbar-nav"
        className="justify-content-between"
      >
        <Nav className="mr-auto">
          {/* Other nav links or content can go here */}
        </Nav>
        {/* Conditionally render the CustomDropdown if dropdownItems are provided */}
        {dropdownItems && dropdownItems.length > 0 && (
          <div style={{ paddingRight: "25px" }}>
            <CustomDropdown items={dropdownItems} />
          </div>
        )}
      </Navbar.Collapse>
    </Navbar>
  );
};
