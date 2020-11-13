#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "frame.h"

int main(int argc, char **argv)
{
  uint8_t *buf_in;
  uint8_t *buf_out;
  FILE *in;
  FILE *out;

  if (argc < 2) {
      printf("usage: %s raw.gray\n", argv[0]);
      return -1;
  }

  in = fopen(argv[1], "rb");
  if (!in) {
      printf("ERROR fopen\n");
      return -1;
  }

  buf_in = malloc(FRAME_SW * FRAME_SH);
  memset(buf_in, 0, FRAME_SW * FRAME_SH);
  fread(buf_in, 1, FRAME_SW * FRAME_SH, in);
  fclose(in);

  /* no filtering */

  buf_out = malloc(FRAME_DW * FRAME_DH);
  memset(buf_out, 0, FRAME_DW * FRAME_DH);
  morph(buf_in, buf_out);

  out = fopen("nofilter.gray", "wb");
  fwrite(buf_out, 1, FRAME_DW * FRAME_DH, out);
  fclose(out);
  free(buf_out);

  /* bilinear filtering */

  buf_out = malloc(FRAME_DW * FRAME_DH);
  memset(buf_out, 0, FRAME_DW * FRAME_DH);
  morph_bilinear(buf_in, buf_out);

  out = fopen("bilinear.gray", "wb");
  fwrite(buf_out, 1, FRAME_DW * FRAME_DH, out);
  fclose(out);
  free(buf_out);

  free(buf_in);
}
