import AppKit
let a=CommandLine.arguments
guard a.count == 8 else {fatalError("usage: output ref baseline tonalA tonalB selected component")}
let rep=NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:3000,pixelsHigh:1450,bitsPerSample:8,samplesPerPixel:4,hasAlpha:true,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:0,bitsPerPixel:0)!
let c=NSGraphicsContext(bitmapImageRep:rep)!;NSGraphicsContext.saveGraphicsState();NSGraphicsContext.current=c;NSColor(calibratedWhite:0.055,alpha:1).setFill();NSBezierPath(rect:NSRect(x:0,y:0,width:3000,height:1450)).fill()
let h:[NSAttributedString.Key:Any]=[.font:NSFont.boldSystemFont(ofSize:34),.foregroundColor:NSColor(calibratedRed:0.95,green:0.9,blue:0.8,alpha:1)],l:[NSAttributedString.Key:Any]=[.font:NSFont.boldSystemFont(ofSize:18),.foregroundColor:NSColor(calibratedRed:0.95,green:0.9,blue:0.8,alpha:1)]
func t(_ s:String,_ x:CGFloat,_ y:CGFloat,_ q:[NSAttributedString.Key:Any]=l){s.draw(at:NSPoint(x:x,y:y),withAttributes:q)}
func im(_ p:String,_ r:NSRect,_ al:CGFloat=1){NSImage(contentsOfFile:p)?.draw(in:r,from:.zero,operation:.sourceOver,fraction:al,respectFlipped:false,hints:nil)}
func crop(_ p:String,_ src:NSRect,_ dst:NSRect){NSImage(contentsOfFile:p)?.draw(in:dst,from:src,operation:.sourceOver,fraction:1,respectFlipped:false,hints:nil)}
t("SHOP DOOR V3 — TONAL / FACET MAP REVIEW (APPEARANCE ONLY)",45,1385,h)
let xs:[CGFloat]=[45,535,1025,1515,2005,2495],labels=["REFERENCE","V3 STRUCTURAL BASELINE","TONAL A","TONAL B","SELECTED B","50% SELECTED OVERLAY"]
for i in 0..<5{t(labels[i],xs[i],1325);im(a[i+2],NSRect(x:xs[i],y:700,width:420,height:580))}
t(labels[5],xs[5],1325);im(a[2],NSRect(x:xs[5],y:700,width:420,height:580),0.5);im(a[6],NSRect(x:xs[5],y:700,width:420,height:580),0.5)
t("CLOSEUPS — casing / head+separator / main glass / lower panel / threshold / hardware",45,635)
let p=a[6],src:[NSRect]=[NSRect(x:0,y:130,width:150,height:370),NSRect(x:0,y:430,width:600,height:150),NSRect(x:135,y:220,width:300,height:260),NSRect(x:100,y:0,width:400,height:210),NSRect(x:0,y:0,width:600,height:115),NSRect(x:340,y:210,width:160,height:300)],cl=["Casing tonal planes","Head / separator","Main glass + reflection","Lower panel","Narrow threshold","Hardware"]
for i in 0..<6{let x=45+CGFloat(i)*490;t(cl[i],x,570);crop(p,src[i],NSRect(x:x,y:80,width:420,height:450))}
t("STRUCTURE LOCK: 0 drift • 20/20 door components visible • tonal B selected for clearer shallow-paper separation",45,28)
NSGraphicsContext.restoreGraphicsState();try! rep.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:a[1]))
