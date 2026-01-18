import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Copy, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export function QRCodeDisplay() {
  const [qrUrl, setQrUrl] = useState("");
  const [qrData, setQrData] = useState("");

  useEffect(() => {
    fetch("/api/qr-code")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setQrUrl(data.url);
        setQrData(data.qrData || data.url);
      })
      .catch((error) => {
        console.error("Error fetching QR code:", error);
        // Fallback: generate URL from current location
        const currentUrl = window.location.origin;
        const attendanceUrl = `${currentUrl}/attendance`;
        setQrUrl(attendanceUrl);
        setQrData(attendanceUrl);
      });
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrUrl);
    toast.success("URL copied to clipboard!");
  };

  const downloadQR = () => {
    // Generate QR code using a library or API
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}`;
    const link = document.createElement("a");
    link.href = qrImageUrl;
    link.download = "attendance-qr-code.png";
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code for Attendance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center p-4 bg-muted rounded-lg">
          {qrData ? (
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`}
              alt="QR Code"
              className="w-48 h-48"
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-muted-foreground">
              Loading QR Code...
            </div>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground break-all">{qrUrl}</p>
          <div className="flex gap-2">
            <Button onClick={copyToClipboard} variant="outline" className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              Copy URL
            </Button>
            <Button onClick={downloadQR} variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download QR
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


