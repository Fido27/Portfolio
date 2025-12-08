#! /bin/sh

for deb in *.deb; do
  dpkg-deb -x "$deb" extracted/
done