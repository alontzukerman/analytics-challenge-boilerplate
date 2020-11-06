///<reference path="types.ts" />

import express from "express";
import { Request, Response } from "express";

// some useful database functions in here:
import {
  getAllEvents,
  getSessionsByDay,
  getSessionsByHour,
  getAllFilteredEvents,
  addNewEvent,
  getRetentionCohort
} from "./database";
import { browser, Event, eventName, weeklyRetentionObject } from "../../client/src/models/event";
import { ensureAuthenticated, validateMiddleware } from "./helpers";

import {
  shortIdValidation,
  searchValidation,
  userFieldsValidator,
  isUserValidator,
} from "./validators";
import { filter } from "bluebird";
const router = express.Router();

// Routes

export interface Filter {
  sorting?: '+date' | '-date';
  type?: eventName | 'all';
  browser?: browser | 'all';
  search?: string;
  offset?: number;
}

router.get('/all', (req: Request, res: Response) => {
  const allEvents: Event[] = getAllEvents();
  res.status(200).json(allEvents);
});

router.get('/all-filtered', (req: Request, res: Response) => {
  const filters: Filter = req.query;
  console.log(filters);
  const allFilteredEvents: Event[] = getAllFilteredEvents(filters);


  res.status(200).json({
    events: allFilteredEvents.slice(0,filters.offset),
    more: allFilteredEvents.length>10
  })
});

router.get('/by-days/:offset', (req: Request, res: Response) => {
  const offset = +req.params.offset || 0 ;
  const sessionsByDate = getSessionsByDay();

  const lastWeekSessions = sessionsByDate.slice(sessionsByDate.length-(offset+7),sessionsByDate.length-offset);
  res.status(200).json(lastWeekSessions);
});

router.get('/by-hours/:offset', (req: Request, res: Response) => {
  const offset = +req.params.offset || 0 ;
  let temp_date = ((new Date().getTime())-(offset*24*60*60*1000));
  const selectedDate = getSessionsByHour(temp_date);
  res.status(200).json(selectedDate)
});

router.get('/today', (req: Request, res: Response) => {
  res.send('/today')
});

router.get('/week', (req: Request, res: Response) => {
  res.send('/week')
});

router.get('/retention', (req: Request, res: Response) => {
  const {dayZero} = req.query ;
  // const weeklyRetentionCohort: weeklyRetentionObject[] = getRetentionCohort(dayZero)
  res.send('/retention')
});
router.get('/:eventId',(req : Request, res : Response) => {
  res.send('/:eventId')
});

router.post('/', (req: Request, res: Response) => {
  const newEvent: Event = req.body ;
  addNewEvent(newEvent);
  res.status(200).json("new Event created");
});

router.get('/chart/os/:time',(req: Request, res: Response) => {
  res.send('/chart/os/:time')
})

  
router.get('/chart/pageview/:time',(req: Request, res: Response) => {
  res.send('/chart/pageview/:time')
})

router.get('/chart/timeonurl/:time',(req: Request, res: Response) => {
  res.send('/chart/timeonurl/:time')
})

router.get('/chart/geolocation/:time',(req: Request, res: Response) => {
  res.send('/chart/geolocation/:time')
})


export default router;
