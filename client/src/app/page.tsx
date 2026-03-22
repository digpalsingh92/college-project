import { redirect } from 'next/navigation';

// Root "/" redirects to the website home in the (website) route group
export default function RootPage() {
  redirect('/');
}
