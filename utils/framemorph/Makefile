TARGETS = framemorph
CFLAGS = -Wall -Ofast
INC = -Isrc
LIBS =

all: $(TARGETS)

framemorph: framemorph.c
	$(CC) $(CFLAGS) $(INC) src/*.c $@.c -o $@

clean:
	rm -f $(TARGETS)

.PHONY: clean
