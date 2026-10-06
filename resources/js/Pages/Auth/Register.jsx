/**
 * Register page — delegates to Login.jsx which detects the /register URL
 * and renders the RegisterForm inside the same split-screen Kemlu layout.
 *
 * Inertia renders this component at the /register route; the Login component
 * checks `usePage().url` to switch between Login and Register forms.
 */
export { default } from '@/Pages/Auth/Login';
