#!/bin/sh

git pull

####### To directly run the servers #######
python3 -m venv venv
. venv/bin/activate
pip3 install -r requirements.txt

# Suppress tokenizers fork warning
export TOKENIZERS_PARALLELISM=false

# Run backend and frontend
uvicorn app.api.main:app --reload &
npm run dev
