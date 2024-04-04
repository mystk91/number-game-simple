import React, { useState, useEffect, useRef } from "react";
import "./HistogramProfile.css";
import "../../normalize.css";
import "../../custom.css";

/*
    Used to create a histogram for a game with different digits / different no. of attempts
    props.modal - set to true to keep the wide width on the stats container
    props.averageLabel
    props.attempts - number of attempts allowed on the game, usually 6
    props.scoresObj - an object containing scores used in the histogram
      scoresObj.average30
      scoresObj.average
      scoresObj.scores30
      scoresObj.scores
  */
function HistogramRegular(props) {
  const [histogram, setHistogram] = useState();
  const histogramDataRef = useRef();
  function setHistogramDataRef(point) {
    histogramDataRef.current = point;
  }

  const averageScoreRef = useRef();
  function setAverageScoreRef(point) {
    averageScoreRef.current = point;
  }

  const [averageLabel, setAverageLabel] = useState();

  //componentDidMount, runs when component mounts, then componentDismount
  useEffect(() => {
    updateHistogram();
    setAverageLabel(props.averageLabel);
    return () => {};
  }, []);

  function updateHistogram() {
    let scoresObj = props.scoresObj;
    if (scoresObj) {
      let histogramArr = [];
      let histogramData = new Array(props.attempts + 1);
      for (let i = 0; i < histogramData.length; i++) {
        histogramData[i] = 0;
      }

      if (props.scoreType === "average") {
        for (let i = 0; i < scoresObj.scores.length; i++) {
          histogramData[scoresObj.scores[i] - 1] += 1;
        }
      } else if (props.scoreType === "average30") {
        scoresObj.scores30.forEach((x) => {
          histogramData[x.score - 1] += 1;
        });
      } else if (props.scoreType === "best30") {
        scoresObj.best30.scores.forEach((x) => {
          histogramData[x.score - 1] += 1;
        });
      }

      let highestHist = 0;
      histogramData.forEach((x) => {
        if (x > highestHist) {
          highestHist = x;
        }
      });

      let pixelData = new Array(props.attempts + 1);
      let histoLength = 248;
      if (!props.modal) {
        histoLength = 190;
      }
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
          <div
            className="histogram-row"
            key={"histogram-row-" + i}
            aria-label={`Score ${i + 1} frequency: ${histogramData[i]}`}
          >
            <div className="histogram-score">{i + 1}</div>
            <div
              className={"histogram-bar score-" + (i + 1)}
              style={{ width: pixelData[i] + "px", clipPath: barStyle[i] }}
            ></div>
            <div className="histogram-frequency">{displayedFrequency[i]}</div>
          </div>
        );
        histogramArr.push(row);
      }
      setHistogram(histogramArr);
      //Calculate the average score
      if (props.averageLabel) {
        if (props.scoreType === "average") {
          let average = scoresObj.average.toFixed(3);
          setAverageScoreRef(average);
        } else if (props.scoreType === "average30") {
          let average = scoresObj.average30.average.toFixed(3);
          setAverageScoreRef(average);
        } else if (props.scoreType === "best30") {
          let average = scoresObj.best30.average.toFixed(3);
          setAverageScoreRef(average);
        }
      }
    }
  }

  return (
    <div className="histogram-container profile" aria-label="Score Histogram">
      <div className="average-score">
        {averageLabel}
        {averageScoreRef.current}
      </div>
      {histogram}
    </div>
  );
}

export default HistogramRegular;
