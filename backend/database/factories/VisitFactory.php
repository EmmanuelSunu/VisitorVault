<?php

namespace Database\Factories;

use App\Models\Visit;
use App\Models\Visitor;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Visit>
 */
class VisitFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Visit::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Get an existing visitor or create one if none exist
        $visitor = Visitor::first() ?? Visitor::factory()->create();

        return [
            'visitor_id' => $visitor->id,
            'user_id' => $visitor->user_id, // Host from visitor
            'visit_date' => $this->faker->dateTimeBetween('-30 days', '+30 days'),
            'check_in_time' => null,
            'check_out_time' => null,
            'notes' => $this->faker->optional()->sentence(),
            'badge_number' => $this->faker->optional()->numerify('BADGE-#####'),
        ];
    }

    /**
     * Indicate that the visit is checked in.
     */
    public function checkedIn(): static
    {
        return $this->state(fn(array $attributes) => [
            'check_in_time' => $this->faker->dateTimeBetween('-2 hours', 'now'),
            'check_out_time' => null,
        ]);
    }

    /**
     * Indicate that the visit is checked out.
     */
    public function checkedOut(): static
    {
        return $this->state(fn(array $attributes) => [
            'check_in_time' => $this->faker->dateTimeBetween('-4 hours', '-2 hours'),
            'check_out_time' => $this->faker->dateTimeBetween('-2 hours', 'now'),
        ]);
    }

    /**
     * Indicate that the visit is scheduled for today.
     */
    public function today(): static
    {
        return $this->state(fn(array $attributes) => [
            'visit_date' => now()->toDateString(),
        ]);
    }
}
