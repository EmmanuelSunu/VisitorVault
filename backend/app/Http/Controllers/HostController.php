<?php

namespace App\Http\Controllers;

use App\Models\Host;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\StoreHostRequest;
use App\Http\Requests\UpdateHostRequest;

class HostController extends Controller
{
    /**
     * Display a listing of the hosts.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Host::query();

        // Filter by company if company_id is provided
        if ($request->has('company_id')) {
            $query->where('company_id', $request->company_id);
        }

        // Include company data if requested
        if ($request->boolean('include_company')) {
            $query->with('company');
        }

        $hosts = $query->get();
        return response()->json($hosts);
    }

    /**
     * Store a newly created host in storage.
     */
    public function store(StoreHostRequest $request): JsonResponse
    {
        $host = Host::create($request->validated());

        if ($request->boolean('include_company')) {
            $host->load('company');
        }

        return response()->json($host, 201);
    }

    /**
     * Display the specified host.
     */
    public function show(Request $request, Host $host): JsonResponse
    {
        if ($request->boolean('include_company')) {
            $host->load('company');
        }

        return response()->json($host);
    }

    /**
     * Update the specified host in storage.
     */
    public function update(UpdateHostRequest $request, Host $host): JsonResponse
    {
        $host->update($request->validated());

        if ($request->boolean('include_company')) {
            $host->load('company');
        }

        return response()->json($host);
    }

    /**
     * Remove the specified host from storage.
     */
    public function destroy(Host $host): JsonResponse
    {
        $host->delete();
        return response()->json(null, 204);
    }

    /**
     * Get all hosts for a specific company.
     */
    public function getCompanyHosts(Company $company): JsonResponse
    {
        $hosts = $company->hosts()->get();
        return response()->json($hosts);
    }

    /**
     * Toggle the active status of a host.
     */
    public function toggleStatus(Host $host): JsonResponse
    {
        $host->update([
            'is_active' => !$host->is_active
        ]);

        return response()->json($host);
    }
}
