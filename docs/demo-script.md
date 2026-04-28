# Demo Script

1. Open VisionFlow Studio.
2. Review the Parking Lot Vision project.
3. Start PostgreSQL and MinIO, then upload an image in the Media tab.
4. Confirm unsupported files fail before storage and duplicate files dedupe by checksum.
5. Open Versions.
6. Create or select a draft dataset version.
7. Select media assets, assign TRAIN, VALID, TEST, or UNASSIGNED split, then confirm the split summary updates.
8. Lock the version and confirm assignment is disabled for the immutable snapshot.
9. Resize to a mobile viewport and confirm the media table, version builder, and threshold control remain usable without page-level horizontal overflow.
10. Open Annotate.
11. Draw a new bounding box on the canvas and confirm the queue records the create operation.
12. Select a label, nudge or edit the selected box, then save queued changes.
13. Confirm coordinates remain image-space values in the inspector.
14. Open the visual pipeline graph: Input -> Resize -> Detector -> NMS -> Output.
15. On mobile, confirm the pipeline graph switches to a legible vertical layout.
16. Start the simulated inference run.
17. Watch job progress and worker logs.
18. Inspect prediction overlay and confidence threshold scaffold.
19. Review evaluation metric placeholders.
20. Scrub the timeline replay placeholder.
21. Export targets in a later phase: YOLO and COCO.
