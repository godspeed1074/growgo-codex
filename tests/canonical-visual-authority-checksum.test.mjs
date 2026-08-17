import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {canonicalVisualChecksum,decodePng,encodePng,exactPixelComparison,semanticPresentationSignature,validateCanonicalVisualAuthority} from '../asset-factory/golden-reference/golden-reference-raster-analysis.mjs';

const historicalRawArtifactSha256='c21ffefb1bce1e2341816d4e695dcec3644c9deb511430523b65a8e484f745c3';
const tempRoot=fs.mkdtempSync(path.join(os.tmpdir(),'growgo-canonical-visual-'));
const write=(name,width,height,rgba)=>{const file=path.join(tempRoot,name);fs.writeFileSync(file,encodePng(width,height,rgba));return file;};
const pngWithTextChunk=(source,destination)=>{const input=fs.readFileSync(source),text=Buffer.from('provenance=alternate-png-encoding');const chunk=Buffer.alloc(12+text.length);chunk.writeUInt32BE(text.length,0);chunk.write('tEXt',4,'ascii');text.copy(chunk,8);crypto.createHash('sha256');fs.writeFileSync(destination,Buffer.concat([input.subarray(0,-12),chunk,input.subarray(-12)]));};
const pixels=Buffer.from([12,30,50,255,70,80,90,255,110,120,130,255,140,150,160,255]);
const base=write('base.png',2,2,pixels);
const canonical=canonicalVisualChecksum(base);
const authority={historicalRawArtifactSha256,canonicalVisualChecksum:canonical};

test('A: canonical checksum accepts distinct encoded PNG streams with identical decoded pixels',()=>{const alternate=path.join(tempRoot,'alternate.png');pngWithTextChunk(base,alternate);assert.notEqual(decodePng(base).checksum,decodePng(alternate).checksum);assert.equal(canonicalVisualChecksum(base).checksum,canonicalVisualChecksum(alternate).checksum);const result=validateCanonicalVisualAuthority({authority,renderPath:alternate,semanticPresentationMatch:true,provenanceMatch:true,visualRegression:false});assert.equal(result.approved,true);assert.equal(result.canonicalMatch,true);});
test('B: canonical checksum rejects a changed pixel',()=>{const changed=Buffer.from(pixels);changed[0]+=1;const file=write('one-pixel-changed.png',2,2,changed);assert.notEqual(canonicalVisualChecksum(base).checksum,canonicalVisualChecksum(file).checksum);assert.equal(exactPixelComparison(base,file).exact,false);});
test('C: canonical checksum rejects a dimension change',()=>{const file=write('dimension-changed.png',1,4,pixels);const comparison=exactPixelComparison(base,file);const result=validateCanonicalVisualAuthority({authority,renderPath:file,semanticPresentationMatch:true,provenanceMatch:true,visualRegression:false});assert.equal(comparison.sameDimensions,false);assert.equal(comparison.exact,false);assert.equal(result.canonicalMatch,false);assert.equal(result.approved,false);});
test('D: semantic mismatch rejects visually identical render when semantic presentation is required',()=>{const result=validateCanonicalVisualAuthority({authority,renderPath:base,semanticPresentationMatch:false,provenanceMatch:true,visualRegression:false,requireSemanticPresentation:true});assert.equal(result.canonicalMatch,true);assert.equal(result.semanticPass,false);assert.equal(result.approved,false);assert.notEqual(semanticPresentationSignature({objectIds:['A']}).checksum,semanticPresentationSignature({objectIds:['B']}).checksum);});
test('E: historical raw authority is preserved by the additive facade migration',()=>{const file=new URL('../asset-factory/modular/SIMPLE_SHOP_FACADE_FRONT_AUTHORITY_V1.json',import.meta.url);const facadeAuthority=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(facadeAuthority.frontChecksum,historicalRawArtifactSha256);assert.equal(facadeAuthority.historicalRawArtifactSha256,historicalRawArtifactSha256);});
test('F: operator approval state remains unchanged by the additive facade migration',()=>{const file=new URL('../asset-factory/modular/SIMPLE_SHOP_FACADE_FRONT_AUTHORITY_V1.json',import.meta.url);const facadeAuthority=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(facadeAuthority.status,'OPERATOR_APPROVED');assert.equal(facadeAuthority.operatorApproved,true);});

test.after(()=>fs.rmSync(tempRoot,{recursive:true,force:true}));
