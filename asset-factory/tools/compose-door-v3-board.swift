import AppKit
let a=CommandLine.arguments
guard a.count == 7 else {fatalError("usage: output ref v1 v2 v3 component")}
let rep=NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:2500,pixelsHigh:1450,bitsPerSample:8,samplesPerPixel:4,hasAlpha:true,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:0,bitsPerPixel:0)!
let c=NSGraphicsContext(bitmapImageRep:rep)!;NSGraphicsContext.saveGraphicsState();NSGraphicsContext.current=c;NSColor(calibratedWhite:0.055,alpha:1).setFill();NSBezierPath(rect:NSRect(x:0,y:0,width:2500,height:1450)).fill()
let h:[NSAttributedString.Key:Any]=[.font:NSFont.boldSystemFont(ofSize:34),.foregroundColor:NSColor(calibratedRed:0.95,green:0.9,blue:0.8,alpha:1)],l:[NSAttributedString.Key:Any]=[.font:NSFont.boldSystemFont(ofSize:19),.foregroundColor:NSColor(calibratedRed:0.95,green:0.9,blue:0.8,alpha:1)]
func t(_ s:String,_ x:CGFloat,_ y:CGFloat,_ q:[NSAttributedString.Key:Any]=l){s.draw(at:NSPoint(x:x,y:y),withAttributes:q)}
func im(_ p:String,_ r:NSRect,_ al:CGFloat=1){NSImage(contentsOfFile:p)?.draw(in:r,from:.zero,operation:.sourceOver,fraction:al,respectFlipped:false,hints:nil)}
func crop(_ p:String,_ src:NSRect,_ dst:NSRect){NSImage(contentsOfFile:p)?.draw(in:dst,from:src,operation:.sourceOver,fraction:1,respectFlipped:false,hints:nil)}
t("SHOP DOOR V3 — OWNERSHIP + DEPTH HIERARCHY REVIEW",45,1385,h)
let xs:[CGFloat]=[45,535,1025,1515,2005],names=["REFERENCE","V1 CANDIDATE","V2 BUILD B","V3 BUILD","V3 OVERLAY"]
for i in 0..<4{t(names[i],xs[i],1325);im(a[i+2],NSRect(x:xs[i],y:700,width:420,height:580))}
t(names[4],xs[4],1325);im(a[2],NSRect(x:xs[4],y:700,width:420,height:580),0.5);im(a[5],NSRect(x:xs[4],y:700,width:420,height:580),0.5)
t("V3 CLOSEUPS — threshold ownership / panel / head+separator / glass+hardware",45,635)
let v3=a[5], crops:[NSRect]=[NSRect(x:0,y:0,width:600,height:160),NSRect(x:0,y:130,width:600,height:210),NSRect(x:0,y:430,width:600,height:150),NSRect(x:150,y:240,width:300,height:250)]
let labels=["D20: narrow sill only — landing/steps absent","D04/D05: dominant brown face + shallow hierarchy","D18/D19: separator + head layered","Locked glass + hardware"]
for i in 0..<4{let x=45+CGFloat(i)*610;t(labels[i],x,570);crop(v3,crops[i],NSRect(x:x,y:80,width:540,height:450))}
t("DIRECT VISION: V3 fixes ownership, but same-door fidelity is still blocked; no authority or shop integration.",45,28)
NSGraphicsContext.restoreGraphicsState();try! rep.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:a[1]))
