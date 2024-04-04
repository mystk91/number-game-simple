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
import NavbarDaily from "../Navbar/NavbarDaily";
import NumberGameRegular from "../Game/NumberGameRegular";
import NumberGameLocal from "../Game/NumberGameLocal";
import NavbarDynamic from "../Navbar/NavbarDynamic";
import { Helmet } from "react-helmet";

//Creates a page for the website that displays the navbar and the daily game
//The game page will either use localStorage or data from players account
function GamePageDaily(props) {
  let [gamePage, setGamePage] = useState();

  //Runs on mount. Checks if the user is logged in and sets the corresponding game page
  useEffect(() => {
    document.title = `Numbler - ${props.digits} Digits`;
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
      setGamePage(
        <div className="game-page">
          <Helmet>
            <meta
              name="description"
              content={`A ${props.digits}-digit number guessing game. Use hints to zero in on the correct number!`}
            />
            <meta
              name="keywords"
              content="numbler, game, number game, number games, guessing game, guessing games, number guessing game, logic game, logic games, math game, math games, strategy game, strategy games, guess the number,  guess a number, puzzle, math puzzle, puzzle game, puzzle games"
            />
          </Helmet>
          <NavbarDynamic digits={props.digits} user={user} />
          <NumberGameRegular
            digits={props.digits}
            attempts={props.attempts}
            user={user}
          />
        </div>
      );
    } else {
      localStorage.removeItem("profile");
      setGamePage(
        <div className="game-page">
          <Helmet>
            <meta
              name="description"
              content={`A ${props.digits}-digit number guessing game. Use hints to zero in on the correct number!`}
            />
            <meta
              name="keywords"
              content="numbler, game, number game, number games, guessing game, guessing games, number guessing game, logic game, logic games, math game, math games, strategy game, strategy games, guess the number,  guess a number, puzzle, math puzzle, puzzle game, puzzle games"
            />
          </Helmet>
          <Navbar digits={props.digits} user={user} />
          <NumberGameLocal
            digits={props.digits}
            attempts={props.attempts}
            user={user}
          />
        </div>
      );
    }
  }

  return gamePage;
}

export default GamePageDaily;
