import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  useCallback,
} from "react";
import "./SiteMessage.css";
import "../../normalize.css";
import "../../custom.css";

//Used to create a confirmation / update message for the user.
//Redirects the user to a different page when they click on the confirmation button
// props.message  - the message that will be displayed in the box
// props.buttonText - the text that appears on the button
// props.buttonUrl - the url that  the button leads to
function SiteMessage(props) {
  const [message, setMessage] = useState(props.message);
  const [buttonText, setButtonText] = useState(props.buttonText);
  const [buttonUrl, setButtonUrl] = useState(props.buttonUrl);

  //componentDidMount, runs when component mounts, then componentDismount
  useEffect(() => {
    document.addEventListener("keydown", confirmMessage, true);
    return () => {
      document.removeEventListener("keydown", confirmMessage, true);
    };
  }, []);

  //Goes to the link when you hit enter
  const confirmMessage = useCallback((e) => {
    e.stopPropagation();
    if (e.key == "Enter") {
      window.location = buttonUrl;
    }
  }, []);

  return (
    <div className="site-message">
      <div className="message-container" aria-label="Message Container">
        <div className="message">{message}</div>
        <a href={buttonUrl}>
          <button className="confirmation-btn">{buttonText}</button>
        </a>
      </div>
    </div>
  );
}

export default SiteMessage;
