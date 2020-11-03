#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#include "minutiaes.h"

int main(int argc, char **argv)
{
  FILE *in;
  unsigned char x, y, z;

  if (argc < 2) {
      printf("usage: %s minutiaes_compact.bin\n", argv[0]);
      return -1;
  }

  in = fopen(argv[1], "rb");
  if (!in) {
      printf("ERROR fopen\n");
      return -1;
  }

  fscanf(in, "%c%c%c", &x, &y, &z);
  do {
      printf("x: %d\ty:%d\ttype:%d\tangle:%d\n", x, y, z >> 6, z & 0x3f);
      fscanf(in, "%c%c%c", &x, &y, &z);
  } while (!feof(in));

  fclose(in);
  return 0;
}
