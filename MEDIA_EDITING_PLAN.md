# Media Editing Feature Implementation Plan

To allow users to edit images/videos (crop, trim) and add draggable/resizable text and emojis (like Instagram Stories or Snapchat), we need a robust set of libraries.

## 📦 Recommended Tech Stack

### 1. Interactive Overlays (Text & Emojis)
**Library:** `react-moveable`
*   **Why:** It is the industry standard for "Canva-like" interactions on the web. It handles dragging, resizing, rotating, and snapping out of the box with high performance.
*   **Alternatives:** `react-draggable` (too basic, no resize handles), `fabric.js` (too heavy, canvas-only).

### 2. Image Cropping
**Library:** `react-easy-crop`
*   **Why:** Lightweight, mobile-friendly touch gestures, and easy integration.

### 3. Video Processing (Trimming)
**Library:** `@ffmpeg/ffmpeg` (FFmpeg.wasm)
*   **Why:** Allows actual video trimming and transcoding directly in the browser without needing a heavy backend.
*   **UI:** Custom Range Slider (using `@radix-ui/react-slider` or simple HTML input).

### 4. Final Export (Compositing)
*   **Images:** `html2canvas` or manual HTML5 Canvas API.
    *   *Strategy:* We overlay the HTML elements on top of the image, then snapshot the container to generate the final JPG/PNG.
*   **Videos:** `FFmpeg.wasm`.
    *   *Strategy:* We map the React state (text positions) to FFmpeg "drawtext" filters to burn them into the video, OR we just save the JSON metadata and render the overlays on the viewer side (cheaper, faster).

---

## 🏗️ Architecture Design

We will create a reusable `MediaEditor` modal component that takes a `file` (Blob) and `type` ('image' | 'video').

### Component Structure
```
src/components/media-editor/
├── MediaEditor.tsx         # Main container / state manager
├── CanvasArea.tsx          # The visual area holding image + overlays
├── OverlayLayer.tsx        # Render interactive elements (Text/Emoji)
├── Controls/
│   ├── CropTools.tsx       # Image crop slider/buttons
│   ├── TrimTimeline.tsx    # Video timeline slider
│   ├── TextTools.tsx       # Color picker, font size
│   └── StickerPicker.tsx   # Emoji picker wrapper
└── utils/
    ├── canvasUtils.ts      # Helper to crop images via Canvas
    └── videoUtils.ts       # FFmpeg wrappers
```

### State Management (Zustand or Local)
We need to track:
```typescript
interface EditorState {
  background: {
    src: string;
    crop: { x: number, y: number, zoom: number }; // For images
    trim: { start: number, end: number };         // For videos
  };
  overlays: Array<{
    id: string;
    type: 'text' | 'emoji';
    content: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    color?: string; // For text
  }>;
  activeOverlayId: string | null;
}
```

---

## 🚀 Implementation Steps

### Phase 1: Foundation & dependency setup
1.  Install packages:
    ```bash
    npm install react-moveable react-easy-crop html2canvas @ffmpeg/ffmpeg @ffmpeg/util
    ```

### Phase 2: Image Editor (Easier)
1.  Build `MediaEditor` modal.
2.  Implement `react-easy-crop` for the base layer.
3.  Add "Add Text" button -> creates a standard object in `overlays` state.
4.  Render `overlays` using `react-moveable` on top of the image.
5.  Implement `handleExport`:
    *   Use `html2canvas` to screenshot the editor div.
    *   Convert to Blob -> Pass back to parent component for upload.

### Phase 3: Video Editor (Advanced)
1.  Switch base layer to `<video>`.
2.  Implement a dual-handle slider for "Start" and "End" time.
3.  On Play, only loop between Start/End times.
4.  **Complex Part (Export):**
    *   *Easy Path:* Upload original video + JSON metadata. Modify `PostView` to render the video + React Overlays. (Recommended for MVP).
    *   *Hard Path:* Use FFmpeg.wasm to cut the video file and burn text. (Slow on mobile).

---

## 💡 Recommendation for Banglagram

**Start with the "Easy Path" for video.**
Burning text into video client-side is very resource-intensive (drains battery, crashes phone browsers).

**Proposed Flow:**
1.  **Images:** Actually merge text/emojis into the final image before upload. (WYSIWYG).
2.  **Videos:**
    *   Trim: Actually cut the video using FFmpeg (it's reasonable for short clips).
    *   Overlays: Save the overlay data (texts, positions) in Supabase separate from the video.
    *   Playback: Re-create the overlays on the viewing screen.

This keeps the app fast and feels like Instagram.
