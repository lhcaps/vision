# Demo Script

1. Open VisionFlow Studio.
2. Review the Parking Lot Vision project.
3. Start PostgreSQL and MinIO, then upload an image in the Media tab.
4. Confirm unsupported files fail before storage and duplicate files dedupe by checksum.
5. Open Versions.
6. Create or select a draft dataset version.
7. Select media assets, assign TRAIN, VALID, TEST, or UNASSIGNED split, then confirm the split summary updates.
8. Lock the version and confirm assignment is disabled for the immutable snapshot.
9. Review manual bounding boxes in the annotation workbench scaffold.
10. Open the visual pipeline graph: Input -> Resize -> Detector -> NMS -> Output.
11. Start the simulated inference run.
12. Watch job progress and worker logs.
13. Inspect prediction overlay and confidence threshold scaffold.
14. Review evaluation metric placeholders.
15. Scrub the timeline replay placeholder.
16. Export targets in a later phase: YOLO and COCO.
