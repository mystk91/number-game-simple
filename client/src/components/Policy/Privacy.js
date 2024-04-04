import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
} from "react";
import "./Policy.css";
import "../../normalize.css";
import "../../custom.css";

function Privacy(props) {
  return (
    <div className="privacy policy">
      <h1>Numbler Privacy Policy</h1>
      <p>
        Your privacy is important to us, and we want you to understand how we
        collect, use, and protect your information when you use our service.
      </p>
      <h3>What Information We Collect and How We Use It</h3>
      <p>
        When you use Numbler, we may ask for your email address and allow you to
        sign in using your Google account. We use this to manage your account,
        keep track of purchases, and to communicate with you about site updates
        and offers. Additionally, we use cookies to create login sessions and to
        keep track of games.
      </p>
      <h3>How We Share Your Information</h3>
      <p>
        We do not share your personal information with other services. However,
        there may be situations that require us to share that data, such as
        legal requests or business transfers.
      </p>
      <h3>How Long We Keep Your Information</h3>
      <p>
        We'll only keep your personal information for as long as we need it to
        provide you with our service, unless we're required to keep it longer
        for legal reasons.
      </p>
      <h3>Your Rights</h3>
      <p>
        You can delete your personal information at any time by going to your
        account settings or by contacting us.
      </p>
      <h3>Children's Privacy</h3>
      <p>
        Numbler does not knowingly collect personal information from children
        under the age of 13. If we become aware that we have collected personal
        information from a child under 13 without parental consent, we will take
        steps to delete that information.
      </p>
      <h3>Security</h3>
      <p>
        We follow industry standard practices to protect your account
        information. While we do our best to protect your data, no method of
        transmission over the internet is completely secure.
      </p>
      <h3>Changes to This Policy</h3>
      <p>
        We may update this policy from time to time, and we'll let you know
        about any significant changes. You should check back periodically for
        updates.
      </p>
      <h3>Contact Us</h3>
      <p>
        If you have any questions or concerns about this policy or your personal
        information, please email us at{" "}
        <a href={`mailto:contact@numbler.net`}>contact@numbler.net</a>
      </p>
      <br />
      <p>Thank you for trusting us with your information!</p>
    </div>
  );
}

export default Privacy;
