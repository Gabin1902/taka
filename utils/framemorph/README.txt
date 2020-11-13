Build
=====

make

Convert image to raw 8bit grayscale
===================================

convert frame_raw_1.png -depth 8 frame_raw_1.gray

Apply the morphing matrix
=========================

./framemorph frame_raw_1.gray

Convert it back for visualisation
=================================

convert -depth 8 -size 314x322 bilinear.gray bilinear.png && feh bilinear.png
