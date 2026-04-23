import { Platform, Image, ImageProps, View } from 'react-native';

interface WebImageProps extends ImageProps {
  webSrc?: string;
}

/**
 * Componente que renderiza uma imagem usando background-image na web e <Image> no mobile
 */
export function WebImage({ webSrc, source, style, ...props }: WebImageProps) {
  if (Platform.OS === 'web' && webSrc) {
    // Na web, usar um div com background-image para ter melhor controle
    const imgStyle = style as any;
    return (
      <div
        style={{
          backgroundImage: `url('${webSrc}')`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          width: imgStyle?.width || '100%',
          height: imgStyle?.height || '100%',
        }}
      />
    );
  }

  // No mobile, usar o Image component normal
  return <Image source={source} style={style} {...props} />;
}
