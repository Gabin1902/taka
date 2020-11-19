#  %matplotlib inline

import sys
import math
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
from collections import defaultdict

plt.rcParams["figure.figsize"] = [20, 20]


# Minuties format from fingerjet library:
# ISO/IEC 19794-2:2005

class Pts():
    pass
    
def min_record_decode(fmr):
    o = []
    length = len(fmr);
    sizeofrec = 6;

    if length <= 30:
        return []

    # Number of minutiaes

    count = fmr[27]

    # Skip header

    p = fmr[28:];

    # Decode minutiaes in ISO record format

    for i in range(count):
        # Read one record

        s = p[i*sizeofrec:(i+1)*sizeofrec]

        x = (s[0] << 8) | s[1]
        y = (s[2] << 8) | s[3]
        angle = s[4]
        quality = s[5]

        # Output one point

        pts = Pts()
        pts.type = x >> 14
        pts.x = x & 0x3fff
        pts.y = y
        pts.angle = angle * 360.0 / 256.0
        pts.quality = quality

        print(pts.type, "\t", pts.x, "\t", pts.y, "\t", pts.angle, "\t", pts.quality)
        o.append(pts)

    return o

def show_image(path):
    img = mpimg.imread(path)
    width = len(img[0])
    height = len(img)
    print("{}x{}".format(width, height))
    print()
    imgplot = plt.imshow(img, cmap="gray")

def show_point(x, y, angle, ptype, color="red", transparency=0.6):
    # print(x, y, angle)
    alpha = angle * (math.pi / 180)
    dx = int(math.cos(alpha) * 10)
    dy = -int(math.sin(alpha) * 10)
    plt.plot([x, x + dx], [y, y + dy], color, linewidth=3, alpha=transparency)
    types = ["*", "^", "x", "."]
    plt.scatter(x=x, y=y, c=color, s=100, marker=types[ptype], alpha=transparency)

def show_compact(data, color="red", transparency=0.6):
    scale = 1.968503937
    for i in range(len(data) // 3):
        x, y, tmp = data[3*i:3*(i+1)]
        ptype = tmp >> 6
        angle = tmp & 0x3f
        print("x: %d\ty:%d\ttype:%d\tangle:%d" % (x, y, ptype, angle))

        x *= scale
        y *= scale
        angle *= (360.0 / 64.0)
        show_point(x, y, angle, ptype, color=color, transparency=transparency)

def show_square(color="yellow"):
    size = 75
    # x = 348/2 - size/2
    x = 314/2 - size/2
    # y = 348/2 - size/2
    y = 322/2 - size/2

    plt.plot([x, x + size], [y, y], color, linewidth=3)
    plt.plot([x + size, x + size], [y, y + size], color, linewidth=3)
    plt.plot([x, x + size], [y + size, y + size], color, linewidth=3)
    plt.plot([x, x], [y, y + size], color, linewidth=3)

def show_circle(color="yellow"):
    size = 75
    cx = 314/2
    cy = 322/2

    theta = np.linspace(0, 2*np.pi, 100)
    r = size / 2
    x1 = cx + r*np.cos(theta)
    x2 = cy + r*np.sin(theta)
    plt.plot(x1, x2, color=color, linewidth=3)

def in_circle(x, y):
    size = 75
    cx = 314/2
    cy = 322/2
    r = size / 2

    dx = (x - cx)
    dy = (y - cy)

    if (dx * dx + dy * dy) > (r * r):
        print("outside")
        if (dx * dx) >= (dy * dy):
            if dx > 0:
                print("too right, move left")
            else:
                print("too left, move right")
        else:
            if dy > 0:
                print("too low, move up")
            else:
                print("too up, move down")
    else:
        print("inside")

def show_ist(data, transparency=1, threshold=0, discard_type0=False, maxpoints=35):
    points = min_record_decode(data)
    qmin = 40
    i = 0

    sx = 0
    sy = 0
    sw = 0

    for point in points:
        if point.quality < threshold:
            continue
        if discard_type0 and point.type == 0:
            continue

        q = (point.quality - qmin) * 100 / (100 - qmin)
        green = int(q * 2.55)
        blue = int((100-q) * 2.55)
        color = "#00{:02x}{:02x}".format(green, blue)

        show_point(point.x, point.y, point.angle, point.type, color=color, transparency=transparency)

        # weighted sum
        sx += point.x * point.quality
        sy += point.y * point.quality
        sw += point.quality

        i += 1
        if i >= maxpoints:
            break

    sx /= sw
    sy /= sw

    show_square()
    show_circle()
    in_circle(sx, sy)
    show_point(sx, sy, 0, 3, color="red", transparency=transparency)

def show_ist_file(ist, threshold=0, discard_type0=False, maxpoints=35):
    print(ist)
    file = open(ist, "rb")
    data = file.read()
    file.close()
    show_ist(data, threshold=threshold, discard_type0=discard_type0, maxpoints=maxpoints)
    print()

def show_compact_file(compact, color):
    print(compact)
    try:
        file = open(compact, "rb")
        data = file.read()
        file.close()
        show_compact(data, color)
        print()
    except FileNotFoundError:
        print("FileNotFoundError")

if __name__ == "__main__":

    if (len(sys.argv) != 2):
        print("usage: %s fingerfile" % sys.argv[0])
        sys.exit(-1)

    base = sys.argv[1]

    image = base + ".pgm"
    remote = base
    local = base + ".mybin"
    fmr = base + ".fmr" # remotely found fmr/ist
    ist = base + ".ist" # locally found fmr/ist

    show_image(image)
    # show_compact_file(local, "#00FF00")
    # show_compact_file(remote, "#FF0000")
    show_ist_file(ist, discard_type0=True, maxpoints=35)
    plt.show()
