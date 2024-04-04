import React, { useState, useEffect, useRef } from "react";
import "./CalendarIcon.css";
import "../../normalize.css";
import "../../custom.css";

//Creates a calendar icon using today's date
function CalendarIcon(props) {
  const [month, setMonth] = useState();
  const [day, setDay] = useState();

  //componentDidMount, runs when component mounts, then componentDismount
  useEffect(() => {
    let date = new Date();
    let month = date.toLocaleString('default', { timezone: "America/New_York", month: 'short' });
    let dayOfMonth = date.toLocaleString('default', { timezone: "America/New_York", day: 'numeric' });
    setMonth(month);
    setDay(dayOfMonth);
    return () => {};
  }, []);

  return (
    <div className="calendar-icon" aria-label="Daily Mode Icon">
      <div className="calendar-top">
        <div className="calendar-hole"></div>
        <div className="calendar-hole"></div>
      </div>
      <div className="calendar-month">{month}</div>
      <div className="calendar-day">{day}</div>
    </div>
  );
}

export default CalendarIcon;
