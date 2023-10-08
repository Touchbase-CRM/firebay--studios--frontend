import { useState } from 'react';
import { useRouter } from 'next/router';
import firebase from '../firebase';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import Swal from 'sweetalert2';

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleSignIn = (event) => {
    event.preventDefault();

    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        var user = userCredential.user;
        if (user.emailVerified) {
          router.push('/createad');
        } else {
          Swal.fire({
            icon: 'info',
            title: 'Email Verification',
            text: 'Please verify your email before continuing.',
          });
        }
      })
      .catch((error) => {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: "User not found, please sign in",
        });
      });
  };


  const handleForgotPassword = () => {
    if (!email) {
      setError('Please enter an email address.');
      alert('Please enter an email address.');
      return;
    }

    firebase
      .auth()
      .sendPasswordResetEmail(email)
      .then(() => {
        alert('Password reset email sent. Please check your email.');
      })
      .catch((error) => {
        setError(error.message);
      });
  };

  return (
    <Container fluid className="vh-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: '#343a40' }}>
      <Row className="w-100">
        <Col md={6} className="mx-auto">
          <Card className="my-5 mx-1 p-4" style={{ backgroundColor: '#1a1a1a', borderRadius: '1rem', color: 'white' }}>
            <h2 className="text-center mb-4">Firebay Studios Sign Up (Demo)</h2>
            <p className="text-center mb-5">Please enter your login and password!</p>
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
                <Form.Control type="email" placeholder="Enter email" value={email} onChange={handleEmailChange} required style={{ borderColor: '#ced4da', backgroundColor: '#495057', color: 'white' }} />
              </Form.Group>

              <Form.Group controlId="password">
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" placeholder="Password" value={password} onChange={handlePasswordChange} minLength={6} required style={{ borderColor: '#ced4da', backgroundColor: '#495057', color: 'white' }} />
              </Form.Group>

              <Form.Group className="text-center small mt-3 mb-3 pb-lg-2">
                <a href="#!" onClick={handleForgotPassword} tyle={{ color: '#fff', fontWeight: 'bold' }}>
                  Forgot password?
                </a>
              </Form.Group>
              <br ></br>

              <Button className="w-100" variant="outline-light" type="submit" size="lg" onClick={handleSignIn}>
                Login
              </Button>
            </Form>

            <div className="my-3">
              <p className="text-center">
                Don&apos;t have an account?{' '}
                <a href="/signup" style={{ color: '#fff', fontWeight: 'bold' }}>
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