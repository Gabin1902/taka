#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

#include "fingerjet.h"

int main(int argc, char ** argv) {
  int ret;
  FILE *fp;
  int height, width, gray;
  size_t n;

  uint8_t* image;
  int imgsize;

  size_t destlen = FJFX_FMD_BUFFER_SIZE;
  uint8_t dest[FJFX_FMD_BUFFER_SIZE] = {0};

  const unsigned short dpi = 500;
  
  if(argc != 3 || argv[1] == NULL || argv[2] == NULL) {
    printf("Fingerprint Minutia Extraction\n"
           "Usage: %s <image.pgm> <fmd.ist>\n"
           "where <image.pgm> is the binary PGM (P5) file that containing 500DPI 8-bpp grayscale figerprint image\n"
           "      <fmd.ist> is the file where to write fingerprint minutia data in ISO/IEC 19794-2 2005 format\n", argv[0]);
    return -1;
  }

  fp = fopen(argv[1], "rb");
  if (fp == 0) {
    printf("Cannot open image file: %s\n", argv[1]);
    return 9;
  }
  n = fscanf(fp, "P5%d%d%d", &width, &height, &gray); 
  if (n != 3 || 
      gray > 256 || width > 0xffff || height > 0xffff || 
      gray <= 1 || width < 32 || height < 32) {
    printf("Image file %s is in unsupported format\n", argv[1]);
    fclose(fp);
    return 10;
  }
  
  imgsize = width * height;
  image = (uint8_t*)malloc(imgsize);
  if (image == 0) {
    printf("Cannot allocate image buffer: image size is %dx%d", width, height);
    if(fp != 0) {
      fclose(fp); fp = 0;
    }
    return 12;
  }
  
  n = fread(image, 1, imgsize, fp);
  fclose(fp); fp = 0;
  if (n != imgsize) {
    printf("Image file %s is too short\n", argv[1]);
    free(image);
    return 11;
  }

  ret = fingerjet_convert(image, width, height, dpi, dest, &destlen);
  free(image);
  image = 0;
  if (ret != 0) {
    printf("Failed feature extraction\n");
    return ret;
  }
  
  fp = fopen(argv[2], "wb");
  if (fp == 0) {
    printf("Cannot create output file: %s\n", argv[2]);
    return 14;
  }
  n = fwrite(dest, 1, destlen, fp);
  fclose(fp);
  if (n != destlen) {
    printf("Cannot write output file of destlen %d\n", (int)destlen);
    return 15;
  }

  return 0;
}

