import React from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { useRouter } from "next/router";

export const NavBar = ({ links, logoutHandler, disableHome = false, saveHandler = null }) => {
  const router = useRouter();

  const navigate = (url) => {
    if (saveHandler) {
      saveHandler();
    }
    router.replace(url, undefined, { scroll: false });
  };

  return (
    <Navbar
      expand="lg"
      style={{
        backgroundColor: 'transparent',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        borderBottom: 'none',
        borderRadius: '0 0 10px 10px',
      }}
    >
      <Container fluid>
        <Navbar.Brand href="#">
          <img
            src="/fire.png"
            width="50"
            height="50"
            className="d-inline-block align-top"
            alt="Logo"
          />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse
          id="navbar-nav"
          style={{
            justifyContent: 'flex-end',
          }}
        >
          <Nav className="me-auto">
            {links.map((link, index) => (
              <Nav.Link key={index} onClick={() => navigate(link.url)}>
                {link.label}
              </Nav.Link>
            ))}
          </Nav>
          <Nav className="ms-auto">
            {!disableHome && (
              <Nav.Link onClick={() => navigate('/home')}>
                <i className="bi bi-house"></i> Home
              </Nav.Link>
            )}
            <Nav.Link onClick={logoutHandler}>
              <i className="bi bi-box-arrow-right"></i> Logout
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};
