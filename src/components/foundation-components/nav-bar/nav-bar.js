import React, { useState, useEffect } from "react";
import { Navbar, Nav, Container, Offcanvas, Button } from "react-bootstrap";
import { useRouter } from "next/router";
import { formatDate } from "@/utils/time/current-timestamp";

export const NavBar = ({ links, logoutHandler, disableHome = false, saveHandler = null, notifications, deleteNotification }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [internalNotifications, setInternalNotifications] = useState(notifications || []);

  const router = useRouter();

  const navigate = (url) => {
    if (saveHandler) {
      saveHandler();
    }
    router.replace(url, undefined, { scroll: false });
  };

  const handleClose = () => setShowNotifications(false);
  const handleShow = () => setShowNotifications(true);

  const handleDeleteNotification = (id) => {
    deleteNotification(id);
  };

  useEffect(() => {
    if (notifications) {
      setInternalNotifications(notifications);
    }
  }, [notifications]);

  return (
    <>
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
                <Nav.Link
                  key={index}
                  onClick={() => navigate(link.url)}
                  style={{
                    margin: '0 15px',
                    color: '#343a40',
                    fontSize: '16px',
                    fontWeight: '500',
                    letterSpacing: '0.5px'
                  }}
                >
                  {link.label}
                </Nav.Link>
              ))}
            </Nav>

            <Nav className="ms-auto align-items-center">
              {!disableHome && (
                <Nav.Link
                  onClick={() => navigate('/home')}
                  style={{
                    margin: '0 15px',
                    color: '#343a40',
                    fontSize: '16px',
                    fontWeight: '500',
                    letterSpacing: '0.5px'
                  }}
                >
                  <i className="bi bi-house"></i> Home
                </Nav.Link>
              )}
              {notifications && (
                <Nav.Link
                  href="#"
                  onClick={handleShow}
                  style={{
                    position: 'relative',
                    padding: '0 15px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#343a40',
                    fontSize: '16px',
                    fontWeight: '500',
                    letterSpacing: '0.5px'
                  }}
                >
                  <i className="bi bi-bell" style={{ fontSize: '20px', marginRight: '5px' }}></i>
                  <span style={{ marginRight: '10px' }}>Notifications</span>
                  {internalNotifications.length > 0 && (
                    <span className="badge text-bg-secondary" style={{ position: 'absolute', top: '-5px', right: '-5px', fontSize: '12px' }}>
                      {internalNotifications.length}
                    </span>
                  )}
                </Nav.Link>
              )}
              <Nav.Link
                onClick={logoutHandler}
                style={{
                  margin: '0 15px',
                  color: '#343a40',
                  fontSize: '16px',
                  fontWeight: '500',
                  letterSpacing: '0.5px'
                }}
              >
                <i className="bi bi-box-arrow-right"></i> Logout
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      {notifications && (

        <Offcanvas show={showNotifications} onHide={handleClose} placement="end" style={{ width: '500px' }}>
          <Offcanvas.Header closeButton style={{ borderBottom: 'none', padding: '20px' }}>
            <Offcanvas.Title style={{ fontSize: '24px', fontWeight: 'bold' }}>Notifications</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body style={{ backgroundColor: '#f8f9fa', padding: '0 20px 20px' }}>
            {internalNotifications.map(notification => (
              <div key={notification.id} className="notification-item" style={{
                marginBottom: '15px',
                marginTop: '15px',
                padding: '15px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ color: '#000000', fontSize: '16px', display: 'block', marginBottom: '5px' }}>
                      {notification.title}
                    </strong>
                    <span style={{ color: '#666', fontSize: '14px' }}>{formatDate(notification.timestamp)}</span>
                  </div>
                  <Button variant="link" size="sm" onClick={() => handleDeleteNotification(notification.id)} style={{ padding: 0 }}>
                    <i className="bi bi-x" style={{ color: '#000000', fontSize: '20px' }}></i>
                  </Button>
                </div>
                <div style={{ marginTop: '10px', fontSize: '15px', color: '#333' }}>
                  {notification.message}
                </div>
              </div>
            ))}
          </Offcanvas.Body>
        </Offcanvas>
      )}
    </>
  );
};
