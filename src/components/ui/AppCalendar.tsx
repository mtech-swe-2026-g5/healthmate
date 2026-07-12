'use client';

import './AppCalendar.css'
import {Calendar, Event, momentLocalizer, Views} from 'react-big-calendar'
import moment from 'moment'
import {v4 as uuidV4} from "uuid";
import {useCallback, useState} from "react";

const localizer = momentLocalizer(moment)

type OnScheduleCallback = (startDate: Date, endDate: Date) => OnScheduleCallbackResult;
type OnRangeChangeCallback = (startDate: Date, endDate: Date) => void;

export interface OnScheduleCallbackResult {
    id: string;
    title: string;
}

export interface AppCalendarEvent extends Event {
    id?: string;
    readonly?: boolean;
}

export interface AppCalendarProps {
    events?: AppCalendarEvent[];
    allowOverlap?: boolean;
    allowEventCreation?: boolean;
    onSchedule?: OnScheduleCallback;
    onRangeChange?: OnRangeChangeCallback;
    className?: string;
}

const defaultOnSchedule: OnScheduleCallback = (startDate: Date, endDate: Date) => {
    const title = window.prompt(`Provide a name for the event to be scheduled between ${startDate} and ${endDate}`, 'New Event') || 'New Event'
    return {
        id: uuidV4(),
        title: title,
    }
};

export default function AppCalendar(props: AppCalendarProps) {
    const onRangeChange = props.onRangeChange
    const [calendarEvents, setCalendarEvents] = useState<AppCalendarEvent[]>(props.events || []);
    const handleOnRangeChange = useCallback((range: Date[] | { start: Date; end: Date }) => {
        if (onRangeChange) {
            if (Array.isArray(range)) {
                onRangeChange(moment(range[0]).startOf('day').toDate(), moment(range[range.length - 1]).endOf('day').toDate())
            } else {
                onRangeChange(moment(range.start).startOf('day').toDate(), moment(range.end).endOf('day').toDate());
            }

        }
    }, [onRangeChange]);

    const handleSelectSlot = useCallback(
        ({start, end}: { start: Date; end: Date }) => {
            if (!props.allowOverlap) {
                const overlapEvents = calendarEvents.filter(event =>
                    moment(start).isBetween(event.start, event.end) || moment(end).isBetween(event.start, event.end)
                );
                if (overlapEvents.length) {
                    window.alert('Cannot schedule overlap events.');
                    return;
                }
            }
            const onScheduleCallback = props.onSchedule || defaultOnSchedule;
            const callbackResult = onScheduleCallback(start, end);
            if (callbackResult) {
                setCalendarEvents((prev: AppCalendarEvent[]) => [...prev, {
                    id: callbackResult.id,
                    title: callbackResult.title,
                    start: start,
                    end: end
                }])
            }
        },
        [calendarEvents, props.allowOverlap, props.onSchedule]
    )

    const handleSelectEvent = useCallback(
        (event: AppCalendarEvent) => window.alert(event.title),
        []
    )

    return <div className={props.className}>
        <Calendar
            localizer={localizer}
            defaultView={Views.WEEK}
            views={[Views.WEEK, Views.DAY]}
            events={calendarEvents}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={props.allowEventCreation ? handleSelectSlot : undefined}
            selectable={props.allowEventCreation}
            scrollToTime={new Date()}
            onRangeChange={handleOnRangeChange}
        />
    </div>
}