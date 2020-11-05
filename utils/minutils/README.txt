Build
=====

make

Extract minutiaes from PGM image
================================

./extract ../samples/remote/0638743217_2.pgm ../samples/remote/0638743217_2.ist

This creates a binary .ist file with minutiaes in ISO/IEC 19794-2 2005 format (FMR)

Show IST (FMR) minutiaes in human readable format
=================================================

./dumpist ../samples/remote/0638743217_2.ist
Type    X       Y       Angle   Quality
2,      40,     160,    210,    76
2,      188,    189,    180,    76
1,      66,     372,    90,     76
1,      81,     170,    196,    74
1,      86,     159,    12,     73
[...]

Select best minutiaes and compact them to card format
=====================================================

./compact ../samples/remote/0638743217_2.ist 60 20 ../samples/remote/0638743217_2.mybin

Show compact minutiaes in human readable format
===============================================

./dumpcompact ../samples/remote/0638743217_2.mybin
x: 65   y:71    type:1  angle:0
x: 68   y:77    type:2  angle:33
x: 43   y:79    type:1  angle:2
x: 20   y:80    type:2  angle:37
x: 62   y:82    type:2  angle:34
[...]

Plot images and minutiaes
=========================

python plot.py ../samples/remote/0638743217_2

Test influence of number of minutiaes
=====================================

Warning: dangerous! Use a know good compact to avoid locking the card!

sudo ./submit ../samples/agbokou/5130159536_2.myok ../samples/agbokou/5130159536_2.ist
