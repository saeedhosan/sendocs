<?php

declare(strict_types=1);

namespace App\Auth\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ResetPasswordRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * The token is never trimmed: it is a secret, so it is compared exactly as
     * it arrived. The ceiling is well above a real token and only keeps an
     * unbounded string out of the lookup.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'token'    => ['required', 'string', 'max:200'],
            'password' => ['required', 'string', 'min:12', 'max:200'],
        ];
    }
}
