/**
 * GuestLayout
 *
 * Minimal pass-through layout for guest (unauthenticated) pages.
 * The Auth/Login page manages its own full-screen design, so this layout
 * simply renders children without imposing extra wrappers.
 *
 * @param {{ children: React.ReactNode }} props
 */
export default function GuestLayout({ children }) {
    return <>{children}</>;
}
