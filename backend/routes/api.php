<?php

use App\Http\Controllers\UserController;
use App\Http\Controllers\VisitorController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/test', function (Request $request) {
    return ['asfafa'];
});


// Auth routes
Route::post('/login', [UserController::class, 'login']);
Route::post('/register', [UserController::class, 'register']);

// Public visitor registration
Route::post('/visitor/register', [VisitorController::class, 'store']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [UserController::class, 'logout']);
    Route::get('/me', function (Request $request) {
        return $request->user();
    });

    // Dashboard route
    Route::get('/dashboard', [VisitorController::class, 'dashboard']);

    // Protected visitor routes
    Route::get('/visitors', [VisitorController::class, 'index']);
    Route::get('/visitor/{visitor}', [VisitorController::class, 'show']);
    Route::patch('/visitor/{visitor}', [VisitorController::class, 'update']);
    Route::delete('/visitor/{visitor}', [VisitorController::class, 'destroy']);

    // Check-in/out routes
    Route::post('/visitor/{visitor}/check-in', [VisitorController::class, 'checkIn']);
    Route::post('/visitor/{visitor}/check-out', [VisitorController::class, 'checkOut']);
});
