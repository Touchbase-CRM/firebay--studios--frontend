import React, { useState, useEffect } from 'react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function VoiceAudioPlayer({ text, voice_id }) {
  const [audioSrc, setAudioSrc] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAudio = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/textToSpeech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice_id })
      });

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
  }, [text, voice_id]);

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
            showJumpControls={false}
            customAdditionalControls={[]}
            customVolumeControls={[]}
          />
        </div>
      </div>
    </div>
  );

}
