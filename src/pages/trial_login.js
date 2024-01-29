import { useState } from "react";
import { useRouter } from "next/router";

import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import Image from "next/image";

import { stripeTrialAuthenticator } from "../stripe_proxy_sdk";
import { usePostHog } from "posthog-js/react";

const TrialLoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const auth = getAuth();
  const posthog = usePostHog();

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handleSignIn = async (event) => {
    event.preventDefault();

    // Call stripeTrialAuthenticator to check the trial status
    try {
      const trialInfo = await stripeTrialAuthenticator(email);

      if (!trialInfo.trial) {
        // If trial is false, show a SweetAlert and don't proceed further
        let trialDurationMessage = trialInfo.trialEnd
          ? `Your last trial ended on ${trialInfo.trialEnd}.`
          : "You have not had a trial period.";

        Swal.fire({
          icon: "info",
          title: "Sorry! you don't have an active trial",
          text: trialDurationMessage,
        });
        return;
      }
      posthog.capture("trial-login-user-clicked-login", {
        date: new Date().toISOString(),
        email: email,
      });

      // Proceed with the login process if the trial is true
      const predefinedEmail = process.env.NEXT_PUBLIC_PYRO_GUEST_EMAIL;
      const predefinedPassword = process.env.NEXT_PUBLIC_PYRO_GUEST_PASSWORD;
      signInWithEmailAndPassword(auth, predefinedEmail, predefinedPassword)
        .then(async (userCredential) => {
          // Logic after successful login
          router.push("/create_ad");
        })
        .catch((error) => {
          // Handle login errors
          Swal.fire({
            icon: "error",
            title: "Login Failed",
            text:
              "There was an error during the login process: " + error.message,
          });
        });
    } catch (error) {
      // Handle errors from stripeTrialAuthenticator
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          "An error occurred while verifying trial status: " + error.message,
      });
    }
  };

  return (
    <Container
      fluid
      className="vh-100 d-flex justify-content-center align-items-center"
      style={{ backgroundColor: "#FFFFFF" }} // Assuming this is the background color you want
    >
      <Row className="w-100">
        <Col md={6} className="mx-auto">
          <Card
            className="my-5 mx-1 p-4"
            style={{
              borderColor: "#eb631c", // Assuming this is the border color from SignupPage
              borderRadius: "1rem",
              color: "black", // Text color as per SignupPage
              position: "relative", // For positioning any absolutely positioned elements
            }}
          >
            <Image
              src="/fire.png"
              alt="Firebay Studios"
              width={100}
              height={100}
              className="d-block mx-auto mb-3"
            />

            <h2 className="text-center mb-4">Pyro Trial Login</h2>
            <p className="text-center mb-5">
              Please enter your email address for access to the PYRO 7-day trial
            </p>

            <Form>
              <Form.Group controlId="email" className="mb-3">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  style={{
                    borderColor: "#e4e4e4", // Matching the SignupPage placeholder color
                    backgroundColor: "#e4e4e4", // Matching the SignupPage background color for input
                    color: "black", // Matching the SignupPage text color for input
                  }}
                />
              </Form.Group>
              <br />

              <Button
                className="w-100"
                style={{ backgroundColor: "#EB631C" }} // Matching the SignupPage button color
                variant="outline-light"
                type="submit"
                size="lg"
                onClick={handleSignIn}
              >
                Login
              </Button>
            </Form>

            <div className="my-3">
              <p className="text-center">
                Already a subscriber?{" "}
                <a href="/login" style={{ color: "black", fontWeight: "bold" }}>
                  Login
                </a>
              </p>
              <p className="text-center">
                Want to become a subscriber?{" "}
                <a
                  href="/signup"
                  style={{ color: "black", fontWeight: "bold" }}
                >
                  Sign Up
                </a>
              </p>
            </div>

            <div
              style={{
                position: "absolute",
                bottom: "10px",
                right: "10px",
                fontSize: "small",
                fontWeight: "bold",
                fontStyle: "italic",
                color: "black", // Text color as per SignupPage
              }}
            >
              By Firebay Studios
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TrialLoginPage;
