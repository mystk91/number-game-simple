import React, { useState, useEffect, useRef, useCallback } from "react";
import "./ProfileComponents.css";
import "../../normalize.css";
import "../../custom.css";
import LoadingIcon from "../Parts/LoadingIcon";

//Displays contact information for questsions / bugs, also contains site policies
function Contact(props) {
  //Adds higher priority email for users with random mode
  const [email, setEmail] = useState("contact@numbler.net");

  //componentDidMount, runs when component mounts, then componentDismount
  useEffect(() => {
    return () => {};
  }, []);

  return (
    <div className="contact" aria-label="Contact Us Container">
      <h1>Contact Us</h1>

      <h2 className="contact-text">
        <div>Questions?</div>
        <div>Issues?</div>
        <div> Bugs?</div>
      </h2>

      <div className="contact-text email">
        <div>Send us an email at:&nbsp;</div>
        <a href={`mailto:${email}`}>{email}</a>
      </div>
    </div>
  );
}

export default Contact;
