'use client';

import { useEffect, useState } from 'react';
import { BottomSheet, BottomSheetContent, BottomSheetTitle } from '@/components/bracketup/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Copy, Check, Share2 } from 'lucide-react';

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  shareCode: string;
  tournamentName: string;
}

export default function ShareSheet({ open, onClose, shareCode, tournamentName }: ShareSheetProps) {
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>('');

  const viewUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/view/${shareCode}` : `/view/${shareCode}`;

  useEffect(() => {
    if (!open) return;

    const generateQr = async () => {
      try {
        const QRCode = (await import('qrcode')).default;
        const url = await QRCode.toDataURL(viewUrl, {
          width: 240,
          margin: 1,
          // Dark modules on a light background — a QR code needs this
          // polarity to scan reliably; the previous version had it
          // backwards (light modules on dark), which most scanners can't
          // read at all.
          color: { dark: '#000000', light: '#ffffff' },
        });
        setQrUrl(url);
      } catch (e) {
        console.error('QR generation failed', e);
      }
    };
    generateQr();
  }, [open, viewUrl]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(viewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback — nothing more to do without clipboard access.
    }
  };

  // Primary action always reads "Share link" — it just does different things
  // depending on the platform, rather than swapping to a different button.
  const handleShareLink = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: tournamentName, text: `Follow along at ${tournamentName}`, url: viewUrl });
      } catch {
        // User cancelled.
      }
    } else {
      copyLink();
    }
  };

  return (
    <BottomSheet open={open} onOpenChange={onClose}>
      <BottomSheetContent aria-label="Invite players to follow along" className="items-center px-5 pb-8 pt-4">
        <BottomSheetTitle className="text-lg font-semibold text-fg">
          Invite players to follow along
        </BottomSheetTitle>

        <div className="mt-5 flex h-[232px] w-[232px] items-center justify-center rounded-card bg-white p-4">
          {qrUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrUrl} alt={`QR code for share code ${shareCode}`} className="h-full w-full" />
          ) : (
            <div className="h-full w-full animate-pulse rounded-[4px] bg-gray-200" />
          )}
        </div>

        <div className="mt-5 flex w-full items-center justify-center gap-3">
          <p className="font-mono text-[52px] font-bold leading-none tracking-[0.15em] text-fg">{shareCode}</p>
          <button
            type="button"
            onClick={copyLink}
            aria-label="Copy link"
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-control px-2 text-fg-muted transition-colors hover:text-fg"
          >
            {copied ? (
              <>
                <Check className="h-5 w-5 text-done-fg" />
                <span className="text-sm text-done-fg">Copied</span>
              </>
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </button>
        </div>

        <p className="mt-5 w-full text-center text-sm text-fg-muted">
          Anyone with the code can watch. Only you can enter scores.
        </p>

        <Button size="cta" className="mt-5 w-full gap-2" onClick={handleShareLink}>
          <Share2 className="h-4 w-4" />
          Share link
        </Button>
      </BottomSheetContent>
    </BottomSheet>
  );
}
