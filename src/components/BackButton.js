import { useRouter } from "next/router";

const BackButton = ({
  width = "50px",
  height = "50px",
  backgroundColor = "#eb631c",
  iconSize = "20px", // You can pass iconSize as a prop if you want it to be adjustable
}) => {
  const router = useRouter();

  const goBack = () => {
    router.back();
  };

  return (
    <button
      onClick={goBack}
      style={{
        width: width,
        height: height,
        borderRadius: "50%",
        backgroundColor: backgroundColor,
        color: "white",
        border: "none",
        cursor: "pointer",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transition: "background-color 1s, transform 0.5s, box-shadow 0.5s",
        padding: 0, // Remove padding to ensure the icon is centered
        position: "relative", // Position relative to allow absolute positioning of the icon if necessary
      }}
    >
      <i
        className="fa fa-arrow-left"
        aria-hidden="true"
        style={{
          fontSize: iconSize,
          position: "absolute", // Absolutely position the icon to ensure it's centered
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)", // This centers the icon
        }}
      ></i>
      <style jsx>{`
        button:hover {
          background-color: rgba(255, 255, 255, 0.8);
          color: black;
          transform: translateX(-5px);
          box-shadow: 5px 0px 18px 0px rgba(105, 105, 105, 0.8);
        }
      `}</style>
    </button>
  );
};

export default BackButton;
