<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    /**
     * Update the student's profile details.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'phone' => 'nullable|string|max:20',
            'school_name' => 'nullable|string|max:255',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }

    /**
     * Change password.
     */
    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'current_password' => 'required',
            'new_password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The provided password does not match your current password.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json([
            'message' => 'Password updated successfully'
        ]);
    }

    /**
     * Upload avatar image.
     */
    public function uploadAvatar(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048', // max 2MB
        ]);

        if ($request->file('avatar')) {
            // Delete previous avatar file if exists
            if ($user->avatar_url) {
                $oldPath = str_replace('/storage/', 'public/', $user->avatar_url);
                if (Storage::exists($oldPath)) {
                    Storage::delete($oldPath);
                }
            }

            // Save the file
            $file = $request->file('avatar');
            $filename = time() . '_' . $user->id . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('avatars', $filename, 'public');

            // Generate web URL
            $url = '/storage/avatars/' . $filename;
            $user->avatar_url = $url;
            $user->save();

            return response()->json([
                'message' => 'Avatar uploaded successfully',
                'avatar_url' => $url,
                'user' => $user
            ]);
        }

        return response()->json(['message' => 'No file uploaded'], 400);
    }
}
