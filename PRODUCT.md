# VisionFlow Studio Product Context

## Product Purpose

VisionFlow Studio is a fullstack computer vision platform for building a credible V1 portfolio product around media ingestion, immutable dataset versions, bounding-box annotation, visual inference pipelines, asynchronous inference jobs, prediction overlays, evaluation, replay, and export.

The product is not a generic dashboard. Its core value is the engine: dataset versioning, annotation storage, inference orchestration, prediction persistence, evaluation reports, and auditability.

## Register

product

## Primary Users

- Computer vision engineers and builders preparing datasets and inference pipelines.
- ML portfolio reviewers who need to see real product depth beyond a UI demo.
- Technical operators who need visible job states, logs, predictions, and evaluation outputs.

## V1 Scope

- Upload and manage images and videos.
- Create projects, datasets, and immutable dataset versions.
- Store manual bounding-box annotations in image coordinates.
- Build a visual pipeline graph: Input, Resize, Detector, NMS, Output.
- Run asynchronous inference jobs through a queue and CV worker.
- Support mock detector and ONNX detector modes.
- Store predictions, evaluation reports, logs, and export artifacts.
- Show prediction overlays, GT-vs-prediction comparisons, timeline replay, and useful worker logs.

## Explicit Non-Goals For V1

- Model training.
- Segmentation masks.
- Keypoints.
- Billing.
- Enterprise RBAC.
- Real-time multiplayer annotation.

## Engineering Principles

- Build vertical slices, not horizontal layers.
- Every phase should connect API, DB/contracts, frontend, and verification.
- API contracts must be typed.
- Geometry stored in persistence uses image coordinates, not viewport coordinates.
- Queue payloads carry IDs, not large blobs.
- Job state transitions must be explicit and tested.
- User-visible mutations write audit logs.
- Failures should produce readable errors.

## Product Personality

Dense, technical, calm, precise, and alive. It should feel like a serious vision operations workbench, not a SaaS landing-page template.

## Signature Moments

- Detection boxes reveal because the detector found objects.
- Pipeline edges pulse because data is flowing.
- Timeline replay morphs boxes between frames.
- Dataset diffs make added, removed, and changed annotations visible.
- Job progress and failures feel inspectable, not hidden.
