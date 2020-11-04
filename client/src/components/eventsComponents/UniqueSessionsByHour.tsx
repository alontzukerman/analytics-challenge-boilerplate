import axios from 'axios';
import React, { useEffect, useState, useRef } from 'react';
import {
    LineChart , Line , XAxis , YAxis , CartesianGrid , Tooltip , Legend , ReferenceLine , ResponsiveContainer
} from 'recharts' ;
const d3 = require('d3-time');

const UniqueSessionsByHour: React.FC = () => {

    const todayDate: string = new Date().toISOString().slice(0,10) ;

    const [info , setInfo] = useState();
    const [offset , setOffset] = useState(0);
    const [inputValue , setInputValue] = useState<string>(todayDate);

    const input = useRef<HTMLInputElement>(null);


    const getSessionsByHour: () => Promise<void> = async() => {

        const { data } = await axios({
            method: "get",
            url: `http://localhost:3001/events/by-hours/${offset}`
        });
        console.log(data);
        setInfo(data);
    }

    const handleInputChange = () => {
        const chosenDate: string = input.current!.value; 
        input.current!.value = chosenDate ;
        console.log(chosenDate);
        setInputValue(chosenDate);
        setOffset(d3.timeDay.count(new Date(chosenDate),new Date(todayDate)))
    }

    useEffect(()=> {
        console.log(offset);
        getSessionsByHour();
    },[offset]);
    return (
        <div id="uniqueSessionsByHour" style={{gridArea: '2 / 1 / 3 / 3'}}>
            <input type="date" id="end-date-hours" ref={input}
                onChange={handleInputChange}
                value={inputValue} 
                min="2020-10-07" 
                max={todayDate}
            ></input>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={info}>
                    <CartesianGrid  />
                    <XAxis dataKey={'hour'} />
                    <YAxis dataKey={'count'} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default UniqueSessionsByHour
