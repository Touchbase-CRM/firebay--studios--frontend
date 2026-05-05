import React, { useEffect, useRef, useState } from "react";
import { getAuth } from "@/firebase";
import { useRouter } from "next/router";
import axios from "axios";
import Swal from "sweetalert2";
import { usePostHog } from "posthog-js/react";
import { doc, getDoc, getFirestore, updateDoc } from "firebase/firestore";

import RenameModal from "@/components/rename-modal";
import SimpleAudioPlayer from "@/components/simple-audio-player";
import { NavBar } from "@/components/foundation-components/nav-bar";
import withAuth from "@/hocs/with-auth";
import { Stack } from "@/data-structures/stack";
import useUserInputsStore from "@/store/user-inputs";
import app from "@/firebase";
import {
  fetchAudioFromPyroBackendDistribution,
  fetchAudioFromElevenLabs,
} from "@/utils/fetch-audio/fetch-from-distribution";
import {
  updateExistingSpotInDb,
  writeToFirestore,
} from "@/utils/db-read-write-ops/serialization-utils";
import { appendToFirestoreArray } from "@/utils/db-read-write-ops/update";
import { captureCurrentTimestamp } from "@/utils/time/current-timestamp";
import { isUiPreviewMode } from "@/firebase";

import LoadingScreen from "@/_pages/advanced-mode/script-to-ad/stitch-sections/components/loading-screen";
import SectionsTable from "@/_pages/advanced-mode/script-to-ad/stitch-sections/components/sections-table";
import NavigationButtons from "@/_pages/advanced-mode/script-to-ad/stitch-sections/components/navigation-buttons";
import InfoPad from "@/_pages/advanced-mode/script-to-ad/stitch-sections/components/info-pad";

import { PageShell, PageContent } from "@/components/ui/page-shell";
import { Stepper } from "@/components/ui/stepper";
import { Card, CardHeader } from "@/components/ui/card";
import { Toolbar } from "@/components/ui/toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";

const STEPS = [
  { label: "Script" },
  { label: "Sections" },
  { label: "Stitch & export" },
];

function StitchSections() {
  const auth = getAuth();
  const router = useRouter();
  const posthog = usePostHog();

  const {
    spotName,
    setSpotName,
    sectionsArray,
    setSectionsArray,
    adLength,
    reset: resetUserInputsStore,
    generatedVoiceUrl,
    setGeneratedVoiceUrl,
    setStitchedAudioPyroHistoryItemId,
    stitchedAudioPyroHistoryItemId,
    spotId,
  } = useUserInputsStore();

  const saveFeatureSpecificStates = { sectionsArray, stitchedAudioPyroHistoryItemId };
  const saveSharedStates = { spotId, adLength, generatedVoiceUrl };

  const [localStack, setLocalStack] = useState(() => new Stack());
  const syncStackWithGlobal = useUserInputsStore((s) => s.setNavigationStack);

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newSpotName, setNewSpotName] = useState("");

  const [audioUrl, setAudioUrl] = useState("");
  const [audioTitle, setAudioTitle] = useState("");
  const [pendingAdvertisement, setPendingAdvertisement] = useState(false);
  const [combinedVoiceoverUrl, setCombinedVoiceoverUrl] = useState(null);
  const [nowPlayingUrl, setNowPlayingUrl] = useState("");
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [forceRenderKey, setForceRenderKey] = useState(0);
  const [localSectionsArray, setLocalSectionsArray] = useState(sectionsArray);
  const [showContentModal, setShowContentModal] = useState(false);
  const [contentModalText, setContentModalText] = useState("");

  const [isDownloading, setIsDownloading] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [exportFileName, setExportFileName] = useState("");

  const getPageSize = () => {
    if (typeof window === "undefined") return 6;
    const h = window.innerHeight;
    if (h < 768) return 4;
    if (h < 992) return 6;
    if (h < 1200) return 8;
    return 10;
  };
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(getPageSize());

  const stitchUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:8000"
      : "https://vgz580uujk.execute-api.us-east-2.amazonaws.com";

  const cancelTokenSourceRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setPageSize(getPageSize());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  // On mount: restore a previously stitched cut OR auto-stitch fresh.
  useEffect(() => {
    if (!combinedVoiceoverUrl && generatedVoiceUrl) {
      setCombinedVoiceoverUrl(generatedVoiceUrl);
      return;
    }
    // No prior stitch in the store — auto-fire a stitch so the user lands
    // on a ready-to-play final cut without an extra click.
    if (!combinedVoiceoverUrl && sectionsArray.every((s) => !!s.getHistoryItemId())) {
      handleStitch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (combinedVoiceoverUrl) {
      const safe = (spotName || "spot").replace(/[^a-z0-9-_]/gi, "-");
      setExportFileName(`${safe}-${captureCurrentTimestamp()}`);
    }
  }, [combinedVoiceoverUrl, spotName]);

  const handleSaveState = () => {
    updateExistingSpotInDb({
      spotId,
      mode: "advanced-script-to-ad",
      modeSpecificStates: saveFeatureSpecificStates,
      sharedStates: saveSharedStates,
    });
  };

  const handleStitch = async (e) => {
    if (e) e.preventDefault();

    // Pre-flight: every section must have a generated take before stitching.
    const ungenerated = sectionsArray
      .map((s, i) => (!s.getHistoryItemId() ? i + 1 : null))
      .filter(Boolean);
    if (!isUiPreviewMode && ungenerated.length > 0) {
      Swal.fire({
        icon: "info",
        title: "Generate every section first",
        text: `Section${ungenerated.length > 1 ? "s" : ""} ${ungenerated.join(", ")} ${ungenerated.length > 1 ? "haven't" : "hasn't"} been generated yet. Go back and generate ${ungenerated.length > 1 ? "them" : "it"} before creating the final cut.`,
      });
      return;
    }

    if (isUiPreviewMode) {
      // Simulate a successful stitch so the export panel renders.
      setPendingAdvertisement(true);
      setTimeout(() => {
        const fakeUrl = "https://www.soundjay.com/buttons/sounds/button-3.mp3";
        setShowAudioPlayer(true);
        setCombinedVoiceoverUrl(fakeUrl);
        setNowPlayingUrl(fakeUrl);
        setAudioTitle("Final cut");
        setForceRenderKey(Math.random().toString());
        setPendingAdvertisement(false);
      }, 600);
      return;
    }
    setPendingAdvertisement(true);

    const userId = auth.currentUser ? auth.currentUser.uid : "anonymous";
    if (process.env.NODE_ENV !== "development") {
      posthog.capture("stitch-sections-finalize-voiceover-button-clicked", {
        userId,
        userEmail: auth.currentUser ? auth.currentUser.email : "anonymous",
        script: sectionsArray.map((s) => s.getCurrentContent()).join(". "),
      });
    }
    cancelTokenSourceRef.current = axios.CancelToken.source();

    const historyItemIds = sectionsArray.map((s) => s.getHistoryItemId());
    const endOfSectionsPausesArray = localSectionsArray.map((s) =>
      s.getEndOfSectionPauseDurationSeconds()
    );
    const payload = {
      user_id: userId,
      history_item_id_list: historyItemIds,
      end_of_section_pause_duration_list: endOfSectionsPausesArray,
    };

    try {
      const response = await axios.post(`${stitchUrl}/stitch-sections`, payload, {
        cancelToken: cancelTokenSourceRef.current.token,
      });
      if (response.data.pyro_history_item_id) {
        const pyroHistoryItemId = response.data.pyro_history_item_id;
        const url = await fetchAudioFromPyroBackendDistribution(pyroHistoryItemId, 0);
        setShowAudioPlayer(true);
        setCombinedVoiceoverUrl(url);
        setNowPlayingUrl(url);
        setAudioTitle("Final cut");
        setForceRenderKey(Math.random().toString());
        setStitchedAudioPyroHistoryItemId(pyroHistoryItemId);
        setGeneratedVoiceUrl(url);
      } else {
        const detail =
          response.data?.error ||
          response.data?.details ||
          "The server didn't return an audio id.";
        console.error("Stitch API error:", detail, response.data || "");
        Swal.fire({
          icon: "error",
          title: "Couldn't generate the final cut",
          text: detail,
        });
      }
    } catch (error) {
      console.error("Error fetching pyro_history_item_id:", error);
      if (!axios.isCancel(error)) {
        Swal.fire({
          icon: "error",
          title: "Couldn't generate the final cut",
          text:
            error?.response?.data?.error ||
            error?.message ||
            "Something went wrong on the server. Try again in a moment.",
        });
      }
    } finally {
      setPendingAdvertisement(false);
    }
    setSectionsArray(localSectionsArray);
    try {
      await writeToFirestore(
        "spots_meta_data",
        { historyItemId: stitchedAudioPyroHistoryItemId },
        spotId
      );
    } catch (error) {
      console.error("Error saving stitched history id:", error);
    }
  };

  const cancelLoading = () => {
    setPendingAdvertisement(false);
    if (cancelTokenSourceRef.current) {
      cancelTokenSourceRef.current.cancel("Cancelled by user.");
    }
    Swal.fire({
      icon: "info",
      title: "Cancelled",
      text: "Returning to home.",
      confirmButtonText: "OK",
      allowOutsideClick: false,
    }).then((r) => {
      if (r.isConfirmed) {
        resetUserInputsStore();
        router.push("/home");
      }
    });
  };

  const cancelAndRetryLoading = () => {
    if (cancelTokenSourceRef.current) {
      cancelTokenSourceRef.current.cancel("Cancelled by user for retry.");
    }
    Swal.fire({
      icon: "info",
      title: "Cancelled",
      text: "Submit again whenever you're ready.",
      confirmButtonText: "OK",
      allowOutsideClick: false,
    });
  };

  const handleLogout = () => {
    resetUserInputsStore();
    localStorage.removeItem("user");
    auth
      .signOut()
      .then(() => router.push("/login"))
      .catch((error) => console.error("Logout Error:", error));
  };

  const handleSectionPreviewPlay = async (section) => {
    const historyItemId = section.getHistoryItemId();
    if (!historyItemId) return;
    setAudioTitle(`Section ${section.getIndex() + 1}`);
    try {
      const url =
        historyItemId.substring(0, 4) === "pyro"
          ? await fetchAudioFromPyroBackendDistribution(historyItemId, 0)
          : await fetchAudioFromElevenLabs(historyItemId);
      if (!url) throw new Error("Audio URL came back empty");
      setShowAudioPlayer(true);
      setAudioUrl(url);
      setNowPlayingUrl(url);
      setForceRenderKey(Math.random().toString());
    } catch (error) {
      console.error("Failed to fetch section audio:", error);
      Swal.fire({
        icon: "error",
        title: "Couldn't play that section",
        text:
          error?.message ||
          "We couldn't load the audio for this section. Try regenerating it.",
      });
    }
  };

  const localPushData = (newData) => {
    localStack.push(newData);
    setLocalStack(localStack);
  };

  const syncLocalStackWithGlobal = () => syncStackWithGlobal(localStack);

  const handleEditSection = (section) => {
    if (generatedVoiceUrl) {
      URL.revokeObjectURL(generatedVoiceUrl);
      setGeneratedVoiceUrl("");
    }
    localPushData("/advanced-mode/script-to-ad/stitch-sections");
    syncLocalStackWithGlobal();
    handleSaveState();
    router.push(
      "/advanced-mode/script-to-ad/process-section/[idx]",
      `/advanced-mode/script-to-ad/process-section/${section.getIndex()}`
    );
  };

  const handleContentClick = (content) => {
    setContentModalText(content);
    setShowContentModal(true);
  };

  const handleStepClick = (idx) => {
    if (idx === 0) router.push("/advanced-mode/script-to-ad/create-sections");
    else if (idx === 1)
      router.push("/advanced-mode/script-to-ad/process-section/0");
  };

  const handleDownload = async () => {
    if (!combinedVoiceoverUrl) return;
    setIsDownloading(true);
    const userId = auth.currentUser?.uid;
    const userEmail = auth.currentUser?.email;

    if (process.env.NODE_ENV !== "development") {
      posthog.capture("stitch-sections-download-clicked", {
        date: new Date().toISOString(),
        userId,
        userEmail,
      });
    }

    if (userId) {
      try {
        const firestore = getFirestore(app);
        const docRef = doc(firestore, "uid_to_org", userId);
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().monthly_downloads !== undefined) {
          await updateDoc(docRef, { monthly_downloads: snap.data().monthly_downloads + 1 });
        }
      } catch (error) {
        console.error("Failed to increment monthly_downloads:", error);
      }
    }

    const link = document.createElement("a");
    link.href = combinedVoiceoverUrl;
    link.download = `${exportFileName || "spot"}.mp3`;

    try {
      await appendToFirestoreArray({
        collectionName: "spots_meta_data",
        docId: spotId,
        fieldName: "downloadLogs",
        newValue: {
          downloadFileName: `${exportFileName || "spot"}.mp3`,
          downloadTime: captureCurrentTimestamp(),
        },
      });
    } catch (error) {
      console.error("Failed to append download log:", error);
    }

    link.click();
    setIsDownloading(false);
    setHasDownloaded(true);
  };

  const handleNewSpot = () => {
    resetUserInputsStore();
    router.push("/home");
  };

  if (pendingAdvertisement) {
    return <LoadingScreen cancelLoading={cancelLoading} cancelAndRetryLoading={cancelAndRetryLoading} />;
  }

  const indexOfLastSection = currentPage * pageSize;
  const indexOfFirstSection = indexOfLastSection - pageSize;
  const currentSections = localSectionsArray.slice(indexOfFirstSection, indexOfLastSection);
  const totalPages = Math.ceil(localSectionsArray.length / pageSize);

  const stitched = !!combinedVoiceoverUrl;

  return (
    <PageShell>
      <NavBar links={[]} logoutHandler={handleLogout} />
      <Stepper steps={STEPS} current={2} onStepClick={handleStepClick} />

      <PageContent style={{ paddingBottom: showAudioPlayer ? 120 : undefined }}>
        <Toolbar
          title={
            <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}>
              {spotName || "Untitled spot"}
              <button
                type="button"
                onClick={() => setShowRenameModal(true)}
                aria-label="Rename"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <i className="bi bi-pencil" style={{ fontSize: 14 }} />
              </button>
            </span>
          }
          description="Review section pauses, then stitch and export."
          style={{ padding: "var(--space-2) 0 var(--space-5)" }}
        />

        <Card padding="0">
          <div style={{ padding: "var(--space-5) var(--space-5) 0" }}>
            <CardHeader
              title="Sections"
              description="Adjust the pause after each section. Total duration must fit within the ad length."
            />
          </div>
          <div style={{ padding: "0 var(--space-5)" }}>
            <SectionsTable
              currentSections={currentSections}
              indexOfFirstSection={indexOfFirstSection}
              handleContentClick={handleContentClick}
              localSectionsArray={localSectionsArray}
              handleSectionPreviewPlay={handleSectionPreviewPlay}
              handleEditSection={handleEditSection}
            />
          </div>
          <div style={{ padding: "0 var(--space-5) var(--space-5)" }}>
            <NavigationButtons
              handlePreviousPage={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              handleNextPage={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              currentPage={currentPage}
              totalPages={totalPages}
            />
            <InfoPad
              localSectionsArray={localSectionsArray}
              adLength={adLength}
              combinedVoiceoverUrl={combinedVoiceoverUrl}
              setForceRenderKey={setForceRenderKey}
              setShowAudioPlayer={setShowAudioPlayer}
              setNowPlayingUrl={setNowPlayingUrl}
              setAudioTitle={setAudioTitle}
            />
          </div>
        </Card>

        {/* Stitch / Export panel */}
        {!stitched ? (
          <div
            style={{
              marginTop: "var(--space-6)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "var(--space-3)",
              flexWrap: "wrap",
            }}
          >
            <Button variant="secondary" onClick={handleSaveState} feedback="Saved">
              Save
            </Button>
            <Button onClick={handleStitch} rightIcon={<i className="bi bi-arrow-right" />}>
              Generate final cut
            </Button>
          </div>
        ) : (
          <Card padding="var(--space-6)" style={{ marginTop: "var(--space-6)" }}>
            <CardHeader
              title="Export your spot"
              description="Stitch complete. Play it from the bar below, then download or start a new one."
              actions={<Badge tone="success">Stitched</Badge>}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <Input
                label="File name"
                value={exportFileName}
                onChange={(e) => setExportFileName(e.target.value)}
                rightAdornment={<span style={{ fontSize: "var(--text-xs)" }}>.mp3</span>}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
                <Button variant="secondary" onClick={() => router.push("/home")}>
                  Back to spots
                </Button>
                <Button onClick={handleDownload} loading={isDownloading} leftIcon={<i className="bi bi-download" />}>
                  Download
                </Button>
              </div>
              {hasDownloaded && (
                <div
                  style={{
                    marginTop: "var(--space-2)",
                    padding: "var(--space-4)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--surface-inset)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--space-3)",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: "var(--font-weight-semibold)",
                        color: "var(--text-primary)",
                      }}
                    >
                      Downloaded. What's next?
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                      Make another spot, or head back to the list.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <Button variant="secondary" onClick={() => router.push("/home")}>
                      Go to home
                    </Button>
                    <Button onClick={handleNewSpot} leftIcon={<i className="bi bi-plus-lg" />}>
                      Create another spot
                    </Button>
                  </div>
                </div>
              )}
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                Each download counts toward this month's billing.
              </div>
            </div>
          </Card>
        )}
      </PageContent>

      {showAudioPlayer && (
        <SimpleAudioPlayer
          audioSrc={nowPlayingUrl}
          audioTitle={audioTitle}
          forceRender={forceRenderKey}
          autoplay
          allowDownload={!!combinedVoiceoverUrl}
          setShowAudioPlayer={setShowAudioPlayer}
        />
      )}

      <RenameModal
        show={showRenameModal}
        onHide={() => setShowRenameModal(false)}
        newSpotName={newSpotName}
        setNewSpotName={setNewSpotName}
        spotId={spotId}
        setSpotName={setSpotName}
      />

      <Modal
        show={showContentModal}
        onHide={() => setShowContentModal(false)}
        title="Section content"
        primaryAction={{ label: "Close", variant: "secondary", onClick: () => setShowContentModal(false) }}
      >
        <div style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
          {contentModalText}
        </div>
      </Modal>
    </PageShell>
  );
}

export default withAuth(StitchSections);
