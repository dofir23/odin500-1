import { Link } from 'react-router-dom';
import odinLogo from '../assets/odin500-logo.svg';
import odinLogoLight from '../assets/odin500-logo-light.svg';

/**
 * Clickable Odin500 wordmark → /market (logo + small “Beta” label).
 * @param {{ theme?: 'light' | 'dark', className?: string, imgClassName?: string, alt?: string, title?: string }} props
 */
export function Odin500BrandLink({
  theme = 'dark',
  className = '',
  imgClassName = '',
  alt = 'Odin500',
  title = 'Go to Market',
  ...linkProps
}) {
  const src = theme === 'light' ? odinLogoLight : odinLogo;
  const linkClassName = ['odin-brand-link', className].filter(Boolean).join(' ');

  return (
    <Link
      to="/market"
      className={linkClassName}
      title={title}
      aria-label={`${alt} Beta`}
      {...linkProps}
    >
      <span className="odin-brand-link__stack">
        <img src={src} alt="" className={imgClassName} aria-hidden />
        <span className={`odin-brand-beta odin-brand-beta--${theme}`}>Beta</span>
      </span>
    </Link>
  );
}
