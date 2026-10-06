set -e
cd "$1"
rm -rf db.db sparse
export QT_QPA_PLATFORM=offscreen
colmap feature_extractor --database_path db.db --image_path img --ImageReader.single_camera_per_folder 1 --ImageReader.camera_model OPENCV --SiftExtraction.use_gpu 0 --SiftExtraction.max_image_size 1600 --SiftExtraction.max_num_features 4096 > fe.log 2>&1
echo "rasgos listos"
colmap sequential_matcher --database_path db.db --SiftMatching.use_gpu 0 --SequentialMatching.overlap 20 --SequentialMatching.quadratic_overlap 1 > sm.log 2>&1
echo "emparejado listo"
mkdir -p sparse
colmap mapper --database_path db.db --image_path img --output_path sparse > map.log 2>&1
echo "mapeo listo"; ls sparse
for d in sparse/*; do colmap model_analyzer --path $d 2>&1 | grep -E "Cameras|Registered|Points|Mean reprojection"; done
