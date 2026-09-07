/**
 * Upload an image (File or base64 string) to ImgBB
 * @param image - File object or Base64 encoded image string
 * @param onProgress - Optional callback for upload progress percentage (0 - 100)
 * @returns Promise with the uploaded direct image URL
 */
export async function uploadToImgBB(
  image: File | string,
  onProgress?: (pct: number) => void
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

  if (!apiKey) {
    throw new Error(
      "ImgBB API key is not configured. Please add NEXT_PUBLIC_IMGBB_API_KEY to your .env.local file"
    );
  }

  const formData = new FormData();

  if (typeof image === "string") {
    // Remove data:image/xxx;base64, prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    formData.append("image", base64Data);
  } else {
    formData.append("image", image);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.imgbb.com/1/upload?key=${apiKey}`);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 100);
          onProgress(pct);
        }
      };
    }

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && response.success) {
          const url = response.data?.display_url || response.data?.url;
          resolve(url);
        } else {
          const errorMsg =
            response?.error?.message ||
            response?.message ||
            `ImgBB upload failed with status ${xhr.status}`;
          reject(new Error(errorMsg));
        }
      } catch (err) {
        reject(new Error(`Failed to parse ImgBB response: ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error occurred while uploading to ImgBB"));
    };

    xhr.send(formData);
  });
}
