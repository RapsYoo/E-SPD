<?php

namespace App\Http\Requests\SuratTugas;

use App\Models\SuratTugas;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validasi draft sementara aktor (Kapus/TU/PPK). Peran → 403, status tahap tidak aktif → 409.
 */
class ActorDraftRequest extends FormRequest
{
    private const ACTOR_ROLES = [
        'kapus' => ['kapus', 'admin'],
        'tu' => ['tu', 'admin'],
        'ppk' => ['ppk', 'admin'],
    ];

    private const REQUIRED_STATUSES = [
        'kapus' => 'MENUNGGU_DISPOSISI_KAPUS',
        'tu' => 'MENUNGGU_PENOMORAN_TU',
        'ppk' => 'SELESAI_TERBIT',
    ];

    /** Aktor yang menyimpan draft (default: peran pengguna). */
    public function actor(): ?string
    {
        return $this->input('actor', $this->user()?->role);
    }

    public function authorize(): bool
    {
        $actor = $this->actor();
        $role = $this->user()?->role;

        abort_unless(
            is_string($actor) && isset(self::ACTOR_ROLES[$actor]) && in_array($role, self::ACTOR_ROLES[$actor], true),
            403
        );

        /** @var SuratTugas $suratTugas */
        $suratTugas = $this->route('suratTugas');
        abort_unless($suratTugas->status === self::REQUIRED_STATUSES[$actor], 409, 'Draft hanya dapat disimpan pada tahap yang sedang aktif.');

        return true;
    }

    public function rules(): array
    {
        return match ($this->actor()) {
            'kapus' => [
                'actor' => 'required|in:kapus',
                'kapus_decision' => 'nullable|in:YA,REVISI,STOP',
                'catatan_kapus' => 'nullable|string|max:5000',
            ],
            'tu' => [
                'actor' => 'required|in:tu',
                'nomor_st' => 'nullable|string|max:255',
                'nomor_spd' => 'nullable|string|max:255',
                'tanggal_surat' => 'nullable|date',
            ],
            'ppk' => [
                'actor' => 'required|in:ppk',
                'is_ppk_signed' => 'nullable|boolean',
                'catatan_ppk' => 'nullable|string|max:5000',
            ],
        };
    }
}
