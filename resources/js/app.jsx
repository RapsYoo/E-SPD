import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Global anti-double-click / anti-spam guard untuk semua aksi mutasi (POST/PUT/PATCH/DELETE).
let activeMutations = 0;

router.on('before', (event) => {
    const method = (event.detail.visit?.method || 'get').toLowerCase();
    if (method === 'get') {
        return;
    }

    if (activeMutations > 0) {
        event.preventDefault();
        return false;
    }

    activeMutations += 1;
    document.body.setAttribute('data-submitting', 'true');
});

router.on('finish', (event) => {
    const method = (event.detail.visit?.method || 'get').toLowerCase();
    if (method === 'get') {
        return;
    }

    activeMutations = Math.max(0, activeMutations - 1);
    if (activeMutations === 0) {
        document.body.removeAttribute('data-submitting');
    }
});

if (typeof document !== 'undefined') {
    document.addEventListener(
        'submit',
        (event) => {
            if (activeMutations > 0) {
                event.preventDefault();
                event.stopPropagation();
            }
        },
        true,
    );
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
