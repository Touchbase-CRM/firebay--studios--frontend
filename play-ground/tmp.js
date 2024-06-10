import React from "react";
import FireSlider from "@/components/foundation-components/slider";
import { useState, useEffect, useRef } from "react";

const ParentComponent = () => {
  const [musicVolume, setMusicVolume] = useState(50);

  return (
    <div>
      <FireSlider
        min={0}
        max={100}
        value={musicVolume}
        onValueChange={setMusicVolume}
        thumbColor="#eb631c"
        trackColor="#f0f0f0"
        fillColor="#eb631c"
        showPercentage={false}
        disabled={false}
        width="50%"
        height="20px"
        containerStyle={{ position: "absolute", top: "700px", left: "500px" }}
      />
      <div>Selected Value: {musicVolume}</div>
    </div>
  );
};

export default ParentComponent;
