import React, { useState, useEffect, useRef } from "react";
import "./ShareScore.css";
import "../../normalize.css";
import "../../custom.css";

//Copies the gameboard as unicode emojis so it can be pasted elsewhere
//props.hints - for the game that was just completed
//props.date - the date the game
//props.random - true if this is a random game
function ShareScore(props) {
  const hintsRef = useRef();
  function setHintsRef(point) {
    hintsRef.current = point;
  }

  //Used to swap the text on the button to tell user it copied their gameboard
  let [shareButtonText, setShareButtonText] = useState("Copy & Share");

  //componentDidMount, runs when component mounts, then componentDismount
  useEffect(() => {
    if (props.hints) {
      setHintsRef(props.hints);
    }
  }, []);

  //Copys the user's board for that game
  async function shareMyScore(e) {
    const grey = `\u{2B1C}`;
    const green = `\u{1F7E9}`;
    const yellow = `\u{1F7E8}`;
    const equals = `\u{2705}`;
    const upArrow = `\u{2B06}`;
    const downArrow = `\u{2B07}`;

    let headerSpacesLeft;
    let bodySpacesLeft;
    let labelSpacesLeft;

    if (props.random) {
      headerSpacesLeft = [1, 1, 2, 4, 7, 9];
      bodySpacesLeft = [3, 1, 0, 0, 0, 0];
      labelSpacesLeft = [0, 0, 1, 3, 6, 8];
    } else {
      headerSpacesLeft = [0, 1, 2, 5, 7, 9];
      bodySpacesLeft = [2, 1, 0, 0, 0, 0];
      labelSpacesLeft = [1, 1, 3, 5, 7, 10];
    }

    let copiedText = "";
    for (let i = 0; i < headerSpacesLeft[props.hints[0].length - 3]; i++) {
      copiedText += " ";
    }
    copiedText += "Numbler.net\n";

    let attempts = 1;
    props.hints.forEach((x) => {
      for (let i = 0; i < bodySpacesLeft[props.hints[0].length - 3]; i++) {
        copiedText += " ";
      }

      for (let i = 0; i < x.length - 1; i++) {
        switch (x[i]) {
          case "G": {
            copiedText += green;
            break;
          }
          case "Y": {
            copiedText += yellow;
            break;
          }
          default: {
            copiedText += grey;
            break;
          }
        }
      }

      switch (x[x.length - 1]) {
        case "E": {
          copiedText += equals + "\n";
          break;
        }
        case "H": {
          copiedText += upArrow + "\n";
          attempts++;
          break;
        }
        case "L": {
          copiedText += downArrow + "\n";
          attempts++;
          break;
        }
        default: {
        }
      }

      if (!x) {
        for (let i = 0; i < props.hints[0].length - 1; i++) {
          copiedText += green;
        }
        copiedText += equals + "\n";
      }
    });
    for (let i = 0; i < labelSpacesLeft[props.hints[0].length - 3]; i++) {
      copiedText += " ";
    }
    copiedText += attempts + "/" + props.hints.length + " - ";
    if (props.random) {
      copiedText += "Random";
    } else {
      copiedText += getDate();
    }

    async function writeClipboardItem(text) {
      try {
        const clipboardItem = new ClipboardItem({
          "text/plain": new Blob([text], { type: "text/plain" }),
        });
        await navigator.clipboard.write([clipboardItem]);
      } catch (err) {}
    }
    await writeClipboardItem(copiedText);
    e.target.style.cursor = "default";
    e.target.style.pointerEvents = "none";
    e.target.classList = "share clicked";
    setShareButtonText("Copied to Clipboard!");
    setTimeout(() => {
      setShareButtonText("Copy & Share");
      e.target.classList = "share";
      e.target.style.cursor = "copy";
      e.target.style.pointerEvents = "auto";
    }, 2000);
  }

  //Gets the date in EST
  function getDate() {
    let date;
    if (props.date) {
      date = props.date.toLocaleString("default", {
        timeZone: "America/New_York",
        month: "short",
        day: "numeric",
      });
      return date;
    }
    date = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
    });
    return date;
  }

  return (
    <button
      className="share"
      onClick={shareMyScore}
      aria-label="Copy your game to clipboard"
    >
      {shareButtonText}
    </button>
  );
}

export default ShareScore;
