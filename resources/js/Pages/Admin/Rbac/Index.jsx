import React, { useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Save,
  Layers,
  Lock,
  Unlock,
  CheckSquare,
  Square,
  Info,
} from 'lucide-react';

export default function AdminRbacIndex({
  roles = {},
  modules = [],
  rolePermissions = {},
  defaultPermissions = {},
}) {
  const roleKeys = Object.keys(roles);
  const [selectedRole, setSelectedRole] = useState(roleKeys[0] || 'pemohon');
  const [draftMatrix, setDraftMatrix] = useState(rolePermissions);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    setDraftMatrix(rolePermissions);
  }, [rolePermissions]);

  const activeRoleMeta = roles[selectedRole] || {
    label: selectedRole,
    description: '',
    badge: '',
  };

  const selectedModules = useMemo(
    () => new Set(draftMatrix[selectedRole] || []),
    [draftMatrix, selectedRole]
  );

  const savedModules = useMemo(
    () => new Set(rolePermissions[selectedRole] || []),
    [rolePermissions, selectedRole]
  );

  const defaultRoleModules = useMemo(
    () => new Set(defaultPermissions[selectedRole] || []),
    [defaultPermissions, selectedRole]
  );

  const hasUnsavedChanges = useMemo(() => {
    if (selectedModules.size !== savedModules.size) return true;
    for (const key of selectedModules) {
      if (!savedModules.has(key)) return true;
    }
    return false;
  }, [selectedModules, savedModules]);

  const groupedModules = useMemo(() => {
    const groups = {};
    modules.forEach((mod) => {
      if (!groups[mod.category]) {
        groups[mod.category] = [];
      }
      groups[mod.category].push(mod);
    });
    return groups;
  }, [modules]);

  const toggleModule = (moduleKey) => {
    setDraftMatrix((prev) => {
      const current = new Set(prev[selectedRole] || []);
      if (current.has(moduleKey)) {
        current.delete(moduleKey);
      } else {
        current.add(moduleKey);
      }
      return {
        ...prev,
        [selectedRole]: Array.from(current),
      };
    });
  };

  const toggleCategory = (categoryModules, enableAll) => {
    setDraftMatrix((prev) => {
      const current = new Set(prev[selectedRole] || []);
      categoryModules.forEach((mod) => {
        if (enableAll) {
          current.add(mod.key);
        } else {
          current.delete(mod.key);
        }
      });
      return {
        ...prev,
        [selectedRole]: Array.from(current),
      };
    });
  };

  const handleSave = () => {
    if (saving || resetting) return;
    setSaving(true);
    router.put(
      route('admin.rbac.update', selectedRole),
      {
        modules: draftMatrix[selectedRole] || [],
      },
      {
        preserveScroll: true,
        onFinish: () => setSaving(false),
      }
    );
  };

  const handleResetRole = () => {
    if (saving || resetting) return;
    if (
      !window.confirm(
        `Kembalikan hak akses role ${activeRoleMeta.label} ke pengaturan default sistem?`
      )
    ) {
      return;
    }
    setResetting(true);
    router.post(
      route('admin.rbac.reset', selectedRole),
      {},
      {
        preserveScroll: true,
        onFinish: () => setResetting(false),
      }
    );
  };

  return (
    <AdminLayout title="Manajemen Hak Akses Role (RBAC)">
      <Head title="Hak Akses Role (RBAC) - e-SPD Pusdiklat Kemlu" />

      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-600">
            <ShieldCheck className="h-4 w-4" />
            <span>Master Database • Otorisasi Dinamis</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Manajemen Hak Akses Modul (RBAC)
          </h1>
          <p className="text-xs text-slate-500">
            Atur visibilitas menu sidebar dan izin akses modul untuk setiap role pengguna secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={saving || resetting}
            onClick={handleResetRole}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4 text-slate-500" />
            <span>Reset Role ke Default</span>
          </button>

          <button
            type="button"
            disabled={saving || resetting}
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-extrabold text-slate-950 shadow-md shadow-amber-500/20 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Menyimpan...' : `Simpan Hak Akses ${activeRoleMeta.label}`}</span>
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-xs text-blue-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <div className="space-y-1">
          <p className="font-bold">Cara Kerja Pengaturan Modul RBAC:</p>
          <p className="text-blue-800/90 leading-relaxed">
            Saat suatu modul <strong>dinonaktifkan</strong> pada sebuah role, menu terkait akan{' '}
            <strong>otomatis tertutup/disembunyikan dari Sidebar</strong> pengguna role tersebut dan akses langsung melalui URL juga akan ditolak oleh sistem. Role <strong>Admin Master</strong> selalu memiliki akses penuh ke seluruh modul.
          </p>
        </div>
      </div>

      {/* Main Layout: Role Selector (Left) & Module Matrix (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Role Selector */}
        <div className="space-y-2.5 lg:col-span-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Pilih Role Pengguna
            </h2>
            <div className="space-y-2">
              {roleKeys.map((roleKey) => {
                const meta = roles[roleKey];
                const isSelected = selectedRole === roleKey;
                const count = (draftMatrix[roleKey] || []).length;

                return (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => setSelectedRole(roleKey)}
                    className={`w-full rounded-xl border p-3.5 text-left transition ${
                      isSelected
                        ? 'border-[#0B2247] bg-[#0B2247] text-white shadow-md'
                        : 'border-slate-200/80 bg-slate-50/70 text-slate-800 hover:border-amber-400 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-extrabold">{meta.label}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {count} / {modules.length} Modul
                      </span>
                    </div>
                    <p
                      className={`mt-1 text-[11px] leading-relaxed ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {meta.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Modules Toggle Cards */}
        <div className="space-y-5 lg:col-span-8">
          {/* Active Role Summary Bar */}
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Konfigurasi Role: {activeRoleMeta.label}
                </h2>
                <span className="rounded-md bg-amber-100 px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-amber-800">
                  {selectedRole === 'sespalu' ? 'sesparlu' : selectedRole}
                </span>
                {hasUnsavedChanges && (
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                    Belum Disimpan
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{activeRoleMeta.description}</p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-emerald-800">
                Aktif: {selectedModules.size} Modul
              </span>
            </div>
          </div>

          {/* Grouped Modules */}
          {Object.entries(groupedModules).map(([category, categoryModules]) => {
            const allEnabledInCategory = categoryModules.every((m) =>
              selectedModules.has(m.key)
            );

            return (
              <section
                key={category}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-amber-600" />
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                      {category}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleCategory(categoryModules, !allEnabledInCategory)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 transition hover:text-blue-800"
                  >
                    {allEnabledInCategory ? (
                      <>
                        <Square className="h-3.5 w-3.5" />
                        <span>Nonaktifkan Kategori</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare className="h-3.5 w-3.5" />
                        <span>Aktifkan Semua</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {categoryModules.map((mod) => {
                    const isEnabled = selectedModules.has(mod.key);
                    const isDefault = defaultRoleModules.has(mod.key);

                    return (
                      <div
                        key={mod.key}
                        onClick={() => toggleModule(mod.key)}
                        className={`flex cursor-pointer items-start justify-between gap-4 p-4 transition ${
                          isEnabled ? 'bg-emerald-50/25 hover:bg-emerald-50/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{mod.label}</span>
                            <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
                              {mod.route_hint}
                            </span>
                            {isDefault && (
                              <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                Default Role
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-slate-500">
                            {mod.description}
                          </p>
                        </div>

                        {/* Toggle Switch */}
                        <div className="flex shrink-0 items-center gap-2.5 pt-0.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              isEnabled
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isEnabled ? (
                              <>
                                <Unlock className="h-3 w-3" />
                                <span>Aktif</span>
                              </>
                            ) : (
                              <>
                                <Lock className="h-3 w-3" />
                                <span>Nonaktif</span>
                              </>
                            )}
                          </span>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={isEnabled}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleModule(mod.key);
                            }}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                isEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-end gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <button
              type="button"
              disabled={saving || resetting}
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B2247] px-6 py-2.5 text-xs font-extrabold text-white shadow transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4 text-amber-400" />
              <span>{saving ? 'Menyimpan...' : `Simpan Perubahan (${activeRoleMeta.label})`}</span>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

