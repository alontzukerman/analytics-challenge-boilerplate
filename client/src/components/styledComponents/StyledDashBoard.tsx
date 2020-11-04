import styled from 'styled-components';
import DashBoard from '../../containers/DashBoard';

const StyledDashBoard = styled(DashBoard)`
    // display: grid;
    // grid-template-areas: 
    //     "urlperuser alleventsgm alleventsgm"
    //     "uniquesessionsbyhour totaltimeurlofallusers uniquesessionsbyday"
    //     "retentioncohortbyweeks logevents";

    // & #allEventsGM {
    //     grid-area: alleventsgm;
    // }
    // & #urlPerUser {
    //     grid-area: urlperuser;
    // }
    // & #totalTimeUrlOfAllUsers {
    //     grid-area: totaltimeurlofallusers;
    // }
    // & #uniqueSessionsByDay {
    //     grid-area: uniquesessionsbyday;  
    // }
    // & #uniqueSessionsByHour {
    //     grid-area: uniquesessionsbyhour;
    // }
    // & #retentionCohortByWeeks {
    //     grid-area: retentioncohortbyweeks;
    // }
    // & #logEvents {
    //     grid-area: logevents;
    // }
    display: flex;
`;

export default StyledDashBoard ;