'use client';

import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  getListingProposalDownloadFilename,
  getListingProposalTitle,
} from '@/lib/listing-proposal';
import type { SaleListing } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ListingProposalButtonProps {
  listing: Pick<SaleListing, 'id' | 'make' | 'model' | 'year'>;
  className?: string;
}

function parseFilenameFromDisposition(
  contentDisposition: string | null,
  fallbackFilename: string
) {
  if (!contentDisposition) {
    return fallbackFilename;
  }

  const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (filenameStarMatch?.[1]) {
    return decodeURIComponent(filenameStarMatch[1]);
  }

  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (filenameMatch?.[1]) {
    return filenameMatch[1];
  }

  return fallbackFilename;
}

function downloadBlob(blob: Blob, fileName: string) {
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function ListingProposalButton({
  listing,
  className,
}: ListingProposalButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    if (isPending) {
      return;
    }

    const fallbackFilename = getListingProposalDownloadFilename(listing);
    const proposalTitle = getListingProposalTitle(listing);

    setIsPending(true);

    try {
      const response = await fetch(`/api/listings/${listing.id}/proposal`);

      if (!response.ok) {
        let message = 'Не удалось сформировать PDF по объявлению.';

        try {
          const payload = await response.json();
          if (payload?.error && typeof payload.error === 'string') {
            message = payload.error;
          }
        } catch {
          // Ignore JSON parse failures and use the fallback message.
        }

        throw new Error(message);
      }

      const blob = await response.blob();
      const fileName = parseFilenameFromDisposition(
        response.headers.get('content-disposition'),
        fallbackFilename
      );

      if (typeof window !== 'undefined' && typeof File === 'function') {
        const file = new File([blob], fileName, { type: 'application/pdf' });

        try {
          const canShareFiles =
            typeof navigator !== 'undefined' &&
            typeof navigator.share === 'function' &&
            typeof navigator.canShare === 'function' &&
            navigator.canShare({ files: [file] });

          if (canShareFiles) {
            await navigator.share({
              title: proposalTitle,
              text: `${proposalTitle} — коммерческое предложение vin2win`,
              files: [file],
            });
            return;
          }
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }
        }
      }

      downloadBlob(blob, fileName);
      toast({
        title: 'PDF готов',
        description: 'Коммерческое предложение сохранено в формате PDF.',
      });
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      toast({
        title: 'Не удалось собрать PDF',
        description:
          error instanceof Error
            ? error.message
            : 'Попробуйте ещё раз через несколько секунд.',
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        'h-11 w-full rounded-2xl border-border/80 bg-background/70 font-medium dark:bg-background/10',
        className
      )}
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Send className="mr-2 h-4 w-4" />
      )}
      {isPending ? 'Собираем PDF…' : 'PDF клиенту'}
    </Button>
  );
}
