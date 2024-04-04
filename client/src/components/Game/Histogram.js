import React, { useState, useEffect, useRef } from "react";
import "./Histogram.css";
import "../../normalize.css";
import "../../custom.css";

//Creates a histogram of the users guesses among all their games
//Uses Local Storage
//Takes props.digits and props.attempts
function Histogram(props) {
  const [histogram, setHistogram] = useState();

  const averageScoreRef = useRef();
  function setAverageScoreRef(point) {
    averageScoreRef.current = point;
  }

  //componentDidMount, runs when component mounts, then componentDismount
  useEffect(() => {
    updateHistogram();

    return () => {};
  }, []);

  //Used to set the histogram for a game with different digits / different no. of attempts
  function updateHistogram() {
    let storageObj = JSON.parse(localStorage.getItem("scores" + props.digits));
    storageObj.scores = Object.values(storageObj.scores);
    if (storageObj) {
      let histogramArr = [];
      let histogramData = new Array(props.attempts + 1);
      for (let i = 0; i < histogramData.length; i++) {
        histogramData[i] = 0;
      }
      storageObj.scores.forEach((x) => {
        histogramData[x - 1] += 1;
      });

      let highestHist = 0;
      histogramData.forEach((x) => {
        if (x > highestHist) {
          highestHist = x;
        }
      });

      let pixelData = new Array(props.attempts + 1);
      let histoLength = 248;
      for (let i = 0; i < pixelData.length; i++) {
        if (histogramData[i] > 0) {
          pixelData[i] = Math.max(
            Math.ceil(histoLength * (histogramData[i] / highestHist)),
            10
          );
        } else {
          pixelData[i] = 0;
        }
      }
      let displayedFrequency = new Array(props.attempts + 1);
      for (let i = 0; i < displayedFrequency.length; i++) {
        if (histogramData[i] === 0) {
          displayedFrequency[i] = "";
        } else {
          displayedFrequency[i] = histogramData[i];
        }
      }
      let barStyle = new Array(props.attempts + 1);
      for (let i = 0; i < barStyle.length; i++) {
        if (histogramData[i] === 0) {
          barStyle[i] = "";
        } else {
          barStyle[i] = "inset(0 .5px 0 .5px)";
        }
      }

      for (let i = 0; i < props.attempts + 1; i++) {
        let row = (
          <div className="histogram-row" key={"histogram-row-" + i} aria-label={`Score ${i + 1} frequency: ${histogramData[i]}`}>
            <div className="histogram-score">{i + 1}</div>
            <div
              className={`histogram-bar score-${i + 1}`}
              style={{ width: `${pixelData[i]}px`, clipPath: barStyle[i] }}
            ></div>
            <div className="histogram-frequency">{displayedFrequency[i]}</div>
          </div>
        );
        histogramArr.push(row);
      }
      setHistogram(histogramArr);
      //Calculate the average score
      let average =
        storageObj.scores.reduce((total, x) => {
          return total + x;
        }, 0) / storageObj.scores.length;

      average = average.toFixed(3);
      setAverageScoreRef(average);
    }
  }

  return (
    <div className="histogram-container" aria-label="Score Histogram">
      <div className="average-score">
        Average Score: {averageScoreRef.current}{" "}
      </div>
      {histogram}
    </div>
  );
}

export default Histogram;
