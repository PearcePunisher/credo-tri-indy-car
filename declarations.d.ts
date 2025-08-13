declare module "*.svg" {
  import * as React from "react";
  import { SvgProps } from "react-native-svg";
  const content: React.FC<SvgProps>;
  export default content;
}

// TypeScript sometimes fails to resolve Luxon's bundled types in React Native setups.
// Provide a lightweight module declaration to satisfy the compiler.
declare module 'luxon';
