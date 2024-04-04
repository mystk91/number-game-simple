import React, { useState, useEffect, useRef } from "react";
import "./ChangeUsername.css";
import "./SettingsModals.css";
import "../../normalize.css";
import "../../custom.css";
import PasswordInput from "../Parts/PasswordInput";

//Displays contact information for questsions / bugs
function ChangeUsername(props) {
  //Used to keep track of the inputed values
  const [usernameValue, setUsernameValue] = useState("");

  //Used to display errors on the form
  let [usernameErrs, setUsernameErrs] = useState();
  //let [passwordErrs, setPasswordErrs] = useState();

  //Used for displaying success screen
  const [currentScreen, setCurrentScreen] = useState();
  const [hideThis, setHideThis] = useState("");
  const [hideModal, setHideModal] = useState("");

  //Used to give focus to the form input on load
  const inputReference = useRef(null);

  //componentDidMount, runs when component mounts, then componentDismount
  useEffect(() => {
    inputReference.current.focus();
    return () => {};
  }, []);

  //Attempts to change the username
  async function changeUsername(e) {
    e.preventDefault();
    const url = "/api/change-username";
    const formData = new FormData(e.target);
    const formDataObj = Object.fromEntries(formData.entries());
    formDataObj.user = props.user;
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
    let resObj = await res.json();
    if (resObj.success) {
      //window.location = "/profile";
      setHideThis(" hide");
      setCurrentScreen(successScreen);
      document.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          window.location = "/profile";
        }
      });
    } else {
      setUsernameErrs(<div className="error" aria-label="Error">{resObj.errors.username}</div>);
      //setPasswordErrs(<div className="error" aria-label="Error">{resObj.errors.password}</div>);
    }
  }

  //Displays if the username is successfully changed
  let successScreen = (
    <div className="settings-modal">
      <div className="success-container" aria-label="Success">
        <span className="modal-top">
          <button
            className="close-modal"
            onClick={(e) => (window.location = "/profile")}
            aria-label="Close Modal"
          >
            X
          </button>
        </span>
        <div className="success-message">Your username has been updated.</div>
        <button
          className="submit-btn"
          onClick={(e) => (window.location = "/profile")}
        >
          Okay!
        </button>
      </div>
    </div>
  );

  return (
    <div className={"new-username settings-modal" + hideModal} aria-label="New Username Modal">
      {currentScreen}
      <div className={"new-username-container" + hideThis} aria-label="New Username Container">
        <span className="modal-top">
          <button
            className="close-modal"
            onClick={(e) => setHideModal(" hide")}
            aria-label="Close New Username Modal"
          >
            X
          </button>
        </span>
        <div>
          <h1>Username</h1>
        </div>
        <div className="username-info">
          You can only change your username once a month. Inappropriate names
          may lead to account suspensions.
        </div>
        <form
          method="post"
          className="change-username-form"
          onSubmit={(e) => changeUsername(e)}
          aria-label="New Username Form"
        >
          <div className="form-input">
            <label htmlFor="newUsername">New Username</label>
            <input
              id="newUsername"
              name="newUsername"
              type="text"
              maxLength={16}
              value={usernameValue}
              onChange={(e) => setUsernameValue(e.target.value)}
              ref={inputReference}
            />
            {usernameErrs}
          </div>
          
          <div>
            <button
              type="submit"
              className="change-username submit-btn"
              name="change-username"
            >
              Change Username
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangeUsername;
