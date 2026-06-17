import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.97]',
        navCta:
          'text-foreground bg-nav-button hover:bg-nav-button/80 active:scale-[0.97] rounded-lg uppercase text-xs tracking-widest',
        hero: 'bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.97] rounded-sm font-bold',
        heroOutline:
          'bg-white text-background hover:brightness-90 active:scale-[0.97] rounded-sm font-bold',
        ghost: 'hover:bg-secondary text-muted-foreground hover:text-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2 text-sm',
        lg: 'h-11 px-6 text-sm',
        sm: 'h-9 px-3 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button, buttonVariants };
