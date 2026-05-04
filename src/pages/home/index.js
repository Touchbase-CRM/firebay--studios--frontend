import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import {
  deserializeAndLoadModeData,
  readFromFirestore,
} from "@/utils/db-read-write-ops/deserialization-utils";
import { NavBar } from "@/components/foundation-components/nav-bar";
import withAuth from "@/hocs/with-auth";

import { getAuth } from "@/firebase";
import app from "@/firebase";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

import { updateAdvancedS2AState } from "@/_pages/home/utils/update-state";
import { createNewSpotInDb } from "@/utils/db-read-write-ops/serialization-utils";
import SpotTable from "@/_pages/home/components/spots-table";
import ManageSpotTableActions from "@/_pages/home/components/manage-spots-table-actions";
import { fetchSpots } from "@/_pages/home/utils/fetch-spots";
import useUserInputsStore from "@/store/user-inputs";
import { PageShell, PageContent } from "@/components/ui/page-shell";
import { Toolbar } from "@/components/ui/toolbar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const Home = () => {
  const { setSpotName, setSpotId, setAdGenerationMethod, reset: resetUserInputsStore } = useUserInputsStore();
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
  const [notifications, setNotifications] = useState([]); // State for notifications

  const router = useRouter();
  const auth = getAuth(app);
  const currentUser = auth.currentUser;
  const db = getFirestore(app);
  const [pageSize, setPageSize] = useState(10); // Updated state for pageSize

  useEffect(() => {
    const handleResize = () => {
      const height = window.innerHeight;
      if (height >= 1300) {
        setPageSize(16); // xxl
      } else if (height >= 1100) {
        setPageSize(13); // xl
      } else if (height >= 900) {
        setPageSize(10); // lg
      } else if (height >= 700) {
        setPageSize(6); // md
      } else if (height >= 500) {
        setPageSize(3); // sm
      } else {
        setPageSize(1); // xs
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    setPaginatedSpots(
      spots.slice(currentTableIndex, currentTableIndex + pageSize)
    );
  }, [spots, currentTableIndex, pageSize]);

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        try {
          // Fetch spots
          fetchSpots(db, currentUser.uid, setSpots, setIsLoading);

          // Fetch downloads and unit price
          const data = await readFromFirestore("uid_to_org", currentUser.uid);
          const downloads = data?.monthly_downloads;
          const unitPrice = data?.unit_price;
          setTotalDownloads(downloads !== undefined ? downloads : null);
          setUnitPrice(unitPrice !== undefined ? unitPrice : null);

          // Fetch notifications
          const q = query(
            collection(db, "notifications"),
            where("userId", "==", currentUser.uid),
            // where("read", "==", false)
          );
          const querySnapshot = await getDocs(q);
          const notificationsData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setNotifications(notificationsData);
        } catch (error) {
          console.error("Error fetching data:", error);
          setTotalDownloads(null);
          setUnitPrice(null);
        }
      }
    };

    fetchData();
  }, [currentUser, db]);

  const deleteNotification = async (id) => {
    try {
      await deleteDoc(doc(db, "notifications", id));
      setNotifications((prevNotifications) =>
        prevNotifications.filter((notification) => notification.id !== id)
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

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

    try {
      const sharedStates = {
        ...useUserInputsStore.getState(),
        spotName: adName,
        adGenerationMethod: "advanced-script-to-ad",
      };
      delete sharedStates.reset;
      const newSpotId = await createNewSpotInDb({
        spotName: adName,
        mode: "advanced-script-to-ad",
        modeSpecificStates: {
          s2aAdvancedFreeStyleStatus: true,
          sectionsArray: [],
          sectionHistoryArray: [],
          stitchedAudioPyroHistoryItemId: "",
          numSectionsIdentified: 0,
        },
        sharedStates: {
          ogScriptWordsArray: [],
          originalScriptString: "",
          transformedWords: {},
          voiceId: sharedStates.voiceId,
          voiceName: sharedStates.voiceName,
          voicePreviewFilename: sharedStates.voicePreviewFilename,
          adLength: sharedStates.adLength,
          generatedVoiceUrl: "",
          modelId: sharedStates.modelId,
          adGenerationMethod: "advanced-script-to-ad",
          spotId: "",
          spotName: adName,
        },
      });
      setSpotId(newSpotId);
      setSpotName(adName);
      setAdGenerationMethod("advanced-script-to-ad");
      router.push("/advanced-mode/script-to-ad/create-sections");
    } catch (error) {
      console.error("Failed to create new spot:", error);
      Swal.fire({ title: "Error", text: "Failed to create the spot. Please try again.", icon: "error" });
    }
  };

  async function handleEditSpot(spotId) {
    setEditLoading(true);
    try {
      await manageAdvancedEditSpot(spotId);
    } catch (error) {
      console.error("Error handling the spot mode:", error);
    }
  }

  async function manageAdvancedEditSpot(spotId) {
    const data = await deserializeAndLoadModeData({ spotId });
    setSpotName(data.sharedStates.spotName);
    await updateAdvancedS2AState(data);
    if ((data.featureSpecificStates?.sectionsArray ?? []).length === 0) {
      router.push("/advanced-mode/script-to-ad/create-sections");
    } else {
      router.push("/advanced-mode/script-to-ad/process-section/0");
    }
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
    router.push("/home");
  };

  useEffect(() => {
    let timeout;
    if (isLoading || editLoading) {
      timeout = setTimeout(() => {
        setIsLoading(false);
        setEditLoading(false);
        Swal.fire({
          title: "Error",
          text: "Failed to load data, please try again.",
          icon: "error",
        });
      }, 60000); // 60 seconds
    }
    return () => clearTimeout(timeout);
  }, [isLoading, editLoading]);

  const handleLogout = () => {
    resetUserInputsStore();
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

  const openCreateModal = () => {
    reset();
    setAdName("");
    setShowCreateAdModal(true);
  };

  return (
    <PageShell>
      <NavBar links={[]} logoutHandler={handleLogout} showLogout />
      <PageContent>
        {isLoading || editLoading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "var(--space-12) 0",
              gap: "var(--space-4)",
            }}
          >
            <Spinner size="lg" />
            <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
              Loading your spots…
            </div>
          </div>
        ) : (
          <>
            <Toolbar
              title="Spots"
              description="Pick up where you left off, or start something new."
              actions={
                <Button onClick={openCreateModal} leftIcon={<i className="bi bi-plus-lg" />}>
                  New spot
                </Button>
              }
              style={{ padding: "var(--space-2) 0 var(--space-6)" }}
            />
            <SpotTable
              spots={paginatedSpots}
              handleSpotActions={handleSpotActions}
              currentTableIndex={currentTableIndex}
              setCurrentTableIndex={setCurrentTableIndex}
              pageSize={pageSize}
              totalSpots={spots.length}
              totalDownloads={totalDownloads}
              onCreate={openCreateModal}
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
      </PageContent>
    </PageShell>
  );
};

export default withAuth(Home);
