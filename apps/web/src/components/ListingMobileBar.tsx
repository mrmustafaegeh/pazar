'use client';

import { MessageSellerButton } from '@/components/MessageSellerButton';

interface Props {
  price: string;
  sellerId: string;
  listingId: string;
  contactLabel: string;
}

export function ListingMobileBar({ price, sellerId, listingId, contactLabel }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <p className="min-w-0 flex-1 truncate text-xl font-bold text-[#E8A33D]">{price}</p>
        <MessageSellerButton
          sellerId={sellerId}
          listingId={listingId}
          label={contactLabel}
          className="btn-primary shrink-0 px-5 py-2.5 text-sm"
        />
      </div>
    </div>
  );
}
