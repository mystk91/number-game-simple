import React, { useState, useEffect, useRef } from "react";
import "./ProfileComponents.css";
import "../../normalize.css";
import "../../custom.css";
import ChangeUsername from "./ChangeUsername";
import DeleteAccount from "./DeleteAccount";
import ResetPassword from "../LoginSystem/ForgotPassword";
import Privacy from "../Policy/Privacy";
import Refund from "../Policy/Refund";
import Contact from "./Contact";

//Lets user change email, password, and username, premium status
function Settings(props) {
  const [username, setUsername] = useState(props.username);
  const [modal, setModal] = useState();

  //componentDidMount, runs when component mounts, then componentDismount
  useEffect(() => {
    return () => {};
  }, []);

  return (
    <div className="account-settings" aria-label="Settings Container">
      {modal}
      <h1>Account Settings</h1>
      <main>
        <div
          className="settings-option-container"
          aria-label="Username Setting"
        >
          <div className="settings-option username">
            <div>Username</div>
          </div>
          <div className="change-settings">
            <div className="username">{username}</div>
            <button
              className="change-username-btn"
              onClick={() => {
                setModal(<ChangeUsername user={props.user} key={new Date()} />);
              }}
            >
              Change Username
            </button>
            <div className="username-info"></div>
          </div>
        </div>

        <div
          className="settings-option-container"
          aria-label="Password Setting"
        >
          <div className="settings-option">
            <div>Password</div>
          </div>
          <div className="change-settings">
            <button
              className="change-password-btn"
              onClick={() => {
                setModal(<ResetPassword key={new Date()} />);
              }}
            >
              Change Password
            </button>
          </div>
        </div>

        <div
          className="settings-option-container"
          aria-label="Delete Account Setting"
        >
          <div className="settings-option">
            <div>Delete Your Account</div>
          </div>
          <div className="change-settings delete-account">
            <div>Want to delete your account?</div>
            <button
              className="delete-account-btn"
              onClick={() => {
                setModal(<DeleteAccount user={props.user} key={new Date()} />);
              }}
            >
              Start Here
            </button>
          </div>
        </div>

        <div className="settings-option-container" aria-label="Policies">
          <div className="settings-option">
            <div>Our Policies</div>
          </div>

          <button
            className="privacy-policy-btn"
            onClick={() => {
              setModal(
                <div
                  className={"privacy-modal"}
                  aria-label="Privacy Policy Modal"
                  onClick={(e) => setModal()}
                >
                  <div
                    className={"privacy-modal-container"}
                    aria-label="Privacy Policy Container"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="modal-top">
                      <button
                        className="close-modal"
                        onClick={(e) => setModal()}
                        aria-label="Close Privacy Policy Modal"
                      >
                        X
                      </button>
                    </span>
                    <Privacy />
                  </div>
                </div>
              );
            }}
          >
            Privacy Policy
          </button>

          
        </div>
      </main>
    </div>
  );
}

export default Settings;
