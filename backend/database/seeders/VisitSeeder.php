<?php

namespace Database\Seeders;

use App\Models\Visit;
use App\Models\Visitor;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class VisitSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get existing visitors
        $visitors = Visitor::all();

        if ($visitors->isEmpty()) {
            // Create some visitors first if none exist
            $visitors = Visitor::factory(10)->create();
        }

        // Create various types of visits
        foreach ($visitors as $visitor) {
            // Create a few visits for each visitor
            Visit::factory(3)->create([
                'visitor_id' => $visitor->id,
                'user_id' => $visitor->user_id,
            ]);

            // Create some checked-in visits
            Visit::factory()->checkedIn()->create([
                'visitor_id' => $visitor->id,
                'user_id' => $visitor->user_id,
            ]);

            // Create some checked-out visits
            Visit::factory()->checkedOut()->create([
                'visitor_id' => $visitor->id,
                'user_id' => $visitor->user_id,
            ]);

            // Create some visits for today
            Visit::factory()->today()->create([
                'visitor_id' => $visitor->id,
                'user_id' => $visitor->user_id,
            ]);
        }
    }
}
