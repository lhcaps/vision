# Demo Recording Guide

This document explains how to record a high-quality demo GIF/video for VisionFlow Studio.

## Recording Setup

**Tools recommended:**

- Windows: [ScreenToGif](https://www.screentogif.com/) (recommended — free, lightweight)
- macOS: LICEcap or built-in Screen Recording
- Cross-platform: [LICEcap](https://www.cockos.com/licecap/)

**Display settings:**

- Resolution: 1280×720 or 1920×1080
- Frame rate: 15 FPS (sufficient for UI animations)
- Output: GIF or WebM, max 5MB

**Recording area:**

- Capture only the browser window, not the full desktop
- Leave 10px padding on all sides
- Remove browser bookmarks bar

## Demo Flow Script

Record the following 8-step flow. Target duration: 30–45 seconds.

### Step 1: Overview (5s)

Open VisionFlow Studio. Pan across the full workbench showing all 8 navigation sections: Overview, Media, Versions, Annotate, Pipeline, Jobs, Prediction Overlay, Timeline.

### Step 2: Media Upload (8s)

Navigate to Media tab. Show the drag-and-drop upload zone. Upload a sample image. Show the progress bar and success state. Point out the SHA-256 dedupe indicator.

### Step 3: Dataset Versioning (8s)

Navigate to Versions tab. Create a new dataset. Add the uploaded image to a draft version. Assign TRAIN split. Show the split summary updating. Click "Lock Version" to create an immutable snapshot.

### Step 4: Annotation (10s)

Navigate to Annotate tab. Select the annotated image. Draw 2–3 bounding boxes with different labels (car, van, truck). Show the label selector dropdown. Demonstrate keyboard shortcuts (Enter to confirm, Escape to cancel). Show the save queue with pending changes.

### Step 5: Pipeline Builder (6s)

Navigate to Pipeline tab. Show the visual pipeline graph: Input → Resize → Detector → NMS → Output. Select the detector node. Adjust the confidence threshold slider. Click "Validate" to show passing validation.

### Step 6: Job Execution (8s)

Navigate to Jobs tab. Click "Run Pipeline". Watch the SSE progress stream update in real-time. Show the worker logs panel. Wait for the job to reach SUCCEEDED state.

### Step 7: Prediction Overlay (6s)

Navigate to Prediction Overlay. Toggle between Ground Truth, Predictions, and Both views. Show color-coded bounding boxes (green = GT, red = predictions). Adjust the confidence threshold slider to filter predictions.

### Step 8: Evaluation Metrics (5s)

Show the evaluation report panel. Display precision, recall, F1, and mean IoU. Show per-class breakdowns with TP/FP/FN counts.

## Post-Recording

1. **Optimize the GIF** at [ezgif.com/optimize](https://ezgif.com/optimize):
   - Reduce colors to 128 or 64
   - Set lossy compression to 10–20
   - Target: < 3MB for fast loading

2. **Trim precisely** using [ezgif.com/crop](https://ezgif.com/crop) if needed

3. **Save as WebM** if GIF size is problematic (better compression at same quality)

4. **Place the file:**

   ```
   docs/demo/demo.gif       ← GIF format
   # or
   docs/demo/demo.webm     ← WebM format
   ```

5. **Update README.md** reference if using a different path

## Fallback: Static Screenshots

If recording a GIF is not possible, use high-quality static screenshots:

1. Take screenshots at each step above
2. Use [Cloud Convert](https://cloudconvert.com/png-to-gif) to create an animated GIF
3. Or embed individual images in the README using markdown:

   ```markdown
   ## Demo

   ### Media Upload

   ![Media Upload](docs/demo/screenshots/media-upload.png)

   ### Dataset Versioning

   ![Dataset Versioning](docs/demo/screenshots/versions.png)

   ### Annotation

   ![Annotation](docs/demo/screenshots/annotate.png)

   ### Pipeline Builder

   ![Pipeline](docs/demo/screenshots/pipeline.png)

   ### Evaluation Results

   ![Evaluation](docs/demo/screenshots/evaluation.png)
   ```

## Recording Tips

- **Practice first** — Run through the flow 2–3 times before recording
- **Clean state** — Reset browser cache and localStorage before recording
- **No audio** — Keep the demo silent
- **No cursor trail** — Disable cursor effects
- **Consistent speed** — Use the same pacing throughout
- **End cleanly** — Let the final screen sit for 1–2 seconds before stopping
