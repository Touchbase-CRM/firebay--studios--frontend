import React, { useState } from 'react';
import { Nav, Dropdown } from 'react-bootstrap';

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const toggleCollapse = () => {
        setCollapsed(!collapsed);
        console.log('Sidebar collapsed:', !collapsed);
    };

    const handleCreateClick = () => {
        console.log('Create clicked');
    };

    const handleHomeClick = () => {
        console.log('Home clicked');
    };

    const handleSharedClick = () => {
        console.log('Shared with me clicked');
    };

    const handleStarredClick = () => {
        console.log('Starred clicked');
    };

    const handleRequestServiceClick = () => {
        console.log('Request full service clicked');
    };

    const handleNotificationsClick = () => {
        console.log('Notifications clicked');
    };

    const handleSettingsClick = () => {
        console.log('Settings clicked');
    };

    const handleHelpClick = () => {
        console.log('Help clicked');
    };

    const handleProfileClick = () => {
        setShowDropdown(!showDropdown);
        console.log('Profile clicked');
    };

    const handleSignOutClick = () => {
        console.log('Sign out clicked');
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
                    width: collapsed ? '90px' : '250px',
                }}
            >
                <Nav.Item className="mb-3">
                    <img
                        src={collapsed ? "/fire.png" : "/White mic horizontal.png"}
                        alt="Firebay Studios Logo"
                        style={{
                            width: collapsed ? '40px' : '150px', // Adjust these values as needed
                            marginBottom: '0px',
                            transition: 'width 0.3s',
                            display: 'block',
                            marginLeft: collapsed ? '8px' : 'auto', // Adjust the left margin when collapsed
                            marginRight: collapsed ? '15px' : 'auto', // Adjust the right margin when collapsed
                        }}
                    />
                </Nav.Item>

                {!collapsed && (
                    <Nav.Item className="mb-3">
                        <button
                            onClick={handleCreateClick}
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
                            // backgroundColor: '#f6f6f6',
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
                        onClick={handleStarredClick}
                        className="d-flex align-items-center"
                        style={{
                            color: '#000000',
                            padding: '10px 20px',
                            borderRadius: '5px',
                            marginBottom: '10px',
                            fontSize: '14px',
                        }}
                    >
                        <i className="bi bi-star" style={{ marginRight: collapsed ? '0' : '10px' }}></i>
                        {!collapsed && 'Starred'}
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
                        {!collapsed && 'Request full service'}
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link
                        onClick={handleNotificationsClick}
                        className="d-flex align-items-center"
                        style={{
                            color: '#000000',
                            padding: '10px 20px',
                            borderRadius: '5px',
                            marginBottom: '10px',
                            fontSize: '14px',
                        }}
                    >
                        <i className="bi bi-bell" style={{ marginRight: collapsed ? '0' : '10px' }}></i>
                        {!collapsed && 'Notifications'}
                    </Nav.Link>
                </Nav.Item>
                <hr style={{ width: collapsed ? '50px' : '220px' }} />
                <Nav.Item>
                    <Nav.Link
                        onClick={handleSettingsClick}
                        className="d-flex align-items-center"
                        style={{
                            color: '#000000',
                            padding: '10px 20px',
                            borderRadius: '5px',
                            marginBottom: '10px',
                            fontSize: '14px',
                        }}
                    >
                        <i className="bi bi-gear" style={{ marginRight: collapsed ? '0' : '10px' }}></i>
                        {!collapsed && 'Settings'}
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link
                        onClick={handleHelpClick}
                        className="d-flex align-items-center"
                        style={{
                            color: '#000000',
                            padding: '10px 20px',
                            borderRadius: '5px',
                            marginBottom: '10px',
                            fontSize: '14px',
                        }}
                    >
                        <i className="bi bi-question-circle" style={{ marginRight: collapsed ? '0' : '10px' }}></i>
                        {!collapsed && 'Help'}
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item className="mt-auto">
                    <Dropdown drop='up' show={showDropdown} onToggle={() => setShowDropdown(!showDropdown)}>
                        <Dropdown.Toggle
                            as="div"
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
                        </Dropdown.Toggle>
                        <Dropdown.Menu align="up">
                            <Dropdown.Item onClick={handleSignOutClick}>
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
        </div>
    );
};

export default Sidebar;
