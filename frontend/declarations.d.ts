declare module "*.svg" {
  import type { FC } from "react";
  import type { SvgProps } from "react-native-svg";

  const SvgImage: FC<SvgProps>;
  export default SvgImage;
}
