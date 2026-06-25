import iconSrc from '../assets/Favicon.svg';

export default function Logo({
  className = 'inline-flex items-center gap-2',
  iconClassName = 'h-8 w-auto shrink-0 opacity-100',
  textClassName = 'text-xl font-semibold tracking-tight text-foreground',
  showText = true,
  ...props
}) {
  return (
    <span className={className} {...props}>
      <img src={iconSrc} alt="" className={iconClassName} aria-hidden />
      {showText && (
        <span className={textClassName}>
          CodeReview<span className="text-primary">.live</span>
        </span>
      )}
    </span>
  );
}
