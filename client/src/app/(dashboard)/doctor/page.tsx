import { redirect } from 'next/navigation';

export default function DoctorRoot() {
  redirect('/doctor/dashboard');
}
