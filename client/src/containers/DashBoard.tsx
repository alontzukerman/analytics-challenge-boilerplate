import React from "react";
import { Interpreter } from "xstate";
import { AuthMachineContext, AuthMachineEvents } from "../machines/authMachine";
import AllEventsGM from '../components/eventsComponents/AllEventsGM';
import PageViews from '../components/eventsComponents/PageViews';
import UsersByOS from '../components/eventsComponents/UsersByOS';
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
    gridTemplateRows: '40vh 40vh 40vh 40vh 40vh',
    gridAutoRows: 'auto',
    gridAutoColumns: 'auto',
    gridGap: '3vh'
  }
  return (
    <div id="dashBoard" style={style}>
        <AllEventsGM />
        <UniqueSessionsByDay />
        <UniqueSessionsByHour />
        <RetentionCohortByWeeks />
        <LogEvents />
        <PageViews />
        <UsersByOS />
    </div>
  );
};

export default DashBoard;
