#ifndef _LIBMIN_H
#define _LIBMIN_H

#include <stdint.h>

#include "SDL2/SDL.h"

struct min_s {
  unsigned short x;
  unsigned short y;
  unsigned char a;
  unsigned char b;
}__attribute__((packed));

void print_minuties(uint8_t *minuties, uint32_t len);
void render_minuties(SDL_Renderer *renderer, uint8_t *minuties, uint32_t len);

#endif
