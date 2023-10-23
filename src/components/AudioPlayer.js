import React, { useState, useEffect } from 'react';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css'; // Import the CSS styles
import 'bootstrap/dist/css/bootstrap.min.css';

export default function CustomAudioPlayer() {
  const [audioSrc, setAudioSrc] = useState(null);

  const fetchAudio = async () => {
    try {
      const response = await fetch('/api/textToSpeech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Firebay Studios is cool' })
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
  }, []);

  return (
    <div>
      {audioSrc && (
        <div className="fixed-bottom bg-light border-top">
          <div className="container pt-2 pb-2">
            <AudioPlayer
              src={audioSrc}
              showJumpControls={false}
              customAdditionalControls={[]}
              customVolumeControls={[]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
