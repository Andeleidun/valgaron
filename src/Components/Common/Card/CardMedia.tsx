import CardMedia from '@mui/material/CardMedia';

type CardMediaProps = {
  component?: 'img' | 'picture' | 'video';
  height?: string;
  className?: string;
  src: string;
  alt: string;
};

function VWorldBuilderCardMedia({
  src,
  alt,
  component = 'img',
  height = '400',
  className = 'card-media',
}: CardMediaProps) {
  return (
    <CardMedia
      src={src}
      alt={alt}
      component={component}
      height={height}
      className={className}
    />
  );
}

export default VWorldBuilderCardMedia;
