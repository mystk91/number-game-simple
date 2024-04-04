import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
} from "react";
import "../../normalize.css";
import "../../custom.css";
import GamePageDaily from "./GamePageDaily";

//Sets the homepage to the 5 digits mode most of the time,
//but will set it to 4 digits some of the time
function Homepage(props) {
  const [homepage, setHomepage] = useState();

  //componentDidMount, runs when component mounts, then componentDismount
  useEffect(() => {
    let digits = sessionStorage.getItem("homepage");
    if (sessionStorage.getItem("homepage")) {
      if (digits === "4") {
        setHomepage(<GamePageDaily digits={4} attempts={6} />);
      } else {
        setHomepage(<GamePageDaily digits={5} attempts={6} />);
      }
    } else {
      let n = Math.floor(Math.random() * 10);
      if (n < 7) {
        sessionStorage.setItem("homepage", "4");
        setHomepage(<GamePageDaily digits={4} attempts={6} />);
      } else {
        sessionStorage.setItem("homepage", "5");
        setHomepage(<GamePageDaily digits={5} attempts={6} />);
      }
    }

    return () => {};
  }, []);

  return homepage;
}

export default Homepage;
