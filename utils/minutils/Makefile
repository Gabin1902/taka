TARGETS = extract compact dumpist dumpcompact submit
CFLAGS = -Wall -Ofast
INC = -Isrc -Isrc/fingerjet -Isrc/fingerjet/algorithm
LIBS = -lnfc

all: $(TARGETS)

extract: extract.c
	$(CXX) $(CFLAGS) $(INC) src/fingerjet/*.cxx $@.c -o $@

compact: compact.c
	$(CC) $(CFLAGS) $(INC) src/*.c $@.c -o $@

dumpist: dumpist.c
	$(CC) $(CFLAGS) $(INC) src/*.c $@.c -o $@

dumpcompact: dumpcompact.c
	$(CC) $(CFLAGS) $(INC) src/*.c $@.c -o $@

submit: submit.c
	$(CC) $(CFLAGS) $(INC) $(LIBS) src/*.c $@.c -o $@

submit_translate: submit_translate.c
	$(CC) $(CFLAGS) $(INC) $(LIBS) src/*.c $@.c -o $@

clean:
	rm -f $(TARGETS)

.PHONY: clean
