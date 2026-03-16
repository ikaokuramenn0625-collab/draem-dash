#!/bin/bash
# 動画クリップ切り抜きツール
# 使い方: ./ops/clip.sh <入力ファイル> <開始時間> <切り抜き秒数> [出力ファイル名]
#
# 例:
#   ./ops/clip.sh video.mp4 00:01:30 30
#     → video_clip_01m30s_30s.mp4 を出力
#
#   ./ops/clip.sh video.mp4 0:00:15 60 short_ver.mp4
#     → short_ver.mp4 を出力
#
# 開始時間フォーマット: HH:MM:SS または MM:SS または 秒数 (例: 90)

set -e

INPUT="$1"
START="$2"
DURATION="$3"
OUTPUT="$4"

if [ -z "$INPUT" ] || [ -z "$START" ] || [ -z "$DURATION" ]; then
  echo "使い方: $0 <入力ファイル> <開始時間> <切り抜き秒数> [出力ファイル名]"
  echo "例:     $0 継承.mp4 00:01:30 30"
  exit 1
fi

if [ -z "$OUTPUT" ]; then
  # 出力ファイル名を自動生成: 開始時間のコロンをmに変換
  START_LABEL=$(echo "$START" | sed 's/://g' | sed 's/^0*//')
  EXT="${INPUT##*.}"
  BASE="${INPUT%.*}"
  OUTPUT="${BASE}_clip_${START_LABEL}s_${DURATION}s.${EXT}"
fi

ffmpeg -ss "$START" -i "$INPUT" -t "$DURATION" -c:v copy -c:a copy "$OUTPUT"

echo "出力: $OUTPUT"
