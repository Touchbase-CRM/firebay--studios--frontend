// Relative path: ./src/pages/options-dev/[option].js
import React from "react";
import { useRouter } from "next/router";
import ActionCard from "@/_pages/options/components/action-card";

const OptionsPage = () => {
  const router = useRouter();
  const { option } = router.query;

  const handleBackClick = () => {
    router.push("/dashboard");
  };

  const handleCardClick = (path) => {
    console.log(`${path} clicked!`);
  };

  let cards = [];
  let heading = "";

  switch (option) {
    case "mode":
      heading = "What would you like to do?";
      cards = [
        {
          icon: "bi-lightning-fill",
          title: "Quick ad",
          description: "Simply create your ad in seconds. Best for explorers",
          link: "#",
          onLinkClick: () => router.push("/options-dev/quick"),
        },
        {
          icon: "bi-lightbulb-fill",
          title: "Advanced ad",
          description:
            "Create your audio ad with more precision. Best for ad agencies and production teams.",
          link: "#",
          onLinkClick: () => handleCardClick("Advanced ad"),
        },
      ];
      break;
    case "quick":
      heading = "Create your Quick ad";
      cards = [
        {
          icon: "bi-file-text-fill",
          title: "Script to Ad",
          description:
            "Transform your script into an ad instantly with our powerful tool.",
          link: "#",
          onLinkClick: () => handleCardClick("Script to Ad"),
        },
        {
          icon: "bi-mic-fill",
          title: "Voice to Ad",
          description: "Create a voice ad quickly using our advanced tools.",
          link: "#",
          onLinkClick: () => handleCardClick("Voice to Ad"),
        },
      ];
      break;
    default:
      heading = "Page not found";
      cards = [];
      break;
  }

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
          {heading}
        </h2>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          {cards.map((card, index) => (
            <ActionCard
              key={index}
              icon={card.icon}
              title={card.title}
              description={card.description}
              link={card.link}
              onLinkClick={card.onLinkClick}
            />
          ))}
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

export default OptionsPage;
