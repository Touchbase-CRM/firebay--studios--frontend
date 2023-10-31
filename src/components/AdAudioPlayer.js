
import React from 'react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function AdAudioPlayer({ src, onDownloadClick }) {
    const downloadRef = React.useRef(null);

    const handleDownloadClick = (e) => {
        if (onDownloadClick) {
            e.preventDefault();
            onDownloadClick();
            downloadRef.current.click();
        }
    };
    return (
        <div className="fixed-bottom bg-light border-top">
            <div className="container pt-2 pb-2">
                <div className="d-flex align-items-center justify-content-between">
                    <span style={{ fontSize: '24px', fontWeight: '400', color: '#555', marginRight: '20px' }}>
                        <span style={{ fontWeight: '600', color: '#333', marginLeft: '50px' }}>
                            Charley
                        </span>
                    </span>
                    <AudioPlayer
                        src={src || undefined}
                        showJumpControls={false}
                        customAdditionalControls={[]}
                        customVolumeControls={[]}
                        style={{ width: '80%' }}
                    />
                    <a
                        ref={downloadRef}
                        href={src}
                        onClick={handleDownloadClick}
                        style={{ marginLeft: '10px', color: '#000', fontSize: '30px' }}
                    >
                        <i className="bi bi-download"></i>
                    </a>
                </div>
            </div>
        </div>
    );
}
