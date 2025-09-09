<?php

namespace App\Notifications;

use App\Models\Visitor;
use App\Models\Visit;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VisitorStatusNotification extends Notification implements ShouldQueue
{
    // use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        protected Visitor $visitor,
        protected Visit $visit
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $status = $this->visit->status;
        $visitDate = $this->visit->visit_date->format('F j, Y');
        $hostName = $this->visit->host ? $this->visit->host->name : 'your host';

        $message = (new MailMessage)
            ->subject("Your Visit Request Status Update")
            ->greeting("Hello {$this->visitor->f_name},");

        if ($status === 'approved') {
            $message->line("Your visit request for {$visitDate} has been approved.")
                ->line("You can now proceed with your visit as planned.");

            if ($this->visit->host) {
                $message->line("Host Details:")
                    ->line("Name: {$this->visit->host->name}")
                    ->line("Department: {$this->visit->host->department}");
            }
        } else {
            $message->line("Your visit request for {$visitDate} has been rejected.");
            if ($this->visit->notes) {
                $message->line("Reason: {$this->visit->notes}");
            }
        }

        return $message->line("If you have any questions, please contact your host or the reception.");
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'visitor_id' => $this->visitor->id,
            'visit_id' => $this->visit->id,
            'status' => $this->visit->status,
            'visit_date' => $this->visit->visit_date,
            'host' => $this->visit->host ? [
                'name' => $this->visit->host->name,
                'department' => $this->visit->host->department,
            ] : null,
        ];
    }
}
