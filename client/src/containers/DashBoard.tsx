import React from "react";
import { Interpreter } from "xstate";
import { AuthMachineContext, AuthMachineEvents } from "../machines/authMachine";
import AllEventsGM from '../components/eventsComponents/AllEventsGM';
import UrlPerUser from '../components/eventsComponents/UrlPerUser';
import TotalTimeUrlOfAllUsers from '../components/eventsComponents/TotalTimeUrlOfAllUsers';
import UniqueSessionsByDay from '../components/eventsComponents/UniqueSessionsByDay';
import UniqueSessionsByHour from '../components/eventsComponents/UniqueSessionsByHour';
import RetentionCohortByWeeks from '../components/eventsComponents/RetentionCohortByWeeks';
import LogEvents from '../components/eventsComponents/LogEvents';

export interface Props {
  authService?: Interpreter<AuthMachineContext, any, AuthMachineEvents, any>;
}

const DashBoard: React.FC = () => {

  const style = {
    display: 'grid',
    height: '100%',
    width: '100%',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
    gridTemplateRows: '50vh 50vh 50vh',
    gridAutoRows: 'auto',
    gridAutoColumns: 'auto',
    gridGap: '3vh'
  }
  return (
    <div id="dashBoard" style={style}>
        <AllEventsGM />
        <UrlPerUser />
        <TotalTimeUrlOfAllUsers />
        <UniqueSessionsByDay />
        <UniqueSessionsByHour />
        <RetentionCohortByWeeks />
        <LogEvents />
    </div>
  );
};

export default DashBoard;
