import React, { useState, useEffect, useRef } from "react";
import "./PasswordInput.css";
import "../../normalize.css";
import "../../custom.css";

//Used to create a password input for a form. It has an icon that shows / hides the password
function PasswordInput(props) {
  //Used to toggle the password input from invisible to visible
  const [inputType, setInputType] = useState("password");
  const [eyeIcon, setEyeIcon] = useState("/images/site/hidden-password.png");

  //Toggles the password from being invisible to visible
  function toggleDisplayPassword(e) {
    e.preventDefault();
    if (inputType === "password") {
      setInputType("text");
      setEyeIcon("/images/site/shown-password.png");
    } else {
      setInputType("password");
      setEyeIcon("/images/site/hidden-password.png");
    }
  }

  return (
    <div className="password-container">
      <input id="password" name="password" type={inputType} maxLength={32} />
      <div
        className="toggle-password"
        aria-label="Toggle Password Visibility"
        role="button"
        onClick={(e) => toggleDisplayPassword(e)}
      >
        <img src={eyeIcon} alt="Eye Icon" />
      </div>
    </div>
  );
}

export default PasswordInput;
