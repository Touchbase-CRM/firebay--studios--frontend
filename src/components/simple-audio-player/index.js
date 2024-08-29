import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import 'bootstrap/dist/css/bootstrap.min.css';

const SimpleAudioPlayer = ({ audioSrc }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const playerRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateProgress);
    } else {
      cancelAnimationFrame(animationRef.current);
    }

    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const restartAudio = () => {
    if (playerRef.current) {
      playerRef.current.seekTo(0);
      setProgress(0);
      setElapsedTime('0:00');
      setIsPlaying(true);
    }
  };

  const updateProgress = () => {
    if (playerRef.current) {
      const currentProgress = playerRef.current.getCurrentTime() / playerRef.current.getDuration();
      setProgress(currentProgress * 100);
      setElapsedTime(formatTime(playerRef.current.getCurrentTime()));
      if (currentProgress === 1) {
        onTrackEnd();
      } else {
        animationRef.current = requestAnimationFrame(updateProgress);
      }
    }
  };

  const seekAudio = (event) => {
    if (playerRef.current) {
      const { left, width } = event.currentTarget.getBoundingClientRect();
      const clickPosition = event.clientX - left;
      const clickPercentage = clickPosition / width;
      playerRef.current.seekTo(clickPercentage);
      setProgress(clickPercentage * 100);
      setElapsedTime(formatTime(playerRef.current.getCurrentTime()));
    }
  };

  const onTrackEnd = () => {
    setIsPlaying(false);
    setProgress(0);
    setElapsedTime('0:00');
    if (playerRef.current) {
      playerRef.current.seekTo(0);
    }
  };

  const onDuration = (durationInSeconds) => {
    setDuration(formatTime(durationInSeconds));
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div style={styles.audioPlayerContainer}>
      <ReactPlayer
        ref={playerRef}
        url={audioSrc}
        playing={isPlaying}
        controls={false}
        width="0"
        height="0"
        onEnded={onTrackEnd}
        onDuration={onDuration}
      />
      <button onClick={togglePlay} style={styles.controlBtn}>
        <i className={isPlaying ? "bi bi-pause-fill" : "bi bi-play-fill"}></i>
      </button>
      <button onClick={restartAudio} style={styles.controlBtn}>
        <i className="bi bi-arrow-counterclockwise"></i>
      </button>
      <div style={styles.timeDisplay}>
        {elapsedTime} / {duration}
      </div>
      <div style={styles.progressContainer} onClick={seekAudio}>
        <div
          style={{
            ...styles.progressBar,
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
  );
};

const styles = {
  audioPlayerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px',
    borderRadius: '5px',
    backgroundColor: '#f3f3f3',
    width: '100%',
    maxWidth: '100%',
    position: 'fixed',
    bottom: '0',
    left: '0',
    zIndex: '1000', // Ensures the audio player is above other content
    boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
  },
  controlBtn: {
    fontSize: '24px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'black',
    cursor: 'pointer',
    marginRight: '10px',
    padding: '5px',
  },
  timeDisplay: {
    fontSize: '14px',
    color: 'black',
    marginRight: '10px',
    whiteSpace: 'nowrap',
  },
  progressContainer: {
    flexGrow: 1,
    height: '6px',
    backgroundColor: '#ddd',
    borderRadius: '3px',
    position: 'relative',
    cursor: 'pointer',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#EB631C', // Orange color
    borderRadius: '3px',
  },
};

export default SimpleAudioPlayer;
