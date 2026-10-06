import sys, numpy as np, trimesh, fast_simplification
M=sys.argv[1]; corte=float(sys.argv[2]); caras=int(sys.argv[3])
a=np.load(M+'/arriba.npy'); c0,n=a[:3],a[3:]
mesh=trimesh.load(M+'/mvs/escena_dense_mesh.ply', process=False)
h=(mesh.vertices-c0)@n
keep=(h[mesh.faces]>corte).all(1)
m=mesh.submesh([np.where(keep)[0]], append=True)
partes=m.split(only_watertight=False)
partes=sorted(partes, key=lambda p: len(p.faces), reverse=True)
print('partes', len(partes), [len(p.faces) for p in partes[:5]])
m=partes[0]
v,f=fast_simplification.simplify(np.asarray(m.vertices,dtype=np.float32), np.asarray(m.faces), target_count=caras)
m2=trimesh.Trimesh(v,f,process=True)
print('recortada', len(m.faces), '→ simplificada', len(m2.faces), 'extensión', np.ptp(m2.vertices,0).round(2))
m2.export(M+'/mvs/maqueta.ply')
