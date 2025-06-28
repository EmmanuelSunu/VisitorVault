import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, RotateCcw } from "lucide-react";
import { generateQRCode, downloadQRCode } from "@/lib/qr-utils";

interface QrDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeData: string;
  badgeNumber: string;
  visitorName?: string;
}

export default function QrDisplayModal({ 
  isOpen, 
  onClose, 
  qrCodeData, 
  badgeNumber, 
  visitorName 
}: QrDisplayModalProps) {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Generate QR code when modal opens
  useState(() => {
    if (isOpen && qrCanvasRef.current) {
      generateQRCode(qrCodeData, qrCanvasRef.current);
    }
  });

  const handleDownload = () => {
    if (qrCanvasRef.current) {
      downloadQRCode(qrCanvasRef.current, `visitor-badge-${badgeNumber}`);
    }
  };

  const handlePrint = () => {
    // Create a print-friendly window with the badge
    const printWindow = window.open('', '_blank');
    if (printWindow && qrCanvasRef.current) {
      const qrDataURL = qrCanvasRef.current.toDataURL();
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Visitor Badge - ${badgeNumber}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              .badge {
                width: 3.5in;
                height: 2.25in;
                border: 2px solid #2563eb;
                border-radius: 8px;
                padding: 16px;
                background: white;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 8px;
              }
              .company-logo {
                font-size: 14px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 4px;
              }
              .badge-title {
                font-size: 12px;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .visitor-info {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: space-between;
              }
              .visitor-details {
                flex: 1;
              }
              .visitor-name {
                font-size: 16px;
                font-weight: bold;
                color: #111;
                margin-bottom: 4px;
              }
              .badge-number {
                font-size: 12px;
                color: #666;
                font-family: monospace;
              }
              .qr-section {
                text-align: center;
              }
              .qr-code {
                width: 60px;
                height: 60px;
                border: 1px solid #ddd;
              }
              .footer {
                text-align: center;
                font-size: 10px;
                color: #666;
                margin-top: 8px;
              }
              @media print {
                body { margin: 0; padding: 0; }
                .badge { box-shadow: none; }
              }
            </style>
          </head>
          <body>
            <div class="badge">
              <div class="header">
                <div class="company-logo">SecureVisit Pro</div>
                <div class="badge-title">Visitor Badge</div>
              </div>
              <div class="visitor-info">
                <div class="visitor-details">
                  <div class="visitor-name">${visitorName || 'Visitor'}</div>
                  <div class="badge-number">${badgeNumber}</div>
                </div>
                <div class="qr-section">
                  <img src="${qrDataURL}" alt="QR Code" class="qr-code" />
                </div>
              </div>
              <div class="footer">
                Valid for scheduled visit only • Present at reception
              </div>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      
      // Printer after a short delay to ensure content is loaded
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-green-600">
            Visitor Badge Generated
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 text-center">
          {/* QR Code Display */}
          <div className="flex justify-center">
            <div className="w-48 h-48 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center p-4">
              <canvas
                ref={qrCanvasRef}
                className="max-w-full max-h-full"
              />
            </div>
          </div>
          
          {/* Badge Information */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900">
              Registration Complete!
            </h3>
            <p className="text-gray-600">
              Badge Number: <span className="font-mono font-medium">{badgeNumber}</span>
            </p>
            <p className="text-sm text-gray-500">
              Please present this QR code at reception for check-in
            </p>
          </div>

          {/* Status Information */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 text-sm">
              <strong>Status:</strong> Pending host approval. You will receive an email notification once approved.
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <Button className="w-full" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download QR Code
            </Button>
            <Button variant="outline" className="w-full" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Printer Badge
            </Button>
            <Button variant="outline" className="w-full" onClick={onClose}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
