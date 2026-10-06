<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

/**
 * AuthApiController
 *
 * Handles stateless token-based authentication via Laravel Sanctum.
 * Used by external API clients (mobile apps, third-party integrations, etc.)
 * that require Bearer tokens instead of session cookies.
 *
 * Routes (api.php):
 *   POST /api/register  → AuthApiController@register
 *   POST /api/login     → AuthApiController@login
 *   POST /api/logout    → AuthApiController@logout  (auth:sanctum)
 *   GET  /api/me        → AuthApiController@me      (auth:sanctum)
 */
class AuthApiController extends Controller
{
    // ─── Register ─────────────────────────────────────────────────────────────

    /**
     * Register a new user and return a Sanctum token.
     *
     * @param  Request  $request
     * @return JsonResponse
     *
     * @throws ValidationException
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'                  => ['required', 'string', 'max:255'],
            'email'                 => ['required', 'string', 'email:rfc,dns', 'max:255', 'unique:users,email'],
            'password'              => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
            'password_confirmation' => ['required', 'string'],
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        event(new Registered($user));

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'message'      => 'Registrasi berhasil.',
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'data'         => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
            ],
        ], 201);
    }

    // ─── Login ─────────────────────────────────────────────────────────────────

    /**
     * Authenticate an existing user and return a Sanctum token.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email'    => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials)) {
            return response()->json([
                'message' => 'Email atau password yang Anda masukkan salah.',
                'errors'  => [
                    'email' => ['Kredensial tidak cocok dengan data kami.'],
                ],
            ], 401);
        }

        /** @var User $user */
        $user = Auth::user();

        // Revoke all previous tokens to enforce single-session policy.
        // Remove this line to allow multiple concurrent sessions.
        $user->tokens()->delete();

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'message'      => 'Login berhasil.',
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'data'         => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    // ─── Logout ────────────────────────────────────────────────────────────────

    /**
     * Revoke the current user's token.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout berhasil. Token telah dicabut.',
        ]);
    }

    // ─── Me ────────────────────────────────────────────────────────────────────

    /**
     * Return the currently authenticated user.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $request->user()->only('id', 'name', 'email', 'created_at'),
        ]);
    }
}
