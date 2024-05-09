// pages/index.js
import React from "react";
import ActionCard from "@/_pages/options/components/action-card";

const Home = () => {
  const handleLinkClick = () => {
    console.log("Get Started clicked!");
  };

  return (
    <div
      style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}
    >
      <ActionCard
        icon="bi-lightning-fill"
        title="Quick ad"
        description="Simply create your ad in seconds. Best for explorers"
        link="#"
        onLinkClick={handleLinkClick}
      />
    </div>
  );
};

export default Home;
