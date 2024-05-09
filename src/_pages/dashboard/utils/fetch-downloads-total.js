import { getFirestore, doc, getDoc } from "firebase/firestore";
import Swal from "sweetalert2";

export async function fetchDownloadsTotal(db, userId) {
  try {
    const userDocRef = doc(db, "uid_to_org", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.monthly_downloads || null;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching download totals:", error);
    Swal.fire({
      title: "Error fetching download totals!",
      text: error.message,
      icon: "error",
    });
    return null;
  }
}
