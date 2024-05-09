// pages/index.js
import React from "react";
import { useRouter } from "next/router";
import ActionCard from "@/_pages/options/components/action-card";

const Home = () => {
  const router = useRouter();

  const handleBackClick = () => {
    router.push("/dashboard");
  };

  const handleQuickAdClick = () => {
    console.log("Quick Ad clicked!");
  };

  const handleAdvancedAdClick = () => {
    console.log("Advanced Ad clicked!");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#FFFFFF",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        <h2
          style={{
            fontSize: "1.5em",
            fontWeight: "bold",
            textAlign: "left",
            marginBottom: "30px",
          }}
        >
          What would you like to do?
        </h2>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <ActionCard
            icon="bi-lightning-fill"
            title="Quick ad"
            description="Simply create your ad in seconds. Best for explorers"
            link="#"
            onLinkClick={handleQuickAdClick}
          />
          <ActionCard
            icon="bi-lightbulb-fill"
            title="Advanced ad"
            description="Create your audio ad with more precision. Best for ad agencies and production teams."
            link="#"
            onLinkClick={handleAdvancedAdClick}
          />
        </div>
        <div
          style={{
            fontSize: "1em",
            color: "#008080",
            textDecoration: "underline",
            cursor: "pointer",
            marginTop: "10px",
          }}
          onClick={handleBackClick}
        >
          Back
        </div>
      </div>
    </div>
  );
};

export default Home;
