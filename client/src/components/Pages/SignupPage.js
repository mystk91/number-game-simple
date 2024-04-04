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
import SignupRegular from "../LoginSystem/SignupRegular";
import { Helmet } from "react-helmet";

//Creates the page used for password reset
function SignupPage(props) {
  let [signupPage, setSignupPage] = useState();

  //Runs on mount. Gets users profile pic and starts game
  useEffect(() => {
    document.title = "Numbler - Signup";
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
    setSignupPage(
      <div className="signup-page">
        <Helmet>
          <meta name="description" content={`Create an account!`} />
          <meta name="keywords" content="numbler signup, signup page" />
        </Helmet>
        <NavbarDynamic digits={0} user={user} instructions={" invisible"} />
        <SignupRegular />
      </div>
    );
  }

  return signupPage;
}

export default SignupPage;
