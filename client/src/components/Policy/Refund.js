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

function Refund(props) {
  return (
    <div className="refund policy">
      <h1>Numbler Refund Policy</h1>
      <p>
        If you are unsatisfied with a product or have encountered technical
        difficulties, you may be elgible for a refund. You may request a refund
        within 7 days of purchase if you have not extensively used the purchased
        product, as determined by our usage metrics. To initiate a refund, send
        an email to the address provided in the contact tab of your profile.
        Please provide purchase details and the reason you are requesting a
        refund. Refund approval is at our discretion. Approved refunds will be
        processed back to the original payment method used.
      </p>
    </div>
  );
}

export default Refund;
