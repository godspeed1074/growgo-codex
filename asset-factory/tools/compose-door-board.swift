import AppKit

let args = CommandLine.arguments
guard args.count == 7 else { fatalError("usage: output reference previous final componentId wireframe") }
let output = args[1]
let canvas = NSSize(width: 1800, height: 1380)
let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(canvas.width), pixelsHigh: Int(canvas.height), bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
let context = NSGraphicsContext(bitmapImageRep: rep)!
NSGraphicsContext.saveGraphicsState(); NSGraphicsContext.current = context
NSColor(calibratedWhite: 0.06, alpha: 1).setFill(); NSBezierPath(rect: NSRect(origin: .zero, size: canvas)).fill()
let titleAttrs: [NSAttributedString.Key: Any] = [.font: NSFont.boldSystemFont(ofSize: 36), .foregroundColor: NSColor(calibratedRed: 0.96, green: 0.91, blue: 0.82, alpha: 1)]
let labelAttrs: [NSAttributedString.Key: Any] = [.font: NSFont.boldSystemFont(ofSize: 22), .foregroundColor: NSColor(calibratedRed: 0.96, green: 0.91, blue: 0.82, alpha: 1)]
func text(_ value: String, _ x: CGFloat, _ y: CGFloat, _ attrs: [NSAttributedString.Key: Any] = labelAttrs) { value.draw(at: NSPoint(x: x, y: y), withAttributes: attrs) }
func image(_ path: String, _ rect: NSRect, _ alpha: CGFloat = 1) { NSImage(contentsOfFile: path)?.draw(in: rect, from: .zero, operation: .sourceOver, fraction: alpha, respectFlipped: false, hints: nil) }
text("Simple Shop Door — Local Panel + Threshold Correction", 55, 1320, titleAttrs)
text("AUTHORITATIVE REFERENCE", 70, 1260); text("PREVIOUS PARAMETRIC DOOR", 480, 1260); text("FINAL LOCAL FIX (B)", 950, 1260); text("50% OVERLAY", 1410, 1260)
image(args[2], NSRect(x: 70, y: 500, width: 300, height: 720)); image(args[3], NSRect(x: 470, y: 500, width: 360, height: 720)); image(args[4], NSRect(x: 940, y: 500, width: 360, height: 720)); image(args[2], NSRect(x: 1400, y: 500, width: 300, height: 720), 0.5); image(args[4], NSRect(x: 1400, y: 500, width: 300, height: 720), 0.5)
text("COMPONENT ID", 120, 435); text("WIREFRAME", 700, 435); text("BLOCKED — FRONT EVIDENCE ONLY", 1240, 435)
image(args[5], NSRect(x: 70, y: 60, width: 430, height: 340)); image(args[6], NSRect(x: 650, y: 60, width: 430, height: 340))
NSGraphicsContext.restoreGraphicsState()
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: output))
