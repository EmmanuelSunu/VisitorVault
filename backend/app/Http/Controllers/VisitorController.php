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

    private function saveBase64Image($base64Image, $folder)
    {
        // Remove data URI scheme header
        $image = str_replace('data:image/jpeg;base64,', '', $base64Image);
        $image = str_replace('data:image/png;base64,', '', $image);
        $image = str_replace(' ', '+', $image);

        // Generate unique filename
        $filename = $folder . '/' . Str::uuid() . '.jpg';

        // Save image
        Storage::put($filename, base64_decode($image));

        return $filename;
    }
}
