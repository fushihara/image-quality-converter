const initialBackgroundColor = "#ffffff";
const qualityList = [1, 0.99, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45, 0.4, 0.35, 0.3, 0.25, 0.2, 0.15, 0.1, 0.05, 0.01, 0.001, 0.0001];
class PasteFile {
  fileObj = null;
  _backgroundColor = initialBackgroundColor;
  _quality = qualityList[0];
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
    await this._setBlob(document.querySelector("#before-image"), fileObj, null);
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
  async _updateAfterElement() {
    if (this.fileObj == null) {
      return;
    }
    const afterImageElement = await this._getConvertedBlob(this.fileObj, this._quality);
    if (afterImageElement == null) {
      return;
    }
    await this._setBlob(document.querySelector("#after-image"), afterImageElement, this._quality);
  }
  async _setBlob(baseElement, blobObject, quality) {
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
    if (quality != null) {
      textArea.innerText = `"${blobObject.type}" , ${(blobObject.size / 1000).toFixed(1)}kb , Quality ${Number(quality)}`;
    } else {
      textArea.innerText = `"${blobObject.type}" , ${(blobObject.size / 1000).toFixed(1)}kb`;
    }
  }
  async _getConvertedBlob(imageFileObj, quality) {
    const backgroundColor = this._backgroundColor;
    const fileObjBlobUrl = URL.createObjectURL(imageFileObj);
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
    const canvas = document.createElement("canvas");
    canvas.width = imageSize.width;
    canvas.height = imageSize.height;
    const context = canvas.getContext("2d");
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, imageSize.width, imageSize.height);
    context.drawImage(img, 0, 0);
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
    return canvasBlob;
  }
}
const pasteFile = new PasteFile();
const colorPicker = document.querySelector("#background-color-picker");
colorPicker.value = initialBackgroundColor;
const qualitySliderInput = document.querySelector("#quality-slider-input");
const qualitySliderValue = document.querySelector("#quality-slider-value");
{
  console.log(`load page`);
  const top = document.querySelector("#drop-area");
  const child = top.querySelector("div");
  top.addEventListener("dragover", (e) => {
    e.dataTransfer.dropEffect = "copy";
    e.preventDefault();
    child.style.display = "block";
    //console.log(`drag over`, e.dataTransfer);
  });
  top.addEventListener("dragleave", (e) => {
    child.style.display = "none";
    //console.log(`drag over`, e.dataTransfer);
  });
  top.addEventListener("drop", (e) => {
    e.preventDefault();
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
    pasteFile.updateBackgroundColor(e.target.value);
  });
}
{
  qualitySliderInput.min = "0";
  qualitySliderInput.max = String(qualityList.length - 1);
  qualitySliderValue.innerText = qualityList[0];
  qualitySliderInput.addEventListener("input", () => {
    const val = qualityList[Number(qualitySliderInput.value)];
    qualitySliderValue.innerText = val;
    pasteFile.updateQuality(val);
  });
}
