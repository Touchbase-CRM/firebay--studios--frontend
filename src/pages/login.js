import { useState } from "react";
import { useRouter } from "next/router";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth"; // Importing new Auth methods
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import Image from "next/image";
import { getSubscriptionStatus } from "../stripe_proxy_sdk";
import app from "../firebase";

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const auth = getAuth(); // Initialize Firebase Auth

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleSignIn = async (event) => {
    event.preventDefault();

    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        var user = userCredential.user;

        // Check if the user's email is verified
        if (!user.emailVerified) {
          Swal.fire({
            icon: "info",
            title: "Email Verification",
            text: "Please verify your email before continuing.",
          });
          return;
        }

        // Check the subscription status before proceeding
        try {
          const isSubscribed = await getSubscriptionStatus(app);
          if (!isSubscribed) {
            throw new Error("You must have an active subscription to log in.");
          }

          // If the user has an active subscription, redirect to the create_ad page
          router.push("/create_ad");
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Subscription Required",
            text: error.message,
          });
        }
      })
      .catch((error) => {
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: "User not found, please sign in",
        });
      });
  };

  const handleForgotPassword = () => {
    if (!email) {
      Swal.fire({
        icon: "warning",
        title: "Oops...",
        text: "Please enter an email address.",
      });
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        Swal.fire({
          icon: "success",
          title: "Email Sent",
          text: "Password reset email sent. Please check your email.",
        });
      })
      .catch((error) => {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: error.message,
        });
      });
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

            <h2 className="text-center mb-4">Firebay Studios Sign Up</h2>
            <p className="text-center mb-5">
              Please enter your login and password!
            </p>
            <style jsx global>{`
              input:-webkit-autofill,
              input:-webkit-autofill:focus,
              input:-webkit-autofill:hover {
                -webkit-box-shadow: 0 0 0 1000px #495057 inset;
                box-shadow: 0 0 0 1000px #495057 inset;
                -webkit-text-fill-color: white !important;
              }
            `}</style>
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
                    borderColor: "#ced4da",
                    backgroundColor: "#495057",
                    color: "white",
                  }}
                />
              </Form.Group>

              <Form.Group controlId="password">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={handlePasswordChange}
                  minLength={6}
                  required
                  style={{
                    borderColor: "#ced4da",
                    backgroundColor: "#495057",
                    color: "white",
                  }}
                />
              </Form.Group>

              <Form.Group className="text-center small mt-3 mb-3 pb-lg-2">
                <a
                  href="#!"
                  onClick={handleForgotPassword}
                  tyle={{ color: "#fff", fontWeight: "bold" }}
                >
                  Forgot password?
                </a>
              </Form.Group>
              <br></br>

              <Button
                className="w-100"
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
                Don&apos;t have an account?{" "}
                <a href="/signup" style={{ color: "#fff", fontWeight: "bold" }}>
                  Sign Up
                </a>
              </p>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
