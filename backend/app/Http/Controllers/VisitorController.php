<?php

namespace App\Http\Controllers;

use App\Models\Visitor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Carbon\Carbon;

class VisitorController extends Controller
{
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
        $request->validate([
            'f_name' => 'required|string|max:255',
            'l_name' => 'required|string|max:255',
            'purpose' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'required|email|max:255',
            'company' => 'nullable|string|max:255',
            'h_name' => 'required|string|max:255',
            'h_email' => 'required|email|max:255',
            'h_phone' => 'required|string|max:20',
            'id_type' => 'required|string|max:255',
            'id_number' => 'required|string|max:255',
            'visit_date' => 'required|date',
            'pic' => 'required|string', // Base64 encoded image
            'id_pic' => 'required|string', // Base64 encoded image
        ]);

        // Handle selfie image
        $selfieImage = $this->saveBase64Image($request->pic, 'selfies');

        // Handle ID image
        $idImage = $this->saveBase64Image($request->id_pic, 'ids');

        $visitor = Visitor::create([
            ...$request->except(['pic', 'id_pic']),
            'pic' => $selfieImage,
            'id_pic' => $idImage,
            'status' => 'pending'
        ]);

        return response()->json($visitor, 201);
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
        $request->validate([
            'status' => 'sometimes|required|in:approved,rejected',
            'notes' => 'nullable|string',
        ]);

        $visitor->update($request->all());

        return response()->json($visitor);
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

    public function checkIn(Visitor $visitor)
    {
        if ($visitor->status !== 'approved') {
            return response()->json(['message' => 'Visitor must be approved before check-in'], 422);
        }

        $visitor->update([
            'check_in_time' => now(),
        ]);

        return response()->json($visitor);
    }

    public function checkOut(Visitor $visitor)
    {
        if (!$visitor->check_in_time) {
            return response()->json(['message' => 'Visitor must be checked in before check-out'], 422);
        }

        $visitor->update([
            'check_out_time' => now(),
        ]);

        return response()->json($visitor);
    }

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

        // Get today's visits
        $today = Carbon::today();
        $todaysVisits = (clone $baseQuery)
            ->whereDate('visit_date', $today)
            ->with('host')
            ->latest()
            ->get();

        // Get currently checked in visitors
        $currentlyCheckedIn = (clone $baseQuery)
            ->whereNotNull('check_in_time')
            ->whereNull('check_out_time')
            ->count();

        // Get total visits for the week
        $weekStart = Carbon::now()->startOfWeek();
        $weekEnd = Carbon::now()->endOfWeek();
        $weeklyTotal = (clone $baseQuery)
            ->whereBetween('visit_date', [$weekStart, $weekEnd])
            ->count();

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
     */
    public function checkedIn()
    {
        $visitors = Visitor::query()
            ->with(['host'])
            ->whereNotNull('check_in_time')
            ->whereNull('check_out_time')
            ->latest('check_in_time')
            ->get()
            ->map(function ($visitor) {
                return [
                    'id' => $visitor->id,
                    'visitor' => [
                        'firstName' => $visitor->f_name,
                        'lastName' => $visitor->l_name,
                        'photoUrl' => $this->getImageUrl($visitor->pic),
                    ],
                    'host' => [
                        'firstName' => $visitor->h_name,
                        'lastName' => '', // Host last name is not stored separately in current schema
                    ],
                    'checkedInAt' => $visitor->check_in_time,
                    'duration' => $visitor->visit_duration ?? '2 hours', // Default duration if not specified
                ];
            });

        return response()->json($visitors);
    }

    /**
     * Search visitors by name, company, or badge number
     */
    public function search(Request $request)
    {
        $query = $request->get('q');

        if (empty($query)) {
            return response()->json([]);
        }

        $visitors = Visitor::query()
            ->where(function ($q) use ($query) {
                $q->where('f_name', 'like', "%{$query}%")
                    ->orWhere('l_name', 'like', "%{$query}%")
                    ->orWhere('company', 'like', "%{$query}%")
                    ->orWhere('id_number', 'like', "%{$query}%");
            })
            ->with('host')
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($visitor) {
                return [
                    'id' => $visitor->id,
                    'firstName' => $visitor->f_name,
                    'lastName' => $visitor->l_name,
                    'company' => $visitor->company,
                    'badgeNumber' => $visitor->id_number,
                    'photoUrl' => $this->getImageUrl($visitor->pic),
                    'visitRequests' => [[
                        'id' => $visitor->id,
                        'status' => $visitor->check_out_time ? 'checked_out' : ($visitor->check_in_time ? 'checked_in' : ($visitor->status ?? 'pending')),
                        'checkedInAt' => $visitor->check_in_time,
                        'checkedOutAt' => $visitor->check_out_time,
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
            ->with('host')
            ->first();

        if (!$visitor) {
            return response()->json(['message' => 'Visitor not found'], 404);
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
                'status' => $visitor->check_out_time ? 'checked_out' : ($visitor->check_in_time ? 'checked_in' : ($visitor->status ?? 'pending')),
                'checkedInAt' => $visitor->check_in_time,
                'checkedOutAt' => $visitor->check_out_time,
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
     * Check in a visitor
     */
    public function checkInVisitor($id)
    {
        $visitor = Visitor::findOrFail($id);

        if ($visitor->check_in_time) {
            return response()->json(['message' => 'Visitor is already checked in'], 422);
        }

        if ($visitor->status !== 'approved') {
            return response()->json(['message' => 'Visit must be approved before check-in'], 422);
        }

        $visitor->update([
            'check_in_time' => now(),
            'status' => 'checked_in'
        ]);

        return response()->json(['message' => 'Visitor checked in successfully']);
    }

    /**
     * Check out a visitor
     */
    public function checkOutVisitor($id)
    {
        $visitor = Visitor::findOrFail($id);

        if (!$visitor->check_in_time) {
            return response()->json(['message' => 'Visitor must be checked in first'], 422);
        }

        if ($visitor->check_out_time) {
            return response()->json(['message' => 'Visitor is already checked out'], 422);
        }

        $visitor->update([
            'check_out_time' => now(),
            'status' => 'checked_out'
        ]);

        return response()->json(['message' => 'Visitor checked out successfully']);
    }

    /**
     * Get recent visitor activity logs
     */
    public function activityLogs(Request $request)
    {
        $query = Visitor::query()
            ->with('host')
            ->where(function ($q) {
                $q->whereNotNull('created_at') // New registrations
                    ->orWhereNotNull('check_in_time') // Check-ins
                    ->orWhereNotNull('check_out_time') // Check-outs
                    ->orWhereIn('status', ['approved', 'rejected']); // Status changes
            });

        // If user is a host, only show their visitors' activities
        if ($request->user()->role === 'host') {
            $query->where('user_id', $request->user()->id);
        }

        $activities = $query->latest()->limit(10)->get()->map(function ($visitor) {
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

            // Check-in
            if ($visitor->check_in_time) {
                $activities[] = [
                    'type' => 'check_in',
                    'visitor_name' => $visitor->f_name . ' ' . $visitor->l_name,
                    'host_name' => $visitor->h_name,
                    'timestamp' => $visitor->check_in_time,
                    'description' => "Visitor checked in"
                ];
            }

            // Check-out
            if ($visitor->check_out_time) {
                $activities[] = [
                    'type' => 'check_out',
                    'visitor_name' => $visitor->f_name . ' ' . $visitor->l_name,
                    'host_name' => $visitor->h_name,
                    'timestamp' => $visitor->check_out_time,
                    'description' => "Visitor checked out"
                ];
            }

            return $activities;
        })->flatten(1)
            ->sortByDesc('timestamp')
            ->values()
            ->take(10);

        return response()->json($activities);
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
