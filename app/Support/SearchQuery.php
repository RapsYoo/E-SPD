<?php

namespace App\Support;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * Helper pencarian `LIKE` + paginasi yang dipakai berulang pada daftar master data.
 */
final class SearchQuery
{
    /**
     * @param  string[]  $columns  Kolom yang dicari memakai OR LIKE.
     */
    public static function apply(Builder $query, ?string $term, array $columns): Builder
    {
        if ($term) {
            $query->where(function ($q) use ($term, $columns) {
                foreach ($columns as $i => $column) {
                    $method = $i === 0 ? 'where' : 'orWhere';
                    $q->{$method}($column, 'like', "%{$term}%");
                }
            });
        }

        return $query;
    }

    public static function paginate(Builder $query, ?string $term, array $columns, string $orderBy, int $perPage = 10): LengthAwarePaginator
    {
        return self::apply($query, $term, $columns)
            ->orderBy($orderBy)
            ->paginate($perPage)
            ->withQueryString();
    }
}
