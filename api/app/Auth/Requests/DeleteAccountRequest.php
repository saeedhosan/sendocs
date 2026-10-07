<?php

declare(strict_types=1);

namespace App\Auth\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class DeleteAccountRequest extends FormRequest
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
     * The password is only checked for shape: it is compared against the stored
     * hash, so a wrong one is a 401 rather than a 422. The confirmation is
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'password' => ['required', 'string', 'max:200'],
            'confirm'  => ['required', 'string', 'email', 'max:254'],
        ];
    }
}
