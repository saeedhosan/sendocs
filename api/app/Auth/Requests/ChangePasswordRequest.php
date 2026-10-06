<?php

namespace App\Auth\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ChangePasswordRequest extends FormRequest
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
     * The current password is only checked for shape: it is compared against the
     * stored hash, so a wrong one is a 401 rather than a 422. The ceiling keeps
     * an unbounded string away from the comparison.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'currentPassword' => ['required', 'string', 'max:200'],
            'password' => ['required', 'string', 'min:12', 'max:200'],
        ];
    }
}
