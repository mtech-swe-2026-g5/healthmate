'use client';

import './AppCalendar.css'
import {Calendar, Event, momentLocalizer, Views} from 'react-big-calendar'
import moment from 'moment'
import {useCallback} from "react";

const localizer = momentLocalizer(moment)

type OnScheduleCallback = (startDate: Date, endDate: Date) => void;
type OnRangeChangeCallback = (startDate: Date, endDate: Date) => void;
type OnEventSelectCallback = (event: AppCalendarEvent) => void;

export interface OnScheduleCallbackResult {
    id: string;
    title: string;
}

export interface AppCalendarEvent extends Event {
    id?: string;
    readonly?: boolean;
}

export interface AppCalendarProps {
    isLoading: boolean;
    events?: AppCalendarEvent[];
    allowOverlap?: boolean;
    allowEventCreation?: boolean;
    onSchedule?: OnScheduleCallback;
    onEventSelect?: OnEventSelectCallback;
    onRangeChange?: OnRangeChangeCallback;
    className?: string;
}


export default function AppCalendar(props: AppCalendarProps) {
    const onRangeChange = props.onRangeChange
    const onSchedule = props.onSchedule;

    const handleOnRangeChange = useCallback((range: Date[] | { start: Date; end: Date }) => {
        if (onRangeChange) {
            if (Array.isArray(range)) {
                onRangeChange(moment(range[0]).startOf('day').toDate(), moment(range[range.length - 1]).endOf('day').endOf('hour').endOf('minute').toDate())
            } else {
                onRangeChange(moment(range.start).startOf('day').toDate(), moment(range.end).endOf('day').endOf('hour').endOf('minute').toDate());
            }

        }
    }, [onRangeChange]);

    const handleSelectSlot = useCallback(
        ({start, end}: { start: Date; end: Date }) => {
            if (!props.allowOverlap) {
                const overlapEvents = props.events?.filter(event =>
                    moment(start).isBetween(event.start, event.end) || moment(end).isBetween(event.start, event.end)
                );
                if (overlapEvents?.length) {
                    window.alert('Cannot schedule overlap events.');
                    return;
                }
            }
            if (onSchedule) {
                onSchedule(start, end);
            }
        },
        [props.events, props.allowOverlap, onSchedule]
    )


    return <div className={`${props.className} ${props.isLoading ? 'loading' : ''}`}>
        <Calendar
            localizer={localizer}
            defaultView={Views.WEEK}
            views={[Views.WEEK, Views.DAY]}
            events={props.events}
            onSelectEvent={props.onEventSelect}
            onSelectSlot={props.allowEventCreation ? handleSelectSlot : undefined}
            selectable={props.allowEventCreation}
            scrollToTime={new Date()}
            onRangeChange={handleOnRangeChange}
        />
    </div>
}