<?php

namespace Database\Factories;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Visitor>
 */
class VisitorFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $host = User::factory()->host()->create();
        $visitDate = fake()->dateTimeBetween('-1 week', '+1 week');

        return [
            'f_name' => fake()->firstName(),
            'l_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'company' => fake()->company(),
            'purpose' => fake()->randomElement(['Meeting', 'Interview', 'Delivery', 'Maintenance', 'Consultation']),
            'status' => 'pending',
            'visit_date' => $visitDate,
            'user_id' => $host->id,
            'h_name' => $host->name,
            'h_email' => $host->email,
            'h_phone' => $host->phone,
            'id_type' => fake()->randomElement(['National ID', 'Passport', 'Drivers License', 'Work ID']),
            'id_number' => fake()->unique()->numerify('ID###-###-###'),
            'pic' => 'selfies/' . fake()->uuid() . '.jpg',
            'id_pic' => 'ids/' . fake()->uuid() . '.jpg',
            'notes' => fake()->optional(0.3)->sentence(),
        ];
    }

    /**
     * Indicate that the visitor is approved.
     */
    public function approved(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'approved',
        ]);
    }

    /**
     * Indicate that the visitor is rejected.
     */
    public function rejected(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'rejected',
            'notes' => fake()->sentence(),
        ]);
    }

    // Check-in and check-out functionality moved to Visit model

    /**
     * Set a specific host for the visitor.
     */
    public function forHost(User $host): static
    {
        return $this->state(fn(array $attributes) => [
            'user_id' => $host->id,
            'h_name' => $host->name,
            'h_email' => $host->email,
            'h_phone' => $host->phone,
        ]);
    }
}
