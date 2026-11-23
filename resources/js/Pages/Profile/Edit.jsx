import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { UserCog, KeyRound } from 'lucide-react';

export default function Edit({ mustVerifyEmail, status, pegawai, uptBidangList = [] }) {
  return (
    <AdminLayout title="Pengaturan Profil Akun & Data Pegawai">
      <Head title="Edit Profil - E-Jaldis Pusdiklat Kemlu" />

      <div className="space-y-6 max-w-5xl">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
              <UserCog className="w-4 h-4" />
              <span>Pengaturan Akun</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Profil Saya & Data Pegawai
            </h1>
            <p className="text-xs text-slate-500">
              Kelola foto profil, biodata kepegawaian, dan kata sandi akun E-Jaldis Anda.
            </p>
          </div>
        </div>

        {/* Profil Information & Data Pegawai */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
          <UpdateProfileInformationForm
            mustVerifyEmail={mustVerifyEmail}
            status={status}
            pegawai={pegawai}
            uptBidangList={uptBidangList}
          />
        </div>

        {/* Update Password */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
          <header className="mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>Keamanan & Kata Sandi</span>
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Pastikan akun Anda menggunakan kata sandi yang kuat dan aman untuk menjaga kerahasiaan data.
            </p>
          </header>

          <UpdatePasswordForm className="max-w-xl" />
        </div>
      </div>
    </AdminLayout>
  );
}
