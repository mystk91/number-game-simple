import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
} from "react";
import "./normalize.css";
import "./custom.css";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignupPage from "./components/Pages/SignupPage";
import LoginPage from "./components/Pages/LoginPage";
import LoginComplete from "./components/Pages/LoginComplete";
import ResetPasswordPage from "./components/Pages/ResetPasswordPage";
import NewPasswordPage from "./components/Pages/NewPasswordPage";
import EmailVerification from "./components/LoginSystem/EmailVerification";
import GamePageDaily from "./components/Pages/GamePageDaily";
import ProfilePage from "./components/Pages/ProfilePage";
import Homepage from "./components/Pages/Homepage";
import SiteMessagePage from "./components/Pages/SiteMessagePage";
import Privacy from "./components/Policy/Privacy";
import Refund from "./components/Policy/Refund";

function App() {
  const [returned, setReturned] = useState();

  //componentDidMount, runs when component mounts, then componentDismount
  useEffect(() => {
    let storage = localStorage.getItem("secret");
    if (storage !== "5m2543eemfieoqmferkgajzi") {
      setReturned(
        <div className="Test">
          <BrowserRouter>
            <Routes>
              <Route path="/loginPage" element={<LoginPage />} />
              <Route
                path="/testGameForYou"
                element={<GamePageDaily digits={4} attempts={6} />}
              />
            </Routes>
          </BrowserRouter>
        </div>
      );
    } else {
      setReturned(
        <div className="Numbler">
          <BrowserRouter>
            <Routes>
              <Route
                path="/new-password/:verificationCode"
                element={<NewPasswordPage />}
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/login/complete" element={<LoginComplete />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route
                path="/verify-email/:verificationCode"
                element={<EmailVerification />}
              />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route
                path="/digits2"
                element={<GamePageDaily digits={2} attempts={6} />}
              />
              <Route
                path="/digits3"
                element={<GamePageDaily digits={3} attempts={6} />}
              />
              <Route
                path="/digits4"
                element={<GamePageDaily digits={4} attempts={6} />}
              />
              <Route path="/" element={<Homepage />} />
              <Route
                path="/digits5"
                element={<GamePageDaily digits={5} attempts={6} />}
              />
              <Route
                path="/digits6"
                element={<GamePageDaily digits={6} attempts={6} />}
              />
              <Route
                path="/digits7"
                element={<GamePageDaily digits={7} attempts={6} />}
              />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/privacy-policy" element={<Privacy />} />
              <Route
                path="*"
                element={
                  <SiteMessagePage
                    message={"You went somewhere that doesn't exist."}
                    buttonText={"Oops!"}
                    buttonUrl="/"
                  />
                }
              />
            </Routes>
          </BrowserRouter>
        </div>
      );
    }

    return () => {};
  }, []);

  return returned;

  /*
  return (
    <div className="Numbler">
      <BrowserRouter>
        <Routes>
          <Route
            path="/new-password/:verificationCode"
            element={<NewPasswordPage />}
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/complete" element={<LoginComplete />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/verify-email/:verificationCode"
            element={<EmailVerification />}
          />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/digits2"
            element={<GamePageDaily digits={2} attempts={6} />}
          />
          <Route
            path="/digits3"
            element={<GamePageDaily digits={3} attempts={6} />}
          />
          <Route
            path="/digits4"
            element={<GamePageDaily digits={4} attempts={6} />}
          />
          <Route path="/" element={<Homepage />} />
          <Route
            path="/digits5"
            element={<GamePageDaily digits={5} attempts={6} />}
          />
          <Route
            path="/digits6"
            element={<GamePageDaily digits={6} attempts={6} />}
          />
          <Route
            path="/digits7"
            element={<GamePageDaily digits={7} attempts={6} />}
          />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/privacy-policy" element={<Privacy />} />
          <Route
            path="*"
            element={
              <SiteMessagePage
                message={"You went somewhere that doesn't exist."}
                buttonText={"Oops!"}
                buttonUrl="/"
              />
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
  */
}

export default App;
