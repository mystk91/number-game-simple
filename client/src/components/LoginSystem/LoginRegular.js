import React, { useState, useEffect, useRef } from "react";
import "./LoginRegular.css";
import "../../normalize.css";
import "../../custom.css";
import LoginOption from "./LoginOption";
import PasswordInput from "../Parts/PasswordInput";

//A non-modal version of the login screen. It links to the other screens instead of creating multiple modals
function LoginRegular(props) {
  //componentDidMount, runs when component mounts, then componentDismount
  useEffect(() => {
    return () => {};
  }, []);

  //Used to set the errors that can occur on login.
  const [errEmail, setErrEmail] = useState();
  const [errPassword, setErrPassword] = useState();

  //Handles to lhe login logic
  async function login(e) {
    e.preventDefault();
    setErrEmail();
    setErrPassword();
    const url = "/api/validate";
    const formData = new FormData(e.target);
    const formDataObj = Object.fromEntries(formData.entries());
    formDataObj.location = "/";
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
    if (res.status === 302) {
      let loginURL = "/api/login";
      let resLogin = await fetch(loginURL, options);
      if (resLogin.status === 302) {
        let profile = await fetch("/api/current_user");
        let profileObj = await profile.json();
        if (profileObj) {
          localStorage.setItem(
            "profile",
            JSON.stringify({
              session: profileObj.session,
              profile_picture: profileObj.profile_picture,
            })
          );
        }
        window.location = "/";
      } else {
        window.location.refresh();
      }
    } else {
      let errors = await res.json();
      setErrEmail(
        <div className="error" aria-label="Error">
          {errors.email}
        </div>
      );
      setErrPassword(
        <div className="error" aria-label="Error">
          {errors.password}
        </div>
      );
    }
  }

  return (
    <div className={"login-regular"}>
      <div className={"login-box-regular"} aria-label="Login Container">
        <span className="login-top-regular"></span>
        <form
          action="/api/login"
          method="POST"
          className="login-form"
          onSubmit={(e) => login(e)}
          aria-label="Login Form"
        >
          <div>
            <label htmlFor="email" aria-label="Email">
              Email
            </label>
            <input id="email" name="email" type="text" autoComplete="email" />
            {errEmail}
          </div>
          <div>
            <label htmlFor="password" aria-label="Password">
              Password
            </label>
            <PasswordInput />
            {errPassword}
            <a href="/reset-password" className="recover-password-link">
              Forgot password?
            </a>
          </div>
          <div>
            <button type="submit" className="submit-btn">
              Sign in
            </button>
          </div>
        </form>
        <div className="signup-cont">
          Not a member?{" "}
          <a href="/signup" className="signup-link">
            Sign up!
          </a>
        </div>

        <div className="login-options-simple">
          <hr></hr>
          <div className="login-options-buttons" aria-label="Login Options">
            <LoginOption
              route="/api/login/google"
              className="google"
              imageURL="/images/login-logos/google-logo.png"
              buttonText="Login with Google"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginRegular;
