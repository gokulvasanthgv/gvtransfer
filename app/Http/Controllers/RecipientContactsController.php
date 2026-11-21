<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecipientContactsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_if($user->is_guest, 403);

        $contacts = $user->recipientContacts()
            ->get(['id', 'name', 'email'])
            ->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)
            ->values();

        return response()->json([
            'status' => 'success',
            'data' => ['contacts' => $contacts],
        ])->header('Cache-Control', 'private, no-store');
    }
}
