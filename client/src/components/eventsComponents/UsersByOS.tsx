import React , { useState , useEffect } from 'react';
import axios from 'axios';
import { Event } from '../../models/event';
import {
    ResponsiveContainer , PieChart , Pie , Tooltip , Legend
} from 'recharts' ;
import StyledContainer from '../../containers/StyledContainer';

const osOptions = ["windows","mac","linux","ios","android","other"];

const UsersByOS: React.FC = () => {

    // const [allEvents , setAllEvents] = useState<Event[]>();
    const [details , setDetails] = useState<Object[]>();

    const getAllEvents: () => Promise<void> = async () => {
        const { data } = await axios({
            method: "get",
            url: 'http://localhost:3001/events/all'
        });
        console.log(data);
        // setAllEvents(data);
        createDetails(data);
    }

    const createDetails = (data: Event[]) => {
        let temp: Object[] = [];
        osOptions.forEach((option)=>{
            temp.push({
                name: option,
                count: data.filter(event=>event.os == option).length
            })
        })
        setDetails(temp);
    }
    useEffect(() => {
      getAllEvents();
    },[]);

    return (
        <StyledContainer id="users-os" style={{gridArea: '5 / 1 / 6 / 4'}}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                    <Pie data={details} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={50} fill="#8884d8" />
                </PieChart>
            </ResponsiveContainer>
        </StyledContainer>
    );
}

export default UsersByOS ;