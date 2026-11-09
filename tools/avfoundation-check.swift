// Opens an MP4 the way QuickTime, Safari and iOS do (AVFoundation) and checks it plays: playable, one video and one
// audio track, the size, the audio format, and a frame decoded near the end. Exits 1 if not.
//   swift tools/avfoundation-check.swift film.mp4
import AVFoundation
import Foundation

let path = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : ""
let asset = AVURLAsset(url: URL(fileURLWithPath: path))
func fourCC(_ v: FourCharCode) -> String { String([24, 16, 8, 0].map { Character(UnicodeScalar(UInt8((v >> $0) & 0xff))) }) }

Task {
    do {
        let (playable, duration) = try await asset.load(.isPlayable, .duration)
        let video = try await asset.loadTracks(withMediaType: .video)
        let audio = try await asset.loadTracks(withMediaType: .audio)
        var size = CGSize.zero, videoCodec = "", audioCodec = ""
        if let v = video.first {
            size = try await v.load(.naturalSize)
            if let d = try await v.load(.formatDescriptions).first { videoCodec = fourCC(CMFormatDescriptionGetMediaSubType(d)) }
        }
        if let a = audio.first, let d = try await a.load(.formatDescriptions).first { audioCodec = fourCC(CMFormatDescriptionGetMediaSubType(d)) }
        let generator = AVAssetImageGenerator(asset: asset)
        generator.requestedTimeToleranceBefore = .zero
        generator.requestedTimeToleranceAfter = .zero
        let last = try await generator.image(at: CMTime(seconds: max(0, duration.seconds - 0.2), preferredTimescale: 600)).image
        let ok = playable && video.count == 1 && audio.count == 1
        print("AVFOUNDATION \(ok ? "PASS" : "FAIL") playable=\(playable) seconds=\(String(format: "%.3f", duration.seconds)) video=\(videoCodec) \(Int(size.width))x\(Int(size.height)) audio=\(audioCodec) lastFrame=\(last.width)x\(last.height)")
        exit(ok ? 0 : 1)
    } catch {
        print("AVFOUNDATION FAIL \(error)")
        exit(1)
    }
}
dispatchMain()
