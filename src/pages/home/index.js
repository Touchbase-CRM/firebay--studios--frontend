// Related path: src/pages/home/index.js
import { Button, Container, Row, Col, Card } from "react-bootstrap";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import {
  deserializeAndLoadModeData,
  readFromFirestore,
} from "@/utils/db-read-write-ops/deserialization-utils";
import { NavBar } from "@/components/foundation-components/nav-bar";
import withAuth from "@/hocs/with-auth";

import { getAuth } from "firebase/auth";
import app from "@/firebase";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import {
  updateAdvancedS2AState,
  updateQuickS2AState,
  updateQuickV2AState,
} from "@/_pages/home/utils/update-state";
import SpotTable from "@/_pages/home/components/spots-table";
import ManageSpotTableActions from "@/_pages/home/components/manage-spots-table-actions";
import { fetchSpots } from "@/_pages/home/utils/fetch-spots";
import useUserInputsStore from "@/store/user-inputs";
import Spinner from "@/components/spinner/spinner"; // Import the custom spinner

const Home = () => {
  const { setSpotName } = useUserInputsStore();
  const reset = useUserInputsStore((state) => state.reset);

  const [isLoading, setIsLoading] = useState(false);
  const [showCreateAdModal, setShowCreateAdModal] = useState(false);
  const [spots, setSpots] = useState([]);
  const [adName, setAdName] = useState("");
  const [currentTableIndex, setCurrentTableIndex] = useState(0);
  const [paginatedSpots, setPaginatedSpots] = useState([]);
  const [totalDownloads, setTotalDownloads] = useState(null);
  const [unitPrice, setUnitPrice] = useState(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newSpotName, setNewSpotName] = useState("");
  const [selectedSpotId, setSelectedSpotId] = useState("");
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [newCopySpotName, setNewCopySpotName] = useState("");
  const [copySpotId, setCopySpotId] = useState("");
  const [showDownloadLogsModal, setShowDownloadLogsModal] = useState(false);
  const [downloadLogs, setDownloadLogs] = useState([]);
  const [editLoading, setEditLoading] = useState(false); // New state for edit button loading

  const router = useRouter();
  const auth = getAuth(app);
  const currentUser = auth.currentUser;
  const db = getFirestore(app);
  const pageSize = 15;

  useEffect(() => {
    setPaginatedSpots(
      spots.slice(currentTableIndex, currentTableIndex + pageSize)
    );
  }, [spots, currentTableIndex]);

  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        const data = await readFromFirestore("uid_to_org", currentUser.uid);

        const downloads = data?.monthly_downloads;
        const unitPrice = data?.unit_price;
        setTotalDownloads(downloads !== undefined ? downloads : null);
        setUnitPrice(unitPrice !== undefined ? unitPrice : null);
      } catch (error) {
        setTotalDownloads(null);
        setUnitPrice(null);
        console.error("Error fetching downloads:", error);
      }
    };

    if (currentUser) {
      fetchSpots(db, currentUser.uid, setSpots, setIsLoading);
      fetchDownloads();
    }
  }, [currentUser]);

  const checkSpotNameExists = async (spotName) => {
    const spotsQuery = query(
      collection(db, "spots_meta_data"),
      where("spotName", "==", spotName),
      where("userId", "==", currentUser.uid)
    );
    const querySnapshot = await getDocs(spotsQuery);
    return !querySnapshot.empty;
  };

  const handleCloseModal = () => {
    setShowCreateAdModal(false);
    setAdName("");
  };

  const handleNextOnCreateAd = async () => {
    if (!adName.trim()) {
      Swal.fire({
        title: "Error!",
        text: "Please enter a name for the Spot.",
        icon: "error",
      });
      return;
    }

    const exists = await checkSpotNameExists(adName);
    if (exists) {
      Swal.fire({
        title: "Duplicate Name",
        text: "This spot name already exists. Please choose a different name.",
        icon: "error",
      });
      return;
    }

    router.push({
      pathname: "/options/mode",
      query: { spotName: adName, option: "mode" },
    });
  };

  async function handleEditSpot(spotId) {
    setEditLoading(true); // Show loading spinner
    try {
      const mode = await readFromFirestore("spots_meta_data", spotId, "mode");
      switch (mode) {
        case "advanced-script-to-ad":
          await manageAdvancedEditSpot(spotId);
          break;
        case "quick-script-to-ad":
          await manageQuickScriptToAdSpot(spotId);
          break;
        case "quick-voice-to-ad":
          await manageQuickVoiceToAdSpot(spotId);
          break;
        default:
          throw new Error(`Unsupported mode: ${mode}`);
      }
    } catch (error) {
      console.error("Error handling the spot mode:", error);
    }
  }

  async function manageAdvancedEditSpot(spotId) {
    const data = await deserializeAndLoadModeData({ spotId });
    setSpotName(data.sharedStates.spotName);
    await updateAdvancedS2AState(data);
    if (data.featureSpecificStates.sectionsArray.length === 0) {
      router.push("/advanced-mode/script-to-ad/create-sections");
    } else {
      router.push("/advanced-mode/script-to-ad/process-section/0");
    }
  }

  async function manageQuickScriptToAdSpot(spotId) {
    const data = await deserializeAndLoadModeData({ spotId });
    setSpotName(data.sharedStates.spotName);
    await updateQuickS2AState(data);
    router.push("/quick-mode/script-to-ad/create-ad");
  }

  async function manageQuickVoiceToAdSpot(spotId) {
    const data = await deserializeAndLoadModeData({ spotId });
    setSpotName(data.sharedStates.spotName);
    await updateQuickV2AState(data);
    router.push("/quick-mode/voice-to-ad/create-ad");
  }

  function findDownloadLogs(spotId) {
    const spot = spots.find((spot) => spot.id === spotId);
    const logs = spot ? spot.downloadLogs : [];
    setDownloadLogs(logs);
  }

  const handleSpotActions = {
    downloadHistory: (spotId) => {
      findDownloadLogs(spotId);
      setShowDownloadLogsModal(true);
    },
    copy: (spotId) => {
      setCopySpotId(spotId);
      setShowCopyModal(true);
    },
    rename: (spotId) => {
      setSelectedSpotId(spotId);
      setShowRenameModal(true);
    },
    edit: handleEditSpot,
    delete: async (spotId) => {
      try {
        const confirmation = await Swal.fire({
          title: "Are you sure?",
          text: "You won't be able to revert this!",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Yes, delete it!",
        });

        if (confirmation.isConfirmed) {
          const spotRef = doc(db, "spots", spotId);
          const spotMetaRef = doc(db, "spots_meta_data", spotId);
          const adsRef = doc(db, "ads", spotId);

          await deleteDoc(spotRef);
          await deleteDoc(spotMetaRef);
          await deleteDoc(adsRef);

          const updatedSpots = spots.filter((spot) => spot.id !== spotId);
          setSpots(updatedSpots);
        }
      } catch (error) {
        console.error("Failed to delete spot and associated data:", error);
        Swal.fire({
          title: "Deletion Failed",
          text: error.message,
          icon: "error",
        });
      }
    },
  };

  const handleSaveCopy = async (spotId) => {
    if (!newCopySpotName.trim()) {
      Swal.fire("Error", "Please enter a valid name for the copy.", "error");
      return;
    }

    if (!spotId) {
      console.error("Copy operation failed: No spot ID provided.");
      Swal.fire(
        "Error",
        "No spot ID provided for the copy operation.",
        "error"
      );
      return;
    }

    try {
      const spotRef = doc(db, "spots_meta_data", spotId);
      const adRef = doc(db, "ads", spotId);

      const spotSnap = await getDoc(spotRef);
      const adSnap = await getDoc(adRef);

      if (!spotSnap.exists() || !adSnap.exists()) {
        Swal.fire("Error", "Original spot data not found.", "error");
        return;
      }

      const now = new Date();
      const newSpotMetaRef = doc(collection(db, "spots_meta_data"));
      await setDoc(newSpotMetaRef, {
        ...spotSnap.data(),
        spotName: newCopySpotName,
        created: now,
        downloadLogs: [], // Set downloadLogs to an empty array
      });

      const newAdRef = doc(db, "ads", newSpotMetaRef.id);
      await setDoc(newAdRef, {
        ...adSnap.data(),
        sharedStates: {
          ...adSnap.data().sharedStates,
          spotId: newSpotMetaRef.id,
          spotName: newCopySpotName,
        },
      });

      const newSpot = {
        id: newSpotMetaRef.id,
        spotName: newCopySpotName,
        created: now.toLocaleString(),
        createdRaw: now,
        downloadLogs: [], // Initialize downloadLogs as an empty array
      };

      // Ensure all spots have `createdRaw` and sort by created date
      const updatedSpots = [
        ...spots.map((spot) => ({
          ...spot,
          createdRaw: new Date(spot.createdRaw || spot.created),
        })),
        newSpot,
      ].sort((a, b) => (b.createdRaw ? b.createdRaw - a.createdRaw : 0));

      setSpots(updatedSpots);

      setPaginatedSpots(
        updatedSpots.slice(currentTableIndex, currentTableIndex + pageSize)
      );
      setShowCopyModal(false);
      Swal.fire("Success", "Spot copied successfully!", "success");
    } catch (error) {
      console.error("Copy failed:", error);
      Swal.fire("Failed to copy spot", error.message, "error");
    }
  };

  const updateSpotName = async () => {
    if (!newSpotName.trim()) {
      Swal.fire({
        title: "Error!",
        text: "Please enter a valid name for the spot.",
        icon: "error",
      });
      return;
    }

    if (
      newSpotName === spots.find((spot) => spot.id === selectedSpotId)?.spotName
    ) {
      setShowRenameModal(false);
      return;
    }

    const exists = await checkSpotNameExists(newSpotName);
    if (exists) {
      Swal.fire({
        title: "Duplicate Name",
        text: "This spot name already exists. Please choose a different name.",
        icon: "error",
      });
      return;
    }

    try {
      const spotRef = doc(db, "spots_meta_data", selectedSpotId);
      const adRef = doc(db, "ads", selectedSpotId);

      await updateDoc(spotRef, { spotName: newSpotName });
      await updateDoc(adRef, { "sharedStates.spotName": newSpotName });
      const updatedSpots = spots.map((spot) =>
        spot.id === selectedSpotId ? { ...spot, spotName: newSpotName } : spot
      );
      setSpots(updatedSpots);
      setShowRenameModal(false);
    } catch (error) {
      console.error("Failed to update spot name:", error);
      Swal.fire({
        title: "Update Failed",
        text: error.message,
        icon: "error",
      });
    }
  };

  const cancelLoading = () => {
    setIsLoading(false);
    setEditLoading(false); // Hide the loading spinner
  };

  const dropdownItems = [
    {
      text: "Logout",
      handler: () => {
        localStorage.removeItem("user");
        auth
          .signOut()
          .then(() => {
            router.push("/login");
          })
          .catch((error) => {
            console.error("Logout Error:", error);
          });
      },
    },
  ];

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <NavBar links={[]} dropdownItems={dropdownItems} />
      <Container
        fluid
        style={{
          backgroundColor: "white",
          padding: "20px",
          minHeight: "100vh",
        }}
      >
        {isLoading || editLoading ? ( // Show loading spinner if either loading state is true
          <Row className="justify-content-center">
            <Col xs={12} className="text-center">
              <div
                className="d-flex align-items-center justify-content-center flex-column"
                style={{ height: "100vh", backgroundColor: "#FFFFFF" }}
              >
                <Spinner
                  animation="border"
                  variant="primary"
                  style={{ marginBottom: "200px" }}
                />

                <Card
                  className="p-4"
                  style={{
                    marginTop: "100px",
                    borderRadius: "1rem",
                    border: "2px solid #eb631c",
                    color: "black",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  <p
                    className="ml-3 mb-0"
                    style={{
                      fontWeight: "bold",
                      fontSize: "24px",
                      color: "black",
                      textShadow: "2px 2px 2px rgba(0,0,0,0.2)",
                      fontFamily: "'Cinzel', serif",
                    }}
                  >
                    Loading Data...
                  </p>
                </Card>
                <div className="mt-3">
                  <Button
                    variant="danger"
                    onClick={cancelLoading}
                    style={{ width: "150px" }} // Setting a fixed width
                    title="Stop the current operation and start from the beginning."
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        ) : (
          <>
            <Row
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: "1rem",
              }}
            >
              <Col xs={12}>
                <Button
                  variant="warning"
                  style={{
                    backgroundColor: "#eb631c",
                    borderColor: "#eb631c",
                    color: "white",
                  }}
                  onClick={() => {
                    setShowCreateAdModal(true);
                    reset();
                  }}
                >
                  Create a new Spot
                </Button>
              </Col>
            </Row>
            <SpotTable
              spots={paginatedSpots}
              handleSpotActions={handleSpotActions}
              currentTableIndex={currentTableIndex}
              setCurrentTableIndex={setCurrentTableIndex}
              pageSize={pageSize}
              totalSpots={spots.length}
              totalDownloads={totalDownloads}
            />
            <ManageSpotTableActions
              showCopyModal={showCopyModal}
              showRenameModal={showRenameModal}
              newSpotName={newSpotName}
              setNewSpotName={setNewSpotName}
              showCreateAdModal={showCreateAdModal}
              adName={adName}
              setAdName={setAdName}
              setShowCreateAdModal={setShowCreateAdModal}
              handleNextOnCreateAd={handleNextOnCreateAd}
              setShowCopyModal={setShowCopyModal}
              newCopySpotName={newCopySpotName}
              setNewCopySpotName={setNewCopySpotName}
              handleCloseModal={handleCloseModal}
              updateSpotName={updateSpotName}
              handleSaveCopy={() => handleSaveCopy(copySpotId)}
              setShowRenameModal={setShowRenameModal}
              showDownloadLogsModal={showDownloadLogsModal}
              setShowDownloadLogsModal={setShowDownloadLogsModal}
              downloadLogs={downloadLogs}
              unitPrice={unitPrice}
            />
          </>
        )}
      </Container>
    </div>
  );
};

// export default withAuth(Home);
export default Home;
