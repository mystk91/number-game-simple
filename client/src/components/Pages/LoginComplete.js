import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
} from "react";
import "../../normalize.css";
import "../../custom.css";

//Sets the local storage used for the social media login option and then redirects
function LoginComplete(props) {
  const [loginComplete, setLoginComplete] = useState();

  //Runs on mount.
  useEffect(() => {
    document.title = "Numbler";
    fetchUser();
    return () => {};
  }, []);

  async function fetchUser() {
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
  }

  return loginComplete;
}

export default LoginComplete;
