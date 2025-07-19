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

        // Check if visitor already has an active visit
        $activeVisit = Visit::where('visitor_id', $visit->visitor_id)
            ->whereNotNull('check_in_time')
            ->whereNull('check_out_time')
            ->where('id', '!=', $visit->id)
            ->first();

        if ($activeVisit) {
            return response()->json(['message' => 'Visitor is already checked in for another visit'], 422);
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
     * Find or create a visit for a visitor and check them in
     */
    public function checkInVisitor(Request $request)
    {
        $request->validate([
            'visitor_id' => 'required|exists:visitors,id',
        ]);

        $visitor = Visitor::findOrFail($request->visitor_id);

        if ($visitor->status !== 'approved') {
            return response()->json(['message' => 'Visitor must be approved before check-in'], 422);
        }

        // Check if visitor already has an active visit
        $activeVisit = Visit::where('visitor_id', $visitor->id)
            ->whereNotNull('check_in_time')
            ->whereNull('check_out_time')
            ->first();

        if ($activeVisit) {
            return response()->json(['message' => 'Visitor is already checked in'], 422);
        }

        // Find existing visit for today that hasn't been checked out
        $existingVisit = Visit::where('visitor_id', $visitor->id)
            ->where('visit_date', now()->toDateString())
            ->whereNull('check_out_time')
            ->first();

        if ($existingVisit) {
            // Use the existing visit and check in
            $existingVisit->update([
                'check_in_time' => now(),
            ]);
            return response()->json($existingVisit->load(['visitor', 'host']));
        }

        // Create a new visit for today
        $visit = Visit::create([
            'visitor_id' => $visitor->id,
            'user_id' => $visitor->user_id,
            'visit_date' => now()->toDateString(),
            'badge_number' => 'BADGE-' . strtoupper(substr(md5(uniqid()), 0, 8)),
            'check_in_time' => now(),
        ]);

        return response()->json($visit->load(['visitor', 'host']));
    }

    /**
     * Find and check out a visitor's active visit
     */
    public function checkOutVisitor(Request $request)
    {
        $request->validate([
            'visitor_id' => 'required|exists:visitors,id',
        ]);

        $visitor = Visitor::findOrFail($request->visitor_id);

        // Find the active visit for this visitor (checked in but not checked out)
        $activeVisit = Visit::where('visitor_id', $visitor->id)
            ->whereNotNull('check_in_time')
            ->whereNull('check_out_time')
            ->first();

        if (!$activeVisit) {
            return response()->json(['message' => 'Visitor is not currently checked in'], 422);
        }

        // Check out the visit
        $activeVisit->update([
            'check_out_time' => now(),
        ]);

        return response()->json($activeVisit->load(['visitor', 'host']));
    }

    /**
     * Get currently checked in visits
     */
    public function checkedIn()
    {
        try {
            $visits = Visit::query()
                ->with(['visitor', 'host'])
                ->whereNotNull('check_in_time')
                ->whereNull('check_out_time')
                ->latest('check_in_time')
                ->get()
                ->map(function ($visit) {
                    // Ensure visitor exists
                    if (!$visit->visitor) {
                        return null;
                    }

                    // Handle host name properly
                    $hostName = '';
                    if ($visit->host && $visit->host->name) {
                        $hostName = $visit->host->name;
                    } elseif ($visit->visitor && $visit->visitor->h_name) {
                        $hostName = $visit->visitor->h_name;
                    }

                    return [
                        'id' => $visit->id,
                        'visitor' => [
                            'firstName' => $visit->visitor->f_name ?? '',
                            'lastName' => $visit->visitor->l_name ?? '',
                            'photoUrl' => $this->getImageUrl($visit->visitor->pic),
                        ],
                        'host' => [
                            'firstName' => $hostName,
                            'lastName' => '',
                        ],
                        'checkedInAt' => $visit->check_in_time,
                        'badgeNumber' => $visit->badge_number,
                        'duration' => $visit->check_in_time ? $this->calculateDuration($visit->check_in_time) : '0m',
                    ];
                })
                ->filter() // Remove null values
                ->values(); // Re-index array

            return response()->json($visits);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch checked-in visits',
                'message' => $e->getMessage()
            ], 500);
        }
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

    /**
     * Helper method to calculate duration
     */
    private function calculateDuration($checkInTime)
    {
        $timeIn = \Carbon\Carbon::parse($checkInTime);
        $now = \Carbon\Carbon::now();
        $duration = $now->diffInMinutes($timeIn);

        // Handle negative duration (future check-in time)
        if ($duration < 0) {
            return "0m";
        }

        $hours = floor($duration / 60);
        $minutes = $duration % 60;

        if ($hours > 0) {
            return "{$hours}h {$minutes}m";
        }

        return "{$minutes}m";
    }

    /**
     * Emergency checkout all currently checked in visitors
     */
    public function emergencyCheckoutAll()
    {
        try {
            $activeVisits = Visit::whereNotNull('check_in_time')
                ->whereNull('check_out_time')
                ->get();

            $checkoutCount = 0;
            foreach ($activeVisits as $visit) {
                $visit->update([
                    'check_out_time' => now(),
                    'notes' => $visit->notes ? $visit->notes . ' [EMERGENCY CHECKOUT]' : 'EMERGENCY CHECKOUT'
                ]);
                $checkoutCount++;
            }

            return response()->json([
                'message' => "Emergency checkout completed. {$checkoutCount} visitors checked out.",
                'checkout_count' => $checkoutCount,
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to perform emergency checkout',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export today's visit report
     */
    public function exportTodayReport()
    {
        try {
            $startOfDay = now()->startOfDay();
            $endOfDay = now()->endOfDay();

            // Get all visits for today (from start of day to end of day)
            $todayVisits = Visit::with(['visitor', 'host'])
                ->whereBetween('visit_date', [$startOfDay, $endOfDay])
                ->orderBy('created_at', 'asc')
                ->get();

            // Get statistics for the full day
            $totalVisits = $todayVisits->count();
            $checkedInVisits = $todayVisits->whereNotNull('check_in_time')->whereNull('check_out_time')->count();
            $checkedOutVisits = $todayVisits->whereNotNull('check_out_time')->count();
            $pendingVisits = $todayVisits->whereNull('check_in_time')->count();

            // Prepare report data
            $reportData = [
                'date' => $startOfDay->toDateString(),
                'generated_at' => now()->toISOString(),
                'statistics' => [
                    'total_visits' => $totalVisits,
                    'currently_checked_in' => $checkedInVisits,
                    'checked_out' => $checkedOutVisits,
                    'pending' => $pendingVisits,
                ],
                'visits' => $todayVisits->map(function ($visit) {
                    return [
                        'id' => $visit->id,
                        'visitor_name' => $visit->visitor ? $visit->visitor->f_name . ' ' . $visit->visitor->l_name : 'Unknown',
                        'visitor_email' => $visit->visitor ? $visit->visitor->email : '',
                        'visitor_company' => $visit->visitor ? $visit->visitor->company : '',
                        'host_name' => $visit->host ? $visit->host->name : ($visit->visitor ? $visit->visitor->h_name : 'Unknown'),
                        'visit_date' => $visit->visit_date,
                        'check_in_time' => $visit->check_in_time,
                        'check_out_time' => $visit->check_out_time,
                        'duration' => $visit->check_in_time && $visit->check_out_time
                            ? $this->calculateDurationBetween($visit->check_in_time, $visit->check_out_time)
                            : ($visit->check_in_time ? $this->calculateDuration($visit->check_in_time) : null),
                        'badge_number' => $visit->badge_number,
                        'notes' => $visit->notes,
                        'status' => $visit->check_out_time ? 'checked_out' : ($visit->check_in_time ? 'checked_in' : 'pending'),
                        'created_at' => $visit->created_at,
                        'updated_at' => $visit->updated_at,
                    ];
                }),
                'date_range' => [
                    'start' => $startOfDay->toISOString(),
                    'end' => $endOfDay->toISOString(),
                    'timezone' => config('app.timezone')
                ]
            ];

            return response()->json($reportData);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to generate today\'s report',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper method to calculate duration between two times
     */
    private function calculateDurationBetween($checkInTime, $checkOutTime)
    {
        $timeIn = \Carbon\Carbon::parse($checkInTime);
        $timeOut = \Carbon\Carbon::parse($checkOutTime);
        $duration = $timeOut->diffInMinutes($timeIn);

        $hours = floor($duration / 60);
        $minutes = $duration % 60;

        if ($hours > 0) {
            return "{$hours}h {$minutes}m";
        }

        return "{$minutes}m";
    }
}
