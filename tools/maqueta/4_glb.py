"""OBJ texturizado de OpenMVS (1 o 2 materiales) → GLB liviano como los de tools/build_assets.py."""
import sys, io, json, struct, numpy as np
from PIL import Image
M, sal, ancho = sys.argv[1], sys.argv[2], int(sys.argv[3])
d = M + '/mvs/'
V, VT, F, mat = [], [], [], None
mats = []
for l in open(d + 'maqueta_tex.obj'):
    if l.startswith('v '): V.append([float(x) for x in l.split()[1:4]])
    elif l.startswith('vt '): VT.append([float(x) for x in l.split()[1:3]])
    elif l.startswith('usemtl'):
        mat = l.split()[1]
        if mat not in mats: mats.append(mat)
    elif l.startswith('f '):
        p = [x.split('/') for x in l.split()[1:4]]
        F.append([int(p[i][0]) - 1 for i in range(3)] + [int(p[i][1]) - 1 for i in range(3)] + [mats.index(mat)])
V, VT, F = np.array(V), np.array(VT), np.array(F)
# OpenMVS repite la coordenada de textura en cada esquina: se juntan las que coinciden
_, vt_inv = np.unique(np.round(VT * 2 ** 16).astype(np.int64), axis=0, return_inverse=True)
VT_u = np.zeros((vt_inv.max() + 1, 2)); VT_u[vt_inv.ravel()] = VT
F[:, 3:6] = vt_inv.ravel()[F[:, 3:6]]; VT = VT_u
ims = [Image.open(d + f'maqueta_tex_{m}_map_Kd.jpg').convert('RGB') for m in mats]
print('materiales', mats, [im.size for im in ims], 'caras', len(F))
# atlas: una textura debajo de la otra
W = max(im.width for im in ims); H = sum(im.height for im in ims)
atlas = Image.new('RGB', (W, H)); y0s = []; y = 0
for im in ims: atlas.paste(im, (0, y)); y0s.append(y); y += im.height
# vértices únicos por (posición, uv, material)
claves = np.concatenate([np.stack([F[:, i], F[:, 3 + i], F[:, 6]], 1) for i in range(3)])
uniq, inv = np.unique(claves, axis=0, return_inverse=True)
idx = inv.reshape(3, -1).T
pos = V[uniq[:, 0]]
uv = VT[uniq[:, 1]].copy()
for k, im in enumerate(ims):
    s = uniq[:, 2] == k
    px = uv[s, 0] * im.width; py = y0s[k] + (1 - uv[s, 1]) * im.height
    uv[s, 0] = px / W; uv[s, 1] = py / H          # ya en convención glTF (origen arriba)
# orientación: "arriba" = normal del plano de cámaras → +Y; eje largo → X; piso en y=0; lado mayor = 2
a = np.load(M + '/arriba.npy'); n = a[3:] / np.linalg.norm(a[3:])
P = pos - pos.mean(0); Ph = P - np.outer(P @ n, n)
x = np.linalg.svd(Ph[::7], full_matrices=False)[2][0]; x = x - np.dot(x, n) * n; x /= np.linalg.norm(x)
z = np.cross(x, n)
Q = P @ np.vstack([x, n, z]).T
Q[:, 1] -= Q[:, 1].min()
Q *= 2 / max(np.ptp(Q[:, 0]), np.ptp(Q[:, 2]))
Q[:, 0] -= (Q[:, 0].min() + Q[:, 0].max()) / 2; Q[:, 2] -= (Q[:, 2].min() + Q[:, 2].max()) / 2
# textura reducida
k = ancho / W
atlas = atlas.resize((round(W * k), round(H * k)), Image.LANCZOS)
buf = io.BytesIO(); atlas.save(buf, 'JPEG', quality=82, optimize=True); jpg = buf.getvalue()
pos32, uv32, idx32 = Q.astype(np.float32), uv.astype(np.float32), idx.astype(np.uint32)
al = lambda b, r=b'\x00': b + r * ((-len(b)) % 4)
crudos = [pos32.tobytes(), uv32.tobytes(), idx32.tobytes(), jpg]; obj = [34962, 34962, 34963, None]
partes, vistas, off = [], [], 0
for dat, o in zip(crudos, obj):
    v = {'buffer': 0, 'byteOffset': off, 'byteLength': len(dat)}
    if o: v['target'] = o
    vistas.append(v); r = al(dat); partes.append(r); off += len(r)
binario = b''.join(partes)
gltf = {'asset': {'version': '2.0', 'generator': 'GeoParquemet fotogrametría maqueta (COLMAP + OpenMVS)'},
        'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'mesh': 0}],
        'meshes': [{'primitives': [{'attributes': {'POSITION': 0, 'TEXCOORD_0': 1}, 'indices': 2, 'material': 0}]}],
        'materials': [{'pbrMetallicRoughness': {'baseColorTexture': {'index': 0}, 'metallicFactor': 0.0, 'roughnessFactor': 0.95}, 'doubleSided': True}],
        'textures': [{'sampler': 0, 'source': 0}],
        'samplers': [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 33071, 'wrapT': 33071}],
        'images': [{'bufferView': 3, 'mimeType': 'image/jpeg'}],
        'accessors': [{'bufferView': 0, 'componentType': 5126, 'count': len(pos32), 'type': 'VEC3', 'min': pos32.min(0).tolist(), 'max': pos32.max(0).tolist()},
                      {'bufferView': 1, 'componentType': 5126, 'count': len(uv32), 'type': 'VEC2'},
                      {'bufferView': 2, 'componentType': 5125, 'count': idx32.size, 'type': 'SCALAR'}],
        'bufferViews': vistas, 'buffers': [{'byteLength': len(binario)}]}
js = al(json.dumps(gltf, separators=(',', ':')).encode(), b' ')
with open(sal, 'wb') as fh:
    fh.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binario)))
    fh.write(struct.pack('<II', len(js), 0x4E4F534A)); fh.write(js)
    fh.write(struct.pack('<II', len(binario), 0x004E4942)); fh.write(binario)
print('glb', len(pos32), 'vértices', len(idx32), 'caras', 'textura', atlas.size, f'{len(jpg)/1e6:.1f} MB jpg', 'extensión', np.ptp(Q, 0).round(3))
