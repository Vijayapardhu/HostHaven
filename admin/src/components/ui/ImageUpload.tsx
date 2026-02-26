import { useRef, useState } from "react";
import { toast } from "sonner";
import { mediaUploadService } from "../../lib/mediaUpload";
import { Upload, X, Image as ImageIcon } from "lucide-react";

export type UploadedImage = {
  url: string;
  alt: string;
  isPrimary?: boolean;
};

type ImageUploadProps = {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  folder?: string;
  resourceType?: "image" | "video";
  minImages?: number;
  label?: string;
  error?: string;
};

export function ImageUpload({
  images,
  onChange,
  maxImages = 10,
  folder = "hosthaven/general",
  resourceType = "image",
  minImages = 0,
  label = "Images",
  error,
}: ImageUploadProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  const fileNameWithoutExtension = (filename: string) => {
    const parts = filename.split(".");
    parts.pop();
    return parts.join(".") || filename;
  };

  const handleSingleImageUpload = async (index: number, file: File) => {
    setUploadingIndex(index);
    try {
      const uploaded = await mediaUploadService.uploadSingle(file, {
        folder,
        resourceType,
      });

      const next = [...images];
      next[index] = {
        ...next[index],
        url: uploaded.url,
        alt: next[index].alt || fileNameWithoutExtension(file.name),
      };

      // Auto-set first image as primary if none exists
      if (!next.some((item) => item.isPrimary)) {
        next[index].isPrimary = true;
      }

      onChange(next);
      toast.success("Image uploaded successfully.");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to upload image.",
      );
    } finally {
      setUploadingIndex(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleBulkImageUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setIsBulkUploading(true);
    try {
      const uploadedAssets = await mediaUploadService.uploadMultiple(files, {
        folder,
        resourceType,
      });

      const next = [...images];
      let pointer = 0;

      // Fill empty slots first
      for (
        let index = 0;
        index < next.length && pointer < uploadedAssets.length;
        index += 1
      ) {
        if (!next[index].url) {
          next[index] = {
            ...next[index],
            url: uploadedAssets[pointer].url,
            alt:
              next[index].alt || fileNameWithoutExtension(files[pointer].name),
          };
          pointer += 1;
        }
      }

      // Add new slots if needed
      while (pointer < uploadedAssets.length && next.length < maxImages) {
        next.push({
          url: uploadedAssets[pointer].url,
          alt: fileNameWithoutExtension(files[pointer].name),
          isPrimary: false,
        });
        pointer += 1;
      }

      // Auto-set first image as primary if none exists
      if (!next.some((item) => item.isPrimary) && next.length > 0) {
        next[0].isPrimary = true;
      }

      onChange(next);
      toast.success(`${uploadedAssets.length} image(s) uploaded successfully.`);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to upload images.",
      );
    } finally {
      setIsBulkUploading(false);
      if (bulkFileInputRef.current) {
        bulkFileInputRef.current.value = "";
      }
    }
  };

  const handleImageChange = (
    index: number,
    key: keyof UploadedImage,
    value: string | boolean,
  ) => {
    const next = [...images];
    if (key === "isPrimary" && value) {
      // Uncheck all others if this one is being set as primary
      for (let i = 0; i < next.length; i += 1) {
        next[i] = { ...next[i], isPrimary: false };
      }
    }
    next[index] = { ...next[index], [key]: value };
    onChange(next);
  };

  const addEmptySlot = () => {
    if (images.length < maxImages) {
      onChange([...images, { url: "", alt: "", isPrimary: false }]);
    }
  };

  const removeImage = (index: number) => {
    if (images.length > minImages || images[index].url) {
      const next = images.filter((_, i) => i !== index);
      // Ensure at least one primary image exists
      if (next.length > 0 && !next.some((item) => item.isPrimary)) {
        next[0].isPrimary = true;
      }
      // Ensure minimum slots
      while (next.length < minImages) {
        next.push({ url: "", alt: "", isPrimary: next.length === 0 });
      }
      onChange(next);
    }
  };

  const uploadedCount = images.filter(
    (img) => typeof img.url === "string" && img.url.trim().length > 0,
  ).length;
  const hasPrimaryImage = images.some(
    (img) =>
      typeof img.url === "string" && img.url.trim().length > 0 && img.isPrimary,
  );

  return (
    <div className="space-y-4">
      {/* Header with upload buttons */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-700">{label}</p>
            <p className="text-xs text-slate-500">
              {resourceType === "image" ? "Upload images" : "Upload videos"} to
              cloud storage
            </p>
          </div>
          <div className="flex gap-2">
            <label className="inline-flex cursor-pointer items-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              {isBulkUploading
                ? "Uploading..."
                : `Upload ${resourceType === "image" ? "Images" : "Videos"}`}
              <input
                type="file"
                accept={resourceType === "image" ? "image/*" : "video/*"}
                multiple
                className="hidden"
                onChange={(e) =>
                  handleBulkImageUpload(Array.from(e.target.files || []))
                }
                disabled={isBulkUploading}
                ref={bulkFileInputRef}
              />
            </label>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
            {resourceType === "image" ? "Images" : "Videos"}: {uploadedCount}
          </span>
          {resourceType === "image" && (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
              Primary: {hasPrimaryImage ? "Set" : "Missing"}
            </span>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-rose-600">{error}</p>}

      {/* Image/Video Grid */}
      <div className="space-y-3">
        {images.map((item, index) => (
          <div
            key={`item-${index}`}
            className="rounded-lg border border-slate-200 p-3"
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              {/* Preview */}
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 md:col-span-1">
                {item.url ? (
                  resourceType === "image" ? (
                    <img
                      src={item.url}
                      alt={item.alt || `${label} ${index + 1}`}
                      className="h-28 w-full object-cover"
                    />
                  ) : (
                    <video
                      src={item.url}
                      controls
                      className="h-28 w-full rounded-lg object-cover"
                    />
                  )
                ) : (
                  <div className="flex h-28 items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-slate-400" />
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="md:col-span-3">
                <div className="flex flex-col gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">
                      Alt text
                    </label>
                    <input
                      type="text"
                      value={item.alt}
                      onChange={(e) =>
                        handleImageChange(index, "alt", e.target.value)
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Describe the image"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Upload button */}
                    <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      <Upload className="mr-2 h-4 w-4" />
                      {uploadingIndex === index
                        ? "Uploading..."
                        : item.url
                          ? "Replace"
                          : "Upload"}
                      <input
                        type="file"
                        accept={
                          resourceType === "image" ? "image/*" : "video/*"
                        }
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleSingleImageUpload(index, file);
                        }}
                        disabled={uploadingIndex === index}
                        ref={fileInputRef}
                      />
                    </label>

                    {/* Primary checkbox for images */}
                    {resourceType === "image" && (
                      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={item.isPrimary || false}
                          onChange={(e) =>
                            handleImageChange(
                              index,
                              "isPrimary",
                              e.target.checked,
                            )
                          }
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        Primary
                      </label>
                    )}

                    {/* Remove button */}
                    {(images.length > minImages || item.url) && (
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="inline-flex items-center rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <X className="mr-1 h-4 w-4" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add slot button */}
        {images.length < maxImages && (
          <button
            type="button"
            onClick={addEmptySlot}
            className="rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 hover:border-slate-400 hover:bg-slate-50"
          >
            + Add {resourceType === "image" ? "Image" : "Video"} Slot
          </button>
        )}
      </div>
    </div>
  );
}

export default ImageUpload;
