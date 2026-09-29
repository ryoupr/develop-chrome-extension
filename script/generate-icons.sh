#!/bin/bash

# Chrome拡張機能用アイコン生成ツール
# 画像を16/32/48/128pxに変換し、WXTが自動検出する public/icon/ に出力（ImageMagickを使用）

set -e

# 色付きの出力用関数
print_info() {
    echo -e "\033[34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[32m[SUCCESS]\033[0m $1"
}

print_error() {
    echo -e "\033[31m[ERROR]\033[0m $1"
}

print_warning() {
    echo -e "\033[33m[WARNING]\033[0m $1"
}

# 使用方法を表示
show_usage() {
    echo "Chrome拡張機能用アイコン生成ツール"
    echo
    echo "使用方法:"
    echo "  $0 <入力画像ファイル>"
    echo
    echo "例:"
    echo "  $0 source-icon.png"
    echo "  $0 ~/Downloads/icon.png"
    echo
    echo "出力:"
    echo "  public/icon/16.png  (16x16px)   - ファビコン・ツールバー"
    echo "  public/icon/32.png  (32x32px)   - Windows等での表示"
    echo "  public/icon/48.png  (48x48px)   - 拡張機能管理ページ"
    echo "  public/icon/128.png (128x128px) - Chrome Web Store表示"
    echo
    echo "注意:"
    echo "  - ImageMagickを使用します（macOS: brew install imagemagick / Ubuntu: sudo apt-get install imagemagick）"
    echo "  - 対応形式: PNG, JPEG, WebP"
    echo "  - 正方形でない画像は縦横比を保ったまま透明背景で正方形にします"
}

# 引数チェック
if [ $# -eq 0 ]; then
    show_usage
    exit 1
fi

INPUT_FILE="$1"

# 入力ファイルの存在確認
if [ ! -f "$INPUT_FILE" ]; then
    print_error "ファイルが見つかりません: $INPUT_FILE"
    exit 1
fi

# ファイル拡張子の確認
if [[ ! "$INPUT_FILE" =~ \.(png|PNG|jpe?g|JPE?G|webp|WEBP)$ ]]; then
    print_error "PNG / JPEG / WebP ファイルを指定してください: $INPUT_FILE"
    exit 1
fi

# ImageMagickの存在確認（magick優先、convertフォールバック）
if command -v magick &> /dev/null; then
    MAGICK_CMD="magick"
    IDENTIFY_CMD="magick identify"
elif command -v convert &> /dev/null; then
    MAGICK_CMD="convert"
    IDENTIFY_CMD="identify"
else
    print_error "ImageMagickが見つかりません。"
    print_info "インストール方法:"
    print_info "  macOS: brew install imagemagick"
    print_info "  Ubuntu: sudo apt-get install imagemagick"
    exit 1
fi

# 出力ディレクトリの作成
ICON_DIR="public/icon"
if [ ! -d "$ICON_DIR" ]; then
    print_info "$ICON_DIR ディレクトリを作成中..."
    mkdir -p "$ICON_DIR"
fi

print_info "入力ファイル: $INPUT_FILE"

# 元画像の情報を取得
ORIGINAL_WIDTH=$($IDENTIFY_CMD -format "%w" "$INPUT_FILE[0]" 2>/dev/null || true)
ORIGINAL_HEIGHT=$($IDENTIFY_CMD -format "%h" "$INPUT_FILE[0]" 2>/dev/null || true)

if [ -n "$ORIGINAL_WIDTH" ] && [ -n "$ORIGINAL_HEIGHT" ]; then
    print_info "元画像サイズ: ${ORIGINAL_WIDTH}x${ORIGINAL_HEIGHT}px"

    # 正方形でない場合の警告
    if [ "$ORIGINAL_WIDTH" != "$ORIGINAL_HEIGHT" ]; then
        print_warning "画像が正方形ではありません。透明の余白を付けて正方形にします。"
    fi

    # 小さすぎる画像の警告
    if [ "$ORIGINAL_WIDTH" -lt 128 ] || [ "$ORIGINAL_HEIGHT" -lt 128 ]; then
        print_warning "元画像が128px未満です。拡大により画質が劣化する可能性があります。"
    fi
else
    print_error "画像として読み込めませんでした: $INPUT_FILE"
    exit 1
fi

# 生成するサイズの定義
declare -a SIZES=("16" "32" "48" "128")

print_info "アイコンを生成中..."

# 各サイズのアイコンを生成
for SIZE in "${SIZES[@]}"; do
    OUTPUT_FILE="$ICON_DIR/${SIZE}.png"

    # 既存ファイルの確認
    if [ -f "$OUTPUT_FILE" ]; then
        print_warning "既存ファイルを上書きします: $OUTPUT_FILE"
    fi

    # 縦横比を保って縮小し、透明背景で正方形にする
    if $MAGICK_CMD "$INPUT_FILE[0]" \
        -background none \
        -resize "${SIZE}x${SIZE}" \
        -gravity center \
        -extent "${SIZE}x${SIZE}" \
        "PNG32:$OUTPUT_FILE" 2>/dev/null; then
        print_success "✓ ${SIZE}x${SIZE}px → $OUTPUT_FILE"
    else
        print_error "✗ ${SIZE}x${SIZE}px の生成に失敗しました"
        exit 1
    fi
done

echo
print_success "すべてのアイコンが正常に生成されました！"
print_info "生成されたファイル:"

# 生成されたファイルの情報を表示
for SIZE in "${SIZES[@]}"; do
    OUTPUT_FILE="$ICON_DIR/${SIZE}.png"
    if [ -f "$OUTPUT_FILE" ]; then
        FILE_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
        print_info "  $OUTPUT_FILE (${FILE_SIZE})"
    fi
done

echo
print_info "WXTがビルド時に自動検出し、manifest.jsonのiconsに設定します。"
