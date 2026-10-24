# P0 source provenance, permissions and claims
Six websites, two documents, one exact film benchmark plus future-source policy.

| ID | Source | Evidence grade | Role | Next verification |
| --- | --- | --- | --- | --- |
| S1 | https://agentpolystudios.com/ | Vendor/public historical report; no proprietary source | Character design, custom rigs and expressive features | Confirm actual output vs marketing, independent original art |
| S2 | https://promptbase.shop/learn/claude-pixel | Public site / historic source audit | Comparable film, Three.js + timed voices + FFmpeg | Obtain exact Git Blame MP4, measure scenes |
| S3 | https://viralspy.app/ | Unverified | Optional creator insight, NOT core tool | Research access, terms, price and benefits |
| S4 | https://futurist40.gumroad.com/l/starter-pack-15-claude-skills | Unverified/paid lead | Optional instruction workflow | Do not use without rights/contents |
| S5 | https://www.hypedtown.com/ | Unverified | External research idea | Confirm current relevance/licensing |
| S6 | https://www.canwebuildthis.dev/ | Unverified | External research idea | Confirm current relevance/licensing |
| D1 | NMXWZ-1.pdf | Archived extracted text: docs/history/NMXWZ-1-PDF_EXTRACTED_TEXT.md | Consistent views/first frames/8s clips/1–4 captions | Inspect original illustrations, platform safe zones |
| D2 | Studio_Reverse_Engineering_Report.md | Archived extracted text: docs/history/Studio_Reverse_Engineering_Report_SOURCE.md | Workflow/source/video research | Revalidate current public claims |
| V1 | git-blame.mp4 | Library metadata ONLY: /video Analysis/git-blame.mp4, 3,365,415 bytes on 2026-10-24 | Exact film quality reference | RAW FILE NOT ACCESSIBLE to current runtime; SHA256 UNKNOWN |
| V2 | 65469.mp4 | Separate candidate previously inspected; NOT proven identical | Secondary source only | Don't silently substitute for V1 |
| T1 | HyperFrames open-source project | Candidate, NOT benchmarked | Alternative rendering workflow | Check official repo+license, A/B render before switching |

Grades: A hash-verified original bytes and inspected audio/frames; B directly observed public UI/code; C archived analysis; D marketing/vendor claims; U unavailable. Historical video report says Git Blame ~52.181s, 720x1280, 30fps, but NOT remeasured from this Library copy. A third-party video must not be committed without redistribution rights. Record exact source URL, retrieval date, rights, SHA256 and ffprobe metrics when raw media is accessible.

P0.4 status BLOCKED despite file metadata. Library read returned no text and Library raw materialization explicitly refused; no claim of video frame inspection is appropriate at this step.

## Additional artifact identity check, 2026-10-24
The original-named git-blame.mp4 record in user Library is 3,365,415 bytes; the differently named 65469.mp4 Library item is 9,395,815 bytes. They are *not byte-identical*. No frame or source hash verification can be performed on the original-named file until an authorized raw copy is accessible to the runtime. Local P0 evidence extractor: tools/capture_reference.py. The official HyperFrames project (https://github.com/heygen-com/hyperframes) is an Apache-2.0 rendering candidate; no A/B benchmark has been run, so no exporter replacement is justified.
