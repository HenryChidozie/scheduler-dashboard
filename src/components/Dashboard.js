import React, { Component } from "react";
import axios from "axios";
import Laoding from "./Loading";
import Panel from "./Panel";
import {
  getTotalInterviews,
  getLeastPopularTimeSlot,
  getMostPopularDay,
  getInterviewsPerDay
} from "helpers/selectors";
import { setInterview } from "helpers/reducers";
import classnames from "classnames";
const data = [
  {
    id: 1,
    label: "Total Interviews",
    getValue: getTotalInterviews
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getValue: getLeastPopularTimeSlot
  },
  {
    id: 3,
    label: "Most Popular Day",
    getValue: getMostPopularDay
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getValue: getInterviewsPerDay
  }
];
class Dashboard extends Component {
  state = {
    loading: false,
    days: [],
    appointments: {},
    interviewers: {},
    focused: null
  };
  componentDidMount() {
    const focused = JSON.parse(localStorage.getItem("focused"));
    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);
    if (focused) {
      this.setState({ focused });
    }
    Promise.all([
      axios.get("http://localhost:8001/api/days"),
      axios.get("http://localhost:8001/api/appointments"),
      axios.get("http://localhost:8001/api/interviewers")
    ]).then(([days, appointments, interviewers]) => {
      this.socket.onmessage = event => {
        const data = JSON.parse(event.data);
        if (typeof data === "object" && data.type === "SET_INTERVIEW") {
          this.setState(previousState =>
            setInterview(previousState, data.id, data.interview)
          );
        }
      };
      this.setState({
        loading: false,
        days: days.data,
        appointments: appointments.data,
        interviewers: interviewers.data
      });
    });
  }
  componentDidUpdate(previousProps, previousState) {
    if (previousState.focused !== this.state.focused) {
      localStorage.setItem("focused", JSON.stringify(this.state.focused));
    }
  }
  componentWillUnmount() {
    this.socket.close();
  }
  handleChangeFocus = id => {
    this.setState(prev => ({
      ...prev,
      focused: prev.focused !== null ? null : id
    }));
  };
  render() {
    console.log(this.state);
    const panels = data
      .filter(
        item => this.state.focused === null || this.state.focused === item.id
      )
      .map(item => {
        const { id, label, getValue } = item;
        return (
          <Panel
            key={id}
            id={id}
            label={label}
            value={getValue(this.state)}
            onClick={() => this.handleChangeFocus(id)}
          />
        );
      });
    const dashboardClasses = classnames("dashboard", {
      "dashboard--focused": this.state.focused
    });
    if (this.state.loading) {
      return <Laoding />;
    }
    return <main className={dashboardClasses}>{panels}</main>;
  }
}
export default Dashboard;