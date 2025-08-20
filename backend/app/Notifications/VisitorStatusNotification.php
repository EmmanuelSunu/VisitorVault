<?php

namespace App\Notifications;

use App\Models\Visitor;
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
        protected Visitor $visitor
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
        $status = $this->visitor->status;
        $visitDate = $this->visitor->visit_date->format('F j, Y');

        $message = (new MailMessage)
            ->subject("Your Visit Request Status Update")
            ->greeting("Hello {$this->visitor->f_name},");

        if ($status === 'approved') {
            $message->line("Your visit request for {$visitDate} has been approved.")
                ->line("You can now proceed with your visit as planned.");
            // ->line("Host Details:")
            // ->line("Name: {$this->visitor->h_name}")
            // ->line("Email: {$this->visitor->h_email}")
            // ->line("Phone: {$this->visitor->h_phone}");
        } else {
            $message->line("Your visit request for {$visitDate} has been rejected.")
                ->line("Reason: {$this->visitor->notes}");
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
            'status' => $this->visitor->status,
            'visit_date' => $this->visitor->visit_date,
        ];
    }
}
