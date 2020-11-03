TARGETS = extract compact dumpist dumpcompact
CFLAGS = -Wall -Ofast
INC = -Isrc -Isrc/fingerjet -Isrc/fingerjet/algorithm

all: $(TARGETS)

extract: extract.c
	$(CXX) $(CFLAGS) $(INC) src/fingerjet/*.cxx $@.c -o $@

compact: compact.c
	$(CC) $(CFLAGS) $(INC) src/*.c $@.c -o $@

dumpist: dumpist.c
	$(CC) $(CFLAGS) $(INC) src/*.c $@.c -o $@

dumpcompact: dumpcompact.c
	$(CC) $(CFLAGS) $(INC) src/*.c $@.c -o $@

clean:
	rm -f $(TARGETS)

.PHONY: clean
