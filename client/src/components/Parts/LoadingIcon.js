import React, { useState, useEffect, useRef } from "react";
import "./LoadingIcon.css";
import "../../normalize.css";
import "../../custom.css";

//Creates an unposition box with a loading icon inside it
//Takes box-width, box-height, icon-height. (in pixels)
function LoadingIcon(props) {
  const [property, setProperty] = useState("initialValue");
  const propRef = useRef("initialValue");
  function setPropRef(point) {
    propRef.current = point;
  }

  const [boxWidth, setBoxWidth] = useState();
  const [boxHeight, setBoxHeight] = useState();
  const [iconHeight, setIconHeight] = useState();

  //componentDidMount, runs when component mounts, then componentDismount
  useEffect(() => {
    setBoxWidth(props.boxWidth || "360px");
    setBoxHeight(props.boxHeight || "128px");
    setIconHeight(props.iconHeight || "64px");
    return () => {};
  }, []);
  //componentDidUpdate, runs after render
  useEffect(() => {}, [property]);
  //componentDismount
  useEffect(() => {
    return () => {};
  });

  return (
    <div className="loading-icon1-container" style={{width: boxWidth, height: boxHeight}} aria-label="Loading Icon">
      <span className="loading-icon1" style={{width: iconHeight, height: iconHeight}}></span>
    </div>
  );
}

export default LoadingIcon;
