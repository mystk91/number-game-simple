import React, { useState, useEffect, useRef } from "react";
import "./ProfileDropdown.css";
import "../../normalize.css";
import "../../custom.css";

//A dropdown menu that will only appear if the user is logged in
// Props: (hidden = true) - the menu will be hidden. this is used for animating the dropdown
function ProfileDropdown(props) {
  const [profileDropdown, setProfileDropdown] = useState();

  //componentDidMount, runs when component mounts, then componentDismount
  useEffect(() => {
    if (props.hidden === "true") {
      setProfileDropdown(dropdownHidden);
    } else {
      setProfileDropdown(dropdownVisible);
    }
    return () => {};
  }, []);

  //Logs the user out
  async function logout() {
    const url = "/api/logout";
    const options = {
      method: "POST",
      body: JSON.stringify(props.user),
      withCredentials: true,
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };
    let res = await fetch(url, options);
    if (res.status === 302) {
      localStorage.removeItem("profile");
      localStorage.setItem("previouslyVisited", "5");
      sessionStorage.setItem("currentMode", "daily");
      window.location.assign("/login");
    }
  }

  let dropdownVisible = (
    <ul className="profile-dropdown visible">
      <li>
        <a href="/profile" tabIndex={0}>
          My Profile
        </a>
      </li>
      <li>
        <a onClick={logout} className="logout-link" tabIndex={0}>
          Logout
        </a>
      </li>
    </ul>
  );

  let dropdownHidden = (
    <ul className="profile-dropdown hidden">
      <li>
        <a>My Profile</a>
      </li>
      <li>
        <a className="logout-link">Logout</a>
      </li>
    </ul>
  );

  return profileDropdown;
}

export default ProfileDropdown;
