import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { weeklyRetentionObject } from '../../models/event';
import StyledContainer from '../../containers/StyledContainer';

const week = 7*24*60*60*1000 ;
const useStyles = makeStyles({
    table: {
      width: '100%',
      height: '100%'
    },
    row: {
        width: '100%',
        height: '10%'
    },
    cell: {
        width: '40%',
        height: '100%'
    }
  });

const RetentionCohortByWeeks: React.FC = () => {

    const [dayZero , setDayZero] = useState<number>(new Date().getTime()-5*week);
    const [retention , setRetention] = useState<weeklyRetentionObject[]>();

    const classes = useStyles();

    const getRetentionFrom: () => Promise<void> = async () => {
        const { data } = await axios({
            method: "get",
            url: `http://localhost:3001/events/retention?dayZero=${dayZero}`
        });
        console.log(data);
        setRetention(data);
    }

    useEffect(()=>{
        getRetentionFrom();
    },[]);
    return (
        <StyledContainer id="retentionCohortByWeeks" style={{gridArea: '2 / 1 / 3 / 7'}}>
            <TableContainer className={classes.table} component={Paper}>
                <Table  aria-label="simple table">
                    <TableHead>
                        <TableRow className={classes.row}>
                            <TableCell className={classes.cell}></TableCell>
                            <TableCell>WEEK 0</TableCell>
                            <TableCell>WEEK 1</TableCell>
                            <TableCell>WEEK 2</TableCell>
                            <TableCell>WEEK 3</TableCell>
                            <TableCell>WEEK 4</TableCell>
                            <TableCell>WEEK 5</TableCell>
                            <TableCell>WEEK 6</TableCell>
                            <TableCell>WEEK 7</TableCell>
                            <TableCell>WEEK 8</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {
                            retention && 
                            retention.map((row,i)=>{
                                return (
                                    <TableRow key={row.registrationWeek} className={classes.row}>
                                        <TableCell className={classes.cell} component="th" scope="row">
                                            <div>{`${row.start} - ${row.end}`}</div>
                                            <div>{`${row.newUsers} users`}</div>
                                        </TableCell>
                                        {
                                            row.weeklyRetention.map(weekly=>{
                                                return (
                                                    <TableCell>{`${weekly}%`}</TableCell>
                                                    )
                                                })
                                            }
                                    </TableRow>
                                )
                            })
                        }
                    </TableBody>
                </Table>
            </TableContainer>
        </StyledContainer>
    )
}

export default RetentionCohortByWeeks
