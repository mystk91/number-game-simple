import React, { useState, useEffect, useRef, useCallback } from "react";
import "./Instructions.css";
import "../../normalize.css";
import "../../custom.css";

//A modal that will pop-up when a new user visits the page or hits the question mark button.
//Gives a guide on how to play the game.
function InstructionsFive(props) {
  //Used to hide the modal after its done being used
  const [displayInstructions, setDisplayInstructions] = useState("");

  //Stops the game from being played when the modal is open
  const stopOtherKeydowns = useCallback((e) => {
    e.stopPropagation();
  }, []);

  //componentDidMount, runs when component mounts, then componentDismount
  useEffect(() => {
    setDigitAnimationTimingRef(setInterval(tickDigitAnimation, 400));
    setFlipAnimationTimingRef(setInterval(tickFlipAnimation, 400));
    document.addEventListener("keydown", stopOtherKeydowns, true);
    return () => {
      clearInterval(digitAnimationTimingRef.current);
      clearInterval(flipAnimationTimingRef.current);
      document.removeEventListener("keydown", stopOtherKeydowns, true);
    };
  }, []);

  /* Hides the modal when you click outside the main box */
  function hideInstructionsModal(e) {
    if (e.target.classList[0] === "instructions-modal") {
      document.removeEventListener("keydown", stopOtherKeydowns, true);
      setDisplayInstructions(" hide-modal");
      clearInterval(digitAnimationTimingRef.current);
      clearInterval(flipAnimationTimingRef.current);
    }
  }

  /* Hides the modal when you click on the X */
  function hideInstructionsButton(e) {
    document.removeEventListener("keydown", stopOtherKeydowns, true);
    setDisplayInstructions(" hide-modal");
    clearInterval(digitAnimationTimingRef.current);
    clearInterval(flipAnimationTimingRef.current);
  }

  /* The following functions are used to animate the first digit box on the page
  /* Used for the tickDigitAnimation */
  const digitAnimationTimingRef = useRef();
  function setDigitAnimationTimingRef(point) {
    digitAnimationTimingRef.current = point;
  }

  const digitAnimationIndexRef = useRef(0);
  function setDigitAnimationIndexRef(point) {
    digitAnimationIndexRef.current = point;
  }

  const exampleNumber = [5, 3, 8, 1, 2];

  const [currentDigitNumber, setCurrentDigitNumber] = useState([
    "",
    "",
    "",
    "",
    "",
  ]);

  const [currentDigit, setCurrentDigit] = useState([
    " current-digit",
    "",
    "",
    "",
    "",
  ]);

  function tickDigitAnimation() {
    if (digitAnimationIndexRef.current > 24) {
      setDigitAnimationIndexRef(0);
    } else if (digitAnimationIndexRef.current > currentDigitNumber.length) {
      setDigitAnimationIndexRef(digitAnimationIndexRef.current + 1);
    } else {
      let newCurrentDigit = [];
      let newCurrentNumbers = [];
      for (let i = 0; i < currentDigitNumber.length; i++) {
        if (i === digitAnimationIndexRef.current) {
          newCurrentDigit.push(" current-digit");
        } else {
          newCurrentDigit.push("");
        }
      }
      let max = Math.min(
        digitAnimationIndexRef.current,
        currentDigitNumber.length
      );
      for (let i = 0; i < max; i++) {
        newCurrentNumbers.push(exampleNumber[i]);
      }
      while (newCurrentNumbers.length < currentDigitNumber.length) {
        newCurrentNumbers.push("");
      }
      setCurrentDigit(newCurrentDigit);
      setCurrentDigitNumber(newCurrentNumbers);
      setDigitAnimationIndexRef(digitAnimationIndexRef.current + 1);
    }
  }

  /* The following functions are used to animate the flip that occurs in examples 2/3
  /* Used for the tickFlipAnimation */
  const flipAnimationTimingRef = useRef();
  function setFlipAnimationTimingRef(point) {
    flipAnimationTimingRef.current = point;
  }

  const flipKeyframe = useRef(0);
  function setFlipKeyframe(point) {
    flipKeyframe.current = point;
  }

  const flipClassList = [
    " yellow delay-4",
    " green delay-3",
    " grey delay-2",
    " yellow delay-1",
    " grey delay-0",
    " higher",
    " lower",
  ];

  const [currentClassList, setCurrentClassList] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  function tickFlipAnimation() {
    if (flipKeyframe.current === 5) {
      setCurrentClassList(flipClassList);
      setFlipKeyframe(flipKeyframe.current + 1);
    } else if (flipKeyframe.current === 26) {
      setCurrentClassList(["", "", "", "", "", "", ""]);
      setFlipKeyframe(1);
    } else {
      setFlipKeyframe(flipKeyframe.current + 1);
    }
  }

  return (
    <div
      className={"instructions-modal" + displayInstructions}
      onClick={(e) => hideInstructionsModal(e)}
      aria-label="Instructions Modal"
    >
      <div className="instructions" aria-label="Instructions">
        <span className="instructions-top">
          <button
            className="close-instructions"
            onClick={(e) => hideInstructionsButton(e)}
            aria-label="Close Instructions"
          >
            X
          </button>
        </span>
        <span className="headline">How to play</span>
        <div className="instructions-text">
          Guess the correct number in six tries.
        </div>
        <div
          className="game-example current-row"
          aria-label="Example Row"
        >
          <div className={"digit" + currentDigit[0]} aria-label="1st Digit">
            {currentDigitNumber[0]}
          </div>
          <div className={"digit" + currentDigit[1]} aria-label="2nd Digit">
            {currentDigitNumber[1]}
          </div>
          <div className={"digit" + currentDigit[2]} aria-label="3rd Digit">
            {currentDigitNumber[2]}
          </div>
          <div className={"digit" + currentDigit[3]} aria-label="4th Digit">
            {currentDigitNumber[3]}
          </div>
          <div className={"digit" + currentDigit[4]} aria-label="5th Digit">
            {currentDigitNumber[4]}
          </div>
          <div className="hint" aria-label="Empty Hint"></div>
        </div>
        <div className="instructions-text">
          Arrows tell you to guess higher or lower.
        </div>
        <div
          className="game-example previous-row"
          aria-label="Example Row"
        >
          <div
            className={"digit" + currentClassList[0] + currentClassList[5]}
            aria-label="1st Digit, Yellow"
          >
            5
          </div>
          <div
            className={"digit" + currentClassList[1] + currentClassList[5]}
            aria-label="2nd Digit, Green"
          >
            3
          </div>
          <div
            className={"digit" + currentClassList[2] + currentClassList[5]}
            aria-label="3rd Digit, Grey"
          >
            8
          </div>
          <div
            className={"digit" + currentClassList[3] + currentClassList[5]}
            aria-label="4th Digit, Yellow"
          >
            1
          </div>
          <div
            className={"digit" + currentClassList[4] + currentClassList[5]}
            aria-label="5th Digit, Grey"
          >
            2
          </div>
          <div
            className={"hint" + currentClassList[5]}
            aria-label="Guess Higher Arrow"
          ></div>
        </div>
        <div
          className="game-example previous-row"
          aria-label="Example Row"
        >
          <div
            className={"digit" + currentClassList[0] + currentClassList[6]}
            aria-label="1st Digit, Yellow"
          >
            5
          </div>
          <div
            className={"digit" + currentClassList[1] + currentClassList[6]}
            aria-label="2nd Digit, Green"
          >
            3
          </div>
          <div
            className={"digit" + currentClassList[2] + currentClassList[6]}
            aria-label="3rd Digit, Grey"
          >
            8
          </div>
          <div
            className={"digit" + currentClassList[3] + currentClassList[6]}
            aria-label="4th Digit, Yellow"
          >
            1
          </div>
          <div
            className={"digit" + currentClassList[4] + currentClassList[6]}
            aria-label="5th Digit, Grey"
          >
            2
          </div>
          <div
            className={"hint" + currentClassList[6]}
            aria-label="Guess Lower Arrow"
          ></div>
        </div>
        <hr></hr>
        <div className="instructions-text">
          Colors indicate the spot the digit should be in.
        </div>
        <hr></hr>
        <div className="instructions-text">
          Green digits are in the correct spot.
        </div>
        <div
          className="game-example colors-example"
          aria-label="Example Row"
        >
          <div className="digit" aria-label="1st Digit">
            5
          </div>
          <div className="digit green current-digit" aria-label="2nd Digit, Green">
            3
          </div>
          <div className="digit" aria-label="3rd Digit">
            8
          </div>
          <div className="digit" aria-label="4th Digit">
            1
          </div>
          <div className="digit" aria-label="5th Digit">
            2
          </div>
          <div className="hint" aria-label="Empty Hint"></div>
        </div>
        <div className="instructions-text">
          Yellow digits are in wrong spot.
        </div>
        <div
          className="game-example colors-example"
          aria-label="Example Row"
        >
          <div className="digit yellow current-digit" aria-label="1st Digit, Yellow">
            5
          </div>
          <div className="digit" aria-label="2nd Digit">
            3
          </div>
          <div className="digit" aria-label="3rd Digit">
            8
          </div>
          <div className="digit yellow current-digit" aria-label="4th Digit, Yellow">
            1
          </div>
          <div className="digit" aria-label="5th Digit">
            2
          </div>
          <div className="hint" aria-label="Empty Hint"></div>
        </div>
        <div className="instructions-text">Grey digits are not used again.</div>
        <div
          className="game-example colors-example"
          aria-label="Example Row"
        >
          <div className="digit" aria-label="1st Digit">
            5
          </div>
          <div className="digit" aria-label="2nd Digit">
            3
          </div>
          <div className="digit grey current-digit" aria-label="3rd Digit, Grey">
            8
          </div>
          <div className="digit" aria-label="4th Digit">
            1
          </div>
          <div className="digit grey current-digit" aria-label="5th Digit, Grey">
            2
          </div>
          <div className="hint" aria-label="Empty Hint"></div>
        </div>
      </div>
    </div>
  );
}

export default InstructionsFive;
