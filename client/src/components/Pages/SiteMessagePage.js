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
import SiteMessage from "../Parts/SiteMessage";

//Used to create a confirmation / update message for the user.
//Redirects the user to a different page when they click on the confirmation button
// props.message  - the message that will be displayed in the box
// props.buttonText - the text that appears on the button
// props.buttonUrl - the url that  the button leads to
function SiteMessagePage(props) {
  let [messagePage, setMessagePage] = useState();

  //Runs on mount. Checks if the user is logged in and sets the corresponding game page
  useEffect(() => {
    document.title = `Numbler`;
    fetchUser();
    return () => {};
  }, []);

  //Checks if the user is logged in and sets the corresponding game page
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

    if (user.loggedIn) {
      setMessagePage(
        <div className="game-page">
          <NavbarDynamic digits={props.digits} user={user} instructions={" invisible"} />
          <SiteMessage message={props.message} buttonText={props.buttonText} buttonUrl={props.buttonUrl} />
        </div>
      );
    } else {
      localStorage.removeItem("profile");
      setMessagePage(
        <div className="game-page">
          <Navbar digits={props.digits} user={user} instructions={" invisible"} />
          <SiteMessage message={props.message} buttonText={props.buttonText} buttonUrl={props.buttonUrl} />
        </div>
      );
    }
  }

  return messagePage;
}

export default SiteMessagePage;
