import {act, cleanup, render, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import type {AppCalendarEvent} from '@/components/ui/AppCalendar';
import AppCalendar from '@/components/ui/AppCalendar';

type MockCalendarProps = {
    events?: AppCalendarEvent[];
    selectable?: boolean;
    onSelectSlot?: (slot: { start: Date; end: Date }) => void;
    onSelectEvent?: (event: { title: string }) => void;
    onRangeChange?: (range: Date[] | { start: Date; end: Date }) => void;
};

const mockState = vi.hoisted(() => ({
    calendarProps: null as MockCalendarProps | null,
    momentLocalizer: vi.fn(() => 'mock-localizer'),
    uuidV4: vi.fn(() => 'generated-event-id'),
    prompt: vi.fn(() => 'New Event'),
    alert: vi.fn(),
}));

const getCalendarProps = () => {
    if (!mockState.calendarProps) {
        throw new Error('Calendar props were not captured');
    }

    return mockState.calendarProps;
};

vi.mock('react-big-calendar', () => ({
    Calendar: vi.fn((props: MockCalendarProps) => {
        mockState.calendarProps = props;
        return <div data-testid="app-calendar"/>;
    }),
    Views: {
        WEEK: 'WEEK',
        DAY: 'DAY',
    },
    momentLocalizer: mockState.momentLocalizer,
}));

vi.mock('uuid', () => ({
    v4: mockState.uuidV4,
}));

describe('AppCalendar', () => {
    beforeEach(() => {
        mockState.calendarProps = null;
        vi.clearAllMocks();
        vi.stubGlobal('prompt', mockState.prompt);
        vi.stubGlobal('alert', mockState.alert);
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
    });

    it('renders the calendar with the provided events and class name', () => {
        const events: AppCalendarEvent[] = [
            {
                id: 'existing-event',
                title: 'Existing appointment',
                start: new Date('2026-07-12T09:00:00.000Z'),
                end: new Date('2026-07-12T10:00:00.000Z'),
            },
        ];

        const {container} = render(
            <AppCalendar className="calendar-shell" events={events} allowEventCreation={false}/>,
        );

        const calendar = container.querySelector('[data-testid="app-calendar"]');

        expect(calendar).not.toBeNull();
        expect(calendar?.parentElement).toBe(container.firstElementChild);
        expect((calendar?.parentElement as HTMLElement | null)?.className).toBe('calendar-shell');
        const calendarProps = getCalendarProps();

        expect(calendarProps.events).toEqual(events);
        expect(calendarProps.selectable).toBe(false);
        expect(calendarProps.onSelectSlot).toBeUndefined();
    });

    it('adds a new event when a free slot is selected', async () => {
        render(<AppCalendar allowEventCreation onSchedule={(start, end) => ({
            id: 'custom-id',
            title: `Visit ${start.toISOString()} ${end.toISOString()}`
        })}/>);

        const slot = {
            start: new Date('2026-07-12T11:00:00.000Z'),
            end: new Date('2026-07-12T11:30:00.000Z'),
        };

        act(() => {
            getCalendarProps().onSelectSlot?.(slot);
        });

        await waitFor(() => {
            expect(getCalendarProps().events).toHaveLength(1);
        });

        expect(getCalendarProps().events?.[0]).toMatchObject({
            id: 'custom-id',
            title: expect.stringContaining('Visit'),
            start: slot.start,
            end: slot.end,
        });
    });

    it('uses the default scheduler when no onSchedule callback is provided', async () => {
        mockState.prompt.mockReturnValueOnce('');
        render(<AppCalendar allowEventCreation/>);

        const slot = {
            start: new Date('2026-07-12T12:00:00.000Z'),
            end: new Date('2026-07-12T12:45:00.000Z'),
        };

        act(() => {
            getCalendarProps().onSelectSlot?.(slot);
        });

        await waitFor(() => {
            expect(mockState.prompt).toHaveBeenCalledWith(
                expect.stringContaining('Provide a name for the event to be scheduled between'),
                'New Event',
            );
        });

        expect(mockState.uuidV4).toHaveBeenCalledTimes(1);
        expect(getCalendarProps().events).toHaveLength(1);
        expect(getCalendarProps().events?.[0]).toMatchObject({
            id: 'generated-event-id',
            title: 'New Event',
            start: slot.start,
            end: slot.end,
        });
    });

    it.each([
        {
            name: 'normalizes an array range',
            range: [
                new Date('2026-07-12T09:15:00.000Z'),
                new Date('2026-07-13T10:30:00.000Z'),
            ] as Date[],
            expectedStart: '2026-07-12T00:00:00.000Z',
            expectedEnd: '2026-07-13T23:59:59.999Z',
        },
        {
            name: 'normalizes a start/end range object',
            range: {
                start: new Date('2026-07-14T13:45:00.000Z'),
                end: new Date('2026-07-16T08:20:00.000Z'),
            },
            expectedStart: '2026-07-14T00:00:00.000Z',
            expectedEnd: '2026-07-16T23:59:59.999Z',
        },
    ])(
        'calls onRangeChange when the calendar range changes and %s',
        ({range, expectedStart, expectedEnd}) => {
            const onRangeChange = vi.fn();

            render(<AppCalendar onRangeChange={onRangeChange}/>);

            act(() => {
                getCalendarProps().onRangeChange?.(range);
            });

            expect(onRangeChange).toHaveBeenCalledTimes(1);
            expect(onRangeChange).toHaveBeenCalledWith(
                new Date(expectedStart),
                new Date(expectedEnd),
            );
        },
    );

    it('does nothing when the calendar range changes and no onRangeChange handler is provided', () => {
        render(<AppCalendar/>);

        expect(() => {
            act(() => {
                getCalendarProps().onRangeChange?.({
                    start: new Date('2026-07-12T09:15:00.000Z'),
                    end: new Date('2026-07-16T08:20:00.000Z'),
                });
            });
        }).not.toThrow();

        expect(mockState.prompt).not.toHaveBeenCalled();
        expect(mockState.alert).not.toHaveBeenCalled();
    });

    it('allows overlapping appointments when overlap is enabled', async () => {
        const events: AppCalendarEvent[] = [
            {
                id: 'existing-event',
                title: 'Existing appointment',
                start: new Date('2026-07-12T09:00:00.000Z'),
                end: new Date('2026-07-12T10:00:00.000Z'),
            },
        ];
        const onSchedule = vi.fn(() => ({id: 'allowed-overlap', title: 'Allowed overlap'}));

        render(
            <AppCalendar
                events={events}
                allowEventCreation
                allowOverlap
                onSchedule={onSchedule}
            />,
        );

        act(() => {
            getCalendarProps().onSelectSlot?.({
                start: new Date('2026-07-12T08:30:00.000Z'),
                end: new Date('2026-07-12T09:30:00.000Z'),
            });
        });

        await waitFor(() => {
            expect(onSchedule).toHaveBeenCalledTimes(1);
        });

        expect(mockState.alert).not.toHaveBeenCalled();
        expect(getCalendarProps().events).toHaveLength(2);
    });

    it.each([
        {
            name: 'accepts a non-overlapping slot',
            slot: {
                start: new Date('2026-07-12T10:30:00.000Z'),
                end: new Date('2026-07-12T10:45:00.000Z'),
            },
            shouldAlert: false,
            expectedEventCount: 2,
            expectedScheduleCalls: 1,
        },
        {
            name: 'rejects a slot when the first overlap condition fails',
            slot: {
                start: new Date('2026-07-12T09:30:00.000Z'),
                end: new Date('2026-07-12T10:30:00.000Z'),
            },
            shouldAlert: true,
            expectedEventCount: 1,
            expectedScheduleCalls: 0,
        },
        {
            name: 'rejects a slot when the second overlap condition fails',
            slot: {
                start: new Date('2026-07-12T08:30:00.000Z'),
                end: new Date('2026-07-12T09:30:00.000Z'),
            },
            shouldAlert: true,
            expectedEventCount: 1,
            expectedScheduleCalls: 0,
        },
    ])(
        '$name',
        ({slot, shouldAlert, expectedEventCount, expectedScheduleCalls}) => {
            const events: AppCalendarEvent[] = [
                {
                    id: 'existing-event',
                    title: 'Existing appointment',
                    start: new Date('2026-07-12T09:00:00.000Z'),
                    end: new Date('2026-07-12T10:00:00.000Z'),
                },
            ];
            const onSchedule = vi.fn(() => ({id: 'new-event', title: 'New appointment'}));

            render(
                <AppCalendar
                    events={events}
                    allowEventCreation
                    allowOverlap={false}
                    onSchedule={onSchedule}
                />,
            );

            act(() => {
                getCalendarProps().onSelectSlot?.(slot);
            });

            expect(onSchedule).toHaveBeenCalledTimes(expectedScheduleCalls);
            expect(mockState.alert).toHaveBeenCalledTimes(shouldAlert ? 1 : 0);
            if (shouldAlert) {
                expect(mockState.alert).toHaveBeenCalledWith('Cannot schedule overlap events.');
            }
            expect(getCalendarProps().events).toHaveLength(expectedEventCount);
        },
    );

    it('alerts the event title when an appointment is selected', () => {
        render(<AppCalendar events={[]}/>);

        act(() => {
            getCalendarProps().onSelectEvent?.({title: 'Dental checkup'});
        });

        expect(mockState.alert).toHaveBeenCalledWith('Dental checkup');
    });
});

