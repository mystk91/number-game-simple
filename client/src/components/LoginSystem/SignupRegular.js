import React, { useState, useEffect, useRef } from "react";
import "./SignupRegular.css";
import "../../normalize.css"
import "../../custom.css";
import LoadingIcon from "../Parts/LoadingIcon";
import PasswordInput from "../Parts/PasswordInput";

//A non-modal version of the signup screen.
function Signup(props) {
  //componentDidMount, runs when component mounts, then componentDismount
  useEffect(() => {
    inputReference.current.focus();
    return () => {};
  }, []);

  //Used to give focus to the form input on load
  const inputReference = useRef(null);

  // Used to set the class and hide the modal and the component
  const [hideModal, setHideModal] = useState("");
  const [hideComponent, setHideComponent] = useState("");

  //Used to change the screen when an account is created, display a message.
  const [currentScreen, setCurrentScreen] = useState();

  //Used to keep track of the inputed values
  const [emailValue, setEmailValue] = useState("");
  const [usernameValue, setUsernameValue] = useState("");

  //Used to display errors on the form
  const [errEmail, setErrEmail] = useState();
  const [errUsername, setErrUsername] = useState();
  const [errPassword, setErrPassword] = useState(
    <div className="password-requirements" aria-label="Password Requirements">
      Passwords must be at least 10 characters long, and have strong password
      complexity.
    </div>
  );

  //Used to display Email input errors
  function displayEmailErrors() {
    let emailRegExp = new RegExp(
      "^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,})$"
    );
    if (!emailRegExp.test(emailValue)) {
      setErrEmail(<div className="error" aria-label="Error">Invalid email address</div>);
      return false;
    } else {
      setErrEmail();
      return true;
    }
  }

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

    //Used to display Username input errors
    function displayUsernameErrors() {
      let usernameRegExp = new RegExp("^(?=.*[a-zA-Z])[a-zA-Z0-9_]{3,16}$");
      if (!usernameRegExp.test(usernameValue)) {
        setErrUsername(
          <div className="error" aria-label="Error">
            Invalid username
          </div>
        );
        return false;
      } else {
        setErrUsername();
        return true;
      }
    }
  

  //Attempts to create an account
  async function createAccount(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const formDataObj = Object.fromEntries(formData.entries());
    let noEmailErrors = displayEmailErrors();
    let noUsernameErrors = displayUsernameErrors();
    let noPasswordErrors = displayPasswordErrors(formDataObj.password);
    if (noPasswordErrors && noEmailErrors && noUsernameErrors) {
      setHideModal(" hide-modal");
      setCurrentScreen(loadingScreen);
      const url = "/api/create-account";
      const formDataString = JSON.stringify(formDataObj);
      const options = {
        method: "POST",
        body: formDataString,
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
        const errors = await res.json();
        setCurrentScreen();
        setHideModal("");
        setErrEmail(<div className="error" aria-label="Error">{errors.email}</div>);
        setErrUsername(
          <div className="error" aria-label="Error">
            {errors.username}
          </div>
        );
        setErrPassword(<div className="error" aria-label="Error">{errors.password}</div>);
      }
    }
  }

  let loadingScreen = (
    <div className="signup-regular">
      <LoadingIcon />
    </div>
  );

  //An event function that will allow you to close the window by pressing "Enter"
  function closeSuccessScreen(e) {
    e.stopPropagation();
    if (e.key == "Enter") {
      setCurrentScreen();
      document.removeEventListener("keydown", closeSuccessScreen, true);
      window.location = "/login";
    }
  }

  let successScreen = (
    <div className="signup-regular">
      <div className="signup-box">
        <div className="signup-success-message">
          An account verification link has been sent to your email.
        </div>
        <a href="/login">
          <button type="submit" className="submit-btn">
            Okay!
          </button>
        </a>
      </div>
    </div>
  );

  return (
    <div className={hideComponent}>
      <div className="sub-modals">{currentScreen}</div>
      <div className={"signup-regular" + hideModal}>
        <div className={"signup-box"} aria-label="Sign up Container">
          <span className="signup-top-regular"></span>
          <div className="signup-label">Create an account</div>
          <form
            method="post"
            className="signup-form"
            onSubmit={(e) => createAccount(e)}
            aria-label="Sign up form"
          >
            <div className="form-input">
              <label htmlFor="email" aria-label="Email">Email</label>
              <input
                id="email"
                name="email"
                type="text"
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
                ref={inputReference}
              />
              {errEmail}
            </div>
            <div className="form-input">
              <label htmlFor="username" aria-label="Username">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                maxLength={16}
                value={usernameValue}
                onChange={(e) => setUsernameValue(e.target.value)}
              />
              {errUsername}
            </div>
            <div className="form-input">
              <label htmlFor="current-password" aria-label="Password">Password</label>
              <PasswordInput />
              {errPassword}
            </div>
            <div>
              <button type="submit" className="submit-btn">
                Sign up!
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;
