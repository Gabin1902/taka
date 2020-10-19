#include <stdlib.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include <netinet/in.h>

#include "libmin.h"

void print_minuties(uint8_t *minuties, uint32_t len)
{
    uint8_t *p;
    struct min_s s;
    int angle;

    printf("minuties decoded (%d):\n", len);
    printf("Type    X       Y       Angle   Quality\n");
    p = minuties + 28;
    while(p < minuties+len-2) {
        memcpy(&s, p, sizeof(struct min_s));
        s.x = htons(s.x);
        s.y = htons(s.y);
        angle = s.a >> 0;
        angle = (float)angle * (360.0 / 256.0);
        printf("%d,\t%d,\t%d,\t%d,\t%d\n",
                s.x >> 14, (s.x & 0x3fff), s.y,
                angle, s.b);
        p = p + sizeof(struct min_s);
    }
}

void render_minuties(SDL_Renderer *renderer, uint8_t *minuties, uint32_t len)
{
    uint8_t *p;
    struct min_s s;

    int x, y;
    int dx, dy;
    int angle;
    float alpha;
    int quality;
    int color;
    SDL_Rect rect;

    p = minuties + 28;
    while(p < minuties+len-2) {
        memcpy(&s, p, sizeof(struct min_s));
        s.x = htons(s.x);
        s.y = htons(s.y);

        // extract
        x = (s.x & 0x3fff);
        y = s.y;
        angle = s.a >> 0;
        quality = s.b;

        // convert
        alpha = (float)angle * (360.0 / 256.0) * (M_PI / 180.0);
        dx = cos(alpha) * 10;
        dy = -sin(alpha) * 10;

        // printf("%d, %d, %d, %f, %d, %d\n", x, y, angle, alpha, dx, dy);

        // color
        color = (int)(quality * 2.55) * 0x0000ff; /* blue -> green scale*/

        SDL_SetRenderDrawColor(renderer, 0, color >> 8, color & 0xff, SDL_ALPHA_OPAQUE);

        rect.x = x-1;
        rect.y = y-1;
        rect.w = 3;
        rect.h = 3;
        SDL_RenderFillRect(renderer, &rect);
        SDL_RenderDrawLine(renderer, x, y, x+dx, y+dy);

        p = p + sizeof(struct min_s);
    }
}
