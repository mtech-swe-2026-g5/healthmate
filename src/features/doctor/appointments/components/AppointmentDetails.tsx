import {Patient} from "@/features/doctor/appointments/types/response";

export interface AppointmentDetailsProps {
    patient: Patient | null;
}

export default function AppointmentDetails({patient}: AppointmentDetailsProps) {
    if (!patient) {
        return <></>;
    }
    return <table className={"table-auto w-full"}>
        <tbody>
        <tr>
            <td>Name</td>
            <td>{patient.firstName} {patient.lastName}</td>
        </tr>
        <tr>
            <td>Age</td>
            <td>{patient.age}</td>
        </tr>
        <tr>
            <td>Gender</td>
            <td>{patient.gender}</td>
        </tr>
        <tr>
            <td>Blood Group</td>
            <td>{patient.bloodGroup}</td>
        </tr>
        <tr>
            <td>Phone Number</td>
            <td>{patient.phoneNumber}</td>
        </tr>
        </tbody>
    </table>;
}