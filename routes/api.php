<?php

use App\Http\Controllers\Api\AuthApiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Stateless token-based routes powered by Laravel Sanctum.
| All routes here are prefixed with /api automatically.
|
*/

// ── Public endpoints (no token required) ─────────────────────────────────────

Route::post('/register', [AuthApiController::class, 'register'])
    ->middleware('throttle:10,1')
    ->name('api.register');

Route::post('/login', [AuthApiController::class, 'login'])
    ->middleware('throttle:10,1')
    ->name('api.login');

// ── Protected endpoints (Bearer token required) ───────────────────────────────

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthApiController::class, 'logout'])->name('api.logout');
    Route::get('/me',     [AuthApiController::class, 'me'])->name('api.me');
});
