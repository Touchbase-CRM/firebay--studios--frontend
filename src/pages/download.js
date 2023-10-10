import React from 'react';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
import styles from '../styles/DownloadPage.module.css';
import { Card } from 'react-bootstrap';


const DownloadPage = () => {
    const router = useRouter();
    const { audioUrl } = router.query;

    const handleDownload = () => {
        initiateDownload();
        confirmAndNavigate();
    };

    const initiateDownload = () => {
        const link = document.createElement('a');
        link.href = audioUrl;
        link.download = 'generated-audio.mp3';
        link.click();
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

    return (
        <div className={styles.container}>
             <Card className="p-4 bg-dark text-white" style={{ marginTop: '140px' }}>
            <h1 className={styles.title}>Your audio is ready!</h1>
            <button className={styles.downloadButton} onClick={handleDownload}>
                Download Audio
            </button>
            </Card>
        </div>
    );
};

export default DownloadPage;
