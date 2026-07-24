"use client";

// Side-effect import registers the <model-viewer> custom element.
// Because this module is only ever pulled in via next/dynamic(ssr:false),
// the library ships to the browser lazily — never on the server, never until
// a product detail view with a 3D asset is opened.
import "@google/model-viewer";

interface ModelViewerProps {
  src: string;
  alt?: string;
  poster?: string;
}

export default function ModelViewer({
  src,
  alt = "3D product model",
  poster,
}: ModelViewerProps) {
  return (
    <model-viewer
      src={src}
      alt={alt}
      poster={poster}
      camera-controls="true"
      auto-rotate="true"
      shadow-intensity="1"
      exposure="1"
      loading="eager"
      style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
    />
  );
}
