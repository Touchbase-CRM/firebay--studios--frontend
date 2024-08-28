// Related path: src/pages/home/utils/fetchSpots.js
import Swal from "sweetalert2";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export async function fetchSpots(db, userId, setSpots, setIsLoading) {
  setIsLoading(true);
  try {
    const spotsQuery = query(
      collection(db, "spots_meta_data"),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(spotsQuery);
    const fetchedSpots = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      const createdDate = data.created ? data.created.toDate() : null;
      return {
        id: doc.id,
        spotName: data.spotName || "-",
        voiceName: data.voiceName || "-",
        adLength: data.adLength || "-",
        createdRaw: createdDate,
        created: createdDate ? createdDate.toLocaleString() : "-",
        lastDownloaded: data.lastDownloaded
          ? data.lastDownloaded.toDate().toLocaleString()
          : "Never",
        downloadLogs: data.downloadLogs || [],
      };
    });

    // Sort by created date (latest to earliest)
    fetchedSpots.sort((a, b) =>
      b.createdRaw ? b.createdRaw - a.createdRaw : 0
    );

    setSpots(fetchedSpots);
  } catch (error) {
    console.error("Error fetching spots:", error);
    Swal.fire({
      title: "Error fetching spots!",
      text: error.message,
      icon: "error",
    });
  } finally {
    setIsLoading(false);
  }
}
