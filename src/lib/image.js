const MAX_SIDE = 1280;

// Shrinks a photo before upload. Redrawing it also drops metadata such as GPS position.
export async function prepareImage(file) {
  if (!file.type.startsWith("image/")) throw new Error("Please choose a picture.");
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const preview = canvas.toDataURL("image/jpeg", 0.82);
    return { mimeType: "image/jpeg", data: preview.split(",")[1], preview };
  } catch {
    throw new Error("This picture format could not be opened. Try a JPG or PNG.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
