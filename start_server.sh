#!/bin/sh

git pull

# To directly run the servers
# python -m venv venv
# . venv/bin/activate
# pip install -r requirements.txt
# uvicorn app.api.main:app &
npm run dev
# npm run build
# npm run start