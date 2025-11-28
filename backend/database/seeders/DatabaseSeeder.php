<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Company;
use App\Models\Visitor;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin user
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'role' => 'admin'
        ]);

        // Create receptionist
        User::factory()->create([
            'name' => 'Reception Staff',
            'email' => 'reception@example.com',
            'role' => 'receptionist'
        ]);

        Company::create([
            'name' => 'BethLog Company Ltd.',
            'address' => 'HQ Tse Addo, Accra, Ghana',
            'contact_person' => 'CEO',
            'contact_email' => 'info@bethlog.com',
            'contact_phone' => '+233 123465832',
            'notes' => 'Company 1 notes'
        ]);

        Company::create([
            'name' => 'Bethlog Construction',
            'address' => 'BethLog Tower',
            'contact_person' => 'Nii',
            'contact_email' => 'nii@bethlogconstruction.com',
            'contact_phone' => '+233 123465832',
            'notes' => 'Company 1 notes'
        ]);

        // // Create some host users
        // $hosts = User::factory()->count(5)->host()->create();

        // // Create visitors for each host
        // foreach ($hosts as $host) {
        //     // Pending visitors
        //     Visitor::factory()
        //         ->count(3)
        //         ->forHost($host)
        //         ->create();

        //     // Approved visitors
        //     Visitor::factory()
        //         ->count(2)
        //         ->forHost($host)
        //         ->approved()
        //         ->create();

        //     // Rejected visitors
        //     Visitor::factory()
        //         ->count(1)
        //         ->forHost($host)
        //         ->rejected()
        //         ->create();
        // }

        // // Seed visits after visitors are created
        // $this->call([
        //     VisitSeeder::class,
        // ]);
    }
}
