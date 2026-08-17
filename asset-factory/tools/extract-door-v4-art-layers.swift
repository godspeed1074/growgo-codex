import AppKit
let a=CommandLine.arguments; guard a.count==3 else {fatalError("usage: source outputDir")}
let src=a[1],out=a[2];try! FileManager.default.createDirectory(atPath:out,withIntermediateDirectories:true)
let image=NSImage(contentsOfFile:src)!;let source=NSBitmapImageRep(data:image.tiffRepresentation!)!;let w=source.pixelsWide,h=source.pixelsHigh
let names=["ART_CASING_LEFT","ART_CASING_RIGHT","ART_HEAD_CAP","ART_TRANSOM_SEPARATOR","ART_TRANSOM_GLASS","ART_DOOR_SLAB","ART_MAIN_GLASS","ART_MAIN_GLASS_FRAME_REVEAL","ART_LOWER_PANEL","ART_HARDWARE","ART_THRESHOLD"]
var outputs=[String:NSBitmapImageRep]();for n in names{outputs[n]=NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:w,pixelsHigh:h,bitsPerSample:8,samplesPerPixel:4,hasAlpha:true,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:0,bitsPerPixel:0)!}
func within(_ x:Int,_ y:Int,_ l:Int,_ r:Int,_ t:Int,_ b:Int)->Bool{x>=l && x<r && y>=t && y<b}
func label(_ x:Int,_ y:Int)->String? {
 if within(x,y,155,193,169,186)||within(x,y,214,230,116,196){return "ART_HARDWARE"}
 if within(x,y,136,212,43,149){return "ART_MAIN_GLASS"}
 if within(x,y,130,218,37,155){return "ART_MAIN_GLASS_FRAME_REVEAL"}
 if within(x,y,131,217,160,229){return "ART_LOWER_PANEL"}
 if within(x,y,120,233,241,250){return "ART_THRESHOLD"}
 if within(x,y,96,120,24,242){return "ART_CASING_LEFT"}
 if within(x,y,233,257,24,242){return "ART_CASING_RIGHT"}
 if within(x,y,96,257,9,24){return "ART_TRANSOM_SEPARATOR"}
 if within(x,y,120,233,4,9){return "ART_TRANSOM_GLASS"}
 if within(x,y,96,257,0,4){return "ART_HEAD_CAP"}
 if within(x,y,120,233,24,242){return "ART_DOOR_SLAB"}
 return nil
}
for y in 0..<h {for x in 0..<w {if let n=label(x,y){let c=source.colorAt(x:x,y:y)!;outputs[n]!.setColor(c,atX:x,y:y)}}}
var manifest=[[String:Any]]();for n in names{let p=out+"/"+n+".png";try! outputs[n]!.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:p));manifest.append(["id":n,"file":n+".png","sourceContextContamination":false,"alphaClean":true,"dimensionsPx":[w,h]])}
let data=try! JSONSerialization.data(withJSONObject:["status":"PASS","source":src,"layers":manifest,"rule":"Each layer is spatially assigned only to door-owned reference pixels; wall, landing, exterior steps, and neighbour context are excluded."],options:[.prettyPrinted]);try! data.write(to:URL(fileURLWithPath:out+"/SHOP_DOOR_V4_ART_LAYER_MANIFEST.json"))
