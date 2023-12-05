import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getAuth, onAuthStateChanged, reload } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import Image from "next/image";
import { getSubscriptionStatus } from "../stripe_proxy_sdk";
import app from "../firebase";

const auth = getAuth();

const VerificationPage = () => {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Check the user's verification status
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // Check if the user's email is verified
        setIsVerified(user.emailVerified);
      } else {
        // No user is signed in, redirect to signup
        router.push("/signup");
      }
    });
  }, [router]);

  const handleContinue = async () => {
    try {
      // Make sure that the app instance is defined and has the necessary properties
      if (!app || !app.container) {
        throw new Error("Firebase app is not correctly initialized.");
      }

      const auth = getAuth(app);
      const db = getFirestore(app);
      const user = auth.currentUser;

      if (!user) {
        router.push("/signup");
        return;
      }

      await reload(user);

      const isSubscribed = await getSubscriptionStatus(app); // Assuming the function is named this

      if (!isSubscribed) {
        throw new Error("You must be subscribed to continue.");
      }

      if (user.emailVerified) {
        setIsVerified(true);
        router.push("/create_ad");
      } else {
        Swal.fire({
          icon: "info",
          title: "Email Verification",
          text: "Please verify your email before continuing.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
    }
  };

  return (
    <Container
      fluid
      className="vh-100 d-flex justify-content-center align-items-center"
      style={{ backgroundColor: "#343a40" }}
    >
      <Row className="w-100">
        <Col md={6} className="mx-auto">
          <Card
            className="my-5 mx-1 p-4"
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: "1rem",
              color: "white",
            }}
          >
            <Image
              src="/fire.png"
              alt="Firebay Studios"
              width={100}
              height={100}
              className="d-block mx-auto mb-3"
            />
            <h2 className="text-center mb-4">Email Verification</h2>
            <p className="text-center mb-5">
              Thank you for your payment! Please verify your email to continue.
              A verification email has been sent to your email address.
            </p>

            <Button
              className="w-100"
              variant="outline-light"
              size="lg"
              onClick={handleContinue}
              disabled={isVerified}
            >
              I have verified
            </Button>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default VerificationPage;
