import React from 'react';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';

const DownloadPage = () => {
    const router = useRouter();
    const { audioUrl } = router.query;

    const handleDownload = () => {
        // 6a & 6b. Facilitate the download
        const link = document.createElement('a');
        link.href = audioUrl;
        link.download = 'generated-audio.mp3';
        link.click();

        // 7a. Confirm completion and navigate
        Swal.fire({
            title: 'Download Complete!',
            text: 'Would you like to create a new advertisement?',
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: 'Yes, create more!',
            cancelButtonText: 'No, I’m still downloading...'
        }).then((result) => {
            if (result.isConfirmed) {
                // 7b. Navigate back to the home page
                router.push('/create_ad');
                // 8a. Revoke the Blob URL to free resources
                URL.revokeObjectURL(audioUrl);
            }
        });
    };

    return (
        <div>
            <h1>Your audio is ready!</h1>
            <button onClick={handleDownload}>Download Audio</button>
        </div>
    );
};

export default DownloadPage;
