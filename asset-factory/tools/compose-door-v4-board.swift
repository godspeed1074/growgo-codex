import AppKit
let a=CommandLine.arguments;guard a.count==12 else{fatalError("usage output ref tonal hybrid overlay diff art l15 l30 r15 r30")}
let rep=NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:3000,pixelsHigh:1500,bitsPerSample:8,samplesPerPixel:4,hasAlpha:true,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:0,bitsPerPixel:0)!;let c=NSGraphicsContext(bitmapImageRep:rep)!;NSGraphicsContext.saveGraphicsState();NSGraphicsContext.current=c;NSColor(calibratedWhite:0.055,alpha:1).setFill();NSBezierPath(rect:NSRect(x:0,y:0,width:3000,height:1500)).fill()
let h:[NSAttributedString.Key:Any]=[.font:NSFont.boldSystemFont(ofSize:32),.foregroundColor:NSColor(calibratedRed:0.95,green:0.9,blue:0.8,alpha:1)],l:[NSAttributedString.Key:Any]=[.font:NSFont.boldSystemFont(ofSize:17),.foregroundColor:NSColor(calibratedRed:0.95,green:0.9,blue:0.8,alpha:1)]
func t(_ x:String,_ a:CGFloat,_ b:CGFloat,_ q:[NSAttributedString.Key:Any]=l){x.draw(at:NSPoint(x:a,y:b),withAttributes:q)};func im(_ p:String,_ r:NSRect){NSImage(contentsOfFile:p)?.draw(in:r,from:.zero,operation:.sourceOver,fraction:1,respectFlipped:false,hints:nil)}
t("SHOP DOOR V4 — MODULAR REFERENCE-LAYERED 2.5D FRONT REVIEW",40,1445,h)
let top:[CGFloat]=[40,530,1020,1510,2000,2490],labels=["REFERENCE","V3 TONAL B","HYBRID FRONT","50% OVERLAY","DIFFERENCE","ART-LAYER IDs"],files=[a[2],a[3],a[4],a[5],a[6],a[7]]
for i in 0..<6{t(labels[i],top[i],1380);im(files[i],NSRect(x:top[i],y:730,width:430,height:600))}
let bx:[CGFloat]=[40,610,1180,1750],bf=[a[8],a[9],a[10],a[11]],bl=["15° LEFT — shallow-depth QA","30° LEFT — no art float","15° RIGHT — shallow-depth QA","30° RIGHT — no art float"]
for i in 0..<4{t(bl[i],bx[i],665);im(bf[i],NSRect(x:bx[i],y:80,width:500,height:540))}
t("CLOSEUP REVIEW: casing • head/separator • glass • lower panel • hardware • threshold are preserved in the hybrid front and separately identified by the art-layer diagnostic.",40,28)
NSGraphicsContext.restoreGraphicsState();try! rep.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:a[1]))
