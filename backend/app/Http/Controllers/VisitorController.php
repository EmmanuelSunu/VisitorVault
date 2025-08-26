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
                'purpose' => 'required|string|max:255',
                'phone' => 'required|string|max:20|unique:visitors',
                'email' => 'nullable|email|max:255',
                'company' => 'nullable|string|max:255',
                'h_name' => 'nullable|string|max:255',
                'h_email' => 'nullable|email|max:255',
                'h_phone' => 'nullable|string|max:20',
                'id_type' => 'required|string|max:255',
                'id_number' => 'required|string|max:255',
                'visit_date' => 'required|date',
                'pic' => 'nullable|string', // Make selfie photo optional
                'id_pic' => 'nullable|string', // Make ID photo optional
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

            $visitor = Visitor::create([
                ...$request->except(['pic', 'id_pic']),
                'pic' => $selfieImage,
                'id_pic' => $idImage,
                'status' => 'pending'
            ]);

            // $visitor->visits()->create([
            //     'user_id' => $request->user()->id ?? 1,
            //     'visit_date' => $request->visit_date,
            //     'check_in_time' => null,
            //     'check_out_time' => null,
            //     'notes' => $request->notes,
            // ]);

            return response()->json($visitor, 201);
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

            $visitor->update($request->all());

            // Send email notification if status is updated
            if ($request->has('status')) {
                Notification::sendNow($visitor, new VisitorStatusNotification($visitor));
            }

            return response()->json($visitor);
        } catch (\Throwable $th) {
            return response()->json([
                'message' => 'Failed to update visitor status',
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
        $baseQuery = Visitor::query();
        if ($request->user()->role === 'host') {
            $baseQuery->where('user_id', $request->user()->id);
        }

        // Get pending approvals count and list
        $pendingApprovals = (clone $baseQuery)
            ->where('status', 'pending')
            ->with('host')
            ->latest()
            ->get();

        // Get today's visits (from visits table)
        $today = Carbon::today();
        $todaysVisits = \App\Models\Visit::query()
            ->with(['visitor', 'host'])
            ->whereDate('visit_date', $today);

        if ($request->user()->role === 'host') {
            $todaysVisits->where('user_id', $request->user()->id);
        }
        $todaysVisits = $todaysVisits->latest()->get();

        // Get currently checked in visitors (from visits table)
        $currentlyCheckedIn = \App\Models\Visit::query()
            ->whereNotNull('check_in_time')
            ->whereNull('check_out_time');

        if ($request->user()->role === 'host') {
            $currentlyCheckedIn->where('user_id', $request->user()->id);
        }
        $currentlyCheckedIn = $currentlyCheckedIn->count();

        // Get total visits for the week (from visits table)
        $weekStart = Carbon::now()->startOfWeek();
        $weekEnd = Carbon::now()->endOfWeek();
        $weeklyTotal = \App\Models\Visit::query()
            ->whereBetween('visit_date', [$weekStart, $weekEnd]);

        if ($request->user()->role === 'host') {
            $weeklyTotal->where('user_id', $request->user()->id);
        }
        $weeklyTotal = $weeklyTotal->count();

        return response()->json([
            'statistics' => [
                'pending_approvals_count' => $pendingApprovals->count(),
                'todays_visits_count' => $todaysVisits->count(),
                'currently_checked_in' => $currentlyCheckedIn,
                'weekly_total' => $weeklyTotal,
            ],
            'lists' => [
                'todays_visits' => $todaysVisits,
                'pending_approvals' => $pendingApprovals,
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


        $visitors = Visitor::query()
            ->where(function ($q) use ($query) {
                $q->where('f_name', 'like', "%{$query}%")
                    ->orWhere('l_name', 'like', "%{$query}%")
                    ->orWhere('company', 'like', "%{$query}%")
                    ->orWhere('id_number', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%")
                    ->orWhere('phone', 'like', "%{$query}%");
            })
            ->with(['host', 'visits'])
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($visitor) {
                // Get the latest visit for status
                $latestVisit = $visitor->visits()->latest()->first();
                $status = $visitor->status;
                $checkedInAt = null;
                $checkedOutAt = null;

                if ($latestVisit) {
                    if ($latestVisit->check_out_time) {
                        $status = 'checked_out';
                        $checkedOutAt = $latestVisit->check_out_time;
                    } elseif ($latestVisit->check_in_time) {
                        $status = 'checked_in';
                        $checkedInAt = $latestVisit->check_in_time;
                    }
                }

                return [
                    'id' => $visitor->id,
                    'firstName' => $visitor->f_name,
                    'lastName' => $visitor->l_name,
                    'company' => $visitor->company,
                    'badgeNumber' => $visitor->id_number,
                    'photoUrl' => $this->getImageUrl($visitor->pic),
                    'status' => $visitor->status,
                    'visitRequests' => [[
                        'id' => $visitor->id,
                        'status' => $status,
                        'checkedInAt' => $checkedInAt,
                        'checkedOutAt' => $checkedOutAt,
                        'duration' => $visitor->visit_duration ?? '2 hours',
                        'host' => [
                            'id' => $visitor->user_id,
                            'firstName' => $visitor->h_name,
                            'lastName' => '', // Host last name is not stored separately in current schema
                        ],
                    ]],
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
            ->with(['host', 'visits'])
            ->first();

        if (!$visitor) {
            return response()->json(['message' => 'Visitor not found'], 404);
        }

        // Get the latest visit for status
        $latestVisit = $visitor->visits()->latest()->first();
        $status = $visitor->status;
        $checkedInAt = null;
        $checkedOutAt = null;

        if ($latestVisit) {
            if ($latestVisit->check_out_time) {
                $status = 'checked_out';
                $checkedOutAt = $latestVisit->check_out_time;
            } elseif ($latestVisit->check_in_time) {
                $status = 'checked_in';
                $checkedInAt = $latestVisit->check_in_time;
            }
        }

        return response()->json([
            'id' => $visitor->id,
            'firstName' => $visitor->f_name,
            'lastName' => $visitor->l_name,
            'company' => $visitor->company,
            'badgeNumber' => $visitor->id_number,
            'photoUrl' => $this->getImageUrl($visitor->pic),
            'visitRequests' => [[
                'id' => $visitor->id,
                'status' => $status,
                'checkedInAt' => $checkedInAt,
                'checkedOutAt' => $checkedOutAt,
                'duration' => $visitor->visit_duration ?? '2 hours',
                'host' => [
                    'id' => $visitor->user_id,
                    'firstName' => $visitor->h_name,
                    'lastName' => '', // Host last name is not stored separately in current schema
                ],
            ]],
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
            ->where('status', 'approved')
            ->with(['host', 'visits'])
            ->latest()
            ->first();

        if (!$query) {
            return response()->json(['message' => 'Visitor not found'], 404);
        }

        return response()->json([
            'id' => $query->id,
            'firstName' => $query->f_name,
            'lastName' => $query->l_name,
            'email' => $query->email,
            'phone' => $query->phone,
            'company' => $query->company,
            'idType' => $query->id_type,
            'idNumber' => $query->id_number,
            'hostName' => $query->h_name,
            'hostEmail' => $query->h_email,
            'hostPhone' => $query->h_phone,
            'photoUrl' => $this->getImageUrl($query->pic),
            'idPhotoUrl' => $this->getImageUrl($query->id_pic),
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
            'notes' => 'nullable|string',
        ]);

        // Check if visitor is approved
        if ($visitor->status !== 'approved') {
            return response()->json(['message' => 'Visitor is not approved'], 403);
        }

        $visit = $visitor->visits()->create([
            // 'user_id' => $request->user()->id ?? 1,
            'visit_date' => $request->visit_date,
            'check_in_time' => now(),
            'check_out_time' => null,
            'notes' => $request->notes,
        ]);

        return response()->json([
            'message' => 'Visit created successfully',
            'visit' => $visit->load('visitor', 'host'),
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
}
