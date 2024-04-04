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
import LoginRegular from "../LoginSystem/LoginRegular";
import { Helmet } from "react-helmet";

//Creates the page used for password reset
function LoginPage(props) {
  let [loginPage, setLoginPage] = useState();

  //Runs on mount. Checks if user is logged in and redirects if they are
  useEffect(() => {
    document.title = "Numbler - Login";
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

    if (!user.loggedIn) {
      localStorage.removeItem("profile");
      setLoginPage(
        <div className="login-page">
          <Helmet>
            <meta name="description" content={`Numbler Login`} />
            <meta name="keywords" content="numbler login, login page" />
          </Helmet>
          <Navbar
            digits={0}
            user={user}
            instructions={" invisible"}
            login={" invisible"}
          />
          <LoginRegular />
        </div>
      );
    } else {
      window.location = "/";
    }
  }

  return loginPage;
}

export default LoginPage;
