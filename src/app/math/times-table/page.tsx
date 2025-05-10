
"use client";

import { TimesTableUI } from '@/components/math/times-table-ui';
import { TableIcon } from 'lucide-react';

export default function TimesTablePracticePage() {
  return (
    <div className="space-y-8">
      <header className="text-center space-y-2 animate-in fade-in-0 slide-in-from-top-10 duration-700 ease-out">
         <TableIcon className="h-12 w-12 mx-auto text-primary" aria-hidden="true" />
        <h1 className="text-3xl font-bold text-gradient-primary-accent">Times Table Practice</h1>
        <p className="text-md text-muted-foreground">Master your multiplication facts!</p>
      </header>
      <TimesTableUI />
    </div>
  );
}
