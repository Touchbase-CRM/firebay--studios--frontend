import React from "react";
import { Navbar, Nav, Button } from "react-bootstrap";
import CustomDropdown from "../CustomDropdown"; // Ensure the path is correct
import { useRouter } from "next/router";

export const NavBar = ({ links, dropdownItems, logoutHandler }) => {
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
          width="50"
          height="50"
          className="d-inline-block align-top"
          alt="Logo"
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
        {/* Conditionally render the CustomDropdown or the Logout button */}
        {dropdownItems && dropdownItems.length > 0 ? (
          <div style={{ paddingRight: "25px" }}>
            <CustomDropdown items={dropdownItems} />
          </div>
        ) : logoutHandler ? (
          <Button
            variant="light"
            size="sm"
            onClick={logoutHandler}
            style={{
              marginRight: "10px",
              padding: "5px 10px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <i
              className="bi bi-box-arrow-right"
              style={{ marginRight: "5px" }}
            ></i>
            Logout
          </Button>
        ) : null}
      </Navbar.Collapse>
    </Navbar>
  );
};
