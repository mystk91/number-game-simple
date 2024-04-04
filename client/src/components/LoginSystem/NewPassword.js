import React, { useState, useEffect, useRef } from "react";
import "./NewPassword.css";
import "../../normalize.css"
import "../../custom.css";
import { useParams } from "react-router-dom";
import LoadingIcon from "../Parts/LoadingIcon";
import PasswordInput from "../Parts/PasswordInput";

//Used for the page that DOES the password reset.
function NewPassword(props) {
  //Used to switch screens after the user inputs
  const [currentScreen, setCurrentScreen] = useState();
  const [hideForm, setHideForm] = useState("");

  //Sets the verification code so it can be passed in while changing password
  const verficationCodeRef = useRef();
  function setVerificationCodeRef(point) {
    verficationCodeRef.current = point;
  }
  setVerificationCodeRef(useParams().verificationCode);

  //componentDidMount, runs when component mounts, then componentDismount
  useEffect(() => {
    return () => {};
  }, []);

  //Used to set the errors that occur if password is invalid.
  const [errPassword, setErrPassword] = useState(
    <div className="password-requirements" aria-label="Password Requirements">
      Passwords must be at least 10 characters long, and have strong password
      complexity.
    </div>
  );

  //Used to display Password input errors
  function displayPasswordErrors(password) {
    let passwordRegExp = new RegExp(
      "^(?=.*?[A-Z])(?=.*?[a-z])(?=.*[!@#$%^&*_0-9]).{10,32}$"
    );
    if (!passwordRegExp.test(password)) {
      setErrPassword(
        <div className="error" aria-label="Error">
          Passwords must be at least 10 characters long, have an upper and
          lowercase letter, and have a number or special character.
        </div>
      );
      return false;
    } else {
      setErrPassword();
      return true;
    }
  }
  //Resets the password if there is a valid password reset request
  async function resetPasswordSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const formDataObj = Object.fromEntries(formData.entries());
    let noPasswordErrors = displayPasswordErrors(formDataObj.password);
    if (noPasswordErrors) {
      setHideForm(" hide");
      setCurrentScreen(loadingScreen);
      const url = "/api/change-password";
      formDataObj.verificationCode = verficationCodeRef.current;
      const formDataString = JSON.stringify(formDataObj);
      const options = {
        method: "POST",
        body: formDataString,
        withCredentials: true,
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      };
      let res = await fetch(url, options);
      if (res.status == 200) {
        setCurrentScreen(successScreen);
        document.addEventListener("keydown", closeSuccessScreen, true);
      } else {
        let errors = await res.json();
        if (errors.errorFound) {
          setCurrentScreen();
          setHideForm("");
          setErrPassword(<div className="error" aria-label="Error">{errors.password}</div>);
        } else {
          setCurrentScreen(failureScreen);
        }
      }
    }
  }

  //A spinning wheel that indicates loading
  let loadingScreen = <LoadingIcon />;

  //The screen that appears if the password change failed
  let failureScreen = (
    <div className="reset-password-failure-container" aria-label="Error Container">
      <div className="reset-failure-message">
        This password reset link has expired or does not exist.
      </div>
    </div>
  );

  //The screen that appears if the password change was successfull
  let successScreen = (
    <div className="reset-password-success-container" aria-label="Success Container">
      <div className="reset-success-message">Your password has been reset.</div>
      <a href="/login">
        <button className="submit-btn">Go to Login</button>
      </a>
    </div>
  );

  //An event function that will redirect you to the login page by pressing "Enter"
  function closeSuccessScreen(e) {
    e.stopPropagation();
    if (e.key == "Enter") {
      setCurrentScreen();
      document.removeEventListener("keydown", closeSuccessScreen, true);
      window.location = "/login";
    }
  }

  return (
    <div className="new-password">
      {currentScreen}
      <div className={"reset-password-form-container" + hideForm} aria-label="New Password Container">
        <form
          method="POST"
          className="reset-password-form"
          onSubmit={(e) => resetPasswordSubmit(e)}
          aria-label="New Password Form"
        >
          <div>
            <label htmlFor="password" className="reset-password-label" aria-label="New Password">
              New Password
            </label>
            <PasswordInput />
            {errPassword}
          </div>
          <div>
            <button type="submit" className="submit-btn">
              Reset Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewPassword;
