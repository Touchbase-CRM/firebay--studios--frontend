import React from 'react';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
import styles from '../styles/DownloadPage.module.css';
import { Card, Navbar, Nav, Button } from 'react-bootstrap';
import AdAudioPlayer from '../components/AdAudioPlayer';

const DownloadPage = () => {
    const router = useRouter();
    const { audioUrl } = router.query;

    const handleDownload = () => {
        confirmAndNavigate();
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
                <Card className="p-4 bg-dark text-white" style={{ marginTop: '10px' }}>
                    <h1 className={styles.title}>Your audio is ready!</h1>
                    <button className={styles.downloadButton} onClick={handleDownload}>
                        Download Audio
                    </button>
                </Card>
            </div>
            <AdAudioPlayer src={audioUrl} onDownloadClick={handleDownload} />

        </div>
    );
};

export default DownloadPage;
