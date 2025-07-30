<?php

use App\Http\Controllers\UserController;
use App\Http\Controllers\VisitorController;
use App\Http\Controllers\VisitController;
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
Route::post('/visitor/find-by-email-or-phone', [VisitorController::class, 'findByEmailOrPhone']);
Route::post('/visitor/{visitor}/create-visit', [VisitorController::class, 'createVisit']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [UserController::class, 'logout']);
    Route::get('/me', function (Request $request) {
        return $request->user();
    });

    // User management routes (admin only)
    // Route::middleware('can:manage-users')->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::patch('/users/{id}/toggle-status', [UserController::class, 'toggleStatus']);
    // });

    // Dashboard route
    Route::get('/dashboard', [VisitorController::class, 'dashboard']);
    Route::get('/activity-logs', [VisitorController::class, 'activityLogs']);

    // Protected visitor routes
    Route::get('/visitors', [VisitorController::class, 'index']);
    Route::get('/visitors/checked-in', [VisitorController::class, 'checkedIn']);
    Route::get('/visitors/search', [VisitorController::class, 'search']);
    Route::get('/visitors/badge/{badgeNumber}', [VisitorController::class, 'findByBadge']);
    Route::get('/visitor/{visitor}', [VisitorController::class, 'show']);
    Route::patch('/visitor/{visitor}', [VisitorController::class, 'update']);
    Route::delete('/visitor/{visitor}', [VisitorController::class, 'destroy']);

    // Visit routes (new)
    Route::get('/visits', [VisitController::class, 'index']);
    Route::post('/visits', [VisitController::class, 'store']);
    Route::get('/visits/checked-in', [VisitController::class, 'checkedIn']);
    Route::get('/visits/statistics', [VisitController::class, 'statistics']);
    Route::post('/visits/check-in-visitor', [VisitController::class, 'checkInVisitor']);
    Route::post('/visits/check-out-visitor', [VisitController::class, 'checkOutVisitor']);
    Route::post('/visits/emergency-checkout-all', [VisitController::class, 'emergencyCheckoutAll']);
    Route::get('/visits/export-today-report', [VisitController::class, 'exportTodayReport']);
    Route::get('/visits/{visit}', [VisitController::class, 'show']);
    Route::patch('/visits/{visit}', [VisitController::class, 'update']);
    Route::delete('/visits/{visit}', [VisitController::class, 'destroy']);
    Route::patch('/visits/{visit}/check-in', [VisitController::class, 'checkIn']);
    Route::patch('/visits/{visit}/check-out', [VisitController::class, 'checkOut']);
});
