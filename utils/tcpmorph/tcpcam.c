#include <stdio.h>
#include <netdb.h>
#include <netinet/in.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>
#include <time.h>
#include <math.h>

#include "SDL2/SDL.h"
#include "libmin.h"

#ifdef CAM_RAW

# define CAM_WIDTH  640
# define CAM_HEIGHT 380

#else

# define CAM_DUMP
# define CAM_MORPH
# define CAM_WIDTH  314
# define CAM_HEIGHT 322

#endif

#define FJFX_FMD_BUFFER_SIZE          (34 + 256 * 6)

#ifdef CAM_DUMP
int dump_to_file(uint8_t *buf, int size, char *name)
{
    FILE *file;

    file = fopen(name, "w");
    if (!file) {
        printf("Cant open file: %s\n", name);
        return 1;
    }

    fwrite(buf, sizeof(uint8_t), size, file);
    fclose(file);
}
#endif

int load_pixels(int fd, uint8_t *output, int size, char *outname) // output should be 3*size
{
    int i;
    // uint8_t *input = ______camera_nuttx_buffer_bin;
    uint8_t *input, *p;
    int remain;
    int n;

    memset(output, 0, 3*size);

    input = malloc(size);
    memset(input, 0, size);
    p = input;
    remain = size;

    printf("waiting for frame...\n");

    while (remain > 0) {
        n = read(fd, p, remain);
        if (n <= 0) {
            printf("read socket failed\n");
            return -1;
        }

        p += n;
        remain -= n;

        // printf("recv %d, remain %d\n", n, remain);
    }
    printf("frame received (%d)\n", size);

#ifdef CAM_DUMP
    dump_to_file(input, size, outname);
#endif

    // there is no grayscale... use rgb...
    for (i=0; i<size; i++) {
        // output[4*i] = 0x0; // alpha
        output[3*i] = input[i]; // blue
        output[3*i+1] = input[i]; // green
        output[3*i+2] = input[i]; // red
    }

    free(input);

    return 0;
}

#ifdef CAM_MORPH
int load_minutias(int fd, uint8_t *minuties, uint32_t *len)
{
    int n;
    int remain;
    uint8_t *p;
    uint32_t rlen;

    n = read(fd, &rlen, sizeof(rlen));
    printf("n=%d\n", n);
    if (n < sizeof(rlen)) {
        printf("read socket failed\n");
        return -1;
    }

    if (rlen > *len) {
        rlen = *len;
    }

    printf("waiting for minuties...\n");

    p = minuties;
    remain = rlen;
    while (remain > 0) {
        n = read(fd, p, remain);
        if (n <= 0) {
            printf("read socket failed\n");
            return -1;
        }

        p += n;
        remain -= n;
    }
    printf("got minuties (%d)\n", rlen);

    *len = rlen;
    return 0;
}
#endif // CAM_MORPH

int open_socket()
{
    int sockfd, connfd, len;
    int optval = 1;
    struct sockaddr_in servaddr, cli;

    // socket create and verification
    sockfd = socket(AF_INET, SOCK_STREAM, 0);
    if (sockfd == -1) {
        printf("socket creation failed...\n");
        exit(0);
    }
    else
        printf("Socket successfully created..\n");
    bzero(&servaddr, sizeof(servaddr));

    // assign IP, PORT
    servaddr.sin_family = AF_INET;
    servaddr.sin_addr.s_addr = htonl(INADDR_ANY);
    servaddr.sin_port = htons(1234);

    // Reuse
    setsockopt(sockfd, SOL_SOCKET, SO_REUSEPORT, &optval, sizeof(optval));

    // Binding newly created socket to given IP and verification
    if ((bind(sockfd, (struct sockaddr*)&servaddr, sizeof(servaddr))) != 0) {
        printf("socket bind failed...\n");
        exit(0);
    }
    else
        printf("Socket successfully binded..\n");

    // Now server is ready to listen and verification
    if ((listen(sockfd, 5)) != 0) {
        printf("Listen failed...\n");
        exit(0);
    }
    else
        printf("Server listening..\n");
    len = sizeof(cli);

    // Accept the data packet from client and verification
    connfd = accept(sockfd, (struct sockaddr*)&cli, &len);
    if (connfd < 0) {
        printf("server acccept failed...\n");
        exit(0);
    }
    else
        printf("server acccept the client...\n");

    close(sockfd);

    return connfd;
}

/* Moving Rectangle */
int main(int argc, char *argv[])
{
    SDL_Window *window;
    SDL_Renderer *renderer;
    SDL_Texture *texture;
    SDL_Event event;
    SDL_Surface *surface;

    time_t ts;
    char name[64];

    int ret;
    int width, height;
    int size;
    uint8_t *pixels;
    int sock;

    uint32_t minuties_len = FJFX_FMD_BUFFER_SIZE;
    uint8_t minuties[FJFX_FMD_BUFFER_SIZE];

#ifdef CAM_DUMP
    mkdir("dump", S_IRWXU | S_IRWXG | S_IROTH | S_IXOTH);
#endif

    sock = open_socket();

    if (SDL_Init(SDL_INIT_VIDEO) < 0) {
        SDL_LogError(SDL_LOG_CATEGORY_APPLICATION, "Couldn't initialize SDL: %s", SDL_GetError());
        return 3;
    }

    width = CAM_WIDTH;
    height = CAM_HEIGHT;

    window = SDL_CreateWindow("SDL_CreateTexture",
            SDL_WINDOWPOS_UNDEFINED,
            SDL_WINDOWPOS_UNDEFINED,
            3* width, 3* height,
            SDL_WINDOW_RESIZABLE);

    renderer = SDL_CreateRenderer(window, -1, 0);

    // there is no grayscale... use rgb...
    texture = SDL_CreateTexture(renderer, SDL_PIXELFORMAT_RGB24, SDL_TEXTUREACCESS_TARGET, width, height);
    if (!texture){
        printf("Cant create texture\n");
        return -1;
    }

    size = width * height;
    pixels = malloc(3*size); // there is no grayscale... use rgb...

    while (1) {
        SDL_PollEvent(&event);
        if(event.type == SDL_QUIT)
            break;

        SDL_RenderClear(renderer);

        ts = time(NULL);

        /* get image */

        snprintf(name, 64, "dump/%d.bin", ts);
        ret = load_pixels(sock, pixels, size, name);
        if (ret != 0)
        {
            printf("cant load pixels\n");
            goto end;
        }
        if (SDL_UpdateTexture(texture, NULL, pixels, 3*width) < 0)
        {
            printf("SDL_UpdateTexture failed: %s\n", SDL_GetError());
        }

        SDL_SetRenderTarget(renderer, texture);

#ifdef CAM_MORPH
        /* get minuties */

        minuties_len = FJFX_FMD_BUFFER_SIZE;
        ret = load_minutias(sock, minuties, &minuties_len);
        if (ret != 0)
        {
            printf("cant load minuties\n");
            goto end;
        }
        print_minuties(minuties, minuties_len);
        render_minuties(renderer, minuties, minuties_len);

#ifdef CAM_DUMP
        snprintf(name, 64, "dump/%d.min", ts);
        dump_to_file(minuties, minuties_len, name);
#endif
        // print_minuties(extracted_minuties, sizeof(extracted_minuties));
        // render_minuties(renderer, extracted_minuties, sizeof(extracted_minuties));
#endif

#ifdef CAM_DUMP
        /* export to file */

        ret = SDL_RenderReadPixels(renderer, NULL, SDL_PIXELFORMAT_RGB24,
                                   pixels, 3*width);
        if (ret != 0) {
            SDL_Log("Failed reading pixel data: %s\n", SDL_GetError());
            goto end;
        }

        /* Copy pixel data over to surface */

        surface = SDL_CreateRGBSurfaceWithFormatFrom(pixels, width, height, 24,
                                          3*width, SDL_PIXELFORMAT_RGB24);
        if (!surface) {
            SDL_Log("Failed creating new surface: %s\n", SDL_GetError());
            goto end;
        }

        /* Save result to an image */

        snprintf(name, 64, "dump/%d.bmp", ts);
        ret = SDL_SaveBMP(surface, name);
        if (ret != 0) {
            SDL_Log("Failed saving image: %s\n", SDL_GetError());
            goto end;
        }
#endif

        /* show */

        SDL_SetRenderTarget(renderer, NULL);
        SDL_RenderCopy(renderer, texture, NULL, NULL);
        SDL_RenderPresent(renderer);
    }

end:
    printf("exit\n");
    free(pixels);
    sleep(3);

    SDL_DestroyRenderer(renderer);
    SDL_Quit();

    close(sock);
    return 0;
}
