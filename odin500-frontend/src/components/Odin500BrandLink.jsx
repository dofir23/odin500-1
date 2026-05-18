import { Link } from 'react-router-dom';
import odinLogo from '../assets/odin500-logo.svg';
import odinLogoLight from '../assets/odin500-logo-light.svg';

/**
 * Clickable Odin500 wordmark → /market.
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

  return (
    <Link to="/market" className={className} title={title} aria-label={alt} {...linkProps}>
      <img src={src} alt={alt} className={imgClassName} />
    </Link>
  );
}
