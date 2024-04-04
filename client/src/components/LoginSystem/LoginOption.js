import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
} from "react";
import "./LoginOption.css";
import "../../normalize.css";
import "../../custom.css";
import { Link } from "react-router-dom";

function LoginOption(props) {
  const [property, setProperty] = useState("initialValue");
  const propRef = useRef("initialValue");
  function setPropRef(point) {
    propRef.current = point;
  }

  //Sets the button text if the prop exists, otherwise centers the image
  const [buttonText, setButtonText] = useState();
  const [justifyImage, setJustifyImage] = useState();

  //componentDidMount, runs when component mounts, then componentDismount
  useEffect(() => {
    if (props.buttonText) {
      setButtonText(<span>{props.buttonText}</span>);
    } else {
      setJustifyImage("center");
    }
    return () => {};
  }, []);
  //componentDidUpdate, runs after render
  useEffect(() => {}, [property]);
  //componentDismount
  useEffect(() => {
    return () => {};
  });

  async function goLogin(route) {
    window.location.href=route;
  }

  return (
    <button
      className={props.className + " login-button"}
      onClick={() => goLogin(props.route)}
      style={{ justifyContent: justifyImage }}
      aria-label={`${props.className} login`}
    >
      <img src={props.imageURL} alt={`${props.className} logo`} />
      {buttonText}
    </button>
  );
}

export default LoginOption;
