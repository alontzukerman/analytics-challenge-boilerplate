import axios from 'axios';
import React, { useEffect, useState, useRef } from 'react';
import {
    LineChart , Line , XAxis , YAxis , CartesianGrid , Tooltip , Legend , ReferenceLine , ResponsiveContainer
} from 'recharts' ;
const d3 = require('d3-time');
const UniqueSessionsByDay: React.FC = () => {

    const todayDate: string = new Date().toISOString().slice(0,10) ;

    const [info , setInfo] = useState();
    const [lastSessionDate , setLastSessionDate] = useState<string | undefined>();
    const [offset , setOffset] = useState(0);
    const [inputValue , setInputValue] = useState<string>(todayDate);

    const input = useRef<HTMLInputElement>(null);


    const getSessionsByDay: () => Promise<void> = async() => {
        const { data } = await axios({
            method: "get",
            url: `http://localhost:3001/events/by-days/${offset}`
        });
        console.log(data);
        if(!lastSessionDate) setLastSessionDate(data[data.length-1].date!)
        setInfo(data);
    }

    const handleInputChange = () => {
        const chosenDate: string = input.current!.value; 
        input.current!.value = chosenDate ;
        console.log(chosenDate);
        setInputValue(chosenDate);
        setOffset(d3.timeDay.count(new Date(chosenDate),new Date(lastSessionDate!)))
    }

    useEffect(()=> {
        console.log(offset);
        getSessionsByDay();
    },[offset]);
    return (
        <div id="uniqueSessionsByDay" style={{gridArea: '2 / 4 / 3 / 7'}}>
            <input type="date" id="end-date-days" ref={input}
                onChange={handleInputChange}
                value={inputValue} 
                min="2020-10-07" 
                max={todayDate}
            ></input>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={info}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={'date'} />
                    <YAxis dataKey={'count'} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default UniqueSessionsByDay
