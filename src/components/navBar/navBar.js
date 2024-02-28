import React from "react";
import { Navbar, Nav } from "react-bootstrap";
import CustomDropdown from "../CustomDropdown"; // Adjust the import path as needed
import { useRouter } from "next/router";

export const NavBar = ({ links, dropdownItems }) => {
  const router = useRouter();

  const navigate = (url) => {
    router.push(url);
  };

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
          {/* Iterate over links and use navigate function to handle clicks */}
          {links.map((link, index) => (
            <Nav.Link
              key={index}
              onClick={() => navigate(link.url)}
              style={link.style}
            >
              {link.icon && <i className={link.icon}></i>} {link.label}
            </Nav.Link>
          ))}
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
