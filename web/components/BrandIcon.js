export default function BrandIcon({ size = 32, className = '', style = {} }) {
  return (
    <img
      src="/app_icon.png"
      width={size}
      height={size}
      alt="AI Rewrite Anywhere Icon"
      className={className}
      style={{
        display: 'block',
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        borderRadius: '22%',
        objectFit: 'contain',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
