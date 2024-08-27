import { NavBar } from "@/components/foundation-components/nav-bar";


const VoiceDiscovery = () => {

    const dropdownItems = [

    ];
    return <div
        style={{
            backgroundColor: "#FFFFFF",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden", // Prevent scrolling
            alignItems: "center",
        }}
    >
        <div
            style={{
                position: "absolute",
                top: 0,
                width: "100%",
            }}
        >
            <NavBar links={[]} dropdownItems={dropdownItems} />
        </div>

    </div>
}

export default VoiceDiscovery