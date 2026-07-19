/// <reference types="vite/client" />
import type React from "react";
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "cap-widget": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { "data-cap-api-endpoint": string },
        HTMLElement
      >;
    }
  }
}
