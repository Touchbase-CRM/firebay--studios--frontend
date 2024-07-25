// src/_pages/advanced-mode/script-to-ad/stitch-sections/components/InfoPad.js

import React from "react";
import { Button } from "react-bootstrap";

const InfoPad = ({
    localSectionsArray,
    adLength,
    combinedVoiceoverUrl,
    setForceRenderKey,
    setShowAudioPlayer,
    setNowPlayingUrl,
    setAudioTitle,
}) => {
    return (
        <div
            style={{
                marginTop: "20px",
                padding: "10px 20px",
                backgroundColor: "#f9f9f9",
                borderRadius: "10px",
                fontSize: "1em",
                color: "#333",
            }}
        >
            <div style={{ marginBottom: "10px" }}>
                Total duration without pauses:{" "}
                {localSectionsArray
                    .reduce((acc, section) => acc + section.sectionDurationSeconds, 0)
                    .toFixed(2)}{" "}
                seconds
            </div>
            <div>
                Total duration with pauses:{" "}
                {localSectionsArray
                    .reduce(
                        (acc, section) =>
                            acc +
                            section.sectionDurationSeconds +
                            section.getEndOfSectionPauseDurationSeconds(),
                        0
                    )
                    .toFixed(2)}{" "}
                seconds
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
                <Button
                    onClick={(e) => {
                        e.stopPropagation();
                        setForceRenderKey(Math.random().toString());
                        setShowAudioPlayer(true);
                        setNowPlayingUrl(combinedVoiceoverUrl);
                        setAudioTitle("Final Cut");
                    }}
                    style={{
                        backgroundColor: "#eb631c",
                        borderColor: "#eb631c",
                        color: "white",
                        textDecoration: "none",
                    }}
                    disabled={!combinedVoiceoverUrl}
                >
                    <i className="bi bi-arrow-clockwise" style={{ verticalAlign: "middle" }}></i>
                    <span style={{ verticalAlign: "middle", marginLeft: "8px" }}>
                        Replay Final Cut
                    </span>
                </Button>
            </div>
        </div>
    );
};

export default InfoPad;
