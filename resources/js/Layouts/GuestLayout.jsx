<<<<<<< HEAD
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
=======
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-gray-100 pt-6 sm:justify-center sm:pt-0">
            <div>
                <Link href="/">
                    <ApplicationLogo className="h-20 w-20 fill-current text-gray-500" />
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-white px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg">
                {children}
            </div>
        </div>
    );
>>>>>>> af2d40d45070198084a26a5cda9acc844aa69d65
}
