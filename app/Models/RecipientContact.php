<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RecipientContact extends Model
{
    protected $fillable = ['email_hash', 'name', 'email'];

    protected $hidden = ['email_hash', 'user_id'];

    protected function casts(): array
    {
        return [
            'name' => 'encrypted',
            'email' => 'encrypted',
        ];
    }

    public static function rememberFor(User $user, array $recipients): void
    {
        if ($recipients === []) {
            return;
        }

        $encrypter = app('encrypter');
        $currentKey = $encrypter->getKey();
        $previousKeys = array_diff($encrypter->getPreviousKeys(), [$currentKey]);
        $contacts = [];
        $previousHashes = [];

        foreach ($recipients as $recipient) {
            // Scope the lookup hash to the sender so the same address hashes differently for other users.
            $lookup = 'recipient-contact:'.$user->getKey().':'.Str::lower($recipient['email']);
            $emailHash = hash_hmac('sha256', $lookup, $currentKey);

            // Upsert bypasses model casts. Fill a model first to encrypt both fields.
            $contacts[$emailHash] = (new self([
                'email_hash' => $emailHash,
                'name' => $recipient['name'],
                'email' => $recipient['email'],
            ]))->getAttributes();

            foreach ($previousKeys as $key) {
                $previousHashes[] = hash_hmac('sha256', $lookup, $key);
            }
        }

        DB::transaction(function () use ($user, $contacts, $previousHashes) {
            $user->recipientContacts()->upsert(array_values($contacts), ['user_id', 'email_hash'], ['name', 'email']);

            // Replace older copies when the application key was rotated.
            if ($previousHashes !== []) {
                $user->recipientContacts()->whereIn('email_hash', $previousHashes)->delete();
            }
        }, 3);
    }
}
