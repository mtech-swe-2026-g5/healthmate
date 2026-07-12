import {NextRequest, NextResponse} from "next/server";
import {handleApiError} from "@/lib/errors";
import {getAppointmentsByDoctor} from "@/features/doctor/appointments/services/appointment";

export async function GET(request: NextRequest) {
    try {
        const urlSearchParams = new URL(request.url).searchParams;
        const doctorId = urlSearchParams.get('doctorId');
        const startDate = new Date(urlSearchParams.get('startDate') || '');
        const endDate = new Date(urlSearchParams.get('endDate') || '');

        if (!doctorId || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return NextResponse.json(
                {message: 'Invalid request parameters'},
                {status: 400},
            );
        }

        const result = await getAppointmentsByDoctor({doctorId, startDate, endDate});
        return NextResponse.json(
            {message: 'Appointments retrieved successfully', ...result},
            {status: 200},
        );
    } catch (error) {
        return handleApiError(error);
    }
}