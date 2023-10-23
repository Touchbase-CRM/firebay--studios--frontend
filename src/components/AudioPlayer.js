export default function AudioPlayer() {
    const playAudio = async () => {
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
        const audio = new Audio(audioUrl);
        audio.play();
      } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
      }
    };
  
    return (
      <button onClick={playAudio}>Play Audio</button>
    );
  }