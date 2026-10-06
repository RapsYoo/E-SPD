import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useCallback, useState } from 'react';

// ─── Kemlu Logo SVG (inline — no external request needed) ────────────────────
function KemluLogo({ className = '' }) {
    return (
        <img
            src="/images/kemlu-logo.webp"
            alt="Logo Kementerian Luar Negeri Republik Indonesia"
            className={className}
        />
    );
}

// ─── Password Input ───────────────────────────────────────────────────────────
function PasswordInput({ id, value, onChange, placeholder, autoComplete, error }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input
                id={id}
                type={show ? 'text' : 'password'}
                autoComplete={autoComplete}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`block w-full rounded-lg border py-3 pl-4 pr-11 text-sm text-slate-700 placeholder-slate-400 outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-200 ${
                    error ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
            />
            <button
                type="button"
                tabIndex={-1}
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600 transition-colors focus:outline-none"
                aria-label={show ? 'Sembunyikan' : 'Tampilkan'}
            >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

// ─── Login Form ───────────────────────────────────────────────────────────────
function LoginForm({ canResetPassword, status }) {
    const { errors } = usePage().props;
    const [form, setForm] = useState({ email: '', password: '', remember: false });
    const [loading, setLoading] = useState(false);

    const set = useCallback((key) => (value) => setForm((f) => ({ ...f, [key]: value })), []);

    const submit = (e) => {
        e.preventDefault();
        setLoading(true);
        router.post(route('login'), form, { onFinish: () => setLoading(false) });
    };

    return (
        <form onSubmit={submit} noValidate className="space-y-4">
            {status && (
                <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
                    {status}
                </div>
            )}

            {/* Username / Email */}
            <div>
                <input
                    id="email"
                    type="text"
                    autoComplete="username"
                    autoFocus
                    value={form.email}
                    onChange={(e) => set('email')(e.target.value)}
                    placeholder="Username atau Email"
                    className={`block w-full rounded-lg border py-3 px-4 text-sm text-slate-700 placeholder-slate-400 outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-200 ${
                        errors?.email ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                />
                {errors?.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <PasswordInput
                id="password"
                value={form.password}
                onChange={set('password')}
                placeholder="Password"
                autoComplete="current-password"
                error={errors?.password}
            />

            {/* Forgot password */}
            <div className="flex justify-end">
                {canResetPassword && (
                    <Link
                        href={route('password.request')}
                        className="text-sm text-sky-600 hover:text-sky-800 hover:underline transition-colors"
                    >
                        Forgot password?
                    </Link>
                )}
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-400 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? 'Memproses…' : 'Masuk'}
            </button>

        </form>
    );
}

// ─── Register Form ────────────────────────────────────────────────────────────
function RegisterForm() {
    const { errors } = usePage().props;
    const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
    const [loading, setLoading] = useState(false);

    const set = useCallback((key) => (value) => setForm((f) => ({ ...f, [key]: value })), []);

    const submit = (e) => {
        e.preventDefault();
        setLoading(true);
        router.post(route('register'), form, { onFinish: () => setLoading(false) });
    };

    return (
        <form onSubmit={submit} noValidate className="space-y-4">
            {/* Name */}
            <div>
                <input
                    id="name"
                    type="text"
                    autoFocus
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => set('name')(e.target.value)}
                    placeholder="Nama Lengkap"
                    className={`block w-full rounded-lg border py-3 px-4 text-sm text-slate-700 placeholder-slate-400 outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-200 ${
                        errors?.name ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                />
                {errors?.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
                <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => set('email')(e.target.value)}
                    placeholder="Email"
                    className={`block w-full rounded-lg border py-3 px-4 text-sm text-slate-700 placeholder-slate-400 outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-200 ${
                        errors?.email ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                />
                {errors?.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <PasswordInput
                id="reg-password"
                value={form.password}
                onChange={set('password')}
                placeholder="Password (min. 8 karakter)"
                autoComplete="new-password"
                error={errors?.password}
            />

            {/* Confirm Password */}
            <PasswordInput
                id="password_confirmation"
                value={form.password_confirmation}
                onChange={set('password_confirmation')}
                placeholder="Konfirmasi Password"
                autoComplete="new-password"
                error={errors?.password_confirmation}
            />

            {/* Submit */}
            <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-400 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? 'Mendaftarkan…' : 'Daftar Sekarang'}
            </button>

            {/* Back to login */}
            <div className="text-center pt-1">
                <p className="text-xs text-slate-500">
                    Sudah punya akun?{' '}
                    <Link href={route('login')} className="font-medium text-sky-600 hover:underline">
                        Masuk di sini
                    </Link>
                </p>
            </div>
        </form>
    );
}

// ─── Main Auth Page ───────────────────────────────────────────────────────────
/**
 * Split-screen auth page:
 *  Left  → login/register form with Kemlu branding
 *  Right → Pusdiklat building photo
 *
 * @param {{ canResetPassword: boolean, status?: string }} props
 */
export default function Login({ canResetPassword, status }) {
    const { url } = usePage();
    const isRegister = url.startsWith('/register');

    return (
        <>
            <Head title={isRegister ? 'Daftar Akun' : 'Masuk'} />

            <div className="flex min-h-screen">
                {/* ── Left Panel — Form ── */}
                <div className="flex w-full flex-col justify-center px-8 py-8 sm:px-12 lg:w-[460px] lg:min-w-[460px] bg-white">

                    {/* Logo + Institution Name — compact header */}
                    <div className="mb-6 text-center">
                        <div className="flex justify-center">
                            <KemluLogo className="h-44 w-44 object-contain drop-shadow-sm" />
                        </div>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                            Pusat Pendidikan dan Pelatihan
                        </p>
                        <h1 className="text-sm font-bold uppercase tracking-wide text-[#1a3a7c]">
                            Kementerian Luar Negeri
                        </h1>
                        <p className="text-xs font-bold uppercase tracking-wide text-[#c0392b]">
                            Republik Indonesia
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="mb-5 border-t border-slate-100" />

                    {/* Form title */}
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-slate-800">
                            {isRegister ? 'Buat Akun Baru' : 'Selamat Datang'}
                        </h2>
                        <p className="mt-0.5 text-sm text-slate-500">
                            {isRegister
                                ? 'Isi data diri untuk mendaftar ke sistem E-SPD'
                                : 'Silakan masuk ke sistem E-SPD'}
                        </p>
                    </div>

                    {/* Form */}
                    {isRegister ? (
                        <RegisterForm />
                    ) : (
                        <LoginForm canResetPassword={canResetPassword} status={status} />
                    )}

                    {/* Footer */}
                    <p className="mt-6 text-center text-[10px] text-slate-400">
                        &copy; {new Date().getFullYear()} E-SPD · Pusdiklat Kemlu RI
                    </p>
                </div>


                {/* ── Right Panel — Building Photo ── */}
                <div className="relative hidden flex-1 lg:block">
                    <img
                        src="/images/pusdiklat-building.jpg"
                        alt="Gedung Pusdiklat Kementerian Luar Negeri"
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    {/* Overlay gradient for text legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a3a7c]/60 via-transparent to-transparent" />

                    {/* Caption at bottom */}
                    <div className="absolute bottom-8 left-8 right-8 text-white">
                        <p className="text-xl font-bold drop-shadow">Pusdiklat Kemlu RI</p>
                        <p className="mt-1 text-sm text-white/80 drop-shadow">
                            Sistem E-SPD — Electronic Surat Perjalanan Dinas
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
