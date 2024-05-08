// Related path: src/pages/dashboard/utils/fetchSpots.js
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
      return {
        id: doc.id,
        spotName: data.spotName || "-",
        created: data.created ? data.created.toDate().toLocaleString() : "-",
        lastDownloaded: data.lastDownloaded
          ? data.lastDownloaded.toDate().toLocaleString()
          : "Never",
      };
    });
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
