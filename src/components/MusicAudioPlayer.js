import React, { useState, useEffect } from 'react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function toTitleCase(str) {
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

export default function MusicAudioPlayer({ genre }) {
  const [audioSrc, setAudioSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const fetchAudio = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/musicPreview?genre=${encodeURIComponent(genre)}`);

      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      setAudioSrc(audioUrl);

    } catch (error) {
      console.error('There has been a problem with your fetch operation:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudio();
  }, [genre]);

  return (
    <div className="fixed-bottom bg-light border-top">
      <div className="container pt-2 pb-2">
        <div className="d-flex align-items-center justify-content-between">
          <span style={{ fontSize: '24px', fontWeight: '400', color: '#555', marginRight: '20px' }}>
            <span style={{ fontWeight: '600', color: '#333', marginLeft: '50px' }}>
              {loading && (  // Conditional rendering of the spinner
                <div className="spinner-border" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
              )}
            </span>
          </span>
          <AudioPlayer
            src={audioSrc || undefined}
            header={<span style={{ color: 'black' }}>Now playing: {toTitleCase(genre)}</span>}
            showJumpControls={false}
            customAdditionalControls={[]}
            customVolumeControls={[]}
          />
        </div>
      </div>
    </div>
  );
}
