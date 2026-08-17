import AppKit

let a = CommandLine.arguments
guard a.count == 3 else { fatalError("usage: output reference") }
let output=a[1], reference=a[2]
let width=2500, height=760, panel=NSRect(x:0,y:0,width:440,height:514)
let rep=NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:width,pixelsHigh:height,bitsPerSample:8,samplesPerPixel:4,hasAlpha:true,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:0,bitsPerPixel:0)!
let ctx=NSGraphicsContext(bitmapImageRep:rep)!; NSGraphicsContext.saveGraphicsState();NSGraphicsContext.current=ctx
NSColor(calibratedWhite:0.055,alpha:1).setFill();NSBezierPath(rect:NSRect(x:0,y:0,width:width,height:height)).fill()
let title:[NSAttributedString.Key:Any]=[.font:NSFont.boldSystemFont(ofSize:30),.foregroundColor:NSColor(calibratedRed:0.95,green:0.9,blue:0.8,alpha:1)]
let label:[NSAttributedString.Key:Any]=[.font:NSFont.boldSystemFont(ofSize:17),.foregroundColor:NSColor(calibratedRed:0.95,green:0.9,blue:0.8,alpha:1)]
let note:[NSAttributedString.Key:Any]=[.font:NSFont.systemFont(ofSize:15),.foregroundColor:NSColor(calibratedRed:0.75,green:0.82,blue:0.88,alpha:1)]
func text(_ s:String,_ x:CGFloat,_ y:CGFloat,_ style:[NSAttributedString.Key:Any]=label){s.draw(at:NSPoint(x:x,y:y),withAttributes:style)}
func mp(_ x:CGFloat,_ y:CGFloat,_ o:CGPoint)->CGPoint { CGPoint(x:o.x+x/300*440,y:o.y+(350-y)/350*514) }
func img(_ p:String,_ r:NSRect,_ alpha:CGFloat=1){NSImage(contentsOfFile:p)?.draw(in:r,from:.zero,operation:.sourceOver,fraction:alpha,respectFlipped:false,hints:nil)}
func fill(_ r:NSRect,_ c:NSColor){c.setFill();NSBezierPath(rect:r).fill()}
func vr(_ l:CGFloat,_ r:CGFloat,_ t:CGFloat,_ b:CGFloat,_ o:CGPoint,_ c:NSColor){let p=mp(l,t,o),q=mp(r,b,o);fill(NSRect(x:p.x,y:p.y,width:q.x-p.x,height:q.y-p.y),c)}
func line(_ l:CGFloat,_ r:CGFloat,_ t:CGFloat,_ b:CGFloat,_ o:CGPoint,_ c:NSColor,_ w:CGFloat=2){let p=mp(l,t,o),q=mp(r,b,o);c.setStroke();let z=NSBezierPath();z.move(to:p);z.line(to:q);z.lineWidth=w;z.stroke()}
func guides(_ o:CGPoint){for x:CGFloat in [94,96,119,120,136,211,221,232,233,256,258]{line(x,x,0,350,o,.systemCyan.withAlphaComponent(0.55),1)};for z:CGFloat in [291,249,241,222,166,148,43,24,23,9]{line(0,300,z,z,o,.systemOrange.withAlphaComponent(0.55),1)}}
func door(_ o:CGPoint,_ alpha:CGFloat){let cream=NSColor(calibratedRed:0.72,green:0.58,blue:0.39,alpha:alpha),brown=NSColor(calibratedRed:0.28,green:0.14,blue:0.08,alpha:alpha),dark=NSColor(calibratedRed:0.10,green:0.05,blue:0.025,alpha:alpha),teal=NSColor(calibratedRed:0.05,green:0.35,blue:0.42,alpha:alpha),brass=NSColor(calibratedRed:0.75,green:0.5,blue:0.14,alpha:alpha)
 vr(96,256,-44,241,o,cream);vr(120,232,24,241,o,brown);vr(130,217,37,154,o,dark);vr(136,211,43,148,o,teal);vr(131,216,160,228,o,dark);vr(136,211,166,222,o,brown);vr(155,192,169,185,o,brass);vr(216,226,157,190,o,brass);vr(120,232,241,249,o,cream);vr(96,256,-44,-24,o,cream);vr(120,232,-23,8,o,teal);vr(96,256,9,23,o,cream)}
let xs:[CGFloat]=[30,520,1010,1500,1990], os=xs.map{CGPoint(x:$0,y:100)}
text("SHOP DOOR V3 — OWNERSHIP PREFLIGHT (2D ONLY; NO BLENDER)",30,700,title)
let labels=["1. AUTHORITATIVE REFERENCE","2. OWNERSHIP MAP","3. V3 DOOR-ONLY PREFLIGHT","4. 50% REFERENCE OVERLAY","5. OWNERSHIP KEY"]
for i in 0..<5{text(labels[i],xs[i],635)}
img(reference,NSRect(x:xs[0],y:100,width:440,height:514));guides(os[0])
img(reference,NSRect(x:xs[1],y:100,width:440,height:514));guides(os[1]);vr(96,256,-44,249,os[1],NSColor.systemTeal.withAlphaComponent(0.32));vr(114,238,249,279,os[1],NSColor.systemOrange.withAlphaComponent(0.60));vr(94,258,279,291,os[1],NSColor.systemRed.withAlphaComponent(0.62));text("TEAL = DOOR MODULE",520,74,note);text("ORANGE/RED = LANDING + STEPS CONTEXT",520,51,note)
fill(NSRect(x:xs[2],y:100,width:440,height:514),.black);door(os[2],1);guides(os[2]);text("D20 is an 8px narrow sill only",1010,74,note);text("No landing. No exterior steps. No foundation strip.",1010,51,note)
img(reference,NSRect(x:xs[3],y:100,width:440,height:514),0.5);door(os[3],0.48);guides(os[3]);text("Overlay preserves passing V2 grid; removes context",1500,74,note)
fill(NSRect(x:xs[4],y:100,width:440,height:514),NSColor(calibratedWhite:0.12,alpha:1));vr(105,205,100,160,os[4],.systemTeal);vr(105,205,180,240,os[4],.systemOrange);vr(105,205,260,320,os[4],.systemRed);text("DOOR MODULE",2210,565);text("D01–D20, including narrow D20 sill",2210,540,note);text("ADJACENT LANDING",2210,485);text("Future: GG-BLD-ENTRANCE-STEPS-COMMERCIAL-001",2210,460,note);text("EXTERIOR STEPS / FOUNDATION",2210,405);text("Excluded from GG-BLD-DOOR-SHOP-002",2210,380,note)
text("VISION: SAME DOOR = YES  |  BOUNDARY = PASS  |  EXTERNAL STEPS INCLUDED = NO  |  THRESHOLD = PASS",30,32,note)
NSGraphicsContext.restoreGraphicsState();try! rep.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:output))
