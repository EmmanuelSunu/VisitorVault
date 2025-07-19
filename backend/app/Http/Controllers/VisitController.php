<?php

namespace App\Http\Controllers;

use App\Models\Visit;
use App\Models\Visitor;
use Illuminate\Http\Request;
use Carbon\Carbon;

class VisitController extends Controller
{
    /**
     * Display a listing of visits
     */
    public function index(Request $request)
    {
        $query = Visit::query()->with(['visitor', 'host']);

        // Filter by date range if provided
        if ($request->has('from_date') && $request->has('to_date')) {
            $query->whereBetween('visit_date', [$request->from_date, $request->to_date]);
        }

        // Filter by status
        if ($request->has('status')) {
            switch ($request->status) {
                case 'checked_in':
                    $query->whereNotNull('check_in_time')->whereNull('check_out_time');
                    break;
                case 'checked_out':
                    $query->whereNotNull('check_out_time');
                    break;
                case 'scheduled':
                    $query->whereNull('check_in_time');
                    break;
            }
        }

        // If user is a host, only show visits for their visitors
        if ($request->user()->role === 'host') {
            $query->where('user_id', $request->user()->id);
        }

        return $query->latest()->paginate(10);
    }

    /**
     * Store a newly created visit
     */
    public function store(Request $request)
    {
        $request->validate([
            'visitor_id' => 'required|exists:visitors,id',
            'visit_date' => 'required|date',
            'notes' => 'nullable|string',
            'badge_number' => 'nullable|string|max:50',
        ]);

        $visitor = Visitor::findOrFail($request->visitor_id);

        $visit = Visit::create([
            'visitor_id' => $request->visitor_id,
            'user_id' => $visitor->user_id, // Host from visitor record
            'visit_date' => $request->visit_date,
            'notes' => $request->notes,
            'badge_number' => $request->badge_number,
        ]);

        return response()->json($visit->load(['visitor', 'host']), 201);
    }

    /**
     * Display the specified visit
     */
    public function show(Visit $visit)
    {
        return $visit->load(['visitor', 'host']);
    }

    /**
     * Update the specified visit
     */
    public function update(Request $request, Visit $visit)
    {
        $request->validate([
            'visit_date' => 'sometimes|required|date',
            'notes' => 'nullable|string',
            'badge_number' => 'nullable|string|max:50',
        ]);

        $visit->update($request->all());

        return response()->json($visit->load(['visitor', 'host']));
    }

    /**
     * Remove the specified visit
     */
    public function destroy(Visit $visit)
    {
        $visit->delete();
        return response()->json(null, 204);
    }

    /**
     * Check in a visitor for a specific visit
     */
    public function checkIn(Visit $visit)
    {
        if ($visit->visitor->status !== 'approved') {
            return response()->json(['message' => 'Visitor must be approved before check-in'], 422);
        }

        if ($visit->check_in_time) {
            return response()->json(['message' => 'Visitor is already checked in for this visit'], 422);
        }

        $visit->update([
            'check_in_time' => now(),
        ]);

        return response()->json($visit->load(['visitor', 'host']));
    }

    /**
     * Check out a visitor for a specific visit
     */
    public function checkOut(Visit $visit)
    {
        if (!$visit->check_in_time) {
            return response()->json(['message' => 'Visitor must be checked in before check-out'], 422);
        }

        if ($visit->check_out_time) {
            return response()->json(['message' => 'Visitor is already checked out for this visit'], 422);
        }

        $visit->update([
            'check_out_time' => now(),
        ]);

        return response()->json($visit->load(['visitor', 'host']));
    }

    /**
     * Get currently checked in visits
     */
    public function checkedIn()
    {
        $visits = Visit::query()
            ->with(['visitor', 'host'])
            ->whereNotNull('check_in_time')
            ->whereNull('check_out_time')
            ->latest('check_in_time')
            ->get()
            ->map(function ($visit) {
                return [
                    'id' => $visit->id,
                    'visitor' => [
                        'firstName' => $visit->visitor->f_name,
                        'lastName' => $visit->visitor->l_name,
                        'photoUrl' => $this->getImageUrl($visit->visitor->pic),
                    ],
                    'host' => [
                        'firstName' => $visit->host->name ?? $visit->visitor->h_name,
                        'lastName' => '',
                    ],
                    'checkedInAt' => $visit->check_in_time,
                    'badgeNumber' => $visit->badge_number,
                    'duration' => $visit->check_in_time ? now()->diffForHumans($visit->check_in_time) : null,
                ];
            });

        return response()->json($visits);
    }

    /**
     * Get visit statistics
     */
    public function statistics(Request $request)
    {
        $baseQuery = Visit::query();

        // If user is a host, only show their visits
        if ($request->user()->role === 'host') {
            $baseQuery->where('user_id', $request->user()->id);
        }

        $today = Carbon::today();
        $weekStart = Carbon::now()->startOfWeek();
        $weekEnd = Carbon::now()->endOfWeek();

        $statistics = [
            'today_visits' => (clone $baseQuery)->whereDate('visit_date', $today)->count(),
            'today_checkins' => (clone $baseQuery)->whereDate('check_in_time', $today)->count(),
            'currently_checked_in' => (clone $baseQuery)->whereNotNull('check_in_time')->whereNull('check_out_time')->count(),
            'weekly_visits' => (clone $baseQuery)->whereBetween('visit_date', [$weekStart, $weekEnd])->count(),
        ];

        return response()->json($statistics);
    }

    /**
     * Helper method to get image URL
     */
    private function getImageUrl($path)
    {
        if (!$path) return null;

        if (filter_var($path, FILTER_VALIDATE_URL)) {
            return $path;
        }

        return asset('storage/' . $path);
    }
}
