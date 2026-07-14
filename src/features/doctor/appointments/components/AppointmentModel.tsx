import {Patient} from "@/features/doctor/appointments/types/response";
import Model from "@/components/ui/Model";
import AppointmentDetails from "@/features/doctor/appointments/components/AppointmentDetails";

export interface AppointmentModelProps {
    patient: Patient | null;
    isModelOpen: boolean;
    onClose: () => void;
}

export default function AppointmentModel({patient, isModelOpen, onClose}: AppointmentModelProps) {
    return <Model title="Appointment Details" content={<AppointmentDetails patient={patient}/>}
                  isOpen={isModelOpen} onClose={onClose}/>;
}