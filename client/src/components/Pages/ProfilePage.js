import React, { useState, useEffect, useCallback } from "react";
import "../../normalize.css";
import "../../custom.css";
import NumberGameRegular from "../Game/NumberGameRegular";
import NumberGameLocal from "../Game/NumberGameLocal";
import NavbarDynamic from "../Navbar/NavbarDynamic";
import MyProfile from "../Profile/MyProfile";
import { Helmet } from "react-helmet";

//Creates a profile page for the website that displays the navbar and the users profile
//The game page will either use localStorage or data from players account
function ProfilePage(props) {
  let [profilePage, setProfilePage] = useState();

  //Runs on mount. Checks if the user is logged in and sets the corresponding game page
  useEffect(() => {
    document.title = "Numbler - Your Profile";
    fetchUser();
    return () => {};
  }, []);

  //Checks if the user is logged in and retreives their information for the profile page
  async function fetchUser() {
    let profile = localStorage.getItem("profile");
    let user;
    let username;
    let statsObj;
    let premium;
    if (profile) {
      let profileObj = JSON.parse(profile);
      if (profileObj.session) {
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
        let getProfile = await fetch("/api/profile", options);
        let profileJson = await getProfile.json();
        username = profileJson.username;
        statsObj = profileJson.statsObj;
        premium = profileJson.premium;
      }
      if (username) {
        user = {
          loggedIn: true,
          premium: premium,
          imageUrl: profileObj.profile_picture,
          session: profileObj.session,
        };
      } else {
        user = {
          loggedIn: false,
          premium: false,
          imageUrl: "/images/site/account2.png",
        };
      }
    } else {
      user = {
        loggedIn: false,
        premium: false,
        imageUrl: "/images/site/account2.png",
      };
    }

    if (statsObj) {
      let today = new Date();
      try {
        //Removes old games from stats and updates the averages
        for (let i = 2; i <= 7; i++) {
          if (statsObj[`${i}random-scores`]) {
            let shifted = false;
            while (
              today.getTime() -
                new Date(
                  statsObj[`${i}random-scores`].scores30[0].date
                ).getTime() >
              2592000000
            ) {
              statsObj[`${i}random-scores`].scores30.shift();
              shifted = true;
            }
            if (shifted) {
              let average30 =
                statsObj[`${i}random-scores`].scores30.reduce((total, x) => {
                  return total + x.score;
                }, 0) / statsObj[`${i}random-scores`].scores30.length;

              statsObj[`${i}random-scores`].average30.average = average30;
              statsObj[`${i}random-scores`].average30.numberOfGames =
                statsObj[`${i}random-scores`].scores30.length;
            }

            if (statsObj[`${i}random-scores`].best30.average === 8) {
              statsObj[`${i}random-scores`].best30.average = "";
              statsObj[`${i}random-scores`].best30.date = "";
            }
          }

          if (statsObj[`${i}digits-scores`]) {
            let shifted = false;
            while (
              today.getTime() -
                new Date(
                  statsObj[`${i}digits-scores`].scores30[0].date
                ).getTime() >
              2592000000
            ) {
              statsObj[`${i}digits-scores`].scores30.shift();
              shifted = true;
            }
            if (shifted) {
              let average30 =
                statsObj[`${i}digits-scores`].scores30.reduce((total, x) => {
                  return total + x.score;
                }, 0) / statsObj[`${i}digits-scores`].scores30.length;

              statsObj[`${i}digits-scores`].average30.average = average30;
            }
          }
        }
      } catch {}
    }

    if (username) {
      setProfilePage(
        <div className="profile-page">
          <Helmet>
            <meta name="description" content={`Your Profile`} />
            <meta
              name="keywords"
              content="numbler profile, numbler statistics, numbler account"
            />
          </Helmet>
          <NavbarDynamic digits={0} user={user} instructions={" invisible"} />
          <MyProfile
            user={user}
            username={username}
            stats={statsObj}
            premium={premium}
          />
        </div>
      );
    } else {
      localStorage.removeItem("profile");
      sessionStorage.setItem("currentMode", "daily");
      window.location = "/login";
    }
  }

  return profilePage;
}

export default ProfilePage;
