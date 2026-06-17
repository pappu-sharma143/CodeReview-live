import { cn } from '../../lib/utils';
import { Sparkles } from 'lucide-react';

function DisplayCard({
  className,
  icon = <Sparkles className="size-5 text-primary" />,
  title = 'Featured',
  description = 'Discover amazing content',
  date = 'Just now',
  image,
  imageAlt = '',
  iconClassName = 'text-primary',
  titleClassName = 'text-primary',
}) {
  return (
    <div
      className={cn(
        'relative flex h-90 w-[48rem] max-w-[110vw] -skew-y-[8deg] select-none flex-col justify-between overflow-hidden rounded-xl border-2 border-border bg-muted/70 px-5 py-4 backdrop-blur-sm transition-all duration-700 after:absolute after:-right-1 after:top-[10%] after:h-[110%] after:w-[26rem] after:bg-gradient-to-l after:from-background after:to-transparent after:content-[""] hover:border-primary/30 hover:bg-muted [&>*]:flex [&>*]:items-center [&>*]:gap-2',
        className
      )}
    >
      {image ? (
        <img
          src={image}
          alt={imageAlt}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80"
          loading="lazy"
        />
      ) : null}

      <div className="relative z-[1]">
        <span className="relative inline-block rounded-full bg-primary/20 p-1">
          {icon}
        </span>
        <p className={cn('text-xl font-medium', titleClassName)}>{title}</p>
      </div>
      <p className="relative z-[1] text-xl">{description}</p>
      <p className="relative z-[1] text-base text-muted-foreground">{date}</p>
    </div>
  );
}

export default function DisplayCards({ cards }) {
  const defaultCards = [
    {
      className:
        "[grid-area:stack] hover:-translate-y-10 before:absolute before:left-0 before:top-0 before:h-full before:w-full before:rounded-xl before:bg-background/50 before:bg-blend-overlay before:opacity-100 before:outline before:outline-1 before:outline-border before:transition-opacity before:duration-700 before:content-[''] hover:before:opacity-0 grayscale hover:grayscale-0",
    },
    {
      className:
        "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-1 sm:translate-x-16 before:absolute before:left-0 before:top-0 before:h-full before:w-full before:rounded-xl before:bg-background/50 before:bg-blend-overlay before:opacity-100 before:outline before:outline-1 before:outline-border before:transition-opacity before:duration-700 before:content-[''] hover:before:opacity-0 grayscale hover:grayscale-0",
    },
    {
      className:
        '[grid-area:stack] translate-x-24 translate-y-20 hover:translate-y-10 sm:translate-x-32',
    },
  ];

  const displayCards = cards || defaultCards;

  return (
    <div className="grid animate-in fade-in-0 place-items-center opacity-100 duration-700 [grid-template-areas:'stack']">
      {displayCards.map((cardProps, index) => (
        <DisplayCard key={index} {...cardProps} />
      ))}
    </div>
  );
}
