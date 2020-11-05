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

def show_point(x, y, angle, ptype, color="red"):
    # print(x, y, angle)
    alpha = angle * (math.pi / 180)
    dx = int(math.cos(alpha) * 10)
    dy = -int(math.sin(alpha) * 10)
    plt.plot([x, x + dx], [y, y + dy], color, linewidth=3)
    types = ["*", "^", "x"]
    plt.scatter(x=x, y=y, c=color, s=100, marker=types[ptype])

def show_compact(data, color="red"):
    scale = 2
    for i in range(len(data) // 3):
        x, y, tmp = data[3*i:3*(i+1)]
        ptype = tmp >> 6
        angle = tmp & 0x3f
        print("x: %d\ty:%d\ttype:%d\tangle:%d" % (x, y, ptype, angle))

        x *= scale
        y *= scale
        angle *= (360.0 / 64.0)
        show_point(x, y, angle, ptype, color=color)

def show_ist(data, color="red"):
    points = min_record_decode(data)
    for point in points:
        show_point(point.x, point.y, point.angle, point.type, color=color)

def show_ist_file(ist, color):
    print(ist)
    file = open(ist, "rb")
    data = file.read()
    file.close()
    show_ist(data, color)
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
    official = base
    compact = base + ".mybin"
    ist = base + ".ist"

    show_image(image)
    show_compact_file(official, "#FF0000")
    # show_ist_file(ist, "#0000FF")
    show_compact_file(compact, "#00FF00")
    plt.show()
