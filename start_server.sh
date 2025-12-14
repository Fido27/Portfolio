#!/bin/sh

git pull

####### To directly run the servers #######
# python3 -m venv venv
# . venv/bin/activate
# pip3 install -r requirements.txt
# python app/api/linuxmancyclopedia/ingest.py --device cpu
# uvicorn app.api.main:app --reload &
npm run dev
# npm run build
# npm run start