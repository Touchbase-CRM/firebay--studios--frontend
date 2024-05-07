// Adding this minimal audio player in case if the audio player gets too complex in the future.
import React from "react";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import "bootstrap/dist/css/bootstrap.min.css";

import withAuth from "@/hocs/withAuth";
import { getAuth } from "firebase/auth";
import app from "@/firebase";

import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  query,
  collection,
  where,
} from "firebase/firestore";

export default function SimpleAudioPlayer({
  audioTitle,
  audioSrc,
  forceRender = 0,
  autoplay = false, // Optional autoplay prop, default is false
  allowDownload = false, // Optional prop to allow downloading
}) {
  return (
    <div className="fixed-bottom bg-light border-top">
      <div className="container pt-2 pb-2">
        <AudioPlayer
          key={forceRender}
          src={audioSrc || undefined}
          autoPlay={autoplay}
          header={
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: "black",
              }}
            >
              <span>Now playing: {audioTitle}</span>
              {allowDownload && (
                <a
                  href={audioSrc}
                  download
                  className="btn btn-link"
                  title="Download"
                  style={{
                    marginLeft: "auto",
                    fontSize: "1.5em",
                    color: "#EB631C",
                  }} // Adjust the value as needed
                >
                  <i className="bi bi-download"></i>
                </a>
              )}
            </div>
          }
          showJumpControls={false}
          customAdditionalControls={[]}
          customVolumeControls={[]}
        />
      </div>
    </div>
  );
}
