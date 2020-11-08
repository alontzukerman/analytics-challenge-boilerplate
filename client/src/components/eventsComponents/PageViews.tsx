import React , { useState , useEffect } from 'react';
import axios from 'axios';
import { Event } from '../../models/event';
import {
    ResponsiveContainer , PieChart , Pie , Tooltip , Legend
} from 'recharts' ;
import StyledContainer from '../../containers/StyledContainer';

const pageOptions = ["login","signup","admin","/"];

const PageViews: React.FC = () => {

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
        pageOptions.forEach((option)=>{
            temp.push({
                name: option,
                count: data.filter(event=>event.name == option).length
            })
        })
        setDetails(temp);
    }

    useEffect(() => {
      getAllEvents();
    },[]);
    return (
        <StyledContainer id="page-views" style={{gridArea: '5 / 4 / 6 / 7'}}>
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

export default PageViews ;