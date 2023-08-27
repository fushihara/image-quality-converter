//@ts-check
const initialBackgroundColor = "#ffffff";
const qualityList = [
  1, 0.99, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45, 0.4, 0.35, 0.3, 0.25, 0.2, 0.19, 0.18, 0.17, 0.16, 0.15, 0.14, 0.13, 0.12, 0.11, 0.1, 0.09, 0.08, 0.07, 0.06, 0.05, 0.04, 0.03,
  0.02, 0.01, 0.001, 0.0001,
];
const sizeList = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
class PasteFile {
  fileObj = null;
  _backgroundColor = initialBackgroundColor;
  _quality = qualityList[0];
  _sizeScale = sizeList[0];
  async onDrop(fileObj) {
    if (fileObj == null) {
      alert("fileObjがnullです");
      return;
    }
    const {type: fileType} = fileObj;
    const allowFileTypes = ["image/jpeg", "image/png", "image/svg+xml"];
    if (allowFileTypes.includes(fileType) == false) {
      alert(`ファイルのmimeTypeが想定外です。type:"${fileType}`);
      return;
    }
    this.fileObj = fileObj;
    const fileObjBlobUrl = URL.createObjectURL(fileObj);
    const imageSize = await this._getImageElement(fileObjBlobUrl);
    URL.revokeObjectURL(fileObjBlobUrl);
    await this._setBlob(document.querySelector("#before-image"), fileObj, null, {width: imageSize.imageSize.width, height: imageSize.imageSize.height});
    await this._updateAfterElement();
  }
  async updateBackgroundColor(backgroundColor) {
    this._backgroundColor = backgroundColor;
    await this._updateAfterElement();
  }
  async updateQuality(quality) {
    this._quality = quality;
    await this._updateAfterElement();
  }
  async updateSizeScale(sizeScale) {
    this._sizeScale = sizeScale;
    await this._updateAfterElement();
  }
  async _updateAfterElement() {
    if (this.fileObj == null) {
      return;
    }
    const afterImageElement = await this._getConvertedBlob(this.fileObj, this._quality, this._sizeScale);
    if (afterImageElement == null || afterImageElement.canvasBlob == null) {
      return;
    }
    await this._setBlob(document.querySelector("#after-image"), afterImageElement.canvasBlob, this._quality, {width: afterImageElement.scaledSize.width, height: afterImageElement.scaledSize.height});
  }
  async _setBlob(baseElement, blobObject, quality, size) {
    let image = baseElement.querySelector("img");
    if (image == null) {
      image = new Image();
      baseElement.appendChild(image);
    }
    const blobUrl = URL.createObjectURL(blobObject);
    await new Promise((resolve) => {
      image.addEventListener("load", resolve, {once: true});
      image.src = blobUrl;
    });
    URL.revokeObjectURL(blobUrl);
    const textArea = baseElement.querySelector("div");
    const sizeStr = `${size.width} x ${size.height}`;
    if (quality != null) {
      textArea.innerText = `"${blobObject.type}" , ${sizeStr} ${(blobObject.size / 1000).toFixed(1)}kb , Quality ${Number(quality)}`;
    } else {
      textArea.innerText = `"${blobObject.type}" , ${sizeStr} ${(blobObject.size / 1000).toFixed(1)}kb`;
    }
  }
  async _getConvertedBlob(imageFileObj, quality, sizeScale) {
    const backgroundColor = this._backgroundColor;
    const fileObjBlobUrl = URL.createObjectURL(imageFileObj);
    const imageElement = await this._getImageElement(fileObjBlobUrl);
    const canvas = document.createElement("canvas");
    canvas.width = imageElement.imageSize.width * sizeScale;
    canvas.height = imageElement.imageSize.height * sizeScale;
    const context = canvas.getContext("2d");
    if (context == null) {
      throw new Error(`context null`);
    }
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(imageElement.imgElement, 0, 0, imageElement.imageSize.width, imageElement.imageSize.height, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(fileObjBlobUrl);
    const canvasBlob = await new Promise(async (resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/jpeg",
        quality
      );
    });
    if (this._backgroundColor != backgroundColor) {
      return null;
    }
    return {canvasBlob, originalSize: {width: imageElement.imageSize.width, height: imageElement.imageSize.height}, scaledSize: {width: canvas.width, height: canvas.height}};
  }
  async _getImageElement(fileObjBlobUrl) {
    const img = new Image();
    const imageSize = await new Promise(async (resolve) => {
      img.onload = () => {
        const size = {
          width: img.naturalWidth,
          height: img.naturalHeight,
        };
        resolve(size);
      };
      img.src = fileObjBlobUrl;
    });
    return {imageSize, imgElement: img};
  }
}
const pasteFile = new PasteFile();
const colorPicker = document.querySelector("#background-color-picker");
const qualitySliderInput = document.querySelector("#quality-slider-input");
const qualitySliderValue = document.querySelector("#quality-slider-value");
const sizeSliderInput = document.querySelector("#size-slider-input");
const sizeSliderValue = document.querySelector("#size-slider-value");
if (!(colorPicker instanceof HTMLInputElement)) {
  throw new Error(`colorPicker null`);
}
colorPicker.value = initialBackgroundColor;
{
  console.log(`load page`);
  const top = document.querySelector("#drop-area");
  if (top == null) {
    throw new Error(`top is null`);
  }
  const child = top.querySelector("div");
  if (!(child instanceof HTMLDivElement)) {
    throw new Error(`top is null`);
  }
  top.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (!(e instanceof InputEvent) || e.dataTransfer == null) {
      throw new Error(`e is not InputEvent`);
    }
    e.dataTransfer.dropEffect = "copy";
    child.style.display = "block";
    //console.log(`drag over`, e.dataTransfer);
  });
  top.addEventListener("dragleave", (e) => {
    child.style.display = "none";
    //console.log(`drag over`, e.dataTransfer);
  });
  top.addEventListener("drop", (e) => {
    e.preventDefault();
    if (!(e instanceof InputEvent) || e.dataTransfer == null) {
      throw new Error(`e is not InputEvent`);
    }
    child.style.display = "none";
    //console.log(`drop top`, {files: e.dataTransfer.files, items: e.dataTransfer.items, types: e.dataTransfer.types});
    if (e.dataTransfer.types.length == 1 && e.dataTransfer.types[0] == "Files") {
      const files = [...e.dataTransfer.files].filter((a) => a instanceof File);
      //console.log(files);
    }
    //console.log(e.dataTransfer?.files?.[0]);
    pasteFile.onDrop(e.dataTransfer?.files?.[0]);
  });
  document.addEventListener("paste", (event) => {
    //console.log(event.clipboardData?.files?.[0]);
    pasteFile.onDrop(event.clipboardData?.files?.[0]);
  });
}
{
  colorPicker.addEventListener("input", (e) => {
    if (!(e.target instanceof HTMLInputElement)) {
      throw new Error(`e is not InputEvent`);
    }
    pasteFile.updateBackgroundColor(e.target.value);
  });
}
{
  if (!(qualitySliderInput instanceof HTMLInputElement)) {
    throw new Error(`qualitySliderInput is not htmlInputElement`);
  }
  if (!(qualitySliderValue instanceof HTMLElement)) {
    throw new Error(`qualitySliderValue is not htmlInputElement`);
  }
  qualitySliderInput.min = "0";
  qualitySliderInput.max = String(qualityList.length - 1);
  qualitySliderValue.innerText = String(qualityList[0]);
  qualitySliderInput.addEventListener("input", () => {
    const val = qualityList[Number(qualitySliderInput.value)];
    qualitySliderValue.innerText = String(val);
    pasteFile.updateQuality(val);
  });
}
{
  if (!(sizeSliderInput instanceof HTMLInputElement)) {
    throw new Error(`sizeSliderInput is not htmlInputElement`);
  }
  if (!(sizeSliderValue instanceof HTMLElement)) {
    throw new Error(`sizeSliderValue is not htmlInputElement`);
  }
  sizeSliderInput.min = "0";
  sizeSliderInput.max = String(sizeList.length - 1);
  sizeSliderValue.innerText = String(sizeList[0]);
  sizeSliderInput.addEventListener("input", () => {
    const val = sizeList[Number(sizeSliderInput.value)];
    sizeSliderValue.innerText = String(val);
    pasteFile.updateSizeScale(val);
  });
}
