<?php

namespace App\Http\Controllers;

use App\Models\Visitor;
use App\Notifications\VisitorStatusNotification;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class VisitorController extends Controller
{
    public function testEmail()
    {
        try {
            $to = 'komih31817@mardiek.com';
            $subject = 'Test Email from PHP';
            $message = 'This is a test email sent using PHP mail function.';
            $headers = 'From: support@bethlog.desiderata.com.gh' . "\r\n" .
                'Reply-To: support@bethlog.desiderata.com.gh' . "\r\n" .
                'X-Mailer: PHP/' . phpversion();
            $visitor = Visitor::find(3);

            Notification::sendNow($visitor, new VisitorStatusNotification($visitor));

            return response()->json([
                'message' => 'Test email sent successfully',
                'to' => $to
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'to' => $to
            ]);
        }
    }
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Visitor::query()->with('host');

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by date range if provided
        if ($request->has('from_date') && $request->has('to_date')) {
            $query->whereBetween('visit_date', [$request->from_date, $request->to_date]);
        }

        // If user is a host, only show their visitors
        if ($request->user()->role === 'host') {
            $query->where('user_id', $request->user()->id);
        }

        return $query->latest()->paginate(10);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'f_name' => 'required|string|max:255',
                'l_name' => 'required|string|max:255',
                'phone' => 'required|string|max:20',
                'email' => 'nullable|email|max:255',
                'id_type' => 'required|string|max:255',
                'id_number' => 'required|string|max:255',
                'pic' => 'nullable|string',
                'id_pic' => 'nullable|string',
                'purpose' => 'required|string|max:255',
                'company_id' => 'nullable|exists:companies,id',
                'host_id' => 'nullable|exists:hosts,id',
                'visit_date' => 'required|date',
                'notes' => 'nullable|string',
            ]);

            // Handle selfie image if provided
            $selfieImage = null;
            if ($request->pic) {
                $selfieImage = $this->saveBase64Image($request->pic, 'selfies');
            }

            // Handle ID image if provided
            $idImage = null;
            if ($request->id_pic) {
                $idImage = $this->saveBase64Image($request->id_pic, 'ids');
            }

            // Find or create visitor
            $visitor = Visitor::firstOrCreate(
                ['phone' => $request->phone],
                [
                    'f_name' => $request->f_name,
                    'l_name' => $request->l_name,
                    'email' => $request->email,
                    'id_type' => $request->id_type,
                    'id_number' => $request->id_number,
                    'pic' => $selfieImage,
                    'id_pic' => $idImage,
                ]
            );

            // Create a new visit
            $visit = $visitor->visits()->create([
                'company_id' => $request->company_id,
                'host_id' => $request->host_id,
                'visit_date' => $request->visit_date,
                'purpose' => $request->purpose,
                'notes' => $request->notes,
                'status' => 'pending',
            ]);

            return response()->json([
                'visitor' => $visitor,
                'visit' => $visit->load(['company', 'host']),
            ], 201);
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->errorInfo[1] === 19) { // SQLite unique constraint error code
                return response()->json([
                    'message' => 'A visitor with this phone number already exists in our system. Please use a different phone number or try the returning visitor option.',
                    'errors' => [
                        'phone' => ['This phone number is already registered']
                    ]
                ], 422);
            }
            throw $e;
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Visitor $visitor)
    {
        return $visitor->load('host');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Visitor $visitor)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Visitor $visitor)
    {
        try {
            $request->validate([
                'status' => 'sometimes|required|in:approved,rejected',
                'notes' => 'nullable|string',
            ]);

            // Get the latest pending visit for this visitor
            $visit = $visitor->visits()
                ->where('status', 'pending')
                ->latest()
                ->first();

            if (!$visit) {
                return response()->json([
                    'message' => 'No pending visit found for this visitor'
                ], 404);
            }

            // Update the visit status
            $visit->update([
                'status' => $request->status,
                'notes' => $request->notes,
                'approved_at' => $request->status === 'approved' ? now() : null,
                'approved_by' => $request->status === 'approved' ? $request->user()->id : null,
            ]);

            // Send email notification
            Notification::sendNow($visitor, new VisitorStatusNotification($visitor, $visit));

            return response()->json([
                'visitor' => $visitor,
                'visit' => $visit->load(['company', 'host', 'approver'])
            ]);
        } catch (\Throwable $th) {
            return response()->json([
                'message' => 'Failed to update visit status',
                'error' => $th->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Visitor $visitor)
    {
        // Delete associated images
        if ($visitor->pic) {
            Storage::delete($visitor->pic);
        }
        if ($visitor->id_pic) {
            Storage::delete($visitor->id_pic);
        }

        $visitor->delete();
        return response()->json(null, 204);
    }

    // Check-in and check-out functionality moved to VisitController

    /**
     * Get dashboard statistics and lists
     */
    public function dashboard(Request $request)
    {
        // Base query that considers user role
        $baseQuery = \App\Models\Visit::query()->with(['visitor', 'host', 'company']);
        if ($request->user()->role === 'host') {
            $baseQuery->where('host_id', $request->user()->id);
        }

        // Get pending approvals count and list
        $pendingApprovals = (clone $baseQuery)
            ->where('status', 'pending')
            ->latest()
            ->get();

        // Get today's visits
        $today = Carbon::today();
        $todaysVisits = (clone $baseQuery)
            ->whereDate('visit_date', $today)
            ->latest()
            ->get();

        // Get currently checked in visitors
        $currentlyCheckedIn = (clone $baseQuery)
            ->where('status', 'approved')
            ->whereNotNull('check_in_time')
            ->whereNull('check_out_time')
            ->count();

        // Get total visits for the week
        $weekStart = Carbon::now()->startOfWeek();
        $weekEnd = Carbon::now()->endOfWeek();
        $weeklyTotal = (clone $baseQuery)
            ->whereBetween('visit_date', [$weekStart, $weekEnd])
            ->count();

        // Format visits for response
        $formattedVisits = $todaysVisits->map(function ($visit) {
            return [
                'id' => $visit->id,
                'visitor' => [
                    'id' => $visit->visitor->id,
                    'name' => $visit->visitor->f_name . ' ' . $visit->visitor->l_name,
                    'email' => $visit->visitor->email,
                    'id_type' => $visit->visitor->id_type,
                    'id_number' => $visit->visitor->id_number,
                    'phone' => $visit->visitor->phone,
                    'photo' => $visit->visitor->pic ? asset('storage/' . $visit->visitor->pic) : null,
                    'id_pic' => $visit->visitor->id_pic ? asset('storage/' . $visit->visitor->id_pic) : null,
                ],
                'company' => $visit->company ? [
                    'id' => $visit->company->id,
                    'name' => $visit->company->name,
                ] : null,
                'host' => $visit->host ? [
                    'id' => $visit->host->id,
                    'name' => $visit->host->name,
                    'department' => $visit->host->department,
                ] : null,
                'purpose' => $visit->purpose,
                'status' => $visit->status,
                'visit_date' => $visit->visit_date,
                'check_in_time' => $visit->check_in_time,
                'check_out_time' => $visit->check_out_time,
                'badge_number' => $visit->badge_number,
                'approved_at' => $visit->approved_at,
                'created_at' => $visit->created_at,
            ];
        });

        $formattedPendingApprovals = $pendingApprovals->map(function ($visit) {
            return [
                'id' => $visit->id,
                'visitor' => [
                    'id' => $visit->visitor->id,
                    'name' => $visit->visitor->f_name . ' ' . $visit->visitor->l_name,
                    'email' => $visit->visitor->email,
                    'phone' => $visit->visitor->phone,
                    'id_type' => $visit->visitor->id_type,
                    'id_number' => $visit->visitor->id_number,
                    'photo' => $visit->visitor->pic ? asset('storage/' . $visit->visitor->pic) : null,
                ],
                'company' => $visit->company ? [
                    'id' => $visit->company->id,
                    'name' => $visit->company->name,
                ] : null,
                'host' => $visit->host ? [
                    'id' => $visit->host->id,
                    'name' => $visit->host->name,
                    'department' => $visit->host->department,
                ] : null,
                'purpose' => $visit->purpose,
                'visit_date' => $visit->visit_date,
                'created_at' => $visit->created_at,
            ];
        });

        return response()->json([
            'statistics' => [
                'pending_approvals_count' => $pendingApprovals->count(),
                'todays_visits_count' => $todaysVisits->count(),
                'currently_checked_in' => $currentlyCheckedIn,
                'weekly_total' => $weeklyTotal,
            ],
            'lists' => [
                'todays_visits' => $formattedVisits,
                'pending_approvals' => $formattedPendingApprovals,
            ]
        ]);
    }

    /**
     * Get list of currently checked in visitors
     * @deprecated Use VisitController::checkedIn() instead
     */
    public function checkedIn()
    {
        // This method is deprecated, use VisitController::checkedIn() instead
        return response()->json(['message' => 'Use /api/visits/checked-in endpoint instead'], 400);
    }

    /**
     * Search visitors by name, company, or badge number
     */
    public function search(Request $request)
    {
        $query = $request->get('q');
        $perPage = $request->get('per_page', 10);

        $visitorQuery = Visitor::query()
            ->with(['visits' => function ($query) {
                $query->with(['company', 'host'])
                    ->latest();
            }]);

        // Only apply search filters if a query is provided
        if ($query) {
            $visitorQuery->where(function ($q) use ($query) {
                $q->where('f_name', 'like', "%{$query}%")
                    ->orWhere('l_name', 'like', "%{$query}%")
                    ->orWhere('id_number', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%")
                    ->orWhere('phone', 'like', "%{$query}%");
            });
        }

        $visitors = $visitorQuery
            ->latest()
            ->paginate($perPage)
            ->through(function ($visitor) {
                // Get the latest visit
                $latestVisit = $visitor->visits->first();

                return [
                    'id' => $visitor->id,
                    'firstName' => $visitor->f_name,
                    'lastName' => $visitor->l_name,
                    'email' => $visitor->email,
                    'phone' => $visitor->phone,
                    'badgeNumber' => $visitor->id_number,
                    'photoUrl' => $this->getImageUrl($visitor->pic),
                    'visitRequests' => $visitor->visits->map(function ($visit) {
                        return [
                            'id' => $visit->id,
                            'status' => $visit->status,
                            'purpose' => $visit->purpose,
                            'checkedInAt' => $visit->check_in_time,
                            'checkedOutAt' => $visit->check_out_time,
                            'visitDate' => $visit->visit_date,
                            'company' => $visit->company ? [
                                'id' => $visit->company->id,
                                'name' => $visit->company->name,
                            ] : null,
                            'host' => $visit->host ? [
                                'id' => $visit->host->id,
                                'name' => $visit->host->name,
                                'department' => $visit->host->department,
                            ] : null,
                            'duration' => $visit->check_in_time ?
                                $this->calculateDuration($visit->check_in_time) : null,
                        ];
                    })->values(),
                ];
            });

        return response()->json($visitors);
    }

    /**
     * Find visitor by badge number
     */
    public function findByBadge($badgeNumber)
    {
        $visitor = Visitor::where('id_number', $badgeNumber)
            ->with(['visits' => function ($query) {
                $query->with(['company', 'host'])
                    ->latest();
            }])
            ->first();

        if (!$visitor) {
            return response()->json(['message' => 'Visitor not found'], 404);
        }

        return response()->json([
            'id' => $visitor->id,
            'firstName' => $visitor->f_name,
            'lastName' => $visitor->l_name,
            'email' => $visitor->email,
            'phone' => $visitor->phone,
            'badgeNumber' => $visitor->id_number,
            'photoUrl' => $this->getImageUrl($visitor->pic),
            'visitRequests' => $visitor->visits->map(function ($visit) {
                return [
                    'id' => $visit->id,
                    'status' => $visit->status,
                    'purpose' => $visit->purpose,
                    'checkedInAt' => $visit->check_in_time,
                    'checkedOutAt' => $visit->check_out_time,
                    'visitDate' => $visit->visit_date,
                    'company' => $visit->company ? [
                        'id' => $visit->company->id,
                        'name' => $visit->company->name,
                    ] : null,
                    'host' => $visit->host ? [
                        'id' => $visit->host->id,
                        'name' => $visit->host->name,
                        'department' => $visit->host->department,
                    ] : null,
                    'duration' => $visit->check_in_time ?
                        $this->calculateDuration($visit->check_in_time) : null,
                ];
            })->values(),
        ]);
    }

    /**
     * Find visitor by email or phone number
     */
    public function findByEmailOrPhone(Request $request)
    {
        $request->validate([
            'search' => 'required|string|max:255',
        ]);

        $searchTerm = $request->search;

        $query = Visitor::query()
            ->where(function ($q) use ($searchTerm) {
                $q->where('email', 'like', "%{$searchTerm}%")
                    ->orWhere('phone', 'like', "%{$searchTerm}%");
            })
            ->with(['visits' => function ($query) {
                $query->with(['company', 'host'])->latest();
            }])
            ->latest()
            ->first();

        if (!$query) {
            return response()->json(['message' => 'Visitor not found'], 404);
        }

        // Get the latest visit
        $latestVisit = $query->visits->first();

        return response()->json([
            'id' => $query->id,
            'firstName' => $query->f_name,
            'lastName' => $query->l_name,
            'email' => $query->email,
            'phone' => $query->phone,
            'idType' => $query->id_type,
            'idNumber' => $query->id_number,
            'photoUrl' => $this->getImageUrl($query->pic),
            'idPhotoUrl' => $this->getImageUrl($query->id_pic),
            'latestVisit' => $latestVisit ? [
                'id' => $latestVisit->id,
                'company' => $latestVisit->company ? [
                    'id' => $latestVisit->company->id,
                    'name' => $latestVisit->company->name,
                ] : null,
                'host' => $latestVisit->host ? [
                    'id' => $latestVisit->host->id,
                    'name' => $latestVisit->host->name,
                    'department' => $latestVisit->host->department,
                ] : null,
                'status' => $latestVisit->status,
                'purpose' => $latestVisit->purpose,
                'visitDate' => $latestVisit->visit_date,
                'checkInTime' => $latestVisit->check_in_time,
                'checkOutTime' => $latestVisit->check_out_time,
            ] : null,
        ]);
    }

    // Check-in and check-out methods moved to VisitController

    /**
     * Create a visit for an existing visitor
     */
    public function createVisit(Request $request, Visitor $visitor)
    {
        $request->validate([
            'visit_date' => 'required|date',
            'purpose' => 'required|string|max:255',
            'company_id' => 'nullable|exists:companies,id',
            'host_id' => 'nullable|exists:hosts,id',
            'notes' => 'nullable|string',
        ]);

        // Create a new visit
        $visit = $visitor->visits()->create([
            'company_id' => $request->company_id,
            'host_id' => $request->host_id,
            'visit_date' => $request->visit_date,
            'purpose' => $request->purpose,
            'notes' => $request->notes,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Visit created successfully',
            'visit' => $visit->load(['visitor', 'company', 'host']),
        ], 201);
    }

    /**
     * Get recent visitor activity logs
     */
    public function activityLogs(Request $request)
    {
        $activities = collect();

        // Get visitor registrations and status changes
        $visitorQuery = Visitor::query()
            ->with('host')
            ->where(function ($q) {
                $q->whereNotNull('created_at') // New registrations
                    ->orWhereIn('status', ['approved', 'rejected']); // Status changes
            });

        // If user is a host, only show their visitors' activities
        // if ($request->user()->role === 'host') {
        //     $visitorQuery->where('user_id', $request->user()->id);
        // }

        $visitorActivities = $visitorQuery->latest()->limit(10)->get()->map(function ($visitor) {
            $activities = [];

            // Registration
            $activities[] = [
                'type' => 'registration',
                'visitor_name' => $visitor->f_name . ' ' . $visitor->l_name,
                'host_name' => $visitor->h_name,
                'timestamp' => $visitor->created_at,
                'description' => "New visitor registration"
            ];

            // Status change (approval/rejection)
            if (in_array($visitor->status, ['approved', 'rejected'])) {
                $activities[] = [
                    'type' => 'status_change',
                    'visitor_name' => $visitor->f_name . ' ' . $visitor->l_name,
                    'host_name' => $visitor->h_name,
                    'timestamp' => $visitor->updated_at,
                    'description' => "Visit " . $visitor->status
                ];
            }

            return $activities;
        })->flatten(1);

        // Get visit activities (check-ins and check-outs)
        $visitQuery = \App\Models\Visit::query()
            ->with(['visitor', 'host'])
            ->where(function ($q) {
                $q->whereNotNull('check_in_time')
                    ->orWhereNotNull('check_out_time');
            });

        // If user is a host, only show their visits' activities
        // if ($request->user()->role === 'host') {
        //     $visitQuery->where('user_id', $request->user()->id);
        // }

        $visitActivities = $visitQuery->latest()->limit(10)->get()->map(function ($visit) {
            $activities = [];

            // Check-in
            if ($visit->check_in_time) {
                $activities[] = [
                    'type' => 'check_in',
                    'visitor_name' => $visit->visitor->f_name . ' ' . $visit->visitor->l_name,
                    'host_name' => $visit->host->name ?? $visit->visitor->h_name,
                    'timestamp' => $visit->check_in_time,
                    'description' => "Visitor checked in"
                ];
            }

            // Check-out
            if ($visit->check_out_time) {
                $activities[] = [
                    'type' => 'check_out',
                    'visitor_name' => $visit->visitor->f_name . ' ' . $visit->visitor->l_name,
                    'host_name' => $visit->host->name ?? $visit->visitor->h_name,
                    'timestamp' => $visit->check_out_time,
                    'description' => "Visitor checked out"
                ];
            }

            return $activities;
        })->flatten(1);

        // Combine and sort all activities
        $allActivities = $visitorActivities->concat($visitActivities)
            ->sortByDesc('timestamp')
            ->values()
            ->take(10);

        return response()->json($allActivities);
    }

    private function saveBase64Image($base64Image, $folder)
    {
        // Remove data URI scheme header
        $image = str_replace('data:image/jpeg;base64,', '', $base64Image);
        $image = str_replace('data:image/png;base64,', '', $image);
        $image = str_replace(' ', '+', $image);

        // Generate unique filename
        $filename = $folder . '/' . Str::uuid() . '.jpg';

        // Save image to public storage
        Storage::disk('public')->put($filename, base64_decode($image));

        return $filename;
    }

    /**
     * Get the full URL for a stored image
     */
    private function getImageUrl($path)
    {
        if (!$path) {
            return null;
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
}
