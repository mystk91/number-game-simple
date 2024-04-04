import React, { useState, useEffect, useRef } from "react";
import uniqid from "uniqid";
import "./EmailVerification.css";
import "../../normalize.css";
import "../../custom.css";
import { useParams } from "react-router-dom";
import LoadingIcon from "../Parts/LoadingIcon";

//The component that appears when you click on a email verification link.
function EmailVerification(props) {
  //Used to set the currently displayed screen
  const [currentScreen, setCurrentScreen] = useState();

  const firstCallRef = useRef(true);
  function setFirstCallRef(point) {
    firstCallRef.current = point;
  }

  //Stores the verification code parameter
  const verificationCodeRef = useRef();
  function setVerificationCodeRef(point) {
    verificationCodeRef.current = point;
  }
  setVerificationCodeRef(useParams().verificationCode);

  //componentDidMount, runs when component mounts, then componentDismount
  useEffect(() => {
    if (firstCallRef.current) {
      checkVerification();
      setFirstCallRef(false);
    }
    return () => {};
  }, []);

  //Checks if the email verification is valid, updates the visible screens accordingly
  async function checkVerification() {
    setCurrentScreen(loadingScreen);
    const url = "/api/verify-email/" + verificationCodeRef.current;
    const requestObj = {
      verificationCode: verificationCodeRef.current,
    };
    const requestObjString = JSON.stringify(requestObj);
    const options = {
      method: "POST",
      body: requestObjString,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };
    const res = await fetch(url, options);
    if (res.status == 200) {
      setCurrentScreen(successScreen);
      document.addEventListener("keydown", closeSuccessScreen, true);
    } else {
      setCurrentScreen(failureScreen);
    }
  }

  let loadingScreen = (
    <div className="loading-verification">
      <LoadingIcon />
    </div>
  );

  let successScreen = (
    <div className="verify-success">
      <div className="verify-success-container" aria-label="Success Container">
        <div className="verify-success-message">
          Your account has been created!
        </div>
        <a href="/login">
          <button className="submit-btn">Continue to Login</button>
        </a>
      </div>
    </div>
  );

  let failureScreen = (
    <div className="verify-failure">
      <div className="verify-failure-container" aria-lable="Error Container">
        <div className="verify-failure-message">
          This verification code does not exist or has expired.
        </div>
      </div>
    </div>
  );

  //Goes to the login window when you hit Enter
  function closeSuccessScreen(e) {
    e.stopPropagation();
    if (e.key == "Enter") {
      setCurrentScreen();
      document.removeEventListener("keydown", closeSuccessScreen, true);
      window.location = "/login";
    }
  }

  return currentScreen;
}

export default EmailVerification;
