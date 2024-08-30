import { Button, Container, Row, Col, Nav, Tab, Spinner, Dropdown } from "react-bootstrap";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import {
  deserializeAndLoadModeData,
  readFromFirestore,
} from "@/utils/db-read-write-ops/deserialization-utils";
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
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";

import {
  updateAdvancedS2AState,
  updateQuickS2AState,
  updateQuickV2AState,
} from "@/_pages/home/utils/update-state";
import SpotTable from "@/_pages/home/components/spots-table";
import { fetchSpots } from "@/_pages/home/utils/fetch-spots";
import useUserInputsStore from "@/store/user-inputs";
import styles from "@/styles/home.module.css";
import { NotificationsPad } from "@/_pages/home/components/notifications-pad";  // Import the NotificationsPad component

const Home = () => {
  const { setSpotName, reset: resetUserInputsStore } = useUserInputsStore();
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
  const [editLoading, setEditLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();
  const auth = getAuth(app);
  const currentUser = auth.currentUser;
  const db = getFirestore(app);
  const [pageSize, setPageSize] = useState(10);
  const [userName, setUserName] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const height = window.innerHeight;
      if (height >= 1300) {
        setPageSize(16);
      } else if (height >= 1100) {
        setPageSize(13);
      } else if (height >= 900) {
        setPageSize(10);
      } else if (height >= 700) {
        setPageSize(6);
      } else if (height >= 500) {
        setPageSize(3);
      } else {
        setPageSize(1);
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
          fetchSpots(db, currentUser.uid, setSpots, setIsLoading);

          const data = await readFromFirestore("uid_to_org", currentUser.uid);
          const downloads = data?.monthly_downloads;
          const unitPrice = data?.unit_price;
          setUserName([data?.first_name, data?.last_name]);
          setTotalDownloads(downloads !== undefined ? downloads : null);
          setUnitPrice(unitPrice !== undefined ? unitPrice : null);

          const q = query(
            collection(db, "notifications"),
            where("userId", "==", currentUser.uid)
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

    router.push({
      pathname: "/options/mode",
      query: { spotName: adName, option: "mode" },
    });
  };

  async function handleEditSpot(spotId) {
    setEditLoading(true);
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
    share: (spotId) => {
      setSelectedSpotId(spotId);
      console.log("Share clicked");
    },
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
        downloadLogs: [],
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
        downloadLogs: [],
      };

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
      }, 60000);
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

  const handleCreateAdClick = () => {
    setShowCreateAdModal(true);
    reset();
  };

  const handleProfileClick = () => {
    setShowDropdown(!showDropdown);
    console.log('Profile clicked');
  };

  return (
    <Tab.Container defaultActiveKey="yourAds">
      <div
        className="d-flex"
        style={{ backgroundColor: "white", minHeight: "100vh" }}
      >
        <Nav
          variant="pills"
          className="d-flex flex-column vh-100 p-3"
          style={{
            width: '250px',
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e0e0e0',
          }}
        >
          <Nav.Item className="mb-3">
            <img
              src="/White mic horizontal.png"
              alt="Firebay Studios Logo"
              style={{
                width: '150px',
                marginBottom: '0px',
                display: 'block',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            />
          </Nav.Item>

          <Nav.Item className="mb-3">
            <Button
              variant="outline-primary"
              className="mb-3 w-100"
              style={{
                backgroundColor: "#eb631c",
                border: "none",
                color: "white",
                borderRadius: "5px",
              }}
              onClick={handleCreateAdClick}
            >
              <i className="bi bi-plus-circle"></i> Create
            </Button>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              eventKey="yourAds"
              className={`d-flex align-items-center ${styles.navLink}`}
              style={{
                padding: '10px 20px',
                borderRadius: '5px',
                marginBottom: '10px',
                fontSize: '14px',
                whiteSpace: 'nowrap',
              }}
            >
              <i className="bi bi-house" style={{ marginRight: '10px' }}></i>
              Home
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              eventKey="sharedWithMe"
              className={`d-flex align-items-center ${styles.navLink}`}
              style={{
                padding: '10px 20px',
                borderRadius: '5px',
                marginBottom: '10px',
                fontSize: '14px',
                whiteSpace: 'nowrap',
              }}
            >
              <i className="bi bi-people" style={{ marginRight: '10px' }}></i>
              Shared with me
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              eventKey="notifications"
              className={`d-flex align-items-center ${styles.navLink}`}
              style={{
                padding: '10px 20px',
                borderRadius: '5px',
                marginBottom: '10px',
                fontSize: '14px',
                whiteSpace: 'nowrap',
                position: 'relative',
              }}
              onClick={() => setShowNotifications(true)}
            >
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <i className="bi bi-bell" style={{ marginRight: '10px' }}></i>
              </div>
              Notifications
              {notifications.length > 0 && (
                <span
                  className="badge text-bg-secondary"
                  style={{
                    marginLeft: '5px',
                    fontSize: '12px',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                  }}
                >
                  {notifications.length}
                </span>
              )}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              eventKey="requestFullService"
              className={`d-flex align-items-center ${styles.navLink}`}
              style={{
                padding: '10px 20px',
                borderRadius: '5px',
                marginBottom: '10px',
                fontSize: '14px',
                whiteSpace: 'nowrap',
              }}
            >
              <i className="bi bi-check-circle" style={{ marginRight: '10px' }}></i>
              Request white glove
            </Nav.Link>
          </Nav.Item>

          <Nav.Item className="mt-auto mb-3">
            <div style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '15px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <p style={{ margin: '0', fontSize: '12px', color: '#6c757d' }}>Downloads this month</p>
              <p style={{ margin: '0', fontSize: '20px', fontWeight: 'bold' }}>{totalDownloads}</p>
            </div>
          </Nav.Item>

          <Nav.Item>
            <Dropdown drop='up' show={showDropdown} onToggle={() => setShowDropdown(!showDropdown)}>
              <div
                id="dropdown-profile"
                onClick={handleProfileClick}
                style={{
                  color: '#000000',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: '#f0c6b2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '10px',
                    marginLeft: "-6px",
                    color: '#000000',
                    fontWeight: 'bold',
                  }}
                >
                  {userName[0]?.slice(0, 1).toUpperCase()}
                </div>
                <span>{userName.join(" ")}</span>
              </div>
              <Dropdown.Menu align="end" style={{ bottom: '100%' }}>
                <Dropdown.Item onClick={handleLogout} style={{
                  outline: "none",
                  backgroundColor: "#f8f9fa",
                  color: "#495057",
                  boxShadow: "none",
                }}>
                  <i className="bi bi-box-arrow-right" style={{ marginRight: '10px' }}></i>
                  Sign out
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav.Item>
        </Nav>
        <Container
          fluid
          style={{
            backgroundColor: "white",
            padding: "20px",
            overflowY: "auto",
          }}
        >
          {editLoading || isLoading ? (
            <Row className="justify-content-center">
              <Col xs={12} className="text-center">
                <div
                  className="d-flex align-items-center justify-content-center flex-column"
                  style={{ minHeight: "700px", backgroundColor: "#FFFFFF" }}
                >
                  <Spinner
                    animation="border"
                    role="status"
                    style={{
                      width: "10rem",
                      height: "10rem",
                      borderColor: "#EB621D",
                      borderRightColor: "transparent"
                    }}
                  />
                </div>
              </Col>
            </Row>
          ) : (
            <Tab.Content>
              <Tab.Pane eventKey="yourAds">
                <SpotTable
                  spots={paginatedSpots}
                  handleSpotActions={handleSpotActions}
                  currentTableIndex={currentTableIndex}
                  setCurrentTableIndex={setCurrentTableIndex}
                  pageSize={pageSize}
                  totalSpots={spots.length}
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
              </Tab.Pane>
              <Tab.Pane eventKey="sharedWithMe">
                <div>Shared With Me Component</div>
              </Tab.Pane>
              <Tab.Pane eventKey="notifications">
                <NotificationsPad
                  show={showNotifications}
                  handleClose={() => setShowNotifications(false)}
                  notifications={notifications}
                  deleteNotification={deleteNotification}
                />
              </Tab.Pane>
              <Tab.Pane eventKey="requestFullService">
                <div>Request Full Service Component</div>
              </Tab.Pane>
            </Tab.Content>
          )}
        </Container>
      </div>
    </Tab.Container>
  );

};

export default Home;