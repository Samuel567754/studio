
"use client";

import type { FC, PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';
import { useWalkthroughStore } from '@/stores/walkthrough-store';
import { WalkthroughModal } from '@/components/walkthrough-modal';

export const ClientRootFeatures: FC<PropsWithChildren> = ({ children }) => {
  const {
    hasCompletedWalkthrough,
    openWalkthrough,
    isWalkthroughOpen,
    closeWalkthrough,
    setHasCompletedWalkthrough,
  } = useWalkthroughStore();
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  useEffect(() => {
    if (isClientMounted && !hasCompletedWalkthrough && typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        openWalkthrough();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isClientMounted, hasCompletedWalkthrough, openWalkthrough]);

  return (
    <>
      {children}
      {isClientMounted && (
        <WalkthroughModal
          isOpen={isWalkthroughOpen}
          onClose={closeWalkthrough}
          onFinish={() => {
            setHasCompletedWalkthrough(true);
            closeWalkthrough();
          }}
        />
      )}
    </>
  );
};
