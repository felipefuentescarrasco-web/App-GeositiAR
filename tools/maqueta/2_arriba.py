import sys, numpy as np, trimesh, pycolmap
M=sys.argv[1]
rec=pycolmap.Reconstruction(M+'/sfm/sparse/0')
C=np.array([im.projection_center() for im in rec.images.values()])
mesh=trimesh.load(M+'/mvs/escena_dense_mesh.ply', process=False)
V=np.asarray(mesh.vertices)
# plano de las cámaras → "arriba"
c0=C.mean(0); u,s,vt=np.linalg.svd(C-c0); n=vt[2]
# arriba = hacia donde están las cámaras respecto de la malla
if np.dot(c0-np.median(V,0), n) < 0: n=-n
h=(V-c0)@n            # altura relativa al plano de cámaras (negativa = abajo)
hc=(C-c0)@n
print('cámaras', len(C), 'dispersión altura cámaras', hc.std().round(3), 'radio medio', np.linalg.norm((C-c0)-np.outer(hc,n),axis=1).mean().round(2))
hist,edges=np.histogram(h,bins=60)
for a,b in zip(edges[:-1],hist): print(f'{a:7.2f} {b:8d} '+'#'*int(60*b/hist.max()))
np.save(M+'/arriba.npy', np.concatenate([c0,n]))
