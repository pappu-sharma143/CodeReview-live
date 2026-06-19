import {
  forwardRef,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Check } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
} from 'framer-motion';
import { cn } from '../../lib/utils';

const placeholderImage = (text = 'Image') =>
  `https://placehold.co/600x400/1a1a1a/ffffff?text=${encodeURIComponent(text)}`;

const TOTAL_STEPS = 4;

const steps = [
  {
    id: '1',
    name: 'Live editing',
    title: 'Live editing',
    description:
      'Syntax highlighting, multi-file tabs, and live cursors keep every reviewer on the same page.',
  },
  {
    id: '2',
    name: 'Live previews',
    title: 'Live previews',
    description:
      'See React, TypeScript, and Node apps run as your team reviews — no local setup required.',
  },
  {
    id: '3',
    name: 'Comments',
    title: 'Comments & voice notes',
    description:
      'Pin feedback to exact lines with text or short voice notes so context never gets lost.',
  },
  {
    id: '4',
    name: 'Sessions',
    title: 'Open review rooms',
    description:
      'Join live JavaScript, TypeScript, React, or HTML review rooms from the lobby in seconds.',
  },
];

const ANIMATION_PRESETS = {
  fadeInScale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { type: 'spring', stiffness: 300, damping: 25, mass: 0.5 },
  },
  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { type: 'spring', stiffness: 300, damping: 25, mass: 0.5 },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { type: 'spring', stiffness: 300, damping: 25, mass: 0.5 },
  },
};

function useNumberCycler(totalSteps = TOTAL_STEPS, interval = 5000) {
  const [currentNumber, setCurrentNumber] = useState(0);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setCurrentNumber((prev) => (prev + 1) % totalSteps);
    }, interval);

    return () => clearTimeout(timerId);
  }, [currentNumber, totalSteps, interval]);

  const setStep = useCallback(
    (stepIndex) => {
      setCurrentNumber(stepIndex % totalSteps);
    },
    [totalSteps]
  );

  return { currentNumber, setStep };
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return isMobile;
}

const stepVariants = {
  inactive: { scale: 0.9, opacity: 0.7 },
  active: { scale: 1, opacity: 1 },
};

const StepImage = forwardRef(({ src, alt, className, style, ...props }, ref) => {
  return (
    <img
      ref={ref}
      alt={alt}
      className={className}
      src={src}
      style={{ position: 'absolute', userSelect: 'none', maxWidth: 'unset', ...style }}
      onError={(e) => {
        e.currentTarget.src = placeholderImage(alt);
      }}
      {...props}
    />
  );
});
StepImage.displayName = 'StepImage';

const MotionStepImage = motion(StepImage);

function AnimatedStepImage({ preset = 'fadeInScale', delay = 0, ...props }) {
  const presetConfig = ANIMATION_PRESETS[preset];
  return (
    <MotionStepImage
      {...props}
      {...presetConfig}
      transition={{ ...presetConfig.transition, delay }}
    />
  );
}

function FeatureCard({ children, step }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const isMobile = useIsMobile();

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    if (isMobile) return;
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      className="animated-cards group relative w-full rounded-2xl"
      onMouseMove={handleMouseMove}
      style={{
        '--x': useMotionTemplate`${mouseX}px`,
        '--y': useMotionTemplate`${mouseY}px`,
      }}
    >
      <div className="relative w-full overflow-hidden rounded-3xl border border-border bg-card transition-colors duration-300">
        <div className="m-6 min-h-[420px] w-full sm:m-10 sm:min-h-[450px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              className="relative z-10 flex w-full flex-col gap-4 md:w-3/5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="text-sm font-semibold uppercase tracking-wider text-primary"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {steps[step].name}
              </motion.div>
              <motion.h2
                className="text-2xl font-bold tracking-tight text-foreground md:text-3xl"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {steps[step].title}
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="text-base leading-relaxed text-muted-foreground">
                  {steps[step].description}
                </p>
              </motion.div>
            </motion.div>
          </AnimatePresence>
          {children}
        </div>
      </div>
    </motion.div>
  );
}

function StepsNav({ steps: stepItems, current, onChange }) {
  return (
    <nav aria-label="Progress" className="flex justify-center px-4">
      <ol className="flex w-full flex-wrap items-center justify-center gap-2" role="list">
        {stepItems.map((step, stepIdx) => {
          const isCompleted = current > stepIdx;
          const isCurrent = current === stepIdx;

          return (
            <motion.li
              key={step.id}
              initial="inactive"
              animate={isCurrent ? 'active' : 'inactive'}
              variants={stepVariants}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <button
                type="button"
                className={cn(
                  'group flex items-center gap-2.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
                onClick={() => onChange(stepIdx)}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-300',
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : isCurrent
                        ? 'bg-primary/80 text-primary-foreground'
                        : 'bg-background text-muted-foreground group-hover:bg-muted'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <span>{stepIdx + 1}</span>
                  )}
                </span>
                <span className="hidden sm:inline-block">{step.name}</span>
              </button>
            </motion.li>
          );
        })}
      </ol>
    </nav>
  );
}

const defaultClasses = {
  img: 'rounded-xl border border-border shadow-2xl shadow-black/10 dark:shadow-neutral-950/50',
  step1img1: 'w-[50%] left-0 top-[10%]',
  step1img2: 'w-[60%] left-[40%] top-[35%]',
  step2img1: 'w-[50%] left-[5%] top-[10%]',
  step2img2: 'w-[40%] left-[55%] top-[45%]',
  step3img: 'w-[90%] left-[0%] top-[8%]',
  step4img: 'w-[90%] left-[5%] top-[25%]',
};

export function FeatureCarousel({
  image,
  step1img1Class = defaultClasses.step1img1,
  step1img2Class = defaultClasses.step1img2,
  step2img1Class = defaultClasses.step2img1,
  step2img2Class = defaultClasses.step2img2,
  step3imgClass = defaultClasses.step3img,
  step4imgClass = defaultClasses.step4img,
  ...props
}) {
  const { currentNumber: step, setStep } = useNumberCycler();

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="relative h-full w-full">
            <AnimatedStepImage
              alt={image.alt}
              className={cn(defaultClasses.img, step1img1Class)}
              src={image.step1img1}
              preset="slideInLeft"
            />
            <AnimatedStepImage
              alt={image.alt}
              className={cn(defaultClasses.img, step1img2Class)}
              src={image.step1img2}
              preset="slideInRight"
              delay={0.1}
            />
          </div>
        );
      case 1:
        return (
          <div className="relative h-full w-full">
            <AnimatedStepImage
              alt={image.alt}
              className={cn(defaultClasses.img, step2img1Class)}
              src={image.step2img1}
              preset="fadeInScale"
            />
            <AnimatedStepImage
              alt={image.alt}
              className={cn(defaultClasses.img, step2img2Class)}
              src={image.step2img2}
              preset="fadeInScale"
              delay={0.1}
            />
          </div>
        );
      case 2:
        return (
          <AnimatedStepImage
            alt={image.alt}
            className={cn(defaultClasses.img, step3imgClass)}
            src={image.step3img}
            preset="fadeInScale"
          />
        );
      case 3:
        return (
          <AnimatedStepImage
            alt={image.alt}
            className={cn(defaultClasses.img, step4imgClass)}
            src={image.step4img}
            preset="fadeInScale"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-12 p-4">
      <FeatureCard {...props} step={step}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            {...ANIMATION_PRESETS.fadeInScale}
            className="absolute h-full w-full"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </FeatureCard>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <StepsNav current={step} onChange={setStep} steps={steps} />
      </motion.div>
    </div>
  );
}
