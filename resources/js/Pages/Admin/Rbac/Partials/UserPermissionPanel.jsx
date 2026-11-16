import React, { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import {
  CheckCircle2,
  Layers,
  Lock,
  Search,
  ShieldPlus,
  Unlock,
  UserRound,
} from 'lucide-react';

export default function UserPermissionPanel({
  users = [],
  roles = {},
  modules = [],
  rolePermissions = {},
  userPermissions = {},
}) {
  const [search, setSearch] = useState('');
  const [onlyWithExtra, setOnlyWithExtra] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [draftExtra, setDraftExtra] = useState([]);
  const [saving, setSaving] = useState(false);

  const selectedUser = users.find((u) => u.id === selectedUserId) || null;

  const savedExtra = useMemo(
    () => new Set(selectedUser ? userPermissions[selectedUser.id] || [] : []),
    [selectedUser, userPermissions]
  );

  useEffect(() => {
    setDraftExtra(Array.from(savedExtra));
  }, [savedExtra]);

  const roleModules = useMemo(
    () => new Set(selectedUser ? rolePermissions[selectedUser.role] || [] : []),
    [selectedUser, rolePermissions]
  );

  const extraSet = useMemo(() => new Set(draftExtra), [draftExtra]);

  const hasUnsavedChanges = useMemo(() => {
    if (extraSet.size !== savedExtra.size) return true;
    for (const key of extraSet) {
      if (!savedExtra.has(key)) return true;
    }
    return false;
  }, [extraSet, savedExtra]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      if (onlyWithExtra && !(userPermissions[u.id] || []).length) return false;
      if (!term) return true;
      return (
        (u.name || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term)
      );
    });
  }, [users, search, onlyWithExtra, userPermissions]);

  const groupedModules = useMemo(() => {
    const groups = {};
    modules.forEach((mod) => {
      if (!groups[mod.category]) groups[mod.category] = [];
      groups[mod.category].push(mod);
    });
    return groups;
  }, [modules]);

  const roleLabel = (role) => roles[role]?.label || role;

  const toggleExtra = (moduleKey) => {
    if (roleModules.has(moduleKey)) return;
    setDraftExtra((prev) =>
      prev.includes(moduleKey) ? prev.filter((k) => k !== moduleKey) : [...prev, moduleKey]
    );
  };

  const handleSave = () => {
    if (!selectedUser || saving) return;
    setSaving(true);
    router.put(
      route('admin.rbac.users.update', selectedUser.id),
      { modules: draftExtra.filter((k) => !roleModules.has(k)) },
      { preserveScroll: true, onFinish: () => setSaving(false) }
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left Column: User Selector */}
      <div className="space-y-2.5 lg:col-span-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Pilih Akun Pengguna
          </h2>

          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau email..."
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs focus:border-amber-400 focus:ring-amber-400"
            />
          </div>

          <label className="mb-3 flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={onlyWithExtra}
              onChange={(e) => setOnlyWithExtra(e.target.checked)}
              className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
            />
            Hanya akun yang memiliki hak akses khusus
          </label>

          <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
            {filteredUsers.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-400">Tidak ada akun ditemukan.</p>
            )}
            {filteredUsers.map((u) => {
              const isSelected = selectedUserId === u.id;
              const extraCount = (userPermissions[u.id] || []).length;

              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelectedUserId(u.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    isSelected
                      ? 'border-[#0B2247] bg-[#0B2247] text-white shadow-md'
                      : 'border-slate-200/80 bg-slate-50/70 text-slate-800 hover:border-amber-400 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-extrabold">{u.name}</span>
                    {extraCount > 0 && (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isSelected ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        +{extraCount} Khusus
                      </span>
                    )}
                  </div>
                  <div
                    className={`mt-0.5 flex items-center justify-between gap-2 text-[11px] ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    <span className="truncate">{u.email}</span>
                    <span className="shrink-0 font-semibold">{roleLabel(u.role)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Module Toggles */}
      <div className="space-y-5 lg:col-span-8">
        {!selectedUser ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <UserRound className="mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">Pilih akun di sebelah kiri</p>
            <p className="mt-1 max-w-md text-xs text-slate-500">
              Hak akses khusus hanya berlaku untuk akun yang dipilih dan ditambahkan di atas hak akses role-nya.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Hak Akses Khusus: {selectedUser.name}
                  </h2>
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-amber-800">
                    {roleLabel(selectedUser.role)}
                  </span>
                  {hasUnsavedChanges && (
                    <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                      Belum Disimpan
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Modul bertanda <strong>Dari Role</strong> sudah dimiliki melalui role dan diatur di tab Per Role.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-blue-800">
                  Role: {roleModules.size}
                </span>
                <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-800">
                  Khusus: {draftExtra.filter((k) => !roleModules.has(k)).length}
                </span>
              </div>
            </div>

            {Object.entries(groupedModules).map(([category, categoryModules]) => (
              <section
                key={category}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
              >
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-5 py-3.5">
                  <Layers className="h-4 w-4 text-amber-600" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    {category}
                  </h3>
                </div>

                <div className="divide-y divide-slate-100">
                  {categoryModules.map((mod) => {
                    const fromRole = roleModules.has(mod.key);
                    const isExtra = !fromRole && extraSet.has(mod.key);
                    const isEnabled = fromRole || isExtra;

                    return (
                      <div
                        key={mod.key}
                        onClick={() => toggleExtra(mod.key)}
                        className={`flex items-start justify-between gap-4 p-4 transition ${
                          fromRole
                            ? 'cursor-not-allowed bg-slate-50/60'
                            : isExtra
                              ? 'cursor-pointer bg-amber-50/40 hover:bg-amber-50/70'
                              : 'cursor-pointer hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{mod.label}</span>
                            <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
                              {mod.route_hint}
                            </span>
                            {fromRole && (
                              <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                Dari Role
                              </span>
                            )}
                            {isExtra && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                <ShieldPlus className="h-3 w-3" />
                                Khusus Akun Ini
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-slate-500">{mod.description}</p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2.5 pt-0.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isEnabled ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                            <span>{isEnabled ? 'Aktif' : 'Nonaktif'}</span>
                          </span>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={isEnabled}
                            disabled={fromRole}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExtra(mod.key);
                            }}
                            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:cursor-not-allowed ${
                              fromRole ? 'bg-blue-300' : isExtra ? 'bg-amber-500' : 'bg-slate-300'
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
            ))}

            <div className="flex items-center justify-end gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0B2247] px-6 py-2.5 text-xs font-extrabold text-white shadow transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4 text-amber-400" />
                <span>{saving ? 'Menyimpan...' : `Simpan Hak Akses Khusus (${selectedUser.name})`}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
