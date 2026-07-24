import type React from "react";

/**
 * JSX typing for the Google <model-viewer> web component.
 * Boolean-style attributes are typed as strings ("true") because the custom
 * element treats attribute presence/value, and React serializes strings
 * reliably onto unknown elements.
 */
type ModelViewerProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  src?: string;
  alt?: string;
  poster?: string;
  ar?: string;
  exposure?: string;
  "camera-controls"?: string;
  "auto-rotate"?: string;
  "shadow-intensity"?: string;
  "environment-image"?: string;
  loading?: "auto" | "lazy" | "eager";
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerProps;
    }
  }
}
