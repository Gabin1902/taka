all: camraw cammorph showmin

camraw:
	# gcc tcpcam.c libmin.c -lSDL2 -lm -o tcpcam_raw -DCAM_RAW

cammorph:
	gcc tcpcam.c libmin.c -lSDL2 -lm -o tcpcam_morph

showmin:
	gcc showmin.c libmin.c -lSDL2 -lm -o showmin

tar:
	tar czvf tcpcam.tgz libmin.* Makefile showmin.c tcpcam.c README.txt

.PHONY: showmin
