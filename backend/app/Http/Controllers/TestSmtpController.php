<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TestSmtpController extends Controller
{
    public function testSmtp()
    {
        try {
            $smtp = [
                'host' => 'bethlog.desiderata.com.gh',
                'port' => 465,
                'timeout' => 30
            ];

            // Create socket context with SSL options
            $context = stream_context_create([
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                ]
            ]);

            // Try to connect
            $errno = 0;
            $errstr = '';
            $socket = @stream_socket_client(
                "ssl://{$smtp['host']}:{$smtp['port']}",
                $errno,
                $errstr,
                $smtp['timeout'],
                STREAM_CLIENT_CONNECT,
                $context
            );

            if ($socket) {
                return response()->json([
                    'message' => 'SMTP connection successful',
                    'details' => [
                        'host' => $smtp['host'],
                        'port' => $smtp['port'],
                        'response' => fgets($socket)
                    ]
                ]);
            } else {
                return response()->json([
                    'message' => 'SMTP connection failed',
                    'error' => "$errstr ($errno)",
                    'details' => [
                        'host' => $smtp['host'],
                        'port' => $smtp['port']
                    ]
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error testing SMTP connection',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
