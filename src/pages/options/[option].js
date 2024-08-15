// Relative path: ./src/pages/options/[option].js
import ActionCard from "@/components/action-card";
import { NavBar } from "@/components/foundation-components/nav-bar";
import withAuth from "@/hocs/with-auth";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/router";
import useUserInputsStore from "@/store/user-inputs";
import React from "react";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

import { defaultState } from "@/store/shared-default-values";
import { advancedScriptToAdDefaultValues } from "@/store/features/core/advanced/script-to-ad";
import { quickVoiceToAdDefaultValues } from "@/store/features/core/quick/voice-to-ad";
import { quickScriptToAdDefaultValues } from "@/store/features/core/quick/script-to-ad";
import { createNewSpotInDb } from "@/utils/db-read-write-ops/serialization-utils";

const OptionsPage = () => {
  const auth = getAuth();
  const router = useRouter();
  const { spotName, option } = router.query;

  const {
    // shared states
    setSpotId,
    setSpotName,
    // advanced script to ad states
  } = useUserInputsStore();

  const saveQuickScriptToAd = async (spotName) => {
    defaultState.spotName = spotName;
    const tmpSpotId = await createNewSpotInDb({
      spotName: spotName, // explicitly setting it as null for clarity, optional
      mode: "quick-script-to-ad",
      modeSpecificStates: quickScriptToAdDefaultValues,
      sharedStates: defaultState,
    });
    setSpotId(tmpSpotId);
    setSpotName(spotName);
  };

  const saveQuickVoiceToAd = async (spotName) => {
    defaultState.spotName = spotName;
    const tmpSpotId = await createNewSpotInDb({
      spotName: spotName, // explicitly setting it as null for clarity, optional
      mode: "quick-voice-to-ad",
      modeSpecificStates: quickVoiceToAdDefaultValues,
      sharedStates: defaultState,
    });
    setSpotId(tmpSpotId);
    setSpotName(spotName);
  };
  const saveAdvancedScriptToAd = async (spotName) => {
    defaultState.spotName = spotName;
    const tmpSpotId = await createNewSpotInDb({
      spotName: spotName, // explicitly setting it as null for clarity, optional
      mode: "advanced-script-to-ad",
      modeSpecificStates: advancedScriptToAdDefaultValues,
      sharedStates: defaultState,
    });
    setSpotId(tmpSpotId);
    setSpotName(spotName);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    auth
      .signOut()
      .then(() => {
        router.push("/login");
      })
      .catch((error) => {
        console.error("Logout Error:", error);
      });
  };

  const handleBackClick = () => {
    if (option === "mode") {
      router.push("/home");
    } else if (option === "quick") {
      router.push("/options/mode");
    }
  };

  const handleQuickOption = () => {
    router.push({
      pathname: "/options/quick",
      query: { spotName: spotName, option: "quick" },
    });
  };

  const handleEnergyOption = () => {
    toast.info("This feature is under development and will be available soon.", {
      position: "bottom-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      icon: <i className="bi bi-info-circle-fill" style={{ color: "#ffffff" }} />,
      style: {
        backgroundColor: "#eb631c",
        color: "#ffffff",
        fontSize: "0.9em",
        fontWeight: "bold",
        textAlign: "left",
        width: "300px",
        height: "100px",
      },
      progressStyle: {
        backgroundColor: "#ffffff",
      },
    });
  };

  const handleAdvancedOption = async () => {
    await saveAdvancedScriptToAd(spotName);
    router.push("/advanced-mode/script-to-ad/create-sections");
  };

  const handleQuickScriptToAd = async () => {
    await saveQuickScriptToAd(spotName);
    router.push("/quick-mode/script-to-ad/create-ad");
  };
  const handleQuickVoiceToAd = async () => {
    await saveQuickVoiceToAd(spotName);
    router.push("/quick-mode/voice-to-ad/create-ad");
  };
  const dropdownItems = [
    {
      text: "Logout",
      handler: handleLogout,
    },
  ];

  let cards = [];
  let heading = "";

  switch (option) {
    case "mode":
      heading = "What would you like to do?";
      cards = [
        // {
        //   icon: "bi-lightning-fill",
        //   title: "Quick ad",
        //   description: "Simply create your ad in seconds. Best for explorers.",
        //   link: "#",
        //   onLinkClick: () => handleQuickOption(),
        // },
        {
          icon: "bi-lightning-fill",
          title: "Energy Mode",
          description: "Create ads based on the energy of your liking. Coming soon...",
          link: "#",
          onLinkClick: () => handleEnergyOption(),
        },
        {
          icon: "bi-lightbulb-fill",
          title: "Advanced Mode",
          description:
            "Create your audio ad with more precision. Best for ad agencies and production teams.",
          link: "#",
          onLinkClick: () => handleAdvancedOption(),
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
          link: "/quick-mode/script-to-ad/create-ad",
          onLinkClick: () => handleQuickScriptToAd(),
        },
        {
          icon: "bi-mic-fill",
          title: "Voice to Ad",
          description: "Create a voice ad quickly using our advanced tools.",
          link: "/quick-mode/voice-to-ad/create-ad",
          onLinkClick: () => handleQuickVoiceToAd(),
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
        backgroundColor: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <NavBar links={[]} dropdownItems={dropdownItems} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
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
              gap: "30px",
              marginBottom: "20px",
            }}
          >
            {cards.map((card, index) => (
              <div key={index} style={{ width: "250px", height: "300px" }}>
                <ActionCard
                  icon={card.icon}
                  title={card.title}
                  description={card.description}
                  link={card.link}
                  onLinkClick={card.onLinkClick}
                />
              </div>
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
      <ToastContainer />
    </div>
  );
};


export default withAuth(OptionsPage);
// export default OptionsPage;
