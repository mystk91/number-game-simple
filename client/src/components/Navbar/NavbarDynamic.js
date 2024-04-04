import React, { useState, useEffect, useRef } from "react";
import "../../normalize.css";
import "../../custom.css";
import Navbar from "./Navbar";
import NavbarDaily from "./NavbarDaily";

/*Creates a navbar based on if user is logged in / signed up to random mode
  props.digits - the number of digits the game has
  props.user - takes a user object that was fetched from a higher order component
*/
function NavbarDynamic(props) {
  const [navbar, setNavbar] = useState(
    <div className="navigation-bar-container">
      <nav className="navigation-bar"></nav>
    </div>
  );

  //componentDidMount, runs when component mounts, then componentDismount
  useEffect(() => {
    fetchUser();
    return () => {};
  }, []);

  //Checks if user is logged in and sets a Navbar
  async function fetchUser() {
    if (props.user.loggedIn) {
      setNavbar(
        <Navbar
          digits={props.digits}
          user={props.user}
          instructions={props.instructions}
          login={props.login}
        />
      );
    } else {
      setNavbar(
        <Navbar
          digits={props.digits}
          user={props.user}
          instructions={props.instructions}
          login={props.login}
        />
      );
    }
  }

  return navbar;
}

export default NavbarDynamic;
