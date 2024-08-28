import React, { useState, useEffect } from 'react';
import { Nav, Dropdown, Spinner } from 'react-bootstrap';
import { NotificationsPad } from "./notifications-pad";

const Sidebar = ({ onCreateClick, onLogoutClick, notifications, deleteNotification, totalDownloads }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [internalNotifications, setInternalNotifications] = useState(notifications || []);

    const handleClose = () => setShowNotifications(false);
    const handleShow = () => setShowNotifications(true);

    useEffect(() => {
        if (notifications) {
            setInternalNotifications(notifications);
        }
    }, [notifications]);

    const toggleCollapse = () => {
        setLoading(true);  // Start loading before the transition
        setTimeout(() => {
            setCollapsed(!collapsed);
            setLoading(false);  // End loading after the transition
            console.log('Sidebar collapsed:', !collapsed);
        }, 300); // Adjust this timeout duration as needed to match the transition duration
    };

    const handleHomeClick = () => {
        console.log('Home clicked');
    };

    const handleSharedClick = () => {
        console.log('Shared with me clicked');
    };

    const handleRequestServiceClick = () => {
        console.log('Request full service clicked');
    };

    const handleProfileClick = () => {
        setShowDropdown(!showDropdown);
        console.log('Profile clicked');
    };

    return (
        <div style={{ position: 'relative', display: 'flex' }}>
            <Nav
                className="d-flex flex-column vh-100 p-3"
                style={{
                    width: collapsed ? '80px' : '250px',
                    backgroundColor: '#ffffff',
                    borderRight: '1px solid #e0e0e0',
                    transition: 'width 0s',
                }}
            >
                <Nav.Item className="mb-3">
                    {loading ? (
                        <Spinner
                            animation="border"
                            style={{
                                marginBottom: '0px',
                                marginLeft: collapsed ? '8px' : 'auto',
                                marginRight: collapsed ? '15px' : 'auto',
                                borderColor: '#EB631C', // Set the border color of the spinner
                                borderRightColor: 'transparent' // Hide one side to create the spinning effect
                            }}
                        />
                    ) : (
                        <img
                            src={collapsed ? "/fire.png" : "/White mic horizontal.png"}
                            alt="Firebay Studios Logo"
                            style={{
                                width: collapsed ? '40px' : '150px',
                                marginBottom: '0px',
                                transition: 'width 0.3s',
                                display: 'block',
                                marginLeft: collapsed ? '8px' : 'auto',
                                marginRight: collapsed ? '15px' : 'auto',
                            }}
                        />
                    )}
                </Nav.Item>

                {!collapsed && (
                    <Nav.Item className="mb-3">
                        <button
                            onClick={onCreateClick}
                            style={{
                                backgroundColor: '#eb631c',
                                color: '#ffffff',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '5px',
                                width: '100%',
                                fontWeight: 'bold',
                                fontSize: '16px',
                            }}
                        >
                            + Create
                        </button>
                    </Nav.Item>
                )}
                <Nav.Item>
                    <Nav.Link
                        onClick={handleHomeClick}
                        className="d-flex align-items-center"
                        style={{
                            color: '#000000',
                            padding: '10px 20px',
                            borderRadius: '5px',
                            marginBottom: '10px',
                            fontSize: '14px',
                        }}
                    >
                        <i className="bi bi-house" style={{ marginRight: collapsed ? '0' : '10px' }}></i>
                        {!collapsed && 'Home'}
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link
                        onClick={handleSharedClick}
                        className="d-flex align-items-center"
                        style={{
                            color: '#000000',
                            padding: '10px 20px',
                            borderRadius: '5px',
                            marginBottom: '10px',
                            fontSize: '14px',
                        }}
                    >
                        <i className="bi bi-people" style={{ marginRight: collapsed ? '0' : '10px' }}></i>
                        {!collapsed && 'Shared with me'}
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link
                        onClick={handleRequestServiceClick}
                        className="d-flex align-items-center"
                        style={{
                            color: '#000000',
                            padding: '10px 20px',
                            borderRadius: '5px',
                            marginBottom: '10px',
                            fontSize: '14px',
                        }}
                    >
                        <i className="bi bi-check-circle" style={{ marginRight: collapsed ? '0' : '10px' }}></i>
                        {!collapsed && 'Request white glove'}
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link
                        onClick={handleShow}
                        className="d-flex align-items-center position-relative"
                        style={{
                            color: '#000000',
                            padding: '10px 20px',
                            borderRadius: '5px',
                            marginBottom: '10px',
                            fontSize: '14px',
                        }}
                    >
                        <i className="bi bi-bell" style={{ marginRight: collapsed ? '0' : '10px' }}></i>
                        {internalNotifications.length > 0 && (
                            <span
                                className="badge text-bg-secondary"
                                style={{
                                    position: 'absolute',
                                    top: '8px', // Adjusted top position for better alignment
                                    right: collapsed ? '10px' : '30px', // Adjusted right position for better alignment
                                    fontSize: '12px',
                                    padding: '4px 6px', // Added padding for a more consistent look
                                    borderRadius: '10px', // Making the badge circular
                                }}
                            >
                                {internalNotifications.length}
                            </span>
                        )}
                        {!collapsed && 'Notifications'}
                    </Nav.Link>
                </Nav.Item>

                <Nav.Item className="mt-auto mb-3">
                    {!collapsed && (
                        <div style={{
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            padding: '15px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <p style={{ margin: '0', fontSize: '12px', color: '#6c757d' }}>Downloads this month</p>
                            <p style={{ margin: '0', fontSize: '20px', fontWeight: 'bold' }}>{totalDownloads}</p>
                        </div>
                    )}
                </Nav.Item>

                <Nav.Item>
                    <Dropdown drop='up' show={showDropdown} onToggle={() => setShowDropdown(!showDropdown)}>
                        <div
                            id="dropdown-profile"
                            onClick={handleProfileClick}
                            style={{
                                color: '#000000',
                                padding: '10px 20px',
                                borderRadius: '5px',
                                fontSize: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <div
                                style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '50%',
                                    backgroundColor: '#f0c6b2',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: collapsed ? '0px' : '10px',
                                    marginLeft: "-6px",
                                    color: '#000000',
                                    fontWeight: 'bold',
                                }}
                            >
                                K
                            </div>
                            {!collapsed && <span>Kaveen Jayamanna</span>}
                        </div>
                        <Dropdown.Menu align="end" style={{ bottom: '100%' }}>
                            <Dropdown.Item onClick={onLogoutClick} style={{
                                outline: "none",
                                backgroundColor: "#f8f9fa",
                                color: "#495057",
                                boxShadow: "none",
                            }}>
                                <i className="bi bi-box-arrow-right" style={{ marginRight: '10px' }}></i>
                                Sign out
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Nav.Item>
            </Nav>
            <div
                style={{
                    position: 'absolute',
                    bottom: '25px',
                    right: '-15px',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: '#eb631c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                }}
                onClick={toggleCollapse}
            >
                <i
                    className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}
                    style={{
                        fontSize: '20px',
                        color: '#ffffff',
                    }}
                ></i>
            </div>
            {notifications && (
                <NotificationsPad
                    show={showNotifications}
                    handleClose={handleClose}
                    notifications={internalNotifications}
                    deleteNotification={deleteNotification}
                />
            )}
        </div>
    );
};

export default Sidebar;
