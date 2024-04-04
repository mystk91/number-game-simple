import React, { useState, useEffect, useRef } from "react";
import "./MyProfile.css";
import "../../normalize.css";
import "../../custom.css";
import Settings from "./Settings";
import Statistics from "./Statistics";
import Contact from "./Contact";

//A component that holds other components associated with account information, setting, and statistics
//    props.user - which the page retrieves on load
//    props.stats - inserts game statistics into Statistics component, a statObj
//    props.username - their username, also part of props.user
function MyProfile(props) {
  const statsTab = (
    <Statistics
      user={props.user}
      stats={props.stats}
      key="statsTab"
    />
  );
  const [activeTab, setActiveTab] = useState(statsTab);
  const [username, setUsername] = useState(props.username);

  //Used to give the buttons an effect indicating they are clicked
  const [activeButton, setActiveButton] = useState({
    statistics: " active",
    settings: "",
    contact: "",
  });

  //componentDidMount, runs when component mounts, then componentDismount
  useEffect(() => {
    if (props.tabName) {
      switchTab(props.tabName);
    }
    return () => {};
  }, []);

  //Used to switch tabs
  function switchTab(tabName) {
    switch (tabName) {
      case "settings": {
        setActiveTab(
          <Settings
            user={props.user}
            username={props.username}
          />
        );
        setActiveButton({
          statistics: "",
          settings: " active",
          contact: "",
        });
        break;
      }
      case "statistics": {
        setActiveTab(statsTab);
        setActiveButton({
          statistics: " active",
          settings: "",
          contact: "",
        });
        break;
      }
      case "contact": {
        setActiveTab(<Contact user={props.user} />);
        setActiveButton({
          statistics: "",
          settings: "",
          contact: " active",
        });
        break;
      }
      default: {
        setActiveTab(statsTab);
        setActiveButton({
          statistics: " active",
          settings: "",
          contact: "",
        });
      }
    }
  }

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

  return (
    <div className="profile" aria-label="Your Profile">
      <nav className="profile-tabs-container" aria-label="Side Tabs">
        <div className="username-tab" aria-label="Username">
          <div className="username-container">{username}</div>
        </div>
        <ul className="profile-tabs" aria-label="Tabs">
          <li>
            <button
              className={"statistics-tab" + activeButton[`statistics`]}
              onClick={() => {
                switchTab("statistics");
              }}
              aria-label={`Statistics Tab${activeButton[`statistics`]}`}
            >
              <img
                src="./images/account/icons/stats-icon.svg"
                alt="statistics icon"
                width="56px"
              />
              <label className="tab-button-label">Statistics</label>
            </button>
          </li>
          <li>
            <button
              className={"settings-tab" + activeButton[`settings`]}
              onClick={() => {
                switchTab("settings");
              }}
              aria-label={`Settings Tab${activeButton[`statistics`]}`}
            >
              <img
                src="./images/account/icons/settings-icon.svg"
                alt="settings icon"
                width="56px"
              />
              <label className="tab-button-label">Settings</label>
            </button>
          </li>
          <li>
            <button
              className={"contact-tab" + activeButton[`contact`]}
              onClick={() => {
                switchTab("contact");
              }}
              aria-label={`Contact Us Tab${activeButton[`statistics`]}`}
            >
              <img
                src="./images/account/icons/contact-icon.svg"
                alt="contact icon"
                width="56px"
              />
              <label className="tab-button-label">Contact</label>
            </button>
          </li>
          <li className="logout">
            <button aria-label="Logout" onClick={logout}>
              <img
                src="./images/account/icons/logout-icon.svg"
                alt="logout icon"
                width="56px"
              />
               <label className="tab-button-label">Logout</label>
            </button>
          </li>
        </ul>
      </nav>

      <div className="active-tab" aria-label="Active Tab Container">
        {activeTab}
      </div>
    </div>
  );
}

export default MyProfile;
