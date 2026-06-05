import type { IconBaseProps, IconType } from 'react-icons';

type AppIconProps = {
  icon: IconType;
  className?: string;
  'aria-hidden'?: boolean;
};

export function AppIcon({ icon: Icon, className, 'aria-hidden': ariaHidden = true }: AppIconProps) {
  const props: IconBaseProps = {
    className,
    'aria-hidden': ariaHidden,
  };

  return <Icon {...props} />;
}
