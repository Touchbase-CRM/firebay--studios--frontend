import React from 'react';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
import styles from '../styles/DownloadPage.module.css';
import { Card, Navbar, Nav, Button } from 'react-bootstrap';
import AdAudioPlayer from '../components/AdAudioPlayer';
import Link from 'next/link';
import { cookieCleaner } from '../utils/cookieUtils';

const DownloadPage = () => {
    const router = useRouter();
    const { audioUrl } = router.query;

    const handleDownload = () => {
        confirmAndNavigate();
    };
    const handleNewAd = () => {
        cookieCleaner(); // This will clear all cookies
        router.push('/create_ad'); // Navigate to the create ad page
    };

    const confirmAndNavigate = () => {
        Swal.fire({
            title: 'Download Complete!',
            text: 'Would you like to create a new advertisement?',
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: 'Yes, create more!',
            cancelButtonText: 'No, I’m still downloading...'
        }).then((result) => {
            if (result.isConfirmed) {
                router.push('/create_ad');
                URL.revokeObjectURL(audioUrl);
            }
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <div style={{ backgroundColor: '#343a40', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar bg="dark" variant="dark" expand="lg">
                <Navbar.Brand style={{ marginLeft: '10px' }}>
                    <img src="/fire.png" alt="Firebay Studios" width="50" height="50" className="d-inline-block align-top" />
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="mr-auto"></Nav>
                </Navbar.Collapse>
                <Button variant="danger" size="sm" onClick={handleLogout} style={{ marginRight: '10px' }}>
                    Logout
                </Button>
            </Navbar>
            <div className={styles.container}>
                <Card style={{ width: '400px', height: '450px', marginTop: '10px', position: 'relative', borderRadius: '15px', overflow: 'hidden' }}>
                    <Card.Header style={{ backgroundColor: '#343a40', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <h1 className={styles.title} style={{ margin: 0, fontSize: '24px' }}>Download Manager</h1>
                    </Card.Header>
                    <Card.Body className="bg-dark text-white" style={{ paddingTop: '30px', paddingBottom: '30px' }}>
                        <h5 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px', marginBottom: '20px', fontSize: '18px' }}>Need more tweaking?</h5>
                        <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
                            <li style={{ marginBottom: '12px' }}>
                                <Link href="/add_music" className="btn btn-outline-light btn-lg">Change Music</Link>
                            </li>
                            <li style={{ marginBottom: '12px' }}>
                                <Link href="/create_ad" className="btn btn-outline-light btn-lg">Change Script or Voice</Link>
                            </li>
                            <h5 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px', marginBottom: '20px', marginTop: '20px', fontSize: '18px' }}>Start from scratch?</h5>
                            <li style={{ marginBottom: '12px' }}>
                                <button className="btn btn-outline-light btn-lg" onClick={handleNewAd}>Create a new ad</button>
                            </li>
                        </ul>
                    </Card.Body>
                    <Card.Footer className="bg-dark text-white" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <small style={{ float: 'right', fontSize: '16px' }}>Credits left: 5/5</small>
                    </Card.Footer>
                </Card>
            </div>


            <AdAudioPlayer src={audioUrl} onDownloadClick={handleDownload} />

        </div>
    );
};

export default DownloadPage;
