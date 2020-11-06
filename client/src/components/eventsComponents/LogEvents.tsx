import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Event } from '../../models/event';
import StyledContainer from '../../containers/StyledContainer';

const style = {
    gridArea: '3 / 4 / 4 / 7',
    display: 'flex',
    border: '1px solid black'
}
const LogEvents: React.FC = () => {

    const [logEvents , setLogEvents] = useState<Event[]>();
    const [sorting , setSorting] = useState<string>('none');
    const [type , setType] = useState<string>('all');
    const [browser , setBrowser] = useState<string>('all');
    const [search , setSearch] = useState<string>('');
    const [offset , setOffset] = useState<number>(10);


    const selectSort = useRef<HTMLSelectElement>(null);
    const selectType = useRef<HTMLSelectElement>(null);
    const selectBrowser = useRef<HTMLSelectElement>(null);

    const getLogEvents: () => Promise<void> = async () => {
        const { data } = await axios({
            method: "get",
            url: `http://localhost:3001/events/all-filtered?sorting=${sorting}&type=${type}&browser=${browser}&search=${search}&offset=${offset}`
        });
        console.log(data);
        setLogEvents(data.events);
    }

    useEffect(()=>{
        getLogEvents();
    },[sorting,type,browser,search,offset]);
    return (
        <StyledContainer id="logEvents" style={style}>
            <div id="log-filters" style={{display: 'flex', flexDirection: 'column'}}>
                <input onChange={(e)=>setSearch(e.target.value)} placeholder='Search ..'></input>
                <select ref={selectSort} id="select_sort" 
                    onChange={()=>setSorting(selectSort.current!.value)}
                >
                    <option value="%2Bdate">{'New --> Old'}</option>
                    <option value="-date">{'Old --> New'}</option>
                </select>
                <select ref={selectType} id="select_type"
                    onChange={()=>setType(selectType.current!.value)}
                >
                    <option value="all">{'All'}</option>
                    <option value="login">{'Login'}</option>
                    <option value="signup">{'SignUp'}</option>
                    <option value="admin">{'Admin'}</option>
                    <option value="/">{'/'}</option>
                </select>
                <select ref={selectBrowser} id="select_browser"
                    onChange={()=>setBrowser(selectBrowser.current!.value)}
                >
                    <option value="all">{'All'}</option>
                    <option value="chrome">{'Chrome'}</option>
                    <option value="safari">{'Safari'}</option>
                    <option value="edge">{'Edge'}</option>
                    <option value="firefox">{'Firefox'}</option>
                    <option value="ie">{'Ie'}</option>
                    <option value="other">{'Other'}</option>
                </select>
            </div>
            <div id="log">
                {
                    logEvents &&
                    logEvents.map((event,i)=>{
                        return (<div className="singleLog" id={`${i}`}>{event._id}</div>)
                    })
                }
            </div>
        </StyledContainer>
    );
}

export default LogEvents
