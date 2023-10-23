import React, { useState, useEffect } from 'react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css'; // Import the CSS styles
import 'bootstrap/dist/css/bootstrap.min.css';

export default function CustomAudioPlayer({ text, voice_id }) { // Accepting text and voice_id as props
    const [audioSrc, setAudioSrc] = useState(null);
  
    const fetchAudio = async () => {
      try {
        const response = await fetch('/api/textToSpeech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice_id }) // Passing both text and voice_id
        });
  
        if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
        }
  
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        setAudioSrc(audioUrl);
  
      } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
      }
    };
  
    useEffect(() => {
      fetchAudio();
    }, [text, voice_id]); 

  return (
    <div>
      {audioSrc && (
        <div className="fixed-bottom bg-light border-top">
          <div className="container pt-2 pb-2">
            <div className="d-flex align-items-center justify-content-between">
            <span style={{ fontSize: '24px', fontWeight: '400', color: '#555', marginRight: '20px' }}>
              <span style={{ fontWeight: '600', color: '#333',  marginLeft:'50px' }}></span>
            </span>
              <AudioPlayer
                src={audioSrc}
                showJumpControls={false}
                customAdditionalControls={[]}
                customVolumeControls={[]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
}
