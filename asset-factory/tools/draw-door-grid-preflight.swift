import AppKit

let args = CommandLine.arguments
guard args.count == 3 else { fatalError("usage: output reference") }
let output = args[1], reference = args[2]
let canvas = NSSize(width: 1800, height: 940), panel = NSRect(x: 50, y: 80, width: 500, height: 700)
let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 1800, pixelsHigh: 940, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
let ctx = NSGraphicsContext(bitmapImageRep: rep)!; NSGraphicsContext.saveGraphicsState(); NSGraphicsContext.current = ctx
NSColor(calibratedWhite: 0.055, alpha: 1).setFill(); NSBezierPath(rect: NSRect(origin: .zero, size: canvas)).fill()
let title: [NSAttributedString.Key: Any] = [.font: NSFont.boldSystemFont(ofSize: 34), .foregroundColor: NSColor(calibratedRed: 0.95, green: 0.9, blue: 0.8, alpha: 1)]
let label: [NSAttributedString.Key: Any] = [.font: NSFont.boldSystemFont(ofSize: 22), .foregroundColor: NSColor(calibratedRed: 0.95, green: 0.9, blue: 0.8, alpha: 1)]
func txt(_ s:String,_ x:CGFloat,_ y:CGFloat,_ a:[NSAttributedString.Key:Any]=label){s.draw(at:NSPoint(x:x,y:y),withAttributes:a)}
func img(_ p:String,_ r:NSRect,_ alpha:CGFloat=1){NSImage(contentsOfFile:p)?.draw(in:r,from:.zero,operation:.sourceOver,fraction:alpha,respectFlipped:false,hints:nil)}
func map(_ x:CGFloat,_ y:CGFloat,_ origin:CGPoint)->CGPoint { CGPoint(x:origin.x+x/300*500,y:origin.y+(350-y)/350*700) }
func guide(_ origin:CGPoint) {
 let xs:[CGFloat]=[94,96,119,120,136,211,221,232,233,256,258], zs:[CGFloat]=[291,279,241,222,166,148,43,24,23,9]
 NSColor.systemCyan.withAlphaComponent(0.65).setStroke(); for x in xs { let p=map(x,0,origin), q=map(x,350,origin); let l=NSBezierPath();l.move(to:p);l.line(to:q);l.lineWidth=1;l.stroke() }
 NSColor.systemOrange.withAlphaComponent(0.65).setStroke(); for z in zs { let p=map(0,z,origin),q=map(300,z,origin);let l=NSBezierPath();l.move(to:p);l.line(to:q);l.lineWidth=1;l.stroke() }
}
func fill(_ rect:NSRect,_ color:NSColor){color.setFill();NSBezierPath(rect:rect).fill()}
func vrect(_ left:CGFloat,_ right:CGFloat,_ top:CGFloat,_ bottom:CGFloat,_ origin:CGPoint,_ color:NSColor){let a=map(left,top,origin),b=map(right,bottom,origin);fill(NSRect(x:a.x,y:a.y,width:b.x-a.x,height:b.y-a.y),color)}
func circle(_ x:CGFloat,_ y:CGFloat,_ r:CGFloat,_ origin:CGPoint,_ color:NSColor){let p=map(x,y,origin);color.setFill();NSBezierPath(ovalIn:NSRect(x:p.x-r*1.67,y:p.y-r*2,width:r*3.34,height:r*4)).fill()}
func construction(_ origin: CGPoint, _ alpha: CGFloat) {
 let cream=NSColor(calibratedRed:0.70,green:0.57,blue:0.39,alpha:alpha), brown=NSColor(calibratedRed:0.28,green:0.14,blue:0.08,alpha:alpha), dark=NSColor(calibratedRed:0.11,green:0.055,blue:0.03,alpha:alpha), teal=NSColor(calibratedRed:0.05,green:0.35,blue:0.42,alpha:alpha), gray=NSColor(calibratedRed:0.45,green:0.42,blue:0.40,alpha:alpha), brass=NSColor(calibratedRed:0.75,green:0.50,blue:0.14,alpha:alpha)
 vrect(96,256,-44,241,origin,cream);vrect(120,232,24,241,origin,brown)
 vrect(130,217,37,154,origin,dark);vrect(136,211,43,148,origin,teal)
 vrect(131,216,160,228,origin,dark);vrect(136,211,166,222,origin,brown);vrect(155,192,169,185,origin,brass)
 circle(221,123,4,origin,brass);circle(221,151,6,origin,brass);vrect(216,226,157,190,origin,brass)
 vrect(120,232,241,250,origin,cream);vrect(118,234,250,263,origin,gray);vrect(114,238,263,279,origin,gray)
 vrect(96,256,-44,-24,origin,cream);vrect(120,232,-23,8,origin,teal);vrect(96,256,9,23,origin,cream)
}
txt("SHOP DOOR — SHARED REFERENCE GRID PREFLIGHT (2D ONLY)", 50, 875, title)
let origins=[CGPoint(x:50,y:80),CGPoint(x:650,y:80),CGPoint(x:1250,y:80)]
txt("REFERENCE + GUIDES",50,810);txt("V2 PREFLIGHT + GUIDES",650,810);txt("50% OVERLAY",1250,810)
img(reference,panel); guide(origins[0])
fill(NSRect(x:650,y:80,width:500,height:700),NSColor.black)
construction(origins[1],1); guide(origins[1])
img(reference,NSRect(x:1250,y:80,width:500,height:700),0.5)
construction(origins[2],0.45);guide(origins[2])
txt("X guides: cyan  •  Z guides: orange  •  V2 is not authorized for Blender fabrication",50,25)
NSGraphicsContext.restoreGraphicsState();try! rep.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:output))
