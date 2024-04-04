import React, { useState, useEffect, useRef } from "react";
import "./ChangeUsername.css";
import "./SettingsModals.css";
import "../../normalize.css";
import "../../custom.css";

//Displays contact information for questsions / bugs
function DeleteAccount(props) {
  //Used to keep track of the inputed values
  const [emailValue, setEmailValue] = useState("");

  //Used to display errors on the form
  let [emailErrs, setEmailErrs] = useState();

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
  async function deleteAccount(e) {
    e.preventDefault();
    const url = "/api/delete-my-account";
    const formData = new FormData(e.target);
    const formDataObj = Object.fromEntries(formData.entries());
    formDataObj.user = props.user;
    const formDataString = JSON.stringify(formDataObj);
    const options = {
      method: "DELETE",
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
      setHideThis(" hide");
      setCurrentScreen(successScreen);
      localStorage.removeItem("profile");
      document.addEventListener("keydown", (e) => {
        if (e.key == "Enter") {
          window.location = "/profile";
        }
      });
    } else {
      setEmailErrs(<div className="error" aria-label="Error">{resObj.errors.email}</div>);
    }
  }

  //Displays if the account is successfully deleted
  let successScreen = (
    <div className="settings-modal">
      <div className="success-container" aria-label="Success">
        <span className="modal-top">
          <button
            className="close-modal"
            onClick={(e) => (window.location = "/login")}
          >
            X
          </button>
        </span>
        <div className="success-message">Your account has been deleted.</div>
        <button
          className="submit-btn"
          onClick={(e) => (window.location = "/login")}
        >
          Goodbye
        </button>
      </div>
    </div>
  );

  return (
    <div className={"delete-account settings-modal" + hideModal} aria-label="Delete Account Modal">
      {currentScreen}
      <div className={"delete-account-container" + hideThis} aria-label="Delete Account Container">
        <span className="modal-top">
          <button
            className="close-modal"
            onClick={(e) => setHideModal(" hide")}
            aria-label="Close Delete Account Modal"
          >
            X
          </button>
        </span>
        <div>
          <h1>Delete Account</h1>
        </div>
        <div className="delete-account-info">
          Enter your email address to delete your account. This cannot be reversed.
        </div>
        <form
          method="post"
          className="delete-account-form"
          onSubmit={(e) => deleteAccount(e)}
          aria-label="Delete Account Form"
        >
          <div className="form-input">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              value={emailValue}
              ref={inputReference}
              onChange={(e) => setEmailValue(e.target.value)}
            />
            {emailErrs}
          </div>

          <div>
            <button
              type="submit"
              className="deleteAccount submit-btn"
              name="deleteAccount"
            >
              Delete Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeleteAccount;
