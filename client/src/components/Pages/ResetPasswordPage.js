import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
} from "react";
import "../../normalize.css";
import "../../custom.css";
import Navbar from "../Navbar/Navbar";
import NavbarDynamic from "../Navbar/NavbarDynamic";
import ResetPassword from "../LoginSystem/ForgotPasswordRegular";

//Creates the page used for password reset
function ResetPasswordPage(props) {
  let [passwordPage, setPasswordPage] = useState();

  //Runs on mount. Gets users profile pic and starts game
  useEffect(() => {
    document.title = "Numbler - Reset Password";
    fetchUser();
    return () => {};
  }, []);

  async function fetchUser() {
    let user;
    let profile = localStorage.getItem("profile");
    if (profile) {
      let profileObj = JSON.parse(profile);
      const options = {
        method: "POST",
        body: JSON.stringify(profileObj),
        withCredentials: true,
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      };
      let res = await fetch("/api/account-info", options);
      let accountInfo = await res.json();
      user = {
        loggedIn: accountInfo.loggedIn,
        premium: accountInfo.premium,
        imageUrl: accountInfo.imageUrl,
        session: profileObj.session,
      };
    } else {
      user = {
        loggedIn: false,
        premium: false,
        imageUrl: "/images/site/account2.png",
      };
    }
    setPasswordPage(
      <div className="reset-password-page">
        <NavbarDynamic digits={0} user={user} instructions={" invisible"} />
        <ResetPassword />
      </div>
    );
  }
  return passwordPage;
}

export default ResetPasswordPage;
