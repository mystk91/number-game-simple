import React, { useState, useEffect, useRef, useCallback } from "react";
import "./ChangePassword.css";
import "./SettingsModals.css";
import "../../normalize.css";
import "../../custom.css";

//Displays contact information for questsions / bugs
function ChangePassword(props) {
  //Used to keep track of the inputed values
  const [currentPasswordValue, setCurrentPasswordValue] = useState("");
  const [newPasswordValue, setNewPasswordValue] = useState("");

  //Used to display errors on the form
  let [currentPasswordErrs, setCurrentPasswordErrs] = useState();
  let [newPasswordErrs, setNewPasswordErrs] = useState();

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

  //Used to display Password input errors
  function displayPasswordErrors() {
    let passwordRegExp = new RegExp(
      "^(?=.*?[A-Z])(?=.*?[a-z])(?=.*[!@#$%^&*_0-9]).{10,32}$"
    );
    if (!passwordRegExp.test(newPasswordValue)) {
      setNewPasswordErrs(
        <div className="error" aria-label="Error">
          Passwords must have at least 10 characters, an upper and lowercase
          letter, and a number or special character.
        </div>
      );
      return false;
    } else {
      setNewPasswordErrs();
      return true;
    }
  }

  //Attempts to change the password
  async function changePassword(e) {
    e.preventDefault();
    if (displayPasswordErrors()) {
      const url = "/api/profile-change-password";
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
      if (!resObj.errors) {
        setHideThis(" hide");
        setCurrentScreen(successScreen);
        document.addEventListener("keydown", removeModalEnter);
      } else {
        setCurrentPasswordErrs(
          <div className="error" aria-label="Error">{resObj.errors.currentPassword}</div>
        );
        setNewPasswordErrs(
          <div className="error" aria-label="Error">{resObj.errors.newPassword}</div>
        );
      }
    }
  }

  //Displays if the password is successfully changed
  let successScreen = (
    <div className="settings-modal">
      <div className="success-container" aria-label="Success">
        <span className="modal-top">
          <button
            className="close-modal"
            onClick={removeModal}
            aria-label="Close Modal"
          >
            X
          </button>
        </span>
        <div className="success-message">Your password has been changed.</div>
        <button className="submit-btn" onClick={removeModal}>
          Okay!
        </button>
      </div>
    </div>
  );

  function removeModal(e) {
    setHideModal(" hide");
    document.removeEventListener("keydown", removeModalEnter);
  }

  function removeModalEnter(e) {
    if (e.key == "Enter") {
      setHideModal(" hide");
      document.removeEventListener("keydown", removeModalEnter);
    }
  }

  return (
    <div className={"change-password settings-modal" + hideModal} aria-label="Change Password Modal">
      {currentScreen}
      <div className={"new-password-container" + hideThis} aria-label="Change Password Container">
        <span className="modal-top">
          <button
            className="close-modal"
            onClick={(e) => setHideModal(" hide")}
            aria-label="Close Change Password Modal"
          >
            X
          </button>
        </span>
        <form
          method="post"
          className="change-password-form"
          onSubmit={(e) => changePassword(e)}
          aria-label="Change Password Form"
        >
          <div className="form-input">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              maxLength={32}
              ref={inputReference}
              value={currentPasswordValue}
              onChange={(e) => setCurrentPasswordValue(e.target.value)}
            />
            {currentPasswordErrs}
          </div>

          <div className="form-input">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              maxLength={32}
              value={newPasswordValue}
              onChange={(e) => setNewPasswordValue(e.target.value)}
            />
            {newPasswordErrs}
          </div>

          <div>
            <button
              type="submit"
              className="change-password-input submit-btn"
              name="change-password-input"
            >
              Change Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;
